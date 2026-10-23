/**
 * URL publique du site, sans "/" final : APP_URL si elle est définie, sinon
 * l'adresse de production fournie par Vercel (https://<projet>.vercel.app ou votre domaine).
 */
export function appUrl() {
  const explicit = process.env.APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
