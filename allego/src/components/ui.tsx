import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight ${className}`}>
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#2f6b45" />
        <path d="M6 9c5 0 6 9 11 11s6 3 9 3" fill="none" stroke="#eef5a0" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="26" cy="23" r="2.6" fill="#d9434f" />
      </svg>
      Allégo
    </span>
  );
}

export function MedicalNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`hint ${className}`}>
      Allégo donne des repères généraux et ne remplace pas l&apos;avis d&apos;un médecin ou d&apos;un
      diététicien. Il n&apos;est pas adapté pendant une grossesse ou l&apos;allaitement, en cas de
      maladie chronique ou de troubles du comportement alimentaire.
    </p>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-brume">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md space-y-2">
          <Logo className="text-lg" />
          <MedicalNotice />
        </div>
        <nav aria-label="Informations légales" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link href="/mentions-legales" className="hover:underline">Mentions légales</Link>
          <Link href="/confidentialite" className="hover:underline">Confidentialité</Link>
          <Link href="/cgv" className="hover:underline">Conditions générales</Link>
        </nav>
      </div>
    </footer>
  );
}

export function FormMessage({ state }: { state?: { error?: string; ok?: string } | null }) {
  if (!state) return null;
  if (state.error)
    return (
      <p role="alert" className="notice notice-warn text-sm">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p role="status" className="notice text-sm">
        {state.ok}
      </p>
    );
  return null;
}
