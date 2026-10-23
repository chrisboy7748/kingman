import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { count, desc, gte, sql, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { isAdmin, requireUser } from "@/lib/auth";
import { accessState } from "@/lib/access";
import { formatDateTime } from "@/lib/dates";
import { PLANS } from "@/lib/plans";
import { Logo } from "@/components/ui";

export const metadata: Metadata = { title: "Administration", robots: { index: false } };

const STATE_LABEL = { essai: "Essai", abonne: "Abonné", resilie: "Résilié (accès en cours)", aucun: "Sans accès" } as const;

export default async function AdminPage() {
  const me = await requireUser();
  if (!isAdmin(me.email)) notFound();

  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000);
  const [[{ users }], [{ trials }], activeByPlan, [{ revenue }], recent, subs] = await Promise.all([
    db.select({ users: count() }).from(schema.users),
    db.select({ trials: count() }).from(schema.users).where(gte(schema.users.trialEndsAt, now)),
    db
      .select({ plan: schema.subscriptions.plan, n: count() })
      .from(schema.subscriptions)
      .where(sql`${schema.subscriptions.status} = 'ACTIVE'`)
      .groupBy(schema.subscriptions.plan),
    db.select({ revenue: sum(schema.payments.amount).mapWith(Number) }).from(schema.payments).where(gte(schema.payments.paidAt, monthAgo)),
    db.select().from(schema.users).orderBy(desc(schema.users.createdAt)).limit(50),
    db.select().from(schema.subscriptions),
  ]);

  const active = activeByPlan.reduce((s, r) => s + r.n, 0);
  const mrr = activeByPlan.reduce((s, r) => s + r.n * PLANS[r.plan].monthlyEquivalent, 0);
  const eur = (v: number) => v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <Logo />
        <Link href="/app" className="font-medium underline">Retour à l&apos;application</Link>
      </div>
      <h1 className="mt-8 text-4xl font-extrabold">Administration</h1>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-brume bg-brume md:grid-cols-5">
        {[
          ["Comptes", users.toLocaleString("fr-FR")],
          ["En essai", trials.toLocaleString("fr-FR")],
          ["Abonnés actifs", active.toLocaleString("fr-FR")],
          ["Revenu mensuel récurrent", eur(mrr)],
          ["Encaissé sur 30 jours", eur(revenue ?? 0)],
        ].map(([label, value]) => (
          <div key={label} className="bg-blanc p-4">
            <dt className="text-sm text-grise">{label}</dt>
            <dd className="font-display mt-1 text-2xl font-extrabold tabular">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="hint mt-2">
        Le revenu mensuel récurrent compte les abonnements annuels pour un douzième de leur prix.
      </p>

      <h2 className="mt-10 text-2xl font-bold">Derniers inscrits</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left">
          <thead className="text-sm text-grise">
            <tr className="border-b border-brume">
              <th className="py-2 font-medium">Prénom</th>
              <th className="py-2 font-medium">E-mail</th>
              <th className="py-2 font-medium">Inscription</th>
              <th className="py-2 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((u) => {
              const state = accessState(u, subs.filter((s) => s.userId === u.id), now);
              const plan = state.kind === "abonne" ? ` ${PLANS[state.subscription.plan].name.toLowerCase()}` : "";
              return (
                <tr key={u.id} className="border-b border-brume">
                  <td className="py-2.5">{u.name}</td>
                  <td className="py-2.5">{u.email}</td>
                  <td className="py-2.5 tabular">{formatDateTime(u.createdAt)}</td>
                  <td className="py-2.5">{STATE_LABEL[state.kind]}{plan}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
