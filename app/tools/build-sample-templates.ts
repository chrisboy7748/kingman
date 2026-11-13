/**
 * Builds the sample catalog:
 *   tools/templates.ts  →  templates-src/<id>.json  (AE-like "Bodymovin" exports, importable in the back-office)
 *                       →  public/catalog/templates/<id>.json + public/catalog/catalog.json (prepared)
 * Run: npm run templates
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildManifest, prepareTemplate } from '../src/engine/prepare';
import type { Catalog } from '../src/engine/types';
import { SAMPLE_TEMPLATES } from './templates';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'templates-src');
const outDir = join(root, 'public', 'catalog', 'templates');
mkdirSync(srcDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const catalog: Catalog = { updatedAt: new Date().toISOString(), templates: [] };
let warnings = 0;

for (const t of SAMPLE_TEMPLATES) {
  const ae = t.build().build();
  writeFileSync(join(srcDir, `${t.meta.id}.json`), JSON.stringify(ae));
  const prepared = prepareTemplate(ae);
  const manifest = buildManifest(prepared, t.meta);
  writeFileSync(join(outDir, `${t.meta.id}.json`), JSON.stringify(prepared.lottie));
  catalog.templates.push(manifest);
  const r = prepared.report;
  console.log(
    `${t.meta.pro ? 'PRO ' : 'FREE'} ${t.meta.id.padEnd(22)} ${r.format.padEnd(5)} ${r.duration.toFixed(1)}s  ` +
      `${r.texts} txt  ${r.photos} img  ${r.colors} col${prepared.hasLogo ? '  logo' : ''}`,
  );
  for (const w of r.warnings) {
    warnings++;
    console.log(`     ⚠ ${w}`);
  }
}

writeFileSync(join(root, 'public', 'catalog', 'catalog.json'), JSON.stringify(catalog, null, 1));
console.log(`\n${catalog.templates.length} templates, ${catalog.templates.filter((t) => !t.pro).length} free, ${warnings} warnings`);
