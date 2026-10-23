"use client";

import { useActionState } from "react";
import { saveProfile } from "./profile-actions";
import { FormMessage } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ACTIVITY_LEVELS, WEEKLY_GOALS, type ActivityLevel } from "@/lib/health";

type Defaults = {
  sex?: "femme" | "homme";
  birthDate?: string;
  heightCm?: number;
  targetWeightKg?: number;
  activityLevel?: ActivityLevel;
  weeklyGoalKg?: number;
};

const PACE_DETAIL: Record<number, string> = {
  0.25: "Le plus facile à tenir",
  0.5: "Recommandé",
  0.75: "Plus exigeant",
};

function Choice({ name, value, checked, title, detail }: { name: string; value: string; checked: boolean; title: string; detail?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] border-[#c9d3c4] bg-blanc p-3.5 has-[:checked]:border-feuille has-[:checked]:bg-[#eef4ec]">
      <input type="radio" name={name} value={value} defaultChecked={checked} className="mt-1 h-4 w-4 accent-feuille" required />
      <span>
        <span className="block font-semibold">{title}</span>
        {detail && <span className="hint block">{detail}</span>}
      </span>
    </label>
  );
}

export function ProfileForm({ mode, defaults = {} }: { mode: "create" | "edit"; defaults?: Defaults }) {
  const [state, action] = useActionState(saveProfile.bind(null, mode), null);
  return (
    <form action={action} className="space-y-8">
      <fieldset>
        <legend className="label">Sexe</legend>
        <p className="hint mb-2">Il entre dans le calcul de votre métabolisme de base.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Choice name="sex" value="femme" checked={defaults.sex === "femme"} title="Femme" />
          <Choice name="sex" value="homme" checked={defaults.sex === "homme"} title="Homme" />
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="birthDate" className="label">Date de naissance</label>
          <input id="birthDate" name="birthDate" type="date" className="input" defaultValue={defaults.birthDate} required />
        </div>
        <div>
          <label htmlFor="heightCm" className="label">Taille (cm)</label>
          <input id="heightCm" name="heightCm" inputMode="numeric" className="input tabular" defaultValue={defaults.heightCm} placeholder="168" required />
        </div>
        {mode === "create" && (
          <div>
            <label htmlFor="weightKg" className="label">Poids actuel (kg)</label>
            <input id="weightKg" name="weightKg" inputMode="decimal" className="input tabular" placeholder="78,5" required />
          </div>
        )}
        <div>
          <label htmlFor="targetWeightKg" className="label">Poids visé (kg)</label>
          <input
            id="targetWeightKg"
            name="targetWeightKg"
            inputMode="decimal"
            className="input tabular"
            defaultValue={defaults.targetWeightKg?.toString().replace(".", ",")}
            placeholder="70"
            required
          />
        </div>
      </div>

      <fieldset>
        <legend className="label">Votre activité au quotidien</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {(Object.keys(ACTIVITY_LEVELS) as ActivityLevel[]).map((key) => (
            <Choice
              key={key}
              name="activityLevel"
              value={key}
              checked={defaults.activityLevel === key}
              title={ACTIVITY_LEVELS[key].label}
              detail={ACTIVITY_LEVELS[key].detail}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Rythme de perte</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {WEEKLY_GOALS.map((g) => (
            <Choice
              key={g}
              name="weeklyGoalKg"
              value={String(g)}
              checked={(defaults.weeklyGoalKg ?? 0.5) === g}
              title={`${g.toString().replace(".", ",")} kg par semaine`}
              detail={PACE_DETAIL[g]}
            />
          ))}
        </div>
      </fieldset>

      <FormMessage state={state} />
      <SubmitButton pendingLabel="Calcul en cours…">
        {mode === "create" ? "Calculer mon programme" : "Enregistrer le profil"}
      </SubmitButton>
    </form>
  );
}
