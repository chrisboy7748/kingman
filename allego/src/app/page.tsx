import Link from "next/link";
import { Logo, SiteFooter } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { PLANS, TRIAL_DAYS } from "@/lib/plans";

const FAQ = [
  {
    q: "Comment Allégo calcule-t-il mon objectif ?",
    a: "Allégo estime votre dépense quotidienne avec la formule de Mifflin-St Jeor et votre niveau d'activité, puis retire le déficit qui correspond au rythme choisi : 0,25, 0,5 ou 0,75 kg par semaine. L'objectif ne descend jamais sous 1 200 kcal pour une femme et 1 500 kcal pour un homme.",
  },
  {
    q: "Faut-il un compte PayPal ?",
    a: "Le paiement passe par PayPal. Vous pouvez payer avec votre compte PayPal ou, selon votre pays, directement par carte bancaire sur la page PayPal, sans créer de compte.",
  },
  {
    q: "Puis-je arrêter quand je veux ?",
    a: "Oui. Vous résiliez en un clic depuis la page Abonnement. Vous gardez l'accès jusqu'à la fin de la période déjà payée et aucun autre paiement n'est prélevé.",
  },
  {
    q: "Que deviennent mes données ?",
    a: "Vos mesures sont des données de santé : elles ne servent qu'à faire fonctionner votre programme, ne sont jamais vendues et vous pouvez les télécharger ou supprimer votre compte à tout moment.",
  },
  {
    q: "Allégo convient-il à tout le monde ?",
    a: "Allégo s'adresse aux adultes en bonne santé qui souhaitent perdre quelques kilos. Si vous êtes enceinte, allaitez, suivez un traitement ou avez des troubles du comportement alimentaire, demandez d'abord l'avis de votre médecin.",
  },
];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <>
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link href="/" aria-label="Allégo, accueil">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <a href="#tarifs" className="hidden px-2 font-medium hover:underline sm:inline">
            Tarifs
          </a>
          {user ? (
            <Link href="/app" className="btn btn-primary btn-sm">
              Mon espace
            </Link>
          ) : (
            <>
              <Link href="/connexion" className="px-2 font-medium hover:underline">
                Se connecter
              </Link>
              <Link href="/inscription" className="btn btn-primary btn-sm">
                Essayer
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-16 lg:pb-24">
          <div className="max-w-xl">
            <h1 className="text-[2.6rem] font-extrabold sm:text-6xl">
              Perdre du poids sans régime extrême.
            </h1>
            <p className="mt-6 text-lg text-grise sm:text-xl">
              Allégo calcule ce dont votre corps a besoin, suit votre poids semaine après semaine et
              vous propose des menus et des exercices à votre mesure.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/inscription" className="btn btn-primary text-lg">
                Commencer mes {TRIAL_DAYS} jours gratuits
              </Link>
              <p className="hint">Aucun paiement pendant l&apos;essai.</p>
            </div>
          </div>
          <HeroCurve />
        </section>

        <section className="border-y border-brume bg-blanc">
          <div className="mx-auto grid max-w-6xl gap-x-12 gap-y-10 px-4 py-16 sm:px-6 md:grid-cols-2">
            <h2 className="text-3xl font-bold sm:text-4xl md:col-span-2">Ce qu&apos;Allégo fait pour vous</h2>
            <Feature title="Votre objectif calorique">
              À partir de votre âge, votre taille, votre poids et votre activité, Allégo calcule combien
              manger chaque jour pour perdre au rythme choisi, sans descendre sous un seuil sûr.
            </Feature>
            <Feature title="Votre courbe de poids">
              Une pesée par semaine suffit. La courbe montre la tendance réelle, au-delà des variations
              d&apos;un jour à l&apos;autre, et la date estimée pour atteindre votre objectif.
            </Feature>
            <Feature title="Votre journal alimentaire">
              Ajoutez un repas en deux clics grâce aux aliments courants déjà renseignés, et voyez ce
              qu&apos;il vous reste pour la journée.
            </Feature>
            <Feature title="Votre programme de la semaine">
              Un menu type ajusté à vos calories, des séances adaptées à votre niveau et une habitude à
              travailler chaque semaine.
            </Feature>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">Démarrer prend trois minutes</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              ["Répondez à six questions", "Âge, taille, poids, poids visé, activité et rythme souhaité."],
              ["Recevez votre plan", "Votre objectif calorique, votre répartition par repas et vos séances."],
              ["Suivez chaque semaine", "Une pesée, quelques repas notés, et la courbe fait le reste."],
            ].map(([title, text], i) => (
              <li key={title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-citron text-xl font-extrabold"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-xl font-bold">{title}</h3>
                  <p className="mt-1 text-grise">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="tarifs" className="bg-feuille text-blanc">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-3xl font-bold sm:text-4xl">Tarifs</h2>
            <p className="mt-3 max-w-xl text-lg opacity-90">
              {TRIAL_DAYS} jours gratuits pour essayer, puis un abonnement payé par PayPal. Résiliable à
              tout moment.
            </p>
            <div className="mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
              {(["mensuel", "annuel"] as const).map((key) => {
                const plan = PLANS[key];
                const best = key === "annuel";
                return (
                  <div
                    key={key}
                    className={`rounded-2xl p-6 ${best ? "bg-citron text-encre" : "bg-feuille-fonce"}`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-2xl font-bold">{plan.name}</h3>
                      {plan.badge && <span className="text-sm font-semibold">{plan.badge}</span>}
                    </div>
                    <p className="font-display mt-4 text-5xl font-extrabold tabular">{plan.price}</p>
                    <p className="mt-1 opacity-80">{plan.note}</p>
                  </div>
                );
              })}
            </div>
            <Link href="/inscription" className="btn mt-10 bg-blanc text-lg text-feuille hover:bg-citron">
              Commencer mes {TRIAL_DAYS} jours gratuits
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold sm:text-4xl">Questions fréquentes</h2>
          <div className="mt-8 divide-y divide-brume border-y border-brume">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                  {q}
                  <span aria-hidden="true" className="text-2xl text-feuille transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-grise">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-citron pl-5">
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-2 text-grise">{children}</p>
    </div>
  );
}

/** Exemple de courbe sur 12 semaines, tracée au chargement de la page. */
function HeroCurve() {
  // 84 kg → 78 kg en 12 semaines, avec les petites remontées d'une vraie courbe.
  const kg = [84, 83.6, 83.1, 83.3, 82.6, 82.1, 81.8, 81.9, 81.1, 80.4, 79.9, 79.2, 78.6];
  const x = (i: number) => 30 + i * 40;
  const y = (v: number) => 30 + (84.5 - v) * 38;
  const d = kg.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v).toFixed(1)}`).join(" ");
  return (
    <figure className="rounded-3xl bg-blanc p-5 sm:p-7" style={{ boxShadow: "0 1px 0 #e3e9df, 0 20px 50px -30px rgb(30 43 34 / 0.35)" }}>
      <figcaption className="flex items-baseline justify-between gap-4">
        <span className="font-display text-lg font-bold">Exemple : 12 semaines à 0,5 kg</span>
        <span className="font-display whitespace-nowrap text-3xl font-extrabold text-feuille tabular">−5,4 kg</span>
      </figcaption>
      <svg viewBox="0 0 540 312" className="mt-4 h-auto w-full" aria-hidden="true">
        {[84, 82, 80, 78].map((v) => (
          <g key={v}>
            <line x1="30" x2="520" y1={y(v)} y2={y(v)} stroke="#e3e9df" />
            <text x="24" y={y(v) + 4} fontSize="12" textAnchor="end" fill="#5a675e">
              {v}
            </text>
          </g>
        ))}
        <line x1="30" x2="520" y1={y(78.5)} y2={y(78.5)} stroke="#d9434f" strokeWidth="1.5" strokeDasharray="6 5" />
        <path d={d} pathLength={1} className="courbe-trace" fill="none" stroke="#2f6b45" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(12)} cy={y(78.6)} r="7" fill="#d9434f" />
        {[0, 4, 8, 12].map((i) => (
          <text key={i} x={x(i)} y="306" fontSize="12" textAnchor="middle" fill="#5a675e">
            {i === 0 ? "Départ" : `Sem. ${i}`}
          </text>
        ))}
      </svg>
    </figure>
  );
}
