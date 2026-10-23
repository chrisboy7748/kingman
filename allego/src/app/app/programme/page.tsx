import type { Metadata } from "next";
import { requireMember } from "@/lib/account";
import { addDays, daysBetween, formatDate, today } from "@/lib/dates";
import { MEALS } from "@/lib/foods";
import { habitForWeek, menuFor, trainingFor, WEEKLY_HABITS } from "@/lib/program";

export const metadata: Metadata = { title: "Programme" };

export default async function ProgramPage() {
  const { profile, target } = await requireMember();
  const day = today();
  const startDay = profile.createdAt.toISOString().slice(0, 10);
  const elapsed = daysBetween(startDay, day);
  const weekIndex = Math.floor(elapsed / 7);
  const habit = habitForWeek(weekIndex);
  const training = trainingFor(profile.activityLevel);
  const days = Array.from({ length: 7 }, (_, i) => addDays(day, i));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-extrabold">Mon programme</h1>
        <p className="mt-2 text-lg text-grise">Semaine {weekIndex + 1}</p>
      </div>

      <section className="grid gap-6 rounded-2xl bg-citron p-6 sm:p-8 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="text-sm font-semibold">Habitude de la semaine</p>
          <h2 className="mt-2 text-3xl font-bold">{habit.title}</h2>
          <p className="mt-3 text-lg">{habit.why}</p>
        </div>
        <ul className="space-y-2 self-center">
          {habit.actions.map((a) => (
            <li key={a} className="flex gap-3">
              <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-feuille" />
              {a}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Mes repères chaque jour</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Calories", `${target.target.toLocaleString("fr-FR")} kcal`],
            ["Protéines", `${target.macros.proteinG} g`],
            ["Glucides", `${target.macros.carbsG} g`],
            ["Lipides", `${target.macros.fatG} g`],
          ].map(([label, value]) => (
            <div key={label} className="border-l-4 border-feuille pl-4">
              <dt className="text-sm text-grise">{label}</dt>
              <dd className="font-display text-2xl font-extrabold tabular">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="hint mt-4 max-w-2xl">
          Calculé pour une perte de {profile.weeklyGoalKg.toString().replace(".", ",")} kg par semaine, à
          partir d&apos;une dépense estimée de {target.maintenance.toLocaleString("fr-FR")} kcal par jour.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Idées de menus pour les 7 prochains jours</h2>
        <p className="mt-1 text-grise">Des exemples ajustés à vos calories. Vous pouvez échanger les jours ou les repas.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {days.map((d) => (
            <article key={d} className="panel">
              <h3 className="text-lg font-bold first-letter:uppercase">
                {d === day ? "Aujourd'hui" : formatDate(d, { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <ul className="mt-3 space-y-3">
                {menuFor(target.target, daysBetween(startDay, d)).map(({ meal, idea }) => (
                  <li key={meal}>
                    <p className="text-sm text-grise">{MEALS[meal]}</p>
                    <p className="flex justify-between gap-3">
                      <span>{idea.name}</span>
                      <span className="shrink-0 text-sm text-grise tabular">{idea.kcal} kcal</span>
                    </p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Mes séances : {training.label.toLowerCase()}</h2>
        <p className="mt-1 text-grise">Adaptées à votre niveau d&apos;activité. Arrêtez-vous en cas de douleur ou de malaise.</p>
        <ul className="mt-5 max-w-3xl divide-y divide-brume border-y border-brume">
          {training.sessions.map((s) => (
            <li key={s.day} className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr]">
              <span className="font-semibold text-feuille">{s.day}</span>
              <span>
                <span className="block font-semibold">{s.title}</span>
                <span className="text-grise">{s.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Les 12 semaines</h2>
        <ol className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {WEEKLY_HABITS.map((h, i) => {
            const current = i === weekIndex % WEEKLY_HABITS.length;
            return (
              <li key={h.title} className={`flex gap-3 ${current ? "font-semibold" : "text-grise"}`} aria-current={current ? "step" : undefined}>
                <span className={`w-24 shrink-0 whitespace-nowrap tabular ${current ? "text-feuille" : ""}`}>Semaine {i + 1}</span>
                {h.title}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
