// Vérifie la configuration au démarrage du serveur, pour qu'une variable oubliée
// se voie tout de suite dans les journaux plutôt qu'au premier paiement.

type Problem = { level: "erreur" | "attention"; message: string };

export function checkEnv(env: Record<string, string | undefined> = process.env): Problem[] {
  const problems: Problem[] = [];
  const err = (message: string) => problems.push({ level: "erreur", message });
  const warn = (message: string) => problems.push({ level: "attention", message });

  if (!env.DATABASE_URL) err("DATABASE_URL manque : l'application ne peut pas accéder à la base de données.");
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) err("SESSION_SECRET manque ou fait moins de 32 caractères.");
  if (env.APP_URL && !/^https?:\/\/[^/]+/.test(env.APP_URL)) err("APP_URL doit commencer par https://");

  const paypal = ["PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_PLAN_MONTHLY", "PAYPAL_PLAN_YEARLY"].filter((k) => !env[k]);
  if (paypal.length) warn(`PayPal non configuré (${paypal.join(", ")}) : les abonnements sont désactivés.`);
  else if (!env.PAYPAL_WEBHOOK_ID) warn("PAYPAL_WEBHOOK_ID manque : les renouvellements et résiliations faits chez PayPal ne seront pas pris en compte.");
  if (env.PAYPAL_ENV !== "live") warn("PAYPAL_ENV n'est pas \"live\" : les paiements passent par le bac à sable PayPal (faux argent).");
  if (!env.RESEND_API_KEY) warn("RESEND_API_KEY manque : aucun e-mail n'est envoyé.");
  if (!env.CRON_SECRET) warn("CRON_SECRET manque : le rappel de fin d'essai ne sera pas envoyé.");
  if (!env.ADMIN_EMAILS) warn("ADMIN_EMAILS est vide : personne n'a accès à /admin.");
  return problems;
}
