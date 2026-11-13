# Passage à l'app iPhone native (Swift) — note pour le développeur freelance

Le cahier des charges prévoit une app iPhone en Swift avec lottie-ios. Ce prototype web valide les risques
techniques avant d'engager ce budget. Il fixe aussi les formats que l'app native doit reprendre tels quels.

## Ce qui se réutilise sans changement

- **Les templates** : `public/catalog/templates/*.json` sont des fichiers Lottie standard, lisibles par lottie-ios.
- **Le catalogue** : `catalog.json` (type `TemplateManifest` dans `src/engine/types.ts`). Il contient les
  emplacements texte, photo et couleur, la taille des boîtes, le nombre maximal de caractères, le style
  (police, graisse, taille, couleur, alignement, interligne), les textes par défaut EN/AR, la musique, Pro ou gratuit.
- **Le back-office** et l'outil de préparation (`src/engine/prepare.ts`).
- **La convention de calques** `#txt_` / `#img_` / `#col_` / `#img_logo`.

## Ce qu'il faut réécrire en Swift (≈ `src/engine/apply.ts` + `render.ts`, ~300 lignes)

1. **Textes** : chaque `#txt_` est déjà converti en *image* par l'outil de préparation. L'app dessine le texte
   avec CoreText ou `UIGraphicsImageRenderer` + `NSAttributedString`, qui gèrent l'arabe correctement. Elle
   le dessine dans une image de taille `slot.w × slot.h × échelle`, avec l'alignement inversé pour l'arabe
   et en réduisant la police jusqu'à ce que le texte tienne (voir `layoutText`). L'image est ensuite fournie
   à Lottie via un `AnimationImageProvider` qui renvoie la bonne image pour chaque `assetId`.
2. **Photos et logo** : même `AnimationImageProvider`. Recadrage « cover » + `crop {x, y, zoom}` (voir `cropRect`).
3. **Couleurs** : `ColorValueProvider` sur les keypaths `#col_<clé>.**.Color`.
4. **Logo absent** : masquer le calque (keypath `#img_logo.Transform.Opacity` → 0).
5. **Export** : `AVAssetWriter` (H.264 + AAC), en dessinant chaque image avec `LottieAnimationLayer`
   (`currentFrame`, rendu dans un `CVPixelBuffer`), à 30 images/s. Le filigrane reprend `drawWatermark`.
   Résolutions : 720p (gratuit), 1080p et 4K (Pro, appareils récents seulement).
6. **Abonnements** : RevenueCat, produits `pro_monthly` et `pro_annual` (essai de 3 jours), avec le même
   écran de paywall et les 3 moments d'ouverture.

## Points vérifiés par ce prototype

- Rendu arabe correct (lettres liées, droite à gauche, textes mixtes arabe/chiffres) sur les 16 templates.
- Export MP4 sur l'appareil : 8 s en 720p en ≈ 2 s, 12 s en 1080p en ≈ 7 s (Chromium de bureau).
  **À mesurer sur un ancien iPhone.**
- Piège Lottie rencontré : la bibliothèque modifie le JSON qu'elle charge. Il faut cloner les données avant
  chaque chargement, sinon une deuxième lecture peut se bloquer.

## Propriété

Code, compte Apple Developer, back-office et stockage du catalogue au nom du porteur du projet.
