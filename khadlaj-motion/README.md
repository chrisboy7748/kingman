# Khadlaj — Motion design « Hareem Al Sultan Gold »

Publicité verticale 9:16 (1080×1920), 24 s, 30 i/s, pensée pour Reels / TikTok / Stories.

- `khadlaj-hareem-al-sultan-gold.mp4` — la vidéo finale (avec bande-son d'ambiance provisoire)
- `index.html` — l'animation source, ouvrable dans un navigateur (clic = rejouer)
- `render.cjs` — rendu image par image avec Playwright
- `fonts/` — Cormorant Garamond, Jost, Amiri (Google Fonts, licence OFL)

## Storyboard

| Temps | Scène | Contenu |
|---|---|---|
| 0–3,6 s | Accroche | Une goutte d'or tombe au ralenti, éclaboussure + ondes de lumière. « L'Orient en une goutte. » |
| 3,6–10,2 s | Notes olfactives | 3 tableaux colorés : Tête (Bergamote, Jasmin, Pivoine) · Cœur (Ananas, Prune, Pêche) · Fond (Musc, Santal, Patchouli) |
| 10,2–14 s | Révélation | Le flacon sort du flou dans la fumée et les rayons, motif arabesque, balayage lumineux |
| 14–16 s | Macro | Zoom sur le bouchon ciselé — « Une signature dorée. » |
| 16–20,5 s | Infos produit | HAREEM AL SULTAN **GOLD** · Huile de parfum concentrée · Floral / Fruité / Musqué · tampon « Best-seller » |
| 20,5–24 s | Appel à l'action | خدلج / KHADLAJ · bouton doré « COMMANDEZ MAINTENANT » · khadlaj-perfumes.com |

## Modifier les textes

Tous les textes sont dans l'objet `CONFIG` en haut de `index.html` (offre, prix, URL, notes…).

## Régénérer la vidéo

```bash
NODE_PATH=$(npm root -g) node render.cjs /tmp/frames 30
ffmpeg -framerate 30 -i /tmp/frames/f%04d.png -i soundtrack.wav -t 24 \
  -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -b:a 192k -movflags +faststart out.mp4
```

## À remplacer avant diffusion

- Le flacon est une illustration stylisée : remplacer par le packshot officiel (PNG détouré) pour la version finale.
- La bande-son est une ambiance synthétisée provisoire : utiliser une musique sous licence.
- Vérifier les notes olfactives et la mention « viral sur TikTok » avec la marque.
