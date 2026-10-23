# Allégo

Application d'accompagnement à la perte de poids, avec abonnement payé par PayPal.

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
- **Administration** (`/admin`) : nombre de comptes, essais en cours, abonnés, revenu mensuel récurrent, encaissements sur 30 jours, derniers inscrits.

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

## Brancher PayPal

1. Créez un **compte PayPal Business**.
2. Sur [developer.paypal.com](https://developer.paypal.com), ouvrez **Apps & Credentials**, mode **Sandbox**, et créez une application. Copiez le *Client ID* et le *Secret* dans `PAYPAL_CLIENT_ID` et `PAYPAL_CLIENT_SECRET`, avec `PAYPAL_ENV=sandbox`.
3. Lancez `npm run paypal:setup`. Le script crée le produit et les deux formules chez PayPal, puis affiche les lignes `PAYPAL_PLAN_MONTHLY` et `PAYPAL_PLAN_YEARLY` à copier dans `.env`.
4. Dans votre application PayPal, ajoutez un **webhook** :
   - URL : `https://<votre-domaine>/api/paypal/webhook`
   - Événements : `BILLING.SUBSCRIPTION.*` (tous) et `PAYMENT.SALE.COMPLETED`

   Copiez l'*ID du webhook* dans `PAYPAL_WEBHOOK_ID`. PayPal ne peut pas joindre `localhost` : pour tester les webhooks en local, utilisez un tunnel (par exemple `ngrok`) ou testez directement sur le site en ligne.
5. Testez un abonnement avec un compte acheteur sandbox (onglet *Sandbox accounts*).
6. Pour les vrais paiements, refaites les étapes 2 à 4 en mode **Live**, avec `PAYPAL_ENV=live`.

Fonctionnement : le bouton « Payer avec PayPal » crée l'abonnement côté serveur et envoie l'utilisateur sur PayPal. Au retour, l'abonnement est relu chez PayPal avant d'être activé. Les webhooks tiennent ensuite le statut à jour : renouvellement, échec de paiement, résiliation. Leur signature est vérifiée, et chaque événement n'est traité qu'une fois. Si l'utilisateur s'abonne pendant son essai, le premier prélèvement n'a lieu qu'à la fin de l'essai.

## Brancher les e-mails (Resend)

1. Créez un compte sur [resend.com](https://resend.com), puis une clé dans **API Keys** (droit *Sending access* suffit). Mettez-la dans `RESEND_API_KEY`.
2. Tant que vous n'avez pas de nom de domaine, gardez `EMAIL_FROM=Allégo <onboarding@resend.dev>`. Resend n'envoie alors qu'à l'adresse e-mail de votre compte Resend, ce qui suffit pour tester.
3. Quand vous aurez un domaine : dans **Domains**, ajoutez-le et copiez les enregistrements DNS indiqués chez votre registraire. Une fois le domaine vérifié, mettez par exemple `EMAIL_FROM=Allégo <bonjour@votre-domaine.fr>`. Les e-mails partent alors vers n'importe quelle adresse.

Sans `RESEND_API_KEY`, l'application fonctionne : les e-mails sont écrits dans les journaux du serveur au lieu d'être envoyés.

Le rappel de fin d'essai est envoyé par une tâche quotidienne (`vercel.json`, 8 h UTC). Sur Vercel, définissez `CRON_SECRET` avec une valeur aléatoire : Vercel l'envoie de lui-même à chaque appel.

## Mettre en ligne (Vercel et Supabase)

1. **Base de données** : créez un projet [Supabase](https://supabase.com) dans une région européenne. Dans *Connect*, copiez l'URL du **Transaction pooler** dans `DATABASE_URL`, puis lancez `npm run db:migrate` avec cette URL.
2. **Site** : importez le dépôt sur [Vercel](https://vercel.com), avec `allego` comme *Root Directory*.
3. Dans Vercel, renseignez toutes les variables de `.env.example`. Mettez `APP_URL` sur votre domaine (`https://…`, sans `/` final) et une valeur aléatoire pour `SESSION_SECRET` (`openssl rand -base64 32`).
4. Indiquez votre e-mail dans `ADMIN_EMAILS` pour accéder à `/admin`.

## Avant d'ouvrir au public

- Complétez les pages légales (passages entre crochets) et faites-les relire par un juriste.
- Données de santé : faites vérifier si votre activité impose un hébergeur certifié HDS. Un registre des traitements RGPD est obligatoire dans tous les cas.
- Vérifiez un nom de domaine chez Resend, sinon les e-mails ne partent que vers votre propre adresse.
- Limitez les tentatives de connexion (anti force brute) au niveau de l'hébergeur ou de l'application.
