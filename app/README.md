# Lamsa — app de templates animés (prototype)

« Des animations de motion designer, sans savoir faire de motion design. »
On choisit un template, on remplace les textes, les photos, les couleurs et la musique, et on exporte
une vidéo MP4 pour Instagram, TikTok ou WhatsApp. L'app est en anglais et en arabe.

> **Lamsa** (لمسة, « la touche ») est un nom provisoire. Il est défini dans `src/services/config.ts`,
> `public/config.json`, `index.html` et `public/manifest.webmanifest`.

Ce dossier contient une **application web mobile (PWA)** qui reprend tout le parcours du cahier des charges.
Elle sert de **prototype de validation** (semaines 1 et 2 de la feuille de route) : rendu arabe, export MP4
fait sur le téléphone, 16 templates d'essai. On l'ouvre dans Safari sur iPhone et on l'ajoute à l'écran
d'accueil. Le format des templates, la convention de calques et le back-office restent valables pour la
future app iPhone en Swift (voir [`docs/PASSAGE_IOS.md`](docs/PASSAGE_IOS.md)).

## Lancer l'app

```bash
cd app
npm install
npm run dev          # http://localhost:5173  (app)   ·   http://localhost:5173/admin.html  (back-office)
```

Pour tester sur un iPhone, il faut le même Wi-Fi et l'adresse « Network » affichée par Vite.
L'export vidéo demande un iPhone sous **iOS 17 ou plus récent** (WebCodecs).

```bash
npm test             # tests du moteur de templates
npm run build        # version de production dans dist/ (hébergement statique : Netlify, Vercel, GitHub Pages…)
npm run templates    # régénère les 16 templates d'exemple et catalog.json
npm run samples      # régénère les photos d'exemple et les icônes (Playwright)
```

## Ce qui est fait (par rapport au cahier des charges)

| Écran / brique | État |
|---|---|
| Onboarding en 3 écrans : usage, langue, logo et couleurs | ✅ Le catalogue est trié selon les réponses. |
| Accueil / catalogue | ✅ Rubriques « Nouveautés de la semaine », « Tendances » et catégories. Les aperçus tournent en boucle, sans son. Recherche et filtre par format (9:16, 1:1, 4:5, 16:9). |
| Fiche template | ✅ Aperçu avec musique, durée, nombre de textes et de photos, badge Pro, bouton « Utiliser ». |
| Éditeur | ✅ Textes (5 polices arabe et latin, couleurs), photos (galerie, recadrage au doigt avec pincement), palette globale, « Appliquer mon kit de marque », musique (bibliothèque, musique perso, aucune), logo ajouté automatiquement. Bascule EN / AR du contenu. Sauvegarde automatique. |
| Export | ✅ MP4 H.264 fabriqué sur l'appareil à 30 images/s : 720p gratuit avec filigrane, 1080p et 4K en Pro. La 4K n'est proposée que si l'appareil sait l'encoder. |
| Partage | ✅ Menu de partage du système (Instagram, TikTok, WhatsApp…) et enregistrement de la vidéo. |
| Mes projets | ✅ Rouvrir, dupliquer (par exemple pour un autre bien), supprimer, avec une miniature. |
| Kit de marque (Pro) | ✅ Logo, 3 couleurs, police. |
| Paywall | ✅ S'ouvre sur un template Pro, sur l'export sans filigrane et sur l'export HD/4K. Met en avant l'offre annuelle avec 3 jours d'essai et « Restaurer mes achats ». Les prix sont lus dans `public/config.json`, modifiables sans mise à jour. |
| Moteur de templates | ✅ Lit les exports Bodymovin et remplace par nom de calque (`#txt_`, `#img_`, `#col_`). L'animation n'est jamais modifiée. |
| **Texte arabe** | ✅ Plan B du cahier des charges, appliqué par défaut : l'app dessine elle-même chaque texte (lettres liées, droite à gauche, police réduite automatiquement pour ne jamais déborder), puis Lottie l'anime comme une image. Les animations de position, d'échelle, d'opacité et de masque restent celles d'After Effects. |
| Back-office | ✅ `admin.html` : import du JSON, fiche générée avec alertes sur les effets non supportés, textes EN/AR, photo d'exemple, aperçu EN/AR, publication. Suivi des objectifs du catalogue de lancement (60 templates, ~20 % gratuits). |
| Catalogue sans mise à jour de l'app | ✅ L'app lit `catalog/catalog.json` à chaque ouverture. |
| Statistiques | 🟡 Les événements des 5 indicateurs sont envoyés à `src/services/analytics.ts`. Il reste à brancher Firebase ou Mixpanel. |
| Abonnements | 🟡 **Simulés** : aucun paiement réel, tout est dans `src/services/billing.ts`. En production, c'est RevenueCat. |
| Musique | 🟡 5 morceaux **synthétisés dans l'app**, donc libres de droits. Il faut les remplacer par une bibliothèque sous licence « app » (champ `url` dans `src/media/music.ts`). |

