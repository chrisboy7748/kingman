import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "../profile-form";

export const metadata: Metadata = { title: "Bienvenue" };

export default async function WelcomePage() {
  const user = await requireUser();
  const profile = await db.query.profiles.findFirst({ where: eq(schema.profiles.userId, user.id) });
  if (profile) redirect("/app");

  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl font-extrabold">Bienvenue, {user.name}.</h1>
      <p className="mt-3 text-lg text-grise">
        Six questions pour calculer votre objectif calorique et préparer votre programme.
      </p>
      <div className="panel mt-8">
        <ProfileForm mode="create" />
      </div>
    </div>
  );
}
