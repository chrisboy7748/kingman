import Link from "next/link";
import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-10">
      <Link href="/" aria-label="Allégo, accueil">
        <Logo />
      </Link>
      <main className="mt-8 w-full max-w-md">{children}</main>
    </div>
  );
}