**Pas dans la version 1, comme prévu :** Android, vidéos de l'utilisateur dans les templates, fonctions IA,
offre Agence, création d'animations libres.

## Les 16 templates d'exemple

Ils sont construits avec une bibliothèque de « briques » d'animation (`tools/dsl.ts`, `tools/templates.ts`).
Ils produisent le même JSON qu'un export After Effects et passent par le même outil d'import.

| Catégorie | Templates |
|---|---|
| Immobilier | Just Listed (gratuit) · Property Tour (4 photos) · Sold! · Price & Features · Open House (16:9) |
| Promos et soldes | Flash Sale −20 % (gratuit) · New Arrival |
| Restauration | Today's Menu (gratuit) · Special Hours |
| Beauté et mode | Salon Offer · Fresh Look |
| Fêtes et événements | Ramadan Kareem · UAE National Day (2 décembre) · You're Invited (4:5) |
| Textes et citations | Quote Card (1:1, gratuit) · Link in Bio |

Les exports « bruts », au format After Effects, sont dans `templates-src/`. Tu peux les importer dans le
back-office pour essayer le circuit complet.

## Guide After Effects → app (pour le motion designer)

1. **Effets compatibles** : formes, masques, calques texte et image, transformations (position, échelle,
   rotation, opacité), tracés « Trim Paths », précompositions, dégradés.
   **Effets à éviter** : effets AE (flous, particules, glow…), plugins tiers, expressions (à convertir en
   images clés), calques 3D, styles de calque, « Merge Paths ». Le back-office les signale.
2. **Nommage des calques modifiables** :
   - `#txt_titre`, `#txt_prix`, `#txt_adresse`… : **calque texte en boîte** (outil texte, clic-glisser). La
     boîte fixe la zone : le texte de l'utilisateur rétrécit pour y tenir. Anime le *calque*, pas les
     caractères (les animateurs de texte sont ignorés pour garantir l'arabe).
   - `#img_photo1`, `#img_photo2`… : **calque image**. La taille de l'image fixe la taille du cadre, et
     l'utilisateur recadre dedans.
   - `#img_logo` : emplacement du logo du kit de marque. Il est masqué si l'utilisateur n'a pas de logo.
   - `#col_principale`, `#col_secondaire`, `#col_accent` : **calques de forme** dont les remplissages et
     contours prennent la couleur choisie. Plusieurs calques peuvent porter le même nom.
3. **Règles** : 6 à 15 secondes, 30 images/s, 1080×1920 en priorité, 1 à 5 textes, 0 à 5 photos.
4. **Export** : Bodymovin ou LottieFiles, en JSON, avec les images cochées « Include in json ».
5. **Publication** : `admin.html` → importer → compléter (noms EN/AR, catégorie, Pro, textes arabes,
   photo d'exemple) → vérifier l'aperçu en arabe avec un texte long → « Publier dans le catalogue ».

## Organisation du code

```
src/engine/       moteur de templates (indépendant de l'interface, testé)
  prepare.ts      outil interne : export AE → template préparé + fiche + alertes
  apply.ts        contenu de l'utilisateur → animation (textes, photos, couleurs, logo)
  render.ts       dessin des textes (arabe) et des photos recadrées
src/media/        export.ts (MP4 sur l'appareil, filigrane) · music.ts (bibliothèque, aperçu audio)
src/services/     catalogue distant, projets (IndexedDB), abonnement, config distante, analytics
src/screens/      Onboarding, Accueil, Fiche, Éditeur, Recadrage, Export, Projets, Kit de marque, Réglages
src/admin/        back-office
tools/            briques d'animation, templates d'exemple, génération du catalogue
public/catalog/   catalogue publié (catalog.json + templates/*.json)
```

## Mise en ligne

`npm run build`, puis dépose `dist/` sur un hébergement statique. Pour publier un template en
production sans redéployer l'app, mets `catalog/` sur un stockage (Supabase Storage, Firebase Storage,
S3…), indique son adresse dans `public/config.json` (`catalogUrl`), et branche le bouton « Publier » du
back-office sur ce stockage. Aujourd'hui, ce bouton n'écrit que sur le serveur de développement.
