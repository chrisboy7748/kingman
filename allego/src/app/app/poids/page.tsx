import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireMember } from "@/lib/account";
import { formatDate, today } from "@/lib/dates";
import { formatKg } from "@/lib/health";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { WeightChart } from "@/components/weight-chart";
import { addWeight, deleteWeight } from "../tracking-actions";

export const metadata: Metadata = { title: "Mon poids" };

export default async function WeightPage() {
  const { user, profile } = await requireMember();
  const entries = await db
    .select()
    .from(schema.weightEntries)
    .where(eq(schema.weightEntries.userId, user.id))
    .orderBy(desc(schema.weightEntries.date));
  const day = today();
  const chronological = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold">Mon poids</h1>
        <p className="mt-2 max-w-2xl text-grise">
          Pesez-vous une fois par semaine, le même jour, le matin à jeun. Une nouvelle pesée à la même
          date remplace la précédente.
        </p>
      </div>

      <section className="panel">
        <h2 className="text-xl font-bold">Nouvelle pesée</h2>
        <ActionForm action={addWeight} className="mt-4 flex flex-wrap items-end gap-4">
          <div className="w-44">
            <label htmlFor="date" className="label">Date</label>
            <input id="date" name="date" type="date" className="input" defaultValue={day} max={day} required />
          </div>
          <div className="w-36">
            <label htmlFor="weightKg" className="label">Poids (kg)</label>
            <input id="weightKg" name="weightKg" inputMode="decimal" className="input tabular" placeholder="72,4" required />
          </div>
          <SubmitButton>Enregistrer</SubmitButton>
        </ActionForm>
      </section>

      <section className="panel">
        <h2 className="text-xl font-bold">Ma courbe</h2>
        <div className="mt-4">
          <WeightChart points={chronological} targetKg={profile.targetWeightKg} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold">Historique</h2>
        {entries.length === 0 ? (
          <p className="hint mt-3">Aucune pesée pour l&apos;instant.</p>
        ) : (
          <table className="mt-3 w-full max-w-xl text-left">
            <thead className="text-sm text-grise">
              <tr className="border-b border-brume">
                <th className="py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Poids</th>
                <th className="py-2 font-medium">Écart</th>
                <th className="py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="tabular">
              {entries.map((e, i) => {
                const prev = entries[i + 1];
                const diff = prev ? Math.round((e.weightKg - prev.weightKg) * 10) / 10 : null;
                return (
                  <tr key={e.id} className="border-b border-brume">
                    <td className="py-2.5">{formatDate(e.date, { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="py-2.5 font-semibold">{formatKg(e.weightKg)}</td>
                    <td className={`py-2.5 ${diff !== null && diff < 0 ? "text-feuille" : "text-grise"}`}>
                      {diff === null ? "" : diff === 0 ? "=" : `${diff > 0 ? "+" : "−"}${formatKg(Math.abs(diff))}`}
                    </td>
                    <td className="py-2.5 text-right">
                      <form action={deleteWeight}>
                        <input type="hidden" name="id" value={e.id} />
                        <button className="text-sm text-grise underline hover:text-pamplemousse" aria-label={`Supprimer la pesée du ${formatDate(e.date)}`}>
                          Supprimer
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
