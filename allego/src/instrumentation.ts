export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  const { checkEnv } = await import("./lib/env");
  for (const p of checkEnv()) {
    (p.level === "erreur" ? console.error : console.warn)(`[configuration] ${p.level} : ${p.message}`);
  }
}
