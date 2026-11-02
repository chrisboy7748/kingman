# Affiche AlphaWave Agency — A4

| Fichier | Usage |
|---|---|
| `alphawave-affiche-A4-300dpi.png` | Image 2481 × 3509 px (A4, 300 dpi) — réseaux sociaux, WhatsApp, impression |
| `alphawave-affiche-A4.pdf` | PDF vectoriel A4 (textes et formes nets à toute taille) — imprimeur, Illustrator, Inkscape |
| `affiche.html` | **Fichier source modifiable** (textes, couleurs, prix, contacts) |
| `qr-whatsapp.svg` | QR code vers `https://wa.me/971565213488` |

## Modifier l'affiche
1. Ouvrir `affiche.html` dans un éditeur de texte : chaque bloc est commenté (EN-TÊTE, SERVICES, CLIENTÈLE, PIED DE PAGE).
2. Les couleurs se changent en haut du fichier (`:root { --orange: … ; --navy-800: … }`).
3. Aperçu : ouvrir `affiche.html` dans Chrome.

## Régénérer les exports
```bash
npm install            # qrcode + playwright
node generer-qr.cjs "https://wa.me/971XXXXXXXXX"   # si le numéro change
node exporter.cjs      # recrée le PNG 300 dpi et le PDF
```
Polices (Google Fonts, chargées en ligne) : Barlow Condensed, Inter, Instrument Serif.
