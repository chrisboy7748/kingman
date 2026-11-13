import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Dev-only "publish" endpoint used by the back-office (admin.html):
 * writes the prepared template into public/catalog and updates catalog.json.
 * In production the same files are uploaded to the hosting / storage bucket
 * (Supabase Storage, Firebase Storage, S3…) — the app reads them at runtime.
 */
function publishApi(): Plugin {
  const catalogDir = resolve(__dirname, 'public/catalog');
  return {
    name: 'lamsa-publish-api',
    configureServer(server) {
      server.middlewares.use('/api/publish', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          try {
            const { manifest, lottie, samples } = JSON.parse(body);
            if (!/^[a-z0-9-]+$/.test(manifest.id)) throw new Error('invalid id');
            mkdirSync(join(catalogDir, 'templates'), { recursive: true });
            writeFileSync(join(catalogDir, 'templates', `${manifest.id}.json`), JSON.stringify(lottie));
            // embedded sample images → files
            for (const [key, dataUrl] of Object.entries<string>(samples || {})) {
              const m = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(dataUrl);
              if (!m || !/^[a-z0-9_-]+$/.test(key)) continue;
              const file = `samples/${manifest.id}-${key}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
              mkdirSync(resolve(__dirname, 'public/samples'), { recursive: true });
              writeFileSync(resolve(__dirname, 'public', file), Buffer.from(m[2], 'base64'));
              const slot = manifest.photos.find((p: any) => p.key === key);
              if (slot) slot.sample = file;
            }
            const catPath = join(catalogDir, 'catalog.json');
            const cat = JSON.parse(readFileSync(catPath, 'utf8'));
            cat.templates = [manifest, ...cat.templates.filter((t: any) => t.id !== manifest.id)];
            cat.updatedAt = new Date().toISOString();
            writeFileSync(catPath, JSON.stringify(cat, null, 1));
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: true, manifest }));
          } catch (e: any) {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: String(e?.message || e) }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), publishApi()],
  build: {
    rollupOptions: {
      input: { app: resolve(__dirname, 'index.html'), admin: resolve(__dirname, 'admin.html') },
    },
  },
  server: { port: 5173 },
});
