# Khadlaj — Motion design « Hareem Al Sultan Gold »

Publicité verticale 9:16 (1080×1920) pour Reels / TikTok / Stories.

| Version | Fichiers | Style |
|---|---|---|
| **v2 – social** (actuelle) | `khadlaj-hareem-al-sultan-gold.mp4`, `index.html`, `soundtrack.py` | 15 s, 120 BPM, coupes sur le beat, typographie XXL, couleurs vives |
| v1 – luxe | `v1-luxe.mp4`, `v1-luxe.html` | 24 s, lent, doré, cinématographique |

- `render.cjs` : rendu image par image avec Playwright
- `fonts/` : Anton, Playfair Display, Jost, Amiri, Cormorant Garamond (Google Fonts, licence OFL)

## Storyboard v2 (1 temps = 0,5 s)

| Temps | Scène | Contenu |
|---|---|---|
| 0–2 s | Accroche | Un mot par temps, un fond par mot : LE PARFUM / QUI A FAIT / CRAQUER / TIKTOK (éclats d'étoiles) |
| 2–3 s | Le flacon tombe | Chute du flacon sur fond or, impact + flash, défilé « HAREEM », sticker BEST-SELLER |
| 3–4 s | Nom | HAREEM / AL SULTAN / *Gold* en surimpression, « Huile de parfum concentrée » |
| 4–8,5 s | Notes | 3 cartes en volet diagonal : Tête (citron), Cœur (rose), Fond (prune), 3 mots qui claquent sur le rythme |
| 8,5–10 s | Familles | FLORAL. / FRUITÉ. / MUSQUÉ., un mot par temps avec écho en contour |
| 10–11,5 s | Héros | Flacon pulsé sur le beat, bandeaux croisés « VIRAL SUR TIKTOK » / « HAREEM AL SULTAN GOLD » |
| 11,5–15 s | Appel à l'action | خدلج KHADLAJ, COMMANDE-LE *maintenant*, bouton COMMANDER tapé deux fois, URL, sticker « Dispo en ligne » ou prix |

Les éléments clés restent entre y = 200 et y = 1470, hors des zones couvertes par l'interface TikTok / Reels.

## Modifier les textes

Tous les textes sont dans l'objet `CONFIG` en haut de `index.html`. Renseigner `price` (ex. `"29,90 €"`) remplace le sticker « DISPO EN LIGNE » par une pastille prix.

## Régénérer la vidéo

```bash
NODE_PATH=$(npm root -g) node render.cjs /tmp/frames 30
python3 soundtrack.py /tmp/sound.wav
ffmpeg -framerate 30 -i /tmp/frames/f%04d.jpg -i /tmp/sound.wav -t 15 \
  -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -b:a 192k -movflags +faststart out.mp4
```

Pour la v1 : `node render.cjs /tmp/frames1 30 --page v1-luxe.html`.

## À remplacer avant diffusion

- Le flacon est une illustration stylisée : le remplacer par le packshot officiel (PNG détouré) pour la version finale.
- La bande-son est synthétisée et provisoire : utiliser une musique sous licence (ou un son tendance TikTok à 120 BPM).
- Vérifier les notes olfactives et les mentions « best-seller » / « viral sur TikTok » avec la marque.
