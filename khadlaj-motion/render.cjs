// Rendu image par image de index.html puis encodage MP4.
// Usage : NODE_PATH=$(npm root -g) node render.cjs [dossier_images] [fps] [--stills 1.2,5,12]
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = __dirname;
const outDir = process.argv[2] || path.join(ROOT, 'frames');
const fps = Number(process.argv[3] || 30);
const stillsArg = process.argv.indexOf('--stills');
const stills = stillsArg > 0 ? process.argv[stillsArg + 1].split(',').map(Number) : null;

const TYPES = { '.html': 'text/html', '.woff2': 'font/woff2', '.js': 'text/javascript' };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto(`http://127.0.0.1:${port}/index.html?render`);
  await page.evaluate(() => window.ready);
  const dur = await page.evaluate(() => window.DURATION);

  const times = stills || Array.from({ length: Math.round(dur * fps) }, (_, i) => i / fps);
  for (let i = 0; i < times.length; i++) {
    const data = await page.evaluate(t => { window.renderAt(t); return document.getElementById('c').toDataURL('image/png'); }, times[i]);
    const name = stills ? `still_${String(times[i]).replace('.', '_')}.png` : `f${String(i).padStart(4, '0')}.png`;
    fs.writeFileSync(path.join(outDir, name), Buffer.from(data.split(',')[1], 'base64'));
    if (!stills && i % 60 === 0) console.log(`frame ${i}/${times.length}`);
  }
  await browser.close();
  server.close();
})();
