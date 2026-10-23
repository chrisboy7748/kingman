import type { Email } from "@/lib/email";
import { formatDateTime } from "@/lib/dates";
import { PLANS, type PlanKey } from "@/lib/plans";
import { appUrl } from "@/lib/url";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Content = { subject: string; greeting: string; paragraphs: string[]; cta?: { label: string; url: string }; footnote?: string };

/** Met en forme un e-mail : HTML simple compatible avec les messageries, et version texte. */
function render(to: string, c: Content): Email {
  const p = (t: string) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#1e2b22">${escapeHtml(t)}</p>`;
  const button = c.cta
    ? `<p style="margin:24px 0"><a href="${escapeHtml(c.cta.url)}" style="display:inline-block;background:#2f6b45;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px;font-size:16px">${escapeHtml(c.cta.label)}</a></p>`
    : "";
  const footnote = c.footnote
    ? `<p style="margin:24px 0 0;font-size:14px;line-height:1.5;color:#5a675e">${escapeHtml(c.footnote)}</p>`
    : "";
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#fafbf6;font-family:Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e3e9df;border-radius:16px">
<tr><td style="padding:32px">
<p style="margin:0 0 24px;font-size:22px;font-weight:800;color:#2f6b45">Allégo</p>
${p(c.greeting)}${c.paragraphs.map(p).join("")}${button}${footnote}
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;color:#5a675e">Allégo donne des repères généraux et ne remplace pas l'avis d'un médecin.</p>
</td></tr></table></body></html>`;
  const text = [c.greeting, ...c.paragraphs, c.cta ? `${c.cta.label} : ${c.cta.url}` : "", c.footnote ?? ""]
    .filter(Boolean)
    .join("\n\n");
  return { to, subject: c.subject, html, text };
}

type Recipient = { email: string; name: string };

export function welcomeEmail(u: Recipient, trialEndsAt: Date) {
  return render(u.email, {
    subject: "Bienvenue sur Allégo",
    greeting: `Bonjour ${u.name},`,
    paragraphs: [
      "Votre compte Allégo est créé. Si ce n'est pas déjà fait, répondez au questionnaire de départ : il calcule votre objectif calorique et prépare votre programme.",
      `Votre essai gratuit dure jusqu'au ${formatDateTime(trialEndsAt)}. Aucun paiement ne vous sera demandé d'ici là.`,
      "Un conseil pour bien démarrer : pesez-vous une fois par semaine, le même jour, le matin à jeun.",
    ],
    cta: { label: "Ouvrir Allégo", url: `${appUrl()}/app` },
  });
}

export function passwordResetEmail(u: Recipient, url: string) {
  return render(u.email, {
    subject: "Réinitialiser votre mot de passe Allégo",
    greeting: `Bonjour ${u.name},`,
    paragraphs: ["Vous avez demandé à changer votre mot de passe. Ce lien est valable une heure et ne fonctionne qu'une fois."],
    cta: { label: "Choisir un nouveau mot de passe", url },
    footnote: "Si vous n'avez rien demandé, ignorez cet e-mail : votre mot de passe actuel reste valable.",
  });
}

export function passwordChangedEmail(u: Recipient) {
  return render(u.email, {
    subject: "Votre mot de passe Allégo a été modifié",
    greeting: `Bonjour ${u.name},`,
    paragraphs: [
      "Le mot de passe de votre compte vient d'être modifié. Vous avez été déconnecté de vos autres appareils.",
      "Si vous n'êtes pas à l'origine de ce changement, réinitialisez votre mot de passe tout de suite.",
    ],
    cta: { label: "Réinitialiser mon mot de passe", url: `${appUrl()}/mot-de-passe-oublie` },
  });
}

export function trialEndingEmail(u: Recipient, trialEndsAt: Date) {
  return render(u.email, {
    subject: "Votre essai Allégo se termine bientôt",
    greeting: `Bonjour ${u.name},`,
    paragraphs: [
      `Votre essai gratuit se termine le ${formatDateTime(trialEndsAt)}.`,
      `Pour garder votre programme, votre courbe et votre journal, choisissez une formule : ${PLANS.mensuel.price} par mois ou ${PLANS.annuel.price} par an, payée par PayPal et résiliable à tout moment. Si vous vous abonnez avant la fin de l'essai, le premier paiement n'a lieu qu'à cette date.`,
      "Sans abonnement, vos données restent conservées et vous pourrez reprendre plus tard.",
    ],
    cta: { label: "Choisir une formule", url: `${appUrl()}/app/abonnement` },
  });
}

export function subscriptionActiveEmail(u: Recipient, plan: PlanKey, firstBilling: Date | null) {
  const p = PLANS[plan];
  return render(u.email, {
    subject: "Votre abonnement Allégo est actif",
    greeting: `Bonjour ${u.name},`,
    paragraphs: [
      `Merci ! Votre abonnement ${p.name.toLowerCase()} à ${p.price} ${plan === "mensuel" ? "par mois" : "par an"} est actif.`,
      firstBilling
        ? `Prochain paiement par PayPal le ${formatDateTime(firstBilling)}. Il se renouvelle automatiquement.`
        : "Il se renouvelle automatiquement par PayPal.",
      "Vous pouvez le résilier à tout moment depuis la page Abonnement.",
    ],
    cta: { label: "Gérer mon abonnement", url: `${appUrl()}/app/abonnement` },
  });
}

export function subscriptionCancelledEmail(u: Recipient, accessUntil: Date | null) {
  return render(u.email, {
    subject: "Votre abonnement Allégo est résilié",
    greeting: `Bonjour ${u.name},`,
    paragraphs: [
      "Votre abonnement est résilié : aucun autre paiement ne sera prélevé.",
      accessUntil && accessUntil > new Date()
        ? `Vous gardez l'accès à Allégo jusqu'au ${formatDateTime(accessUntil)}.`
        : "Vos données restent conservées si vous souhaitez reprendre plus tard.",
    ],
    cta: { label: "Me réabonner", url: `${appUrl()}/app/abonnement` },
  });
}

export function paymentFailedEmail(u: Recipient) {
  return render(u.email, {
    subject: "Votre paiement Allégo n'a pas abouti",
    greeting: `Bonjour ${u.name},`,
    paragraphs: [
      "PayPal n'a pas pu prélever votre abonnement Allégo, qui est suspendu pour l'instant.",
      "Vérifiez le moyen de paiement associé dans votre compte PayPal, ou choisissez de nouveau une formule dans Allégo.",
    ],
    cta: { label: "Voir mon abonnement", url: `${appUrl()}/app/abonnement` },
  });
}
