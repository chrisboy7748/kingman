import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, eq, gte, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireMember } from "@/lib/account";
import { addDays, daysBetween, formatDate, today } from "@/lib/dates";
import { bmi, bmiCategory, formatKg, weeksToGoal } from "@/lib/health";
import { habitForWeek } from "@/lib/program";
import { WeightChart } from "@/components/weight-chart";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function Dashboard() {
  const { user, profile, currentWeight, target } = await requireMember();
  const day = today();

  const [weights, [food], [burned]] = await Promise.all([
    db
      .select({ date: schema.weightEntries.date, weightKg: schema.weightEntries.weightKg })
      .from(schema.weightEntries)
      .where(and(eq(schema.weightEntries.userId, user.id), gte(schema.weightEntries.date, addDays(day, -120))))
      .orderBy(asc(schema.weightEntries.date)),
    db
      .select({ kcal: sum(schema.foodEntries.calories).mapWith(Number) })
      .from(schema.foodEntries)
      .where(and(eq(schema.foodEntries.userId, user.id), eq(schema.foodEntries.date, day))),
    db
      .select({ kcal: sum(schema.activityEntries.caloriesBurned).mapWith(Number) })
      .from(schema.activityEntries)
      .where(and(eq(schema.activityEntries.userId, user.id), eq(schema.activityEntries.date, day))),
  ]);

  const eaten = food?.kcal ?? 0;
  const lost = Math.round((profile.startWeightKg - currentWeight) * 10) / 10;
  const remainingKg = Math.max(0, Math.round((currentWeight - profile.targetWeightKg) * 10) / 10);
  const weeks = weeksToGoal(currentWeight, profile.targetWeightKg, profile.weeklyGoalKg);
  const reached = remainingKg === 0;
  const left = target.target - eaten;
  const pct = Math.min(100, Math.round((eaten / target.target) * 100));
  const startDay = profile.createdAt.toISOString().slice(0, 10);
  const habit = habitForWeek(Math.floor(daysBetween(startDay, day) / 7));
  const currentBmi = bmi(currentWeight, profile.heightCm);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold">Bonjour {user.name}</h1>
        <p className="mt-1 text-grise">{formatDate(day, { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      {reached && (
        <p className="notice text-lg">
          Objectif atteint : {formatKg(currentWeight)}. Bravo. Pour stabiliser votre poids, remontez
          progressivement vos apports ou choisissez un nouvel objectif dans{" "}
          <Link href="/app/compte" className="font-semibold underline">Mon compte</Link>.
        </p>
      )}

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-brume bg-brume md:grid-cols-4">
        <Stat label="Poids actuel" value={formatKg(currentWeight)} detail={`IMC ${currentBmi.toFixed(1).replace(".", ",")}, ${bmiCategory(currentBmi).toLowerCase()}`} />
        <Stat label="Depuis le départ" value={lost > 0 ? `−${formatKg(lost)}` : lost < 0 ? `+${formatKg(-lost)}` : formatKg(0)} detail={`Départ : ${formatKg(profile.startWeightKg)}`} />
        <Stat label="Reste à perdre" value={formatKg(remainingKg)} detail={`Objectif : ${formatKg(profile.targetWeightKg)}`} />
        <Stat
          label="Arrivée estimée"
          value={reached ? "Atteint" : formatDate(addDays(day, weeks * 7), { month: "long", year: "numeric" })}
          detail={reached ? "Félicitations" : `Environ ${weeks} semaine${weeks > 1 ? "s" : ""}`}
        />
      </dl>

      <section className="panel">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Aujourd&apos;hui</h2>
            <p className="hint">Objectif du jour : {target.target.toLocaleString("fr-FR")} kcal</p>
          </div>
          <p className="font-display text-4xl font-extrabold tabular">
            {left >= 0 ? left.toLocaleString("fr-FR") : `+${(-left).toLocaleString("fr-FR")}`}
            <span className="ml-2 font-sans text-base font-medium text-grise">
              {left >= 0 ? "kcal restantes" : "kcal au-dessus"}
            </span>
          </p>
        </div>
        <div
          className="mt-4 h-3 overflow-hidden rounded-full bg-brume"
          role="progressbar"
          aria-label="Calories consommées aujourd'hui"
          aria-valuemin={0}
          aria-valuemax={target.target}
          aria-valuenow={eaten}
        >
          <div className={`h-full rounded-full ${left < 0 ? "bg-pamplemousse" : "bg-feuille"}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-grise">
          <span>{eaten.toLocaleString("fr-FR")} kcal mangées</span>
          <span>{(burned?.kcal ?? 0).toLocaleString("fr-FR")} kcal dépensées en activité</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/app/journal" className="btn btn-primary btn-sm">Ajouter un repas</Link>
          <Link href="/app/activites" className="btn btn-secondary btn-sm">Ajouter une activité</Link>
        </div>
        {target.limited && (
          <p className="hint mt-4">
            Votre objectif est fixé au minimum conseillé. Pour perdre plus vite, bougez davantage plutôt
            que de manger moins.
          </p>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <section className="panel">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Ma courbe</h2>
            <Link href="/app/poids" className="btn btn-secondary btn-sm">Me peser</Link>
          </div>
          <div className="mt-4">
            <WeightChart points={weights} targetKg={profile.targetWeightKg} />
          </div>
        </section>
        <section className="rounded-2xl bg-citron p-6">
          <p className="text-sm font-semibold">Habitude de la semaine</p>
          <h2 className="mt-2 text-2xl font-bold">{habit.title}</h2>
          <p className="mt-3">{habit.why}</p>
          <Link href="/app/programme" className="mt-4 inline-block font-semibold underline">
            Voir mon programme
          </Link>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="bg-blanc p-4 sm:p-5">
      <dt className="text-sm text-grise">{label}</dt>
      <dd className="font-display mt-1 text-2xl font-extrabold tabular sm:text-3xl">{value}</dd>
      <dd className="hint mt-1">{detail}</dd>
    </div>
  );
}
