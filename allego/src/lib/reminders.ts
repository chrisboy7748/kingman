import "server-only";
import { and, eq, gt, isNull, lte, notExists } from "drizzle-orm";
import { db, schema } from "@/db";
import { sendEmailSafely } from "@/lib/email";
import { trialEndingEmail } from "@/lib/email-templates";

const WINDOW_MS = 48 * 60 * 60 * 1000;

/**
 * Prévient les comptes dont l'essai se termine dans les 48 heures et qui ne sont pas abonnés.
 * Chaque compte n'est prévenu qu'une fois ; en cas d'échec d'envoi, il le sera au passage suivant.
 */
export async function sendTrialReminders(now = new Date()): Promise<number> {
  const due = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(
      and(
        gt(schema.users.trialEndsAt, now),
        lte(schema.users.trialEndsAt, new Date(now.getTime() + WINDOW_MS)),
        isNull(schema.users.trialReminderSentAt),
        notExists(
          db
            .select({ id: schema.subscriptions.id })
            .from(schema.subscriptions)
            .where(and(eq(schema.subscriptions.userId, schema.users.id), eq(schema.subscriptions.status, "ACTIVE"))),
        ),
      ),
    );

  let sent = 0;
  for (const { id } of due) {
    const [user] = await db
      .update(schema.users)
      .set({ trialReminderSentAt: now })
      .where(and(eq(schema.users.id, id), isNull(schema.users.trialReminderSentAt)))
      .returning();
    if (!user) continue;
    if (await sendEmailSafely(trialEndingEmail(user, user.trialEndsAt))) sent++;
    else await db.update(schema.users).set({ trialReminderSentAt: null }).where(eq(schema.users.id, id));
  }
  return sent;
}
