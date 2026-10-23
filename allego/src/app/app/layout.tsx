import Link from "next/link";
import { Logo, MedicalNotice } from "@/components/ui";
import { requireUser, isAdmin } from "@/lib/auth";
import { getAccess } from "@/lib/account";
import { logout } from "@/app/(auth)/actions";
import { AppNav } from "./nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const access = await getAccess(user.id, user.trialEndsAt);
  const trialDaysLeft =
    access.kind === "essai" ? Math.max(1, Math.ceil((access.until.getTime() - Date.now()) / 86_400_000)) : 0;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-brume bg-blanc lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-5 lg:py-6">
          <Link href="/app" aria-label="Tableau de bord">
            <Logo />
          </Link>
          <form action={logout} className="lg:hidden">
            <button className="text-sm font-medium underline">Se déconnecter</button>
          </form>
        </div>
        <AppNav admin={isAdmin(user.email)} />
        <form action={logout} className="hidden px-5 pt-6 lg:block">
          <button className="text-sm font-medium text-grise underline hover:text-encre">Se déconnecter</button>
        </form>
      </aside>
      <div className="min-w-0">
        {access.kind === "essai" && (
          <div className="bg-citron px-4 py-2.5 text-sm sm:px-8">
            Essai gratuit : {trialDaysLeft === 1 ? "dernier jour" : `encore ${trialDaysLeft} jours`}.{" "}
            <Link href="/app/abonnement" className="font-semibold underline">
              Choisir un abonnement
            </Link>
          </div>
        )}
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 lg:py-10">{children}</main>
        <MedicalNotice className="mx-auto max-w-5xl px-4 pb-10 sm:px-8" />
      </div>
    </div>
  );
}
