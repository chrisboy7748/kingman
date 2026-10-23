import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import type { PaypalSubscription } from "@/lib/paypal";

const remote = new Map<string, PaypalSubscription>();
vi.mock("@/lib/email", () => ({ sendEmailSafely: async () => true }));
vi.mock("@/lib/paypal", () => ({
  getPaypalSubscription: async (id: string) => {
    const sub = remote.get(id);
    if (!sub) throw new Error("introuvable");
    return sub;
  },
}));

const { db, schema } = await import("@/db");
const { handlePaypalEvent, syncSubscription } = await import("@/lib/billing");

async function makeUser() {
  const [u] = await db
    .insert(schema.users)
    .values({
      email: `${crypto.randomUUID()}@test.fr`,
      name: "Test",
      passwordHash: "x",
      healthConsentAt: new Date(),
      trialEndsAt: new Date(),
    })
    .returning();
  return u;
}

function paypalSub(id: string, userId: string, patch: Partial<PaypalSubscription> = {}): PaypalSubscription {
  return { id, status: "ACTIVE", plan_id: "P-MENSUEL", custom_id: userId, billing_info: { next_billing_time: "2026-11-23T10:00:00Z" }, ...patch };
}

const subscriptionRow = (id: string) =>
  db.query.subscriptions.findFirst({ where: eq(schema.subscriptions.paypalSubscriptionId, id) });

beforeEach(() => remote.clear());

describe("syncSubscription", () => {
  it("enregistre un abonnement actif avec sa prochaine échéance", async () => {
    const user = await makeUser();
    const row = await syncSubscription(paypalSub("I-A", user.id));
    expect(row).toMatchObject({ userId: user.id, plan: "mensuel", status: "ACTIVE" });
    expect(row?.currentPeriodEnd?.toISOString()).toBe("2026-11-23T10:00:00.000Z");
  });

  it("garde la fin de période connue après une résiliation", async () => {
    const user = await makeUser();
    await syncSubscription(paypalSub("I-B", user.id));
    await syncSubscription(paypalSub("I-B", user.id, { status: "CANCELLED", billing_info: {} }));
    const row = await subscriptionRow("I-B");
    expect(row?.status).toBe("CANCELLED");
    expect(row?.currentPeriodEnd?.toISOString()).toBe("2026-11-23T10:00:00.000Z");
  });

  it("déduit la fin de période du dernier paiement si besoin", async () => {
    const user = await makeUser();
    const row = await syncSubscription(
      paypalSub("I-C", user.id, { plan_id: "P-ANNUEL", status: "CANCELLED", billing_info: { last_payment: { time: "2026-03-01T08:00:00Z" } } }),
    );
    expect(row?.plan).toBe("annuel");
    expect(row?.currentPeriodEnd?.toISOString()).toBe("2027-03-01T08:00:00.000Z");
  });

  it("refuse un plan inconnu et ignore un compte supprimé", async () => {
    const user = await makeUser();
    await expect(syncSubscription(paypalSub("I-D", user.id, { plan_id: "P-AUTRE" }))).rejects.toThrow("Plan PayPal inconnu");
    expect(await syncSubscription(paypalSub("I-E", crypto.randomUUID()))).toBeNull();
    expect(await subscriptionRow("I-E")).toBeUndefined();
  });
});

describe("handlePaypalEvent", () => {
  it("relit l'abonnement chez PayPal plutôt que de croire le webhook", async () => {
    const user = await makeUser();
    remote.set("I-F", paypalSub("I-F", user.id, { status: "SUSPENDED" }));
    const outcome = await handlePaypalEvent({
      id: "WH-1",
      event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
      resource: { id: "I-F" },
    });
    expect(outcome).toBe("traite");
    expect((await subscriptionRow("I-F"))?.status).toBe("SUSPENDED");
  });

  it("enregistre un paiement une seule fois, même si l'événement est rejoué", async () => {
    const user = await makeUser();
    remote.set("I-G", paypalSub("I-G", user.id));
    const event = {
      id: "WH-2",
      event_type: "PAYMENT.SALE.COMPLETED",
      resource: { id: "SALE-1", billing_agreement_id: "I-G", amount: { total: "9.99", currency: "EUR" }, create_time: "2026-10-23T10:00:00Z" },
    };
    expect(await handlePaypalEvent(event)).toBe("traite");
    expect(await handlePaypalEvent(event)).toBe("deja_traite");
    const payments = await db.query.payments.findMany({ where: eq(schema.payments.paypalSubscriptionId, "I-G") });
    expect(payments).toHaveLength(1);
    expect(payments[0].amount).toBe(9.99);
    expect((await subscriptionRow("I-G"))?.status).toBe("ACTIVE");
  });

  it("ignore les événements sans rapport avec les abonnements", async () => {
    expect(await handlePaypalEvent({ id: "WH-3", event_type: "CUSTOMER.DISPUTE.CREATED", resource: {} })).toBe("ignore");
  });
});
