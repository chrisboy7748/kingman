import { describe, expect, it } from "vitest";
import { checkEnv } from "@/lib/env";

const { db, schema } = await import("@/db");
const { isRateLimited, recordAttempt, purgeRateLimits } = await import("@/lib/rate-limit");

describe("checkEnv", () => {
  const complete = {
    DATABASE_URL: "postgres://x",
    SESSION_SECRET: "x".repeat(32),
    APP_URL: "https://allego.fr",
    PAYPAL_ENV: "live",
    PAYPAL_CLIENT_ID: "a",
    PAYPAL_CLIENT_SECRET: "b",
    PAYPAL_PLAN_MONTHLY: "P-1",
    PAYPAL_PLAN_YEARLY: "P-2",
    PAYPAL_WEBHOOK_ID: "W",
    RESEND_API_KEY: "re",
    CRON_SECRET: "c",
    ADMIN_EMAILS: "moi@allego.fr",
  };

  it("ne signale rien quand tout est configuré", () => {
    expect(checkEnv(complete)).toEqual([]);
  });

  it("signale en erreur ce qui empêche le site de fonctionner", () => {
    const problems = checkEnv({ ...complete, DATABASE_URL: "", SESSION_SECRET: "court" });
    expect(problems.filter((p) => p.level === "erreur")).toHaveLength(2);
  });

  it("prévient quand PayPal est en bac à sable ou les e-mails désactivés", () => {
    const messages = checkEnv({ ...complete, PAYPAL_ENV: "sandbox", RESEND_API_KEY: "" }).map((p) => p.message);
    expect(messages.some((m) => m.includes("bac à sable"))).toBe(true);
    expect(messages.some((m) => m.includes("RESEND_API_KEY"))).toBe(true);
  });
});

describe("limitation des tentatives", () => {
  it("bloque au-delà de la limite puis oublie les tentatives anciennes", async () => {
    const key = `test:${crypto.randomUUID()}`;
    for (let i = 0; i < 3; i++) await recordAttempt(key);
    expect(await isRateLimited(key, 3, 60_000)).toBe(true);
    expect(await isRateLimited(key, 4, 60_000)).toBe(false);

    await db.update(schema.rateLimitEvents).set({ createdAt: new Date(Date.now() - 2 * 86_400_000) });
    expect(await isRateLimited(key, 3, 60_000)).toBe(false);
    await purgeRateLimits();
    expect(await db.$count(schema.rateLimitEvents)).toBe(0);
  });
});
