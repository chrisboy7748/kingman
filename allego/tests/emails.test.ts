import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import type { Email } from "@/lib/email";

const outbox: Email[] = [];
vi.mock("@/lib/email", () => ({
  sendEmailSafely: async (email: Email) => {
    outbox.push(email);
    return true;
  },
}));

const { db, schema } = await import("@/db");
const { requestPasswordReset, resetPassword, isResetTokenValid } = await import("@/lib/password-reset");
const { sendTrialReminders } = await import("@/lib/reminders");
const { syncSubscription } = await import("@/lib/billing");
const { verifyPassword } = await import("@/lib/auth");
const { welcomeEmail } = await import("@/lib/email-templates");

async function makeUser(patch: Partial<typeof schema.users.$inferInsert> = {}) {
  const [u] = await db
    .insert(schema.users)
    .values({
      email: `${crypto.randomUUID()}@test.fr`,
      name: "Léa",
      passwordHash: "x",
      healthConsentAt: new Date(),
      trialEndsAt: new Date(Date.now() + 7 * 864e5),
      ...patch,
    })
    .returning();
  return u;
}

const tokenFrom = (email: Email) => /jeton=([\w-]+)/.exec(email.text)?.[1] ?? "";

beforeEach(() => {
  outbox.length = 0;
});

describe("modèles d'e-mails", () => {
  it("échappe le prénom dans la version HTML et fournit une version texte", () => {
    const mail = welcomeEmail({ email: "a@b.fr", name: "<script>x</script>" }, new Date("2026-10-30T12:00:00Z"));
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.text).toContain("30 octobre 2026");
    expect(mail.text).toContain("/app");
  });
});

describe("réinitialisation du mot de passe", () => {
  it("envoie un lien qui ne sert qu'une fois et change le mot de passe", async () => {
    const user = await makeUser();
    await requestPasswordReset(user.email.toUpperCase());
    expect(outbox).toHaveLength(1);
    const token = tokenFrom(outbox[0]);
    expect(await isResetTokenValid(token)).toBe(true);

    expect(await resetPassword(token, "nouveau-mot-de-passe")).toBe(user.id);
    const updated = await db.query.users.findFirst({ where: eq(schema.users.id, user.id) });
    expect(await verifyPassword("nouveau-mot-de-passe", updated!.passwordHash)).toBe(true);
    expect(updated!.passwordChangedAt).not.toBeNull();
    expect(outbox[1].subject).toContain("a été modifié");

    expect(await resetPassword(token, "autre-mot-de-passe")).toBeNull();
    expect(await isResetTokenValid(token)).toBe(false);
  });

  it("invalide les autres liens du compte une fois le mot de passe changé", async () => {
    const user = await makeUser();
    await requestPasswordReset(user.email);
    await requestPasswordReset(user.email);
    const [first, second] = outbox.map(tokenFrom);
    expect(await resetPassword(second, "nouveau-mot-de-passe")).toBe(user.id);
    expect(await isResetTokenValid(first)).toBe(false);
  });

  it("n'envoie rien pour une adresse inconnue et limite les demandes à 3 par heure", async () => {
    await requestPasswordReset("personne@test.fr");
    expect(outbox).toHaveLength(0);
    const user = await makeUser();
    for (let i = 0; i < 5; i++) await requestPasswordReset(user.email);
    expect(outbox).toHaveLength(3);
  });

  it("refuse un lien expiré", async () => {
    const user = await makeUser();
    await requestPasswordReset(user.email);
    const token = tokenFrom(outbox[0]);
    await db.update(schema.passwordResets).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(schema.passwordResets.userId, user.id));
    expect(await resetPassword(token, "nouveau-mot-de-passe")).toBeNull();
  });
});

describe("rappel de fin d'essai", () => {
  const now = new Date("2030-01-10T08:00:00Z");
  afterEach(async () => {
    await db.update(schema.users).set({ trialReminderSentAt: now });
  });

  it("prévient une seule fois les comptes dont l'essai finit dans les 48 heures, sauf les abonnés", async () => {
    await db.update(schema.users).set({ trialReminderSentAt: now }); // comptes des autres tests
    const due = await makeUser({ trialEndsAt: new Date("2030-01-11T10:00:00Z") });
    await makeUser({ trialEndsAt: new Date("2030-01-15T10:00:00Z") }); // trop tôt
    await makeUser({ trialEndsAt: new Date("2030-01-09T10:00:00Z") }); // essai déjà fini
    const subscribed = await makeUser({ trialEndsAt: new Date("2030-01-11T10:00:00Z") });
    await db.insert(schema.subscriptions).values({ userId: subscribed.id, paypalSubscriptionId: `I-${crypto.randomUUID()}`, plan: "mensuel", status: "ACTIVE" });

    expect(await sendTrialReminders(now)).toBe(1);
    expect(outbox.map((m) => m.to)).toEqual([due.email]);
    expect(await sendTrialReminders(now)).toBe(0);
  });
});

describe("e-mails d'abonnement", () => {
  it("envoie un e-mail par changement de statut, jamais deux fois", async () => {
    const user = await makeUser();
    const id = `I-${crypto.randomUUID()}`;
    const base = { id, plan_id: "P-MENSUEL", custom_id: user.id, billing_info: { next_billing_time: "2030-02-01T00:00:00Z" } };

    await syncSubscription({ ...base, status: "APPROVED" });
    await syncSubscription({ ...base, status: "ACTIVE" });
    await syncSubscription({ ...base, status: "ACTIVE" });
    await syncSubscription({ ...base, status: "SUSPENDED" });
    await syncSubscription({ ...base, status: "CANCELLED", billing_info: {} });
    await syncSubscription({ ...base, status: "CANCELLED", billing_info: {} });

    expect(outbox.map((m) => m.subject)).toEqual([
      "Votre abonnement Allégo est actif",
      "Votre paiement Allégo n'a pas abouti",
      "Votre abonnement Allégo est résilié",
    ]);
  });
});
