// Envoi des e-mails par l'API Resend (https://resend.com/docs/api-reference/emails/send-email).
// Sans RESEND_API_KEY, les e-mails sont seulement écrits dans les journaux du serveur :
// pratique en développement, à ne pas laisser ainsi en production.

export type Email = { to: string; subject: string; html: string; text: string };

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(email: Email): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[e-mail non envoyé, RESEND_API_KEY absent] À : ${email.to} | ${email.subject}\n${email.text}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Allégo <onboarding@resend.dev>",
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Resend : ${res.status} ${(await res.text()).slice(0, 300)}`);
  }
}

/**
 * Envoie un e-mail sans jamais faire échouer l'action en cours :
 * une inscription ou un webhook PayPal ne doivent pas échouer parce qu'un e-mail n'est pas parti.
 */
export async function sendEmailSafely(email: Email): Promise<boolean> {
  try {
    await sendEmail(email);
    return true;
  } catch (err) {
    console.error(`E-mail non envoyé à ${email.to} (${email.subject})`, err);
    return false;
  }
}
