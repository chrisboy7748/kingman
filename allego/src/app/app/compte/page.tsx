import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { ProfileForm } from "../profile-form";
import { DeleteAccountForm } from "./delete-form";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const user = await requireUser();
  const profile = await db.query.profiles.findFirst({ where: eq(schema.profiles.userId, user.id) });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-extrabold">Mon compte</h1>
        <p className="mt-2 text-grise">
          {user.name}, {user.email}. Inscrit depuis le {formatDateTime(user.createdAt)}.
        </p>
      </div>

      {profile && (
        <section className="panel max-w-3xl">
          <h2 className="text-2xl font-bold">Mon profil et mon objectif</h2>
          <p className="hint mt-1 mb-6">Pour mettre à jour votre poids, utilisez la page Mon poids.</p>
          <ProfileForm
            mode="edit"
            defaults={{
              sex: profile.sex,
              birthDate: profile.birthDate,
              heightCm: profile.heightCm,
              targetWeightKg: profile.targetWeightKg,
              activityLevel: profile.activityLevel,
              weeklyGoalKg: profile.weeklyGoalKg,
            }}
          />
        </section>
      )}

      <section className="max-w-3xl">
        <h2 className="text-2xl font-bold">Mes données</h2>
        <p className="mt-2 text-grise">
          Téléchargez toutes les données enregistrées par Allégo : profil, pesées, journal et activités.
        </p>
        <a href="/api/compte/export" className="btn btn-secondary mt-4" download>
          Télécharger mes données
        </a>
      </section>

      <section className="max-w-3xl border-t border-brume pt-8">
        <h2 className="text-2xl font-bold">Supprimer mon compte</h2>
        <p className="mt-2 text-grise">
          Votre abonnement PayPal est résilié et toutes vos données sont effacées immédiatement. Cette
          action est irréversible.
        </p>
        <DeleteAccountForm />
      </section>
    </div>
  );
}
