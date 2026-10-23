// Client minimal de l'API REST PayPal (abonnements et webhooks).
// Doc : https://developer.paypal.com/docs/api/subscriptions/v1/

export type PaypalSubscription = {
  id: string;
  status: "APPROVAL_PENDING" | "APPROVED" | "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";
  plan_id: string;
  custom_id?: string;
  billing_info?: {
    next_billing_time?: string;
    last_payment?: { time?: string; amount?: { value: string; currency_code: string } };
  };
  links?: { href: string; rel: string; method?: string }[];
};

export function paypalConfigured() {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID &&
      process.env.PAYPAL_CLIENT_SECRET &&
      process.env.PAYPAL_PLAN_MONTHLY &&
      process.env.PAYPAL_PLAN_YEARLY,
  );
}

function baseUrl() {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET doivent être définis");
  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Authentification PayPal refusée (${res.status})`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export async function paypalRequest<T>(path: string, init: { method?: string; body?: string } = {}): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: init.body,
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`PayPal ${init.method ?? "GET"} ${path} : ${res.status} ${detail.slice(0, 300)}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function createPaypalSubscription(input: {
  planId: string;
  userId: string;
  returnUrl: string;
  cancelUrl: string;
  /** Premier prélèvement : à la fin de l'essai gratuit s'il est en cours. */
  startTime?: Date;
}): Promise<{ id: string; approveUrl: string }> {
  const sub = await paypalRequest<PaypalSubscription>("/v1/billing/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: input.planId,
      custom_id: input.userId,
      ...(input.startTime && { start_time: input.startTime.toISOString() }),
      application_context: {
        brand_name: "Allégo",
        locale: "fr-FR",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
      },
    }),
  });
  const approveUrl = sub.links?.find((l) => l.rel === "approve")?.href;
  if (!approveUrl) throw new Error("PayPal n'a pas renvoyé de lien de validation");
  return { id: sub.id, approveUrl };
}

export async function getPaypalSubscription(id: string) {
  return paypalRequest<PaypalSubscription>(`/v1/billing/subscriptions/${encodeURIComponent(id)}`);
}

export async function cancelPaypalSubscription(id: string, reason: string) {
  await paypalRequest<void>(`/v1/billing/subscriptions/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

/**
 * Vérifie auprès de PayPal qu'un webhook vient bien de PayPal.
 * Le corps brut est réinjecté tel quel : PayPal compare la signature au JSON exact qu'il a envoyé.
 */
export async function verifyPaypalWebhook(headers: Headers, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  const h = (name: string) => JSON.stringify(headers.get(name) ?? "");
  const body =
    `{"auth_algo":${h("paypal-auth-algo")},"cert_url":${h("paypal-cert-url")},` +
    `"transmission_id":${h("paypal-transmission-id")},"transmission_sig":${h("paypal-transmission-sig")},` +
    `"transmission_time":${h("paypal-transmission-time")},"webhook_id":${JSON.stringify(webhookId)},` +
    `"webhook_event":${rawBody}}`;
  try {
    const res = await paypalRequest<{ verification_status: string }>(
      "/v1/notifications/verify-webhook-signature",
      { method: "POST", body },
    );
    return res.verification_status === "SUCCESS";
  } catch {
    return false;
  }
}
