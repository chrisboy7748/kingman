# Allégo

Application d'accompagnement à la perte de poids, avec abonnement payé par PayPal.

**Pour mettre le site en ligne, suivez [MISE-EN-LIGNE.md](MISE-EN-LIGNE.md)** : guide pas à pas, sans terminal.

## Ce que contient cette première version

- **Site public** : page d'accueil, tarifs, questions fréquentes, mentions légales, confidentialité et conditions générales (modèles à compléter).
- **Comptes** : inscription avec consentement explicite au traitement des données de santé, connexion, déconnexion.
- **Questionnaire de départ** : sexe, date de naissance, taille, poids, poids visé, activité et rythme de perte. Les objectifs dangereux sont refusés : personne mineure, IMC déjà sous 18,5, poids visé sous un IMC de 18,5.
- **Tableau de bord** : poids, IMC, kilos perdus, date d'arrivée estimée, calories du jour, courbe et habitude de la semaine.
- **Mon poids** : pesées, courbe avec la ligne d'objectif, historique.
- **Journal** : une cinquantaine d'aliments courants ou une saisie libre, total par repas et par jour, macronutriments.
- **Activités** : 12 activités, calories estimées selon le poids, suivi des 150 minutes par semaine conseillées par l'OMS.
- **Programme** : objectif calorique, menus sur 7 jours ajustés aux calories, séances selon le niveau, une habitude par semaine sur 12 semaines.
- **Abonnement** : 7 jours d'essai sans paiement, puis abonnement mensuel (12,99 €) ou annuel (99,99 €) par PayPal. La résiliation se fait depuis l'application, et l'accès reste ouvert jusqu'à la fin de la période payée.
- **E-mails** (Resend) : bienvenue, mot de passe oublié, confirmation de changement de mot de passe, rappel 48 heures avant la fin de l'essai, abonnement actif, paiement refusé, résiliation.
- **Mon compte** : modifier le profil, télécharger ses données (RGPD), supprimer son compte (l'abonnement PayPal est résilié automatiquement).
- **Administration** (`/admin`) : état de la configuration, création des formules et du webhook PayPal en un clic, nombre de comptes, essais en cours, abonnés, revenu mensuel récurrent, encaissements sur 30 jours, derniers inscrits.
- **Sécurité** : limitation des tentatives de connexion, d'inscription et de mot de passe oublié ; en-têtes de sécurité (CSP, HSTS) ; polices hébergées sur le site (aucune requête vers Google) ; tables protégées contre l'API publique de Supabase.

Les calculs reposent sur la formule de Mifflin-St Jeor. L'apport ne descend jamais sous 1 200 kcal (femme) ou 1 500 kcal (homme).

## Technologies

Next.js 16 (React 19), TypeScript, Tailwind CSS 4, PostgreSQL avec Drizzle ORM, API REST PayPal Subscriptions. Aucune autre dépendance payante.

## Lancer le projet sur votre ordinateur

Prérequis : Node.js 20 ou plus récent et une base PostgreSQL.

```bash
cd allego
npm install
cp .env.example .env      # puis remplissez les valeurs
npm run db:migrate        # crée les tables
npm run dev               # http://localhost:3000
```

Sans les clés PayPal, toute l'application fonctionne pendant l'essai gratuit. Seul le bouton de paiement affiche un message.

Tests : `npm test`. Ils utilisent une base séparée, `allego_test`, qu'ils vident à chaque lancement. Vous pouvez en choisir une autre avec `TEST_DATABASE_URL`.

## Brancher PayPal et les e-mails

Le plus simple est de suivre [MISE-EN-LIGNE.md](MISE-EN-LIGNE.md) : les formules et le webhook PayPal se créent depuis la page Administration du site. En local, `npm run paypal:setup` fait la même chose (le webhook n'est créé que si `APP_URL` est une adresse publique en https).

Fonctionnement des paiements : le bouton « Payer avec PayPal » crée l'abonnement côté serveur et envoie l'utilisateur sur PayPal. Au retour, l'abonnement est relu chez PayPal avant d'être activé. Les webhooks tiennent ensuite le statut à jour : renouvellement, échec de paiement, résiliation. Leur signature est vérifiée, et chaque événement n'est traité qu'une fois. Si l'utilisateur s'abonne pendant son essai, le premier prélèvement n'a lieu qu'à la fin de l'essai.

Sans `RESEND_API_KEY`, l'application fonctionne : les e-mails sont écrits dans les journaux du serveur au lieu d'être envoyés. Sans domaine vérifié chez Resend, ils ne partent que vers l'adresse de votre compte Resend.

## Déploiement

- `vercel.json` : construction avec `npm run vercel-build`, fonctions à Paris (`cdg1`), tâche quotidienne `/api/cron/rappels` à 8 h UTC (rappels de fin d'essai et ménage).
- Les migrations de la base sont appliquées à chaque déploiement de production, et ignorées pour les déploiements de prévisualisation.
- Au démarrage, le serveur écrit dans ses journaux les variables manquantes ; la page Administration affiche le même bilan.
- `/api/sante` répond `{"statut":"ok"}` quand le site et la base fonctionnent.
- Toute nouvelle table doit recevoir `ENABLE ROW LEVEL SECURITY` dans sa migration (voir `drizzle/0003_enable_rls.sql`).

## Avant d'ouvrir au public

- Complétez les pages légales (passages entre crochets) et faites-les relire par un juriste.
- Données de santé : faites vérifier si votre activité impose un hébergeur certifié HDS. Un registre des traitements RGPD est obligatoire dans tous les cas.
- Vérifiez un nom de domaine chez Resend, sinon les e-mails ne partent que vers votre propre adresse.
