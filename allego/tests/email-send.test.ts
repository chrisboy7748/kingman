import { afterEach, describe, expect, it, vi } from "vitest";
import { sendEmail, sendEmailSafely } from "@/lib/email";

const mail = { to: "a@b.fr", subject: "Sujet", html: "<p>x</p>", text: "x" };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sendEmail", () => {
  it("n'appelle pas Resend sans clé", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    vi.spyOn(console, "info").mockImplementation(() => {});
    await sendEmail(mail);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("envoie à Resend avec la clé et l'expéditeur configurés", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "Allégo <bonjour@allego.fr>");
    const fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    await sendEmail(mail);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test");
    expect(JSON.parse(init.body)).toMatchObject({ from: "Allégo <bonjour@allego.fr>", to: ["a@b.fr"], subject: "Sujet" });
  });

  it("sendEmailSafely renvoie faux au lieu d'échouer", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("refusé", { status: 422 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await sendEmailSafely(mail)).toBe(false);
  });
});
