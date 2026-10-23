import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireMember } from "@/lib/account";
import { addDays, formatDate, isIsoDate, today } from "@/lib/dates";
import { FOOD_GROUPS, MEALS, type Meal } from "@/lib/foods";
import { MEAL_SPLIT } from "@/lib/program";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { addFoodCustom, addFoodFromList, deleteFood } from "../tracking-actions";

export const metadata: Metadata = { title: "Journal alimentaire" };

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { user, target } = await requireMember();
  const now = today();
  const requested = (await searchParams).date;
  const day = requested && isIsoDate(requested) && requested <= now ? requested : now;

  const entries = await db
    .select()
    .from(schema.foodEntries)
    .where(and(eq(schema.foodEntries.userId, user.id), eq(schema.foodEntries.date, day)))
    .orderBy(asc(schema.foodEntries.createdAt));

  const total = entries.reduce((s, e) => s + e.calories, 0);
  const macros = entries.reduce(
    (s, e) => ({ p: s.p + (e.proteinG ?? 0), c: s.c + (e.carbsG ?? 0), f: s.f + (e.fatG ?? 0) }),
    { p: 0, c: 0, f: 0 },
  );
  const meals = Object.keys(MEALS) as Meal[];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold">Journal</h1>
          <p className="mt-1 text-lg first-letter:uppercase">
            {day === now ? "Aujourd'hui" : formatDate(day, { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <nav aria-label="Changer de jour" className="flex gap-2">
          <Link href={`/app/journal?date=${addDays(day, -1)}`} className="btn btn-secondary btn-sm">Jour précédent</Link>
          {day !== now && (
            <Link href={`/app/journal?date=${addDays(day, 1)}`} className="btn btn-secondary btn-sm">Jour suivant</Link>
          )}
        </nav>
      </div>

      <section className="panel">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="font-display text-3xl font-extrabold tabular">
            {total.toLocaleString("fr-FR")}
            <span className="ml-2 font-sans text-base font-medium text-grise">
              sur {target.target.toLocaleString("fr-FR")} kcal
            </span>
          </p>
          <p className="text-sm text-grise tabular">
            Protéines {macros.p} g sur {target.macros.proteinG} g, glucides {macros.c} g sur {target.macros.carbsG} g,
            lipides {macros.f} g sur {target.macros.fatG} g
          </p>
        </div>
      </section>

      <section className="panel">
        <h2 className="text-xl font-bold">Ajouter un aliment</h2>
        <ActionForm action={addFoodFromList} className="mt-4 grid gap-4 sm:grid-cols-[1fr_2fr_7rem_auto] sm:items-end">
          <input type="hidden" name="date" value={day} />
          <MealSelect id="meal-list" />
          <div>
            <label htmlFor="foodId" className="label">Aliment</label>
            <select id="foodId" name="foodId" className="input" required defaultValue="">
              <option value="" disabled>Choisir…</option>
              {FOOD_GROUPS.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.foods.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}, {f.portion} : {f.kcal} kcal
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="portions" className="label">Portions</label>
            <input id="portions" name="portions" type="number" min="0.5" max="10" step="0.5" defaultValue="1" className="input tabular" required />
          </div>
          <SubmitButton>Ajouter</SubmitButton>
        </ActionForm>

        <details className="mt-6 border-t border-brume pt-4">
          <summary className="cursor-pointer font-semibold text-feuille">Saisir un aliment qui n&apos;est pas dans la liste</summary>
          <ActionForm action={addFoodCustom} className="mt-4 grid gap-4 sm:grid-cols-6 sm:items-end">
            <input type="hidden" name="date" value={day} />
            <div className="sm:col-span-2">
              <MealSelect id="meal-custom" />
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="name" className="label">Aliment ou plat</label>
              <input id="name" name="name" className="input" placeholder="Salade niçoise" required maxLength={120} />
            </div>
            <div>
              <label htmlFor="calories" className="label">kcal</label>
              <input id="calories" name="calories" inputMode="numeric" className="input tabular" required />
            </div>
            {[
              ["proteinG", "Protéines (g)"],
              ["carbsG", "Glucides (g)"],
              ["fatG", "Lipides (g)"],
            ].map(([name, label]) => (
              <div key={name} className="sm:col-span-2">
                <label htmlFor={name} className="label">
                  {label} <span className="font-normal text-grise">facultatif</span>
                </label>
                <input id={name} name={name} inputMode="numeric" className="input tabular" />
              </div>
            ))}
            <div className="sm:col-span-6">
              <SubmitButton>Ajouter</SubmitButton>
            </div>
          </ActionForm>
        </details>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {meals.map((meal) => {
          const items = entries.filter((e) => e.meal === meal);
          const sum = items.reduce((s, e) => s + e.calories, 0);
          const budget = Math.round(target.target * MEAL_SPLIT[meal]);
          return (
            <section key={meal} className="panel">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-bold">{MEALS[meal]}</h2>
                <p className="text-sm text-grise tabular">
                  {sum} sur {budget} kcal conseillées
                </p>
              </div>
              {items.length === 0 ? (
                <p className="hint mt-3">Rien de noté pour ce repas.</p>
              ) : (
                <ul className="mt-3 divide-y divide-brume">
                  {items.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                      <span>{e.name}</span>
                      <span className="flex shrink-0 items-center gap-3">
                        <span className="font-semibold tabular">{e.calories} kcal</span>
                        <form action={deleteFood}>
                          <input type="hidden" name="id" value={e.id} />
                          <button className="text-sm text-grise underline hover:text-pamplemousse" aria-label={`Supprimer ${e.name}`}>
                            Retirer
                          </button>
                        </form>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function MealSelect({ id }: { id: string }) {
  return (
    <div>
      <label htmlFor={id} className="label">Repas</label>
      <select id={id} name="meal" className="input" defaultValue={defaultMeal()} required>
        {(Object.keys(MEALS) as Meal[]).map((m) => (
          <option key={m} value={m}>{MEALS[m]}</option>
        ))}
      </select>
    </div>
  );
}

/** Repas présélectionné selon l'heure à Paris. */
function defaultMeal(): Meal {
  const hour = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Paris" }).format(new Date()));
  if (hour < 11) return "petit_dejeuner";
  if (hour < 15) return "dejeuner";
  if (hour < 18) return "collation";
  return "diner";
}
