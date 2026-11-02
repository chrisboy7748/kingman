// Exporte l'affiche en PNG haute résolution (A4 300 dpi) et en PDF vectoriel.
// Utilisation : node exporter.cjs
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const src = 'file://' + path.join(__dirname, 'affiche.html');
  const browser = await chromium.launch();

  // A4 = 794 × 1123 px CSS ; × 3.125 = 2481 × 3509 px (300 dpi)
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 3.125 });
  await page.goto(src, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.poster').screenshot({ path: path.join(__dirname, 'alphawave-affiche-A4-300dpi.png') });

  await page.emulateMedia({ media: 'screen' });
  await page.pdf({ path: path.join(__dirname, 'alphawave-affiche-A4.pdf'), width: '210mm', height: '297mm',
    printBackground: true, pageRanges: '1' });

  await browser.close();
  console.log('Exports terminés.');
})();
