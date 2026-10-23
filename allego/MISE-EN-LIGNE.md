# Mettre Allégo en ligne

Ce guide part de zéro et ne demande aucune commande dans un terminal. Comptez environ une heure la première fois.

Vous allez créer quatre comptes :

| Service | À quoi il sert | Coût indicatif |
|---|---|---|
| [Supabase](https://supabase.com) | La base de données (comptes, pesées, journal…) | Gratuit pour commencer. Les projets gratuits sont mis en pause après une période d'inactivité, prévoyez l'offre payante (environ 25 $ par mois) à l'ouverture au public. |
| [Vercel](https://vercel.com) | Héberge le site | L'offre gratuite (Hobby) est réservée à un usage non commercial : pour un service payant, il faut l'offre Pro (environ 20 $ par mois). |
| [PayPal Business](https://www.paypal.com/fr/business) | Encaisse les abonnements | Pas d'abonnement, une commission sur chaque paiement. |
| [Resend](https://resend.com) | Envoie les e-mails | Gratuit jusqu'à 3 000 e-mails par mois. |

Les prix changent : vérifiez-les sur chaque site avant de vous engager.

Gardez un document (ou un gestionnaire de mots de passe) pour noter les valeurs au fur et à mesure. **Ne les partagez avec personne** : elles donnent accès à votre base de données et à votre compte PayPal.

---

## Étape 1 — Préparer le code

Le code d'Allégo est sur la branche `ccr-c17f4645-yvoy4b` du dépôt GitHub `kingman`. Vercel met en ligne la branche principale (`main`) : il faut donc d'abord y fusionner cette branche, par une *pull request* sur GitHub.

## Étape 2 — La base de données (Supabase)

1. Créez un compte sur supabase.com, puis **New project**.
2. Nom : `allego`. **Database password** : cliquez sur *Generate a password* et notez-le.
3. **Region** : choisissez **West EU (Paris)**. Vos données restent en France, au plus près du site.
4. Une fois le projet prêt, cliquez sur **Connect** en haut de la page, onglet **Connection string**, puis choisissez **Transaction pooler**.
5. Copiez l'adresse qui commence par `postgresql://postgres.` et remplacez `[YOUR-PASSWORD]` par le mot de passe noté à l'étape 2. C'est votre **`DATABASE_URL`**.

Vous n'avez rien d'autre à faire dans Supabase : les tables sont créées automatiquement à chaque mise en ligne. Elles sont aussi protégées contre l'accès par l'API publique de Supabase.

## Étape 3 — Deux mots de passe techniques

Allégo a besoin de deux longues chaînes aléatoires, que personne n'a besoin de retenir :

- **`SESSION_SECRET`** : signe les connexions des utilisateurs. Au moins 32 caractères.
- **`CRON_SECRET`** : protège la tâche quotidienne qui envoie les rappels de fin d'essai.

Générez-les avec votre gestionnaire de mots de passe (40 caractères, lettres et chiffres). Si vous avez un terminal, `openssl rand -base64 32` convient aussi.

## Étape 4 — Le site (Vercel)

1. Créez un compte sur vercel.com avec **Continue with GitHub**.
2. **Add New… → Project**, puis **Import** à côté du dépôt `kingman`.
3. **Root Directory** : cliquez sur *Edit* et choisissez le dossier **`allego`**. Vercel reconnaît Next.js tout seul.
4. Ouvrez **Environment Variables** et ajoutez :

   | Nom | Valeur |
   |---|---|
   | `DATABASE_URL` | l'adresse de l'étape 2 |
   | `SESSION_SECRET` | la chaîne de l'étape 3 |
   | `CRON_SECRET` | la chaîne de l'étape 3 |
   | `ADMIN_EMAILS` | votre adresse e-mail (celle avec laquelle vous créerez votre compte Allégo) |
   | `PAYPAL_ENV` | `sandbox` |

5. Cliquez sur **Deploy**. Après deux à trois minutes, Vercel affiche l'adresse du site, du type `https://allego-xxxx.vercel.app`.
6. Ouvrez-la, créez votre compte avec l'adresse mise dans `ADMIN_EMAILS`, puis allez sur **Administration** dans le menu. La section **Configuration** liste ce qu'il reste à brancher.

Chaque fois que vous modifiez une variable dans Vercel, elle ne s'applique qu'au déploiement suivant : allez dans **Deployments**, cliquez sur les trois points du dernier déploiement, puis **Redeploy**.

## Étape 5 — Les paiements en mode test (PayPal Sandbox)

On commence en *sandbox* : de faux comptes et du faux argent, pour tout tester sans risque.

1. Créez un compte **PayPal Business** si ce n'est pas fait, puis connectez-vous sur [developer.paypal.com](https://developer.paypal.com).
2. **Apps & Credentials**, vérifiez que l'interrupteur en haut est sur **Sandbox**, puis **Create App** (nom : `Allégo`, type *Merchant*).
3. Copiez le **Client ID** et le **Secret**. Ajoutez-les dans Vercel sous les noms `PAYPAL_CLIENT_ID` et `PAYPAL_CLIENT_SECRET`, puis **redéployez**.
4. Dans Allégo, page **Administration**, cliquez sur **Créer les formules et le webhook PayPal**. Trois valeurs s'affichent : `PAYPAL_PLAN_MONTHLY`, `PAYPAL_PLAN_YEARLY` et `PAYPAL_WEBHOOK_ID`.
5. Ajoutez ces trois variables dans Vercel, puis **redéployez**. Ne cliquez qu'une fois sur le bouton : un second clic créerait des formules en double chez PayPal.

### Tester un abonnement

1. Sur developer.paypal.com, **Testing Tools → Sandbox Accounts** : PayPal a créé un compte acheteur fictif (*Personal*). Ouvrez-le pour voir son e-mail et son mot de passe.
2. Dans Allégo, page **Abonnement**, cliquez sur **Payer avec PayPal** et connectez-vous avec ce compte acheteur fictif.
3. De retour dans Allégo, l'abonnement doit apparaître comme actif.
4. Cliquez sur **Résilier mon abonnement** : le statut passe à « résilié » et l'accès reste ouvert jusqu'à la fin de la période.

## Étape 6 — Les e-mails (Resend)

1. Créez un compte sur resend.com, puis **API Keys → Create API Key** (permission *Sending access*).
2. Ajoutez la clé dans Vercel sous le nom `RESEND_API_KEY`, puis **redéployez**.
3. Testez avec **Mot de passe oublié** sur la page de connexion : vous devez recevoir l'e-mail.

Tant que vous n'avez pas de nom de domaine, Resend n'envoie qu'à l'adresse de votre propre compte Resend. C'est suffisant pour tester, mais pas pour de vrais utilisateurs : voir l'étape 8.

## Étape 7 — Passer aux vrais paiements

Quand tout fonctionne en sandbox :

1. Sur developer.paypal.com, basculez l'interrupteur sur **Live**, puis créez une application comme à l'étape 5.
2. Dans Vercel, remplacez `PAYPAL_CLIENT_ID` et `PAYPAL_CLIENT_SECRET` par les clés *Live* et mettez `PAYPAL_ENV` à `live`.
3. **Supprimez** `PAYPAL_PLAN_MONTHLY`, `PAYPAL_PLAN_YEARLY` et `PAYPAL_WEBHOOK_ID` : ce sont ceux du mode test. Puis **redéployez**.
4. Dans Allégo, page **Administration**, cliquez de nouveau sur **Créer les formules et le webhook PayPal**, ajoutez les trois nouvelles valeurs dans Vercel et **redéployez**.
5. Faites un véritable abonnement mensuel avec votre propre compte PayPal, vérifiez qu'il apparaît, puis résiliez-le.

Quand la section **Configuration** de la page Administration indique « Tout est configuré », Allégo est prêt.

## Étape 8 — Votre nom de domaine (plus tard)

1. Achetez un domaine (par exemple chez OVHcloud, Gandi ou directement dans Vercel).
2. Dans Vercel : **Settings → Domains → Add**, puis suivez les indications pour relier le domaine.
3. Dans Resend : **Domains → Add Domain**, ajoutez les enregistrements DNS indiqués chez votre registraire. Une fois le domaine vérifié, ajoutez dans Vercel `EMAIL_FROM` = `Allégo <bonjour@votre-domaine.fr>`.
4. PayPal doit connaître la nouvelle adresse du webhook. Supprimez `PAYPAL_WEBHOOK_ID` dans Vercel, redéployez, puis cliquez sur le bouton de la page Administration : il ne recréera que le webhook. Ajoutez le nouvel ID et redéployez. Pensez aussi à supprimer l'ancien webhook sur developer.paypal.com.

## Surveiller le site

L'adresse `https://votre-site/api/sante` répond `{"statut":"ok"}` quand le site et la base de données fonctionnent. Vous pouvez la confier à un service gratuit comme [UptimeRobot](https://uptimerobot.com), qui vous préviendra par e-mail en cas de panne.

Les erreurs du serveur se lisent dans Vercel, onglet **Logs**.

## Avant d'ouvrir au public

- [ ] Compléter les pages **Mentions légales**, **Confidentialité** et **Conditions générales** (passages entre crochets), et les faire relire par un juriste.
- [ ] Faire vérifier si votre activité impose un hébergeur certifié pour les données de santé (HDS).
- [ ] Tenir un registre des traitements RGPD (la CNIL propose un modèle).
- [ ] Choisir un médiateur de la consommation (obligatoire pour vendre à des particuliers).
- [ ] Brancher un nom de domaine vérifié chez Resend.
- [ ] Passer Vercel (Pro) et Supabase sur une offre adaptée à un usage commercial.
