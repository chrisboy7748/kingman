import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Se connecter" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/app");
  return (
    <div className="panel">
      <h1 className="text-3xl font-extrabold">Se connecter</h1>
      <LoginForm />
      <p className="mt-6 text-center text-sm">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-feuille underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
