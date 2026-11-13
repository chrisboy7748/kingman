/**
 * Renders the sample "photos" used by catalog previews (stylised illustrations,
 * so the repository ships no third-party images) and the app icons.
 * Run: npm run samples   (uses the pre-installed Playwright Chromium)
 */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'samples');
mkdirSync(out, { recursive: true });
mkdirSync(join(root, 'public', 'icons'), { recursive: true });

const W = 1080;
const H = 1920;
const svg = (body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${body}</svg>`;
const lg = (id, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const rg = (id, stops, cx = 0.5, cy = 0.5, r = 0.5) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;
const grain = `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.08 0"/></filter>`;
const noise = `<rect width="${W}" height="${H}" filter="url(#grain)"/>`;

const palms = (x, y, s = 1, c = '#1b2a2a') => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}">
  <path d="M-6 0 C-4 -160 4 -320 14 -460 L22 -460 C12 -320 6 -160 8 0 Z"/>
  ${[-70, -35, 0, 35, 70, 110, -110].map((a) => `<path transform="translate(18 -460) rotate(${a})" d="M0 0 C40 -20 120 -10 170 30 C120 10 50 10 0 6 Z"/>`).join('')}
</g>`;

const samples = {
  villa: svg(
    `<rect width="${W}" height="${H}" fill="url(#sky)"/>
     <circle cx="760" cy="760" r="130" fill="url(#sun)"/>
     <rect y="1180" width="${W}" height="740" fill="url(#ground)"/>
     <g>
       <rect x="120" y="860" width="860" height="360" fill="#F3EDE3"/>
       <rect x="80" y="840" width="940" height="40" fill="#E2D8C8"/>
       <rect x="300" y="620" width="560" height="240" fill="#F7F2EA"/>
       <rect x="260" y="600" width="640" height="34" fill="#E2D8C8"/>
       <rect x="340" y="660" width="220" height="170" fill="url(#glass)"/>
       <rect x="600" y="660" width="220" height="170" fill="url(#glass)"/>
       <rect x="170" y="920" width="300" height="260" fill="url(#glass)"/>
       <rect x="520" y="920" width="160" height="260" fill="#6B4F3A"/>
       <rect x="730" y="920" width="210" height="260" fill="url(#glass)"/>
       <rect x="120" y="1210" width="860" height="70" fill="url(#water)"/>
     </g>
     ${palms(60, 1220, 1.1)}${palms(1010, 1240, 1.25)}${palms(900, 1210, 0.8, '#223232')}
     <rect y="1280" width="${W}" height="640" fill="url(#lawn)"/>
     ${noise}`,
    lg('sky', [[0, '#2B3A67'], [0.45, '#E07A5F'], [0.75, '#F2CC8F'], [1, '#F6E3C3']]) +
      rg('sun', [[0, '#FFF7E0'], [0.6, '#FFD89B'], [1, '#FFD89B', 0]]) +
      lg('ground', [[0, '#C9B79C'], [1, '#8C7A62']]) +
      lg('glass', [[0, '#9EC5D8'], [0.5, '#5D8AA8'], [1, '#2E4A62']], 1, 1) +
      lg('water', [[0, '#5FC6D9'], [1, '#1E7E99']]) +
      lg('lawn', [[0, '#5E7B4C'], [1, '#2F4229']]) + grain,
  ),
  living: svg(
    `<rect width="${W}" height="${H}" fill="url(#wall)"/>
     <rect x="160" y="300" width="760" height="760" fill="url(#window)"/>
     <path d="M160 300 h760 v760 h-760z M540 300 v760 M160 680 h760" stroke="#F5F0E8" stroke-width="18" fill="none"/>
     <rect y="1300" width="${W}" height="620" fill="url(#floor)"/>
     <rect x="120" y="1080" width="840" height="230" rx="40" fill="#CDBBA7"/>
     <rect x="160" y="980" width="760" height="160" rx="40" fill="#DDCDBB"/>
     <rect x="200" y="1050" width="200" height="120" rx="24" fill="#B2593C"/>
     <rect x="680" y="1050" width="200" height="120" rx="24" fill="#3E5C76"/>
     <ellipse cx="540" cy="1520" rx="420" ry="90" fill="#E8DCCB"/>
     <rect x="380" y="1400" width="320" height="40" rx="12" fill="#6B4F3A"/>
     <circle cx="880" cy="900" r="70" fill="#7E9A6B"/><rect x="866" y="940" width="28" height="160" fill="#6B4F3A"/>
     ${noise}`,
    lg('wall', [[0, '#EFE7DC'], [1, '#D9CDBE']]) + lg('window', [[0, '#A7C7DC'], [1, '#E9D7B7']]) +
      lg('floor', [[0, '#B48A64'], [1, '#7A5A3E']]) + grain,
  ),
  bedroom: svg(
    `<rect width="${W}" height="${H}" fill="url(#wall)"/>
     <rect x="140" y="560" width="800" height="520" rx="30" fill="#6E8B8C"/>
     <rect y="1350" width="${W}" height="570" fill="url(#floor)"/>
     <rect x="80" y="1080" width="920" height="320" rx="40" fill="#F4F1EC"/>
     <rect x="80" y="1220" width="920" height="200" rx="30" fill="#C7A27C"/>
     <rect x="180" y="980" width="300" height="150" rx="40" fill="#FFFFFF"/>
     <rect x="600" y="980" width="300" height="150" rx="40" fill="#FFFFFF"/>
     <circle cx="70" cy="760" r="90" fill="url(#lamp)"/><circle cx="1010" cy="760" r="90" fill="url(#lamp)"/>
     ${noise}`,
    lg('wall', [[0, '#3C4F5C'], [1, '#2A3842']]) + lg('floor', [[0, '#8A6A4F'], [1, '#5A4433']]) +
      rg('lamp', [[0, '#FFE8B0'], [1, '#FFE8B0', 0]]) + grain,
  ),
  pool: svg(
    `<rect width="${W}" height="${H}" fill="url(#sky)"/>
     <rect x="0" y="560" width="${W}" height="520" fill="#F4EFE6"/>
     <rect x="80" y="640" width="400" height="360" fill="url(#glass)"/><rect x="560" y="640" width="440" height="360" fill="url(#glass)"/>
     <rect x="0" y="540" width="${W}" height="40" fill="#E0D6C6"/>
     <rect y="1080" width="${W}" height="840" fill="url(#water)"/>
     ${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${1180 + i * 80} q 135 -24 270 0 t 270 0 t 270 0 t 270 0" stroke="#BFF3FF" stroke-opacity="0.35" stroke-width="6" fill="none"/>`).join('')}
     ${palms(980, 1080, 1.2)}
     ${noise}`,
    lg('sky', [[0, '#67B7E8'], [1, '#D7EEF8']]) + lg('glass', [[0, '#9EC5D8'], [1, '#2E4A62']], 1, 1) +
      lg('water', [[0, '#3FC1D9'], [1, '#0B6E8C']]) + grain,
  ),
  tower: svg(
    `<rect width="${W}" height="${H}" fill="url(#sky)"/>
     <path d="M540 120 L560 520 L600 900 L640 1920 L440 1920 L480 900 L520 520 Z" fill="url(#steel)"/>
     ${[[80, 900, 180], [260, 1100, 160], [700, 1000, 190], [880, 1200, 170], [40, 1300, 160]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${H - y}" fill="url(#steel)" opacity="0.85"/>`).join('')}
     ${Array.from({ length: 160 }, (_, i) => `<rect x="${(i * 97) % 1060 + 10}" y="${900 + ((i * 53) % 1000)}" width="10" height="16" fill="#FFE7A8" opacity="${0.4 + (i % 5) / 10}"/>`).join('')}
     ${noise}`,
    lg('sky', [[0, '#0D1B3D'], [0.6, '#4A3B7A'], [1, '#E58F65']]) + lg('steel', [[0, '#3A4660'], [1, '#141A28']], 1, 0) + grain,
  ),
  product: svg(
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>
     <ellipse cx="540" cy="1360" rx="360" ry="60" fill="#000" opacity="0.18"/>
     <rect x="380" y="700" width="320" height="660" rx="60" fill="url(#bottle)"/>
     <rect x="470" y="560" width="140" height="160" rx="20" fill="#2D2D2D"/>
     <rect x="420" y="960" width="240" height="200" rx="16" fill="#FFF7EE"/>
     <text x="540" y="1075" font-family="Georgia, serif" font-size="56" text-anchor="middle" fill="#7A4B2A">OUD</text>
     ${noise}`,
    lg('bg', [[0, '#FFE1C8'], [1, '#F5B38A']]) + lg('bottle', [[0, '#D99A5B'], [0.5, '#F4C58D'], [1, '#B6713A']], 1, 0) + grain,
  ),
  fashion1: svg(
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>
     <circle cx="540" cy="520" r="150" fill="#6B4A3A"/>
     <path d="M300 1920 C300 1200 380 820 540 760 C700 820 780 1200 780 1920 Z" fill="url(#coat)"/>
     <path d="M540 760 L480 1100 L540 1920 L600 1100 Z" fill="#E9DCC8"/>
     ${noise}`,
    lg('bg', [[0, '#D8C3A5'], [1, '#A58B6F']]) + lg('coat', [[0, '#8E5B3E'], [1, '#5C3A27']], 1, 0) + grain,
  ),
  fashion2: svg(
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>
     <circle cx="540" cy="560" r="170" fill="#3B2A24"/>
     <path d="M250 1920 C260 1300 360 900 540 820 C720 900 820 1300 830 1920 Z" fill="url(#dress)"/>
     <circle cx="540" cy="560" r="230" fill="none" stroke="#F5C2C7" stroke-width="10" opacity="0.6"/>
     ${noise}`,
    lg('bg', [[0, '#F3D9DC'], [1, '#C98B94']]) + lg('dress', [[0, '#2F2A3A'], [1, '#1A1722']], 1, 0) + grain,
  ),
  dish: svg(
    `<rect width="${W}" height="${H}" fill="url(#table)"/>
     <circle cx="540" cy="960" r="470" fill="#F7F3EC"/><circle cx="540" cy="960" r="380" fill="#EFE7DA"/>
     <circle cx="540" cy="960" r="330" fill="url(#rice)"/>
     ${Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * Math.PI * 2; return `<ellipse cx="${540 + Math.cos(a) * 150}" cy="${960 + Math.sin(a) * 150}" rx="80" ry="58" fill="url(#meat)" transform="rotate(${(a * 180) / Math.PI} ${540 + Math.cos(a) * 150} ${960 + Math.sin(a) * 150})"/>`; }).join('')}
     ${Array.from({ length: 30 }, (_, i) => `<circle cx="${400 + ((i * 37) % 280)}" cy="${820 + ((i * 61) % 280)}" r="9" fill="${i % 3 ? '#3F7D3A' : '#C0392B'}"/>`).join('')}
     ${noise}`,
    rg('table', [[0, '#7A4E2D'], [1, '#3E2716']]) + rg('rice', [[0, '#F9D27A'], [1, '#E2A23B']]) + rg('meat', [[0, '#C46A2F'], [1, '#7A3A16']]) + grain,
  ),
  salon: svg(
    `<rect width="${W}" height="${H}" fill="url(#bg)"/>
     <ellipse cx="540" cy="760" rx="330" ry="420" fill="url(#mirror)" stroke="#D4AF7A" stroke-width="24"/>
     <circle cx="540" cy="700" r="150" fill="#5A3B32"/>
     <path d="M330 1300 C340 1040 420 940 540 920 C660 940 740 1040 750 1300 Z" fill="#E8C4C4"/>
     <rect x="160" y="1300" width="760" height="80" rx="20" fill="#D4AF7A"/>
     <circle cx="230" cy="1250" r="40" fill="#B76E79"/><circle cx="860" cy="1240" r="50" fill="#F4E1D2"/>
     ${noise}`,
    lg('bg', [[0, '#F7E8E4'], [1, '#E6C3BD']]) + lg('mirror', [[0, '#FDF8F5'], [1, '#E9D9D2']], 1, 1) + grain,
  ),
};

// icon: animated "play" spark in a rounded square
const icon = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>${lg('g', [[0, '#7C3AED'], [1, '#F97316']], 1, 1)}</defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <path d="M196 150 L372 256 L196 362 Z" fill="#fff"/>
  <circle cx="372" cy="146" r="26" fill="#fff" opacity="0.9"/><circle cx="420" cy="214" r="14" fill="#fff" opacity="0.7"/>
</svg>`;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const [name, s] of Object.entries(samples)) {
  await page.setViewportSize({ width: W, height: H });
  await page.setContent(`<html><body style="margin:0">${s}</body></html>`);
  const buf = await page.screenshot({ type: 'jpeg', quality: 82, clip: { x: 0, y: 0, width: W, height: H } });
  writeFileSync(join(out, `${name}.jpg`), buf);
  console.log('sample', name);
}
for (const size of [192, 512, 180]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0">${icon(size)}</body></html>`);
  const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: size, height: size } });
  writeFileSync(join(root, 'public', 'icons', size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`), buf);
}
writeFileSync(join(root, 'public', 'icons', 'icon.svg'), icon(512));
await browser.close();
