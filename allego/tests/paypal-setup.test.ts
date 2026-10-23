import { afterEach, describe, expect, it, vi } from "vitest";
import { createPaypalPlans, createPaypalWebhook, WEBHOOK_EVENTS } from "@/lib/paypal-setup";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function fakePaypal() {
  const calls: { path: string; body: any }[] = [];
  let n = 0;
  vi.stubEnv("PAYPAL_CLIENT_ID", "id");
  vi.stubEnv("PAYPAL_CLIENT_SECRET", "secret");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const path = new URL(url).pathname;
      if (path === "/v1/oauth2/token") return Response.json({ access_token: "t", expires_in: 3600 });
      calls.push({ path, body: JSON.parse(String(init.body)) });
      return Response.json({ id: `ID-${++n}` }, { status: 201 });
    }),
  );
  return calls;
}

describe("configuration PayPal", () => {
  it("crée un produit et deux formules en euros aux bons prix", async () => {
    const calls = fakePaypal();
    expect(await createPaypalPlans()).toEqual({ mensuel: "ID-2", annuel: "ID-3" });
    expect(calls.map((c) => c.path)).toEqual(["/v1/catalogs/products", "/v1/billing/plans", "/v1/billing/plans"]);
    const cycle = (i: number) => calls[i].body.billing_cycles[0];
    expect(calls[1].body.product_id).toBe("ID-1");
    expect(cycle(1).frequency.interval_unit).toBe("MONTH");
    expect(cycle(1).pricing_scheme.fixed_price).toEqual({ value: "12.99", currency_code: "EUR" });
    expect(cycle(2).frequency.interval_unit).toBe("YEAR");
    expect(cycle(2).pricing_scheme.fixed_price).toEqual({ value: "99.99", currency_code: "EUR" });
  });

  it("déclare le webhook avec les événements traités par Allégo", async () => {
    const calls = fakePaypal();
    expect(await createPaypalWebhook("https://allego.fr/api/paypal/webhook")).toBe("ID-1");
    expect(calls[0].body.url).toBe("https://allego.fr/api/paypal/webhook");
    expect(calls[0].body.event_types.map((e: { name: string }) => e.name)).toEqual(WEBHOOK_EVENTS);
  });
});
