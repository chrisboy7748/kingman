// Export de l'affiche AlphaWave Agency : poster.png (x2) + poster.pdf (A4, fond imprimé)
// Usage : npm install && node export.js
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const WIDTH = 1055;
const HEIGHT = 1491;
const ROOT = __dirname;
const HTML = pathToFileURL(path.join(ROOT, 'index.html')).href;

// Copie locale de Font Awesome (npm) utilisée si le CDN ne répond pas (export hors ligne).
const FA_LOCAL = path.join(ROOT, 'node_modules', '@fortawesome', 'fontawesome-free');
const FA_CDN = /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome\/[^/]+\/(.+)$/;
const MIME = { '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };

async function serveFontAwesome(route) {
  try {
    const response = await route.fetch({ timeout: 8000 });
    if (response.ok()) return route.fulfill({ response });
  } catch (_) { /* CDN injoignable : repli local */ }
  const rel = route.request().url().match(FA_CDN)[1].split('?')[0];
  const file = path.join(FA_LOCAL, rel);
  if (!fs.existsSync(file)) return route.abort();
  return route.fulfill({
    status: 200,
    contentType: MIME[path.extname(file)] || 'application/octet-stream',
    body: fs.readFileSync(file),
  });
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.route(FA_CDN, serveFontAwesome);

  await page.goto(HTML, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) =>
      img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; })));
  });

  // Contrôle : rien ne doit déborder de l'affiche.
  const issues = await page.evaluate(({ W, H }) => {
    const out = [];
    const poster = document.querySelector('.poster');
    if (poster.scrollWidth > W || poster.scrollHeight > H) {
      out.push(`.poster scroll ${poster.scrollWidth}x${poster.scrollHeight}`);
    }
    for (const el of poster.querySelectorAll('*')) {
      if (el.closest('svg') || getComputedStyle(el).position === 'absolute') continue;
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (hasText && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
        out.push(`${el.tagName.toLowerCase()}.${el.className} déborde (${el.scrollWidth} > ${el.clientWidth})`);
      }
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > W + 0.5 || r.bottom > H + 0.5)) {
        out.push(`${el.tagName.toLowerCase()}.${el.className} hors cadre (${Math.round(r.right)}, ${Math.round(r.bottom)})`);
      }
    }
    return out;
  }, { W: WIDTH, H: HEIGHT });
  if (issues.length) console.warn('⚠ Débordements détectés :\n  ' + issues.join('\n  '));
  else console.log('✓ Aucun débordement détecté');

  await page.locator('.poster').screenshot({ path: path.join(ROOT, 'poster.png') });
  console.log(`✓ poster.png (${WIDTH * 2} × ${HEIGHT * 2} px)`);

  // A4 = 210 × 297 mm = 793.7 × 1122.5 px CSS : on réduit l'affiche pour qu'elle remplisse la page.
  await page.emulateMedia({ media: 'screen' });
  await page.pdf({
    path: path.join(ROOT, 'poster.pdf'),
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    scale: 793.7 / WIDTH,
    pageRanges: '1',
  });
  console.log('✓ poster.pdf (A4, fond imprimé)');

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
