# kingman

## Affiche AlphaWave Agency

Affiche A4 portrait (1055 × 1491 px) en HTML/CSS : `index.html`.

### Export PNG (x2) + PDF A4

```bash
npm install
node export.js   # → poster.png (2110 × 2982 px) et poster.pdf (A4, fond imprimé)
```

Le script vérifie aussi qu'aucun élément ne déborde de l'affiche.

### Images

Déposez dans `./assets/` : `hero.jpg`, `skyline.png` (Burj Khalifa détouré), `motion.jpg`,
`uiux.jpg`, `web.jpg`, `marketing.jpg`, `community.jpg`, `qr.png`.
Une image absente est remplacée par un dégradé de même taille (silhouette vectorielle pour la skyline).
