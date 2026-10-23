import Link from "next/link";
import { Logo, SiteFooter } from "@/components/ui";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
        <Link href="/" aria-label="Allégo, accueil">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 [&_h1]:mt-6 [&_h1]:text-4xl [&_h1]:font-extrabold [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
        <p className="notice notice-warn">
          Modèle à compléter et à faire relire par un professionnel du droit avant la mise en ligne. Les
          passages entre crochets sont à remplacer.
        </p>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
