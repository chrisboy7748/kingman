import type { Metadata } from "next";
import { and, desc, eq, gte } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireMember } from "@/lib/account";
import { addDays, formatDate, today } from "@/lib/dates";
import { ACTIVITIES } from "@/lib/activities";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { addActivity, deleteActivity } from "../tracking-actions";

export const metadata: Metadata = { title: "Activités" };

export default async function ActivitiesPage() {
  const { user } = await requireMember();
  const day = today();
  const weekStart = addDays(day, -6);
  const entries = await db
    .select()
    .from(schema.activityEntries)
    .where(and(eq(schema.activityEntries.userId, user.id), gte(schema.activityEntries.date, addDays(day, -30))))
    .orderBy(desc(schema.activityEntries.date), desc(schema.activityEntries.createdAt));

  const week = entries.filter((e) => e.date >= weekStart);
  const weekMinutes = week.reduce((s, e) => s + e.durationMin, 0);
  const weekKcal = week.reduce((s, e) => s + e.caloriesBurned, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold">Activités</h1>
        <p className="mt-2 max-w-2xl text-grise">
          L&apos;Organisation mondiale de la santé recommande au moins 150 minutes d&apos;activité
          modérée par semaine. La marche compte.
        </p>
      </div>

      <section className="panel">
        <p className="text-sm text-grise">Ces 7 derniers jours</p>
        <p className="font-display mt-1 text-3xl font-extrabold tabular">
          {weekMinutes} min
          <span className="ml-2 font-sans text-base font-medium text-grise">
            sur 150 conseillées, environ {weekKcal.toLocaleString("fr-FR")} kcal dépensées
          </span>
        </p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-brume" role="progressbar" aria-label="Minutes d'activité cette semaine" aria-valuemin={0} aria-valuemax={150} aria-valuenow={weekMinutes}>
          <div className="h-full rounded-full bg-feuille" style={{ width: `${Math.min(100, (weekMinutes / 150) * 100)}%` }} />
        </div>
      </section>

      <section className="panel">
        <h2 className="text-xl font-bold">Ajouter une activité</h2>
        <ActionForm action={addActivity} className="mt-4 grid gap-4 sm:grid-cols-[10rem_1fr_8rem_auto] sm:items-end">
          <div>
            <label htmlFor="date" className="label">Date</label>
            <input id="date" name="date" type="date" className="input" defaultValue={day} max={day} required />
          </div>
          <div>
            <label htmlFor="activityId" className="label">Activité</label>
            <select id="activityId" name="activityId" className="input" required defaultValue="">
              <option value="" disabled>Choisir…</option>
              {ACTIVITIES.map((a) => (
                <option key={a.id} value={a.id}>{a.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="durationMin" className="label">Durée (min)</label>
            <input id="durationMin" name="durationMin" inputMode="numeric" className="input tabular" placeholder="30" required />
          </div>
          <SubmitButton>Ajouter</SubmitButton>
        </ActionForm>
        <p className="hint mt-3">Les calories dépensées sont estimées à partir de votre poids et de l&apos;intensité de l&apos;activité.</p>
      </section>

      <section>
        <h2 className="text-xl font-bold">30 derniers jours</h2>
        {entries.length === 0 ? (
          <p className="hint mt-3">Aucune activité notée. Une marche de 20 minutes est un très bon début.</p>
        ) : (
          <ul className="mt-3 max-w-2xl divide-y divide-brume border-y border-brume">
            {entries.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>
                  <span className="font-semibold">{e.type}</span>
                  <span className="text-grise">, {formatDate(e.date)}</span>
                </span>
                <span className="flex items-center gap-3 tabular">
                  {e.durationMin} min, {e.caloriesBurned} kcal
                  <form action={deleteActivity}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="text-sm text-grise underline hover:text-pamplemousse" aria-label={`Supprimer ${e.type} du ${formatDate(e.date)}`}>
                      Retirer
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
