import type { ActivityLevel } from "@/lib/health";
import type { Meal } from "@/lib/foods";

/** Une habitude à travailler par semaine. Au-delà de la 12e semaine, le cycle recommence. */
export const WEEKLY_HABITS: { title: string; why: string; actions: string[] }[] = [
  {
    title: "Pesez-vous une fois par semaine",
    why: "Le poids varie d'un jour à l'autre avec l'eau et la digestion. Une pesée hebdomadaire, le même jour à la même heure, montre la vraie tendance.",
    actions: ["Choisissez votre jour de pesée", "Pesez-vous le matin, à jeun", "Notez le résultat dans Allégo"],
  },
  {
    title: "Notez ce que vous mangez",
    why: "Les personnes qui tiennent un journal alimentaire perdent en moyenne plus de poids : on mange autrement quand on voit ce que l'on mange.",
    actions: ["Notez chaque repas juste après l'avoir pris", "N'oubliez pas les boissons", "Ne jugez pas, observez"],
  },
  {
    title: "Remplissez la moitié de l'assiette de légumes",
    why: "Les légumes apportent du volume et des fibres pour très peu de calories. Ils rassasient sans alourdir le bilan.",
    actions: ["Une moitié de légumes, un quart de féculents, un quart de protéines", "Commencez le repas par les légumes"],
  },
  {
    title: "Buvez de l'eau avant d'avoir soif",
    why: "La soif se confond facilement avec la faim. Un grand verre d'eau avant chaque repas aide à manger à sa faim, pas plus.",
    actions: ["Gardez une bouteille à portée de main", "Un verre d'eau avant chaque repas", "Remplacez un soda par de l'eau pétillante"],
  },
  {
    title: "Ajoutez des protéines à chaque repas",
    why: "Les protéines rassasient longtemps et protègent les muscles pendant la perte de poids.",
    actions: ["Un œuf, un yaourt ou du fromage blanc au petit-déjeuner", "Viande, poisson, œufs ou légumineuses midi et soir"],
  },
  {
    title: "Bougez 30 minutes par jour",
    why: "Marcher compte. Bouger tous les jours aide à dépenser plus, à mieux dormir et à garder le moral.",
    actions: ["Descendez un arrêt plus tôt", "Prenez les escaliers", "Une marche après le dîner"],
  },
  {
    title: "Mangez lentement",
    why: "Le signal de satiété met une vingtaine de minutes à arriver. En mangeant lentement, on le sent avant d'avoir trop mangé.",
    actions: ["Posez vos couverts entre deux bouchées", "Mangez sans écran", "Comptez 20 minutes par repas"],
  },
  {
    title: "Préparez vos repas à l'avance",
    why: "Quand on a faim et rien de prêt, on choisit ce qui est rapide, rarement ce qui est léger.",
    actions: ["Prévoyez les menus de la semaine", "Cuisinez en double et gardez une portion", "Ayez toujours des légumes surgelés"],
  },
  {
    title: "Dormez suffisamment",
    why: "Le manque de sommeil augmente l'appétit, surtout pour les produits sucrés et gras.",
    actions: ["Visez 7 à 8 heures par nuit", "Couchez-vous à heure fixe", "Coupez les écrans 30 minutes avant"],
  },
  {
    title: "Repérez la faim émotionnelle",
    why: "Stress, ennui, fatigue : on mange parfois pour autre chose que la faim. La reconnaître permet d'y répondre autrement.",
    actions: ["Avant de grignoter, demandez-vous si vous avez faim", "Attendez 10 minutes", "Trouvez une autre réponse : marcher, appeler quelqu'un"],
  },
  {
    title: "Gardez de la place pour le plaisir",
    why: "Interdire un aliment le rend plus désirable. Un écart prévu et savouré ne fait pas dérailler un programme.",
    actions: ["Prévoyez un repas plaisir par semaine", "Savourez-le sans culpabilité", "Reprenez normalement au repas suivant"],
  },
  {
    title: "Préparez la suite",
    why: "Une fois l'objectif atteint, on remonte progressivement les apports pour stabiliser son poids durablement.",
    actions: ["Gardez la pesée hebdomadaire", "Augmentez de 100 à 200 kcal par semaine", "Continuez à bouger"],
  },
];

export function habitForWeek(weekIndex: number) {
  return WEEKLY_HABITS[((weekIndex % WEEKLY_HABITS.length) + WEEKLY_HABITS.length) % WEEKLY_HABITS.length];
}

/** Part des calories de la journée attribuée à chaque repas. */
export const MEAL_SPLIT: Record<Meal, number> = {
  petit_dejeuner: 0.25,
  dejeuner: 0.35,
  diner: 0.3,
  collation: 0.1,
};

type MealIdea = { name: string; kcal: number };

