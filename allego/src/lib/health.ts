// Calculs nutritionnels d'Allégo. Ce sont des estimations générales,
// pas un avis médical : l'interface le rappelle à chaque endroit où elles apparaissent.

export type Sex = "femme" | "homme";
export type ActivityLevel = "sedentaire" | "leger" | "modere" | "actif";

export const ACTIVITY_LEVELS: Record<ActivityLevel, { label: string; detail: string; factor: number }> = {
  sedentaire: { label: "Sédentaire", detail: "Travail assis, peu ou pas de sport", factor: 1.2 },
  leger: { label: "Légèrement actif", detail: "Marche régulière ou sport 1 à 2 fois par semaine", factor: 1.375 },
  modere: { label: "Actif", detail: "Sport 3 à 5 fois par semaine", factor: 1.55 },
  actif: { label: "Très actif", detail: "Sport intense presque tous les jours ou métier physique", factor: 1.725 },
};

/** Rythmes de perte proposés, en kg par semaine. Au-delà, la perte n'est pas recommandée sans suivi médical. */
export const WEEKLY_GOALS = [0.25, 0.5, 0.75] as const;

/** Énergie contenue dans 1 kg de masse grasse, en kcal. */
const KCAL_PER_KG = 7700;

/** Apport minimal en dessous duquel Allégo ne descend jamais sans suivi médical. */
export const MIN_CALORIES: Record<Sex, number> = { femme: 1200, homme: 1500 };

export const MIN_HEALTHY_BMI = 18.5;
export const MIN_AGE = 18;

export function ageFrom(birthDate: string, today: string): number {
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age--;
  return age;
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(value: number): string {
  if (value < MIN_HEALTHY_BMI) return "Insuffisance pondérale";
  if (value < 25) return "Corpulence normale";
  if (value < 30) return "Surpoids";
  return "Obésité";
}

/** Poids le plus bas correspondant à un IMC de 18,5, arrondi au dixième supérieur. */
export function minHealthyWeight(heightCm: number): number {
  const m = heightCm / 100;
  return Math.ceil(MIN_HEALTHY_BMI * m * m * 10) / 10;
}

/** Métabolisme de base, formule de Mifflin-St Jeor. */
export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "homme" ? 5 : -161);
}

export function tdee(bmrValue: number, level: ActivityLevel): number {
  return bmrValue * ACTIVITY_LEVELS[level].factor;
}

export type CalorieTarget = {
  bmr: number;
  maintenance: number;
  target: number;
  /** Vrai quand le déficit demandé a été réduit pour respecter l'apport minimal. */
  limited: boolean;
  macros: { proteinG: number; carbsG: number; fatG: number };
};

export function calorieTarget(input: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: ActivityLevel;
  weeklyGoalKg: number;
}): CalorieTarget {
  const base = bmr(input.sex, input.weightKg, input.heightCm, input.age);
  const maintenance = tdee(base, input.activityLevel);
  const deficit = (input.weeklyGoalKg * KCAL_PER_KG) / 7;
  const floor = MIN_CALORIES[input.sex];
  const wanted = maintenance - deficit;
  const target = Math.round(Math.max(wanted, floor) / 10) * 10;
  return {
    bmr: Math.round(base),
    maintenance: Math.round(maintenance),
    target,
    limited: wanted < floor,
    macros: macrosFor(target),
  };
}

/** Répartition 25 % protéines, 45 % glucides, 30 % lipides. */
export function macrosFor(kcal: number) {
  return {
    proteinG: Math.round((kcal * 0.25) / 4),
    carbsG: Math.round((kcal * 0.45) / 4),
    fatG: Math.round((kcal * 0.3) / 9),
  };
}

/** Nombre de semaines estimé pour atteindre l'objectif au rythme choisi. */
export function weeksToGoal(currentKg: number, targetKg: number, weeklyGoalKg: number): number {
  if (currentKg <= targetKg) return 0;
  return Math.ceil((currentKg - targetKg) / weeklyGoalKg);
}

export type GoalCheck = { ok: true } | { ok: false; reason: string };

/** Vérifie qu'un objectif de perte de poids est raisonnable avant de l'enregistrer. */
export function checkGoal(input: {
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
}): GoalCheck {
  if (input.age < MIN_AGE) {
    return { ok: false, reason: "Allégo est réservé aux personnes majeures." };
  }
  if (bmi(input.weightKg, input.heightCm) < MIN_HEALTHY_BMI) {
    return {
      ok: false,
      reason:
        "Votre IMC est déjà inférieur à 18,5. Une perte de poids n'est pas recommandée : parlez-en à votre médecin.",
    };
  }
  if (input.targetWeightKg >= input.weightKg) {
    return { ok: false, reason: "Votre poids cible doit être inférieur à votre poids actuel." };
  }
  const min = minHealthyWeight(input.heightCm);
  if (input.targetWeightKg < min) {
    return {
      ok: false,
      reason: `Pour votre taille, le poids cible ne peut pas descendre sous ${formatKg(min)} (IMC de 18,5).`,
    };
  }
  return { ok: true };
}

/** MET : dépense d'une activité en multiple du métabolisme au repos. */
export function activityCalories(met: number, weightKg: number, durationMin: number): number {
  return Math.round(met * weightKg * (durationMin / 60));
}

export function formatKg(kg: number): string {
  return `${kg.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
}
