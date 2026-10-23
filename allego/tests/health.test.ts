import { describe, expect, it } from "vitest";
import {
  activityCalories,
  ageFrom,
  bmi,
  bmiCategory,
  calorieTarget,
  checkGoal,
  macrosFor,
  minHealthyWeight,
  weeksToGoal,
} from "@/lib/health";

describe("ageFrom", () => {
  it("ne compte l'anniversaire qu'une fois passé", () => {
    expect(ageFrom("1990-10-24", "2026-10-23")).toBe(35);
    expect(ageFrom("1990-10-23", "2026-10-23")).toBe(36);
  });
});

describe("IMC", () => {
  it("calcule l'IMC et sa catégorie", () => {
    expect(bmi(70, 175)).toBeCloseTo(22.86, 2);
    expect(bmiCategory(18.4)).toBe("Insuffisance pondérale");
    expect(bmiCategory(24.9)).toBe("Corpulence normale");
    expect(bmiCategory(27)).toBe("Surpoids");
    expect(bmiCategory(30)).toBe("Obésité");
  });

  it("arrondit le poids minimal sain au dixième supérieur", () => {
    expect(minHealthyWeight(170)).toBe(53.5);
  });
});

describe("calorieTarget", () => {
  it("retire le déficit du rythme choisi à la dépense estimée", () => {
    const t = calorieTarget({ sex: "femme", weightKg: 80, heightCm: 165, age: 35, activityLevel: "modere", weeklyGoalKg: 0.5 });
    expect(t.bmr).toBe(1495);
    expect(t.maintenance).toBe(2318);
    expect(t.target).toBe(1770);
    expect(t.limited).toBe(false);
  });

  it("ne descend jamais sous l'apport minimal", () => {
    const femme = calorieTarget({ sex: "femme", weightKg: 60, heightCm: 155, age: 60, activityLevel: "sedentaire", weeklyGoalKg: 0.75 });
    expect(femme.target).toBe(1200);
    expect(femme.limited).toBe(true);
    const homme = calorieTarget({ sex: "homme", weightKg: 62, heightCm: 165, age: 70, activityLevel: "sedentaire", weeklyGoalKg: 0.75 });
    expect(homme.target).toBe(1500);
    expect(homme.limited).toBe(true);
  });

  it("répartit les macronutriments 25/45/30", () => {
    expect(macrosFor(2000)).toEqual({ proteinG: 125, carbsG: 225, fatG: 67 });
  });
});

describe("checkGoal", () => {
  const base = { age: 30, heightCm: 170, weightKg: 80, targetWeightKg: 70 };

  it("accepte un objectif raisonnable", () => {
    expect(checkGoal(base)).toEqual({ ok: true });
  });

  it("refuse les mineurs", () => {
    expect(checkGoal({ ...base, age: 17 }).ok).toBe(false);
  });

  it("refuse une perte de poids quand l'IMC est déjà bas", () => {
    expect(checkGoal({ ...base, weightKg: 53, targetWeightKg: 50 })).toMatchObject({ ok: false });
  });

  it("refuse un poids cible sous un IMC de 18,5", () => {
    const r = checkGoal({ ...base, targetWeightKg: 53 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain("53,5 kg");
  });

  it("refuse un poids cible supérieur ou égal au poids actuel", () => {
    expect(checkGoal({ ...base, targetWeightKg: 80 }).ok).toBe(false);
  });
});

describe("estimations", () => {
  it("compte les semaines jusqu'à l'objectif", () => {
    expect(weeksToGoal(80, 70, 0.5)).toBe(20);
    expect(weeksToGoal(70.2, 70, 0.5)).toBe(1);
    expect(weeksToGoal(69, 70, 0.5)).toBe(0);
  });

  it("estime les calories d'une activité", () => {
    expect(activityCalories(3.5, 80, 30)).toBe(140);
  });
});
