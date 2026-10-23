import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, count, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { hashPassword } from "@/lib/auth";
import { sendEmailSafely } from "@/lib/email";
import { passwordChangedEmail, passwordResetEmail } from "@/lib/email-templates";
import { appUrl } from "@/lib/url";

const VALIDITY_MS = 60 * 60 * 1000;
/** Nombre maximal de liens envoyés par compte et par heure. */
const MAX_PER_HOUR = 3;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Envoie un lien de réinitialisation si un compte existe pour cette adresse.
 * Ne dit jamais à l'appelant si le compte existe, pour ne pas révéler qui est inscrit.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, email.trim().toLowerCase()) });
  if (!user) return;

  const [{ recent }] = await db
    .select({ recent: count() })
    .from(schema.passwordResets)
    .where(and(eq(schema.passwordResets.userId, user.id), gt(schema.passwordResets.createdAt, new Date(Date.now() - VALIDITY_MS))));
  if (recent >= MAX_PER_HOUR) return;

  const token = randomBytes(32).toString("base64url");
  await db.insert(schema.passwordResets).values({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + VALIDITY_MS),
  });
  await sendEmailSafely(passwordResetEmail(user, `${appUrl()}/reinitialiser?jeton=${token}`));
}

/** Vrai si le jeton existe, n'a pas servi et n'a pas expiré. */
export async function isResetTokenValid(token: string): Promise<boolean> {
  const row = await db.query.passwordResets.findFirst({
    where: and(
      eq(schema.passwordResets.tokenHash, hashToken(token)),
      isNull(schema.passwordResets.usedAt),
      gt(schema.passwordResets.expiresAt, new Date()),
    ),
  });
  return Boolean(row);
}

/**
 * Change le mot de passe avec un jeton valide, qui ne peut servir qu'une fois.
 * Les autres liens du compte et toutes les sessions ouvertes sont invalidés.
 * Renvoie l'ID du compte, ou null si le jeton n'est pas valable.
 */
export async function resetPassword(token: string, newPassword: string): Promise<string | null> {
  const now = new Date();
  const passwordHash = await hashPassword(newPassword);
  const userId = await db.transaction(async (tx) => {
    const [used] = await tx
      .update(schema.passwordResets)
      .set({ usedAt: now })
      .where(
        and(
          eq(schema.passwordResets.tokenHash, hashToken(token)),
          isNull(schema.passwordResets.usedAt),
          gt(schema.passwordResets.expiresAt, now),
        ),
      )
      .returning({ userId: schema.passwordResets.userId });
    if (!used) return null;
    await tx.update(schema.users).set({ passwordHash, passwordChangedAt: now }).where(eq(schema.users.id, used.userId));
    await tx
      .update(schema.passwordResets)
      .set({ usedAt: now })
      .where(and(eq(schema.passwordResets.userId, used.userId), isNull(schema.passwordResets.usedAt)));
    return used.userId;
  });
  if (!userId) return null;

  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  if (user) await sendEmailSafely(passwordChangedEmail(user));
  return userId;
}