const MEAL_IDEAS: Record<Meal, MealIdea[]> = {
  petit_dejeuner: [
    { name: "Fromage blanc, flocons d'avoine et fruits rouges", kcal: 280 },
    { name: "2 tranches de pain complet, œuf à la coque et une orange", kcal: 330 },
    { name: "Porridge au lait demi-écrémé et banane", kcal: 400 },
    { name: "Skyr, une pomme et une poignée d'amandes", kcal: 300 },
    { name: "Tartines de pain complet, beurre, confiture et un yaourt", kcal: 380 },
    { name: "Omelette de 2 œufs, tomate et une tranche de pain", kcal: 330 },
    { name: "Yaourt nature, muesli sans sucre ajouté et kiwi", kcal: 260 },
  ],
  dejeuner: [
    { name: "Blanc de poulet, riz et haricots verts", kcal: 460 },
    { name: "Salade de lentilles, tomates, œuf dur et vinaigrette légère", kcal: 450 },
    { name: "Pavé de saumon, quinoa et brocoli", kcal: 560 },
    { name: "Wrap au thon, crudités et fromage frais", kcal: 430 },
    { name: "Steak haché 5 %, pommes de terre vapeur et salade", kcal: 470 },
    { name: "Curry de pois chiches au lait de coco léger et riz", kcal: 540 },
    { name: "Pâtes complètes à la sauce tomate, courgettes et parmesan", kcal: 520 },
  ],
  diner: [
    { name: "Soupe de légumes, omelette et une tranche de pain", kcal: 380 },
    { name: "Cabillaud, purée de patate douce et épinards", kcal: 420 },
    { name: "Poêlée de tofu, légumes sautés et riz", kcal: 450 },
    { name: "Salade composée au poulet, maïs et avocat", kcal: 480 },
    { name: "Gratin de courgettes léger et jambon blanc", kcal: 360 },
    { name: "Velouté de potiron, fromage blanc et pain complet", kcal: 340 },
    { name: "Dahl de lentilles corail et galette de riz", kcal: 430 },
  ],
  collation: [
    { name: "Une pomme", kcal: 80 },
    { name: "Un yaourt nature et une cuillère de miel", kcal: 110 },
    { name: "Une poignée d'amandes", kcal: 120 },
    { name: "Bâtonnets de carotte et houmous", kcal: 130 },
    { name: "Skyr nature", kcal: 95 },
    { name: "2 carrés de chocolat noir et un thé", kcal: 115 },
    { name: "Une banane", kcal: 105 },
  ],
};

/**
 * Menu proposé pour un jour donné : pour chaque repas, on prend les idées
 * les plus proches du budget calorique et on les fait tourner d'un jour à l'autre.
 */
export function menuFor(dailyTarget: number, dayIndex: number) {
  return (Object.keys(MEAL_SPLIT) as Meal[]).map((meal) => {
    const budget = Math.round(dailyTarget * MEAL_SPLIT[meal]);
    const closest = [...MEAL_IDEAS[meal]]
      .sort((a, b) => Math.abs(a.kcal - budget) - Math.abs(b.kcal - budget))
      .slice(0, 5);
    const idea = closest[((dayIndex % closest.length) + closest.length) % closest.length];
    return { meal, budget, idea };
  });
}

type Session = { day: string; title: string; detail: string };

const TRAINING: Record<"doux" | "regulier" | "soutenu", { label: string; sessions: Session[] }> = {
  doux: {
    label: "Reprise en douceur",
    sessions: [
      { day: "Lundi", title: "Marche 20 minutes", detail: "À un rythme où vous pouvez encore parler." },
      { day: "Mercredi", title: "Renforcement léger 15 minutes", detail: "Squats sur une chaise, pompes contre un mur, gainage 20 secondes. 2 tours." },
      { day: "Vendredi", title: "Marche 25 minutes", detail: "Ajoutez une petite côte ou quelques escaliers." },
      { day: "Dimanche", title: "Étirements 10 minutes", detail: "Dos, jambes, épaules. Respirez lentement." },
    ],
  },
  regulier: {
    label: "Rythme régulier",
    sessions: [
      { day: "Lundi", title: "Marche rapide 35 minutes", detail: "Vous devez être légèrement essoufflé." },
      { day: "Mardi", title: "Renforcement 25 minutes", detail: "Squats, fentes, pompes sur les genoux, gainage. 3 tours de 12 répétitions." },
      { day: "Jeudi", title: "Vélo ou natation 30 minutes", detail: "Effort modéré et continu." },
      { day: "Samedi", title: "Sortie longue 45 minutes", detail: "Randonnée, vélo ou marche en famille." },
    ],
  },
  soutenu: {
    label: "Entraînement soutenu",
    sessions: [
      { day: "Lundi", title: "Course ou vélo 40 minutes", detail: "Échauffement 10 minutes, puis effort soutenu." },
      { day: "Mardi", title: "Renforcement 35 minutes", detail: "Circuit complet : squats, fentes, pompes, rowing, gainage. 4 tours." },
      { day: "Jeudi", title: "Fractionné 25 minutes", detail: "8 fois 1 minute rapide, 1 minute lente, après échauffement." },
      { day: "Vendredi", title: "Renforcement 30 minutes", detail: "Haut du corps et gainage." },
      { day: "Dimanche", title: "Sortie longue 60 minutes", detail: "Endurance tranquille : course lente, vélo ou randonnée." },
    ],
  },
};

export function trainingFor(level: ActivityLevel) {
  if (level === "sedentaire") return TRAINING.doux;
  if (level === "actif") return TRAINING.soutenu;
  return TRAINING.regulier;
}
