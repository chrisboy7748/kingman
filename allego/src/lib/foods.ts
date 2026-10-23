// Valeurs moyennes indicatives par portion, d'après les tables de composition usuelles (Ciqual).

export type Food = {
  id: string;
  name: string;
  portion: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export const FOOD_GROUPS: { label: string; foods: Food[] }[] = [
  {
    label: "Petit-déjeuner",
    foods: [
      { id: "pain-complet", name: "Pain complet", portion: "1 tranche (40 g)", kcal: 95, proteinG: 4, carbsG: 17, fatG: 1 },
      { id: "baguette", name: "Baguette", portion: "1/4 (60 g)", kcal: 165, proteinG: 5, carbsG: 34, fatG: 1 },
      { id: "flocons-avoine", name: "Flocons d'avoine", portion: "40 g", kcal: 150, proteinG: 5, carbsG: 24, fatG: 3 },
      { id: "beurre", name: "Beurre", portion: "10 g", kcal: 75, proteinG: 0, carbsG: 0, fatG: 8 },
      { id: "confiture", name: "Confiture", portion: "1 c. à soupe (20 g)", kcal: 50, proteinG: 0, carbsG: 12, fatG: 0 },
      { id: "yaourt-nature", name: "Yaourt nature", portion: "1 pot (125 g)", kcal: 65, proteinG: 5, carbsG: 6, fatG: 2 },
      { id: "skyr", name: "Skyr nature", portion: "150 g", kcal: 95, proteinG: 16, carbsG: 6, fatG: 0 },
      { id: "fromage-blanc", name: "Fromage blanc 0 %", portion: "100 g", kcal: 50, proteinG: 8, carbsG: 4, fatG: 0 },
      { id: "oeuf", name: "Œuf", portion: "1 œuf (50 g)", kcal: 70, proteinG: 6, carbsG: 0, fatG: 5 },
      { id: "lait-demi", name: "Lait demi-écrémé", portion: "1 bol (250 ml)", kcal: 115, proteinG: 8, carbsG: 12, fatG: 4 },
      { id: "cafe", name: "Café noir", portion: "1 tasse", kcal: 2, proteinG: 0, carbsG: 0, fatG: 0 },
      { id: "croissant", name: "Croissant", portion: "1 pièce (45 g)", kcal: 185, proteinG: 4, carbsG: 20, fatG: 10 },
    ],
  },
  {
    label: "Fruits et légumes",
    foods: [
      { id: "pomme", name: "Pomme", portion: "1 moyenne (150 g)", kcal: 80, proteinG: 0, carbsG: 18, fatG: 0 },
      { id: "banane", name: "Banane", portion: "1 moyenne (120 g)", kcal: 105, proteinG: 1, carbsG: 24, fatG: 0 },
      { id: "orange", name: "Orange", portion: "1 moyenne (150 g)", kcal: 70, proteinG: 1, carbsG: 14, fatG: 0 },
      { id: "fruits-rouges", name: "Fruits rouges", portion: "100 g", kcal: 45, proteinG: 1, carbsG: 8, fatG: 0 },
      { id: "salade-verte", name: "Salade verte", portion: "1 assiette (80 g)", kcal: 12, proteinG: 1, carbsG: 1, fatG: 0 },
      { id: "tomate", name: "Tomate", portion: "1 moyenne (120 g)", kcal: 22, proteinG: 1, carbsG: 4, fatG: 0 },
      { id: "haricots-verts", name: "Haricots verts", portion: "200 g", kcal: 60, proteinG: 4, carbsG: 7, fatG: 0 },
      { id: "brocoli", name: "Brocoli", portion: "200 g", kcal: 70, proteinG: 6, carbsG: 6, fatG: 1 },
      { id: "courgette", name: "Courgette poêlée", portion: "200 g", kcal: 60, proteinG: 2, carbsG: 5, fatG: 3 },
      { id: "soupe-legumes", name: "Soupe de légumes", portion: "1 bol (300 ml)", kcal: 90, proteinG: 3, carbsG: 14, fatG: 2 },
    ],
  },
  {
    label: "Féculents",
    foods: [
      { id: "riz", name: "Riz blanc cuit", portion: "150 g", kcal: 195, proteinG: 4, carbsG: 43, fatG: 0 },
      { id: "pates", name: "Pâtes cuites", portion: "150 g", kcal: 220, proteinG: 8, carbsG: 43, fatG: 1 },
      { id: "pommes-de-terre", name: "Pommes de terre vapeur", portion: "200 g", kcal: 160, proteinG: 4, carbsG: 34, fatG: 0 },
      { id: "quinoa", name: "Quinoa cuit", portion: "150 g", kcal: 180, proteinG: 7, carbsG: 32, fatG: 3 },
      { id: "lentilles", name: "Lentilles cuites", portion: "150 g", kcal: 175, proteinG: 13, carbsG: 25, fatG: 1 },
      { id: "frites", name: "Frites", portion: "1 portion (150 g)", kcal: 420, proteinG: 5, carbsG: 50, fatG: 22 },
    ],
  },
  {
    label: "Protéines",
    foods: [
      { id: "poulet", name: "Blanc de poulet", portion: "120 g", kcal: 145, proteinG: 30, carbsG: 0, fatG: 2 },
      { id: "steak-hache-5", name: "Steak haché 5 %", portion: "100 g", kcal: 125, proteinG: 21, carbsG: 0, fatG: 5 },
      { id: "saumon", name: "Saumon", portion: "120 g", kcal: 245, proteinG: 24, carbsG: 0, fatG: 16 },
      { id: "cabillaud", name: "Cabillaud", portion: "150 g", kcal: 120, proteinG: 27, carbsG: 0, fatG: 1 },
      { id: "thon", name: "Thon au naturel", portion: "1 boîte (110 g)", kcal: 120, proteinG: 27, carbsG: 0, fatG: 1 },
      { id: "jambon", name: "Jambon blanc", portion: "1 tranche (45 g)", kcal: 50, proteinG: 9, carbsG: 0, fatG: 1 },
      { id: "tofu", name: "Tofu nature", portion: "125 g", kcal: 150, proteinG: 16, carbsG: 2, fatG: 9 },
      { id: "emmental", name: "Emmental", portion: "30 g", kcal: 115, proteinG: 8, carbsG: 0, fatG: 9 },
    ],
  },
  {
    label: "Plats et extras",
    foods: [
      { id: "pizza", name: "Pizza margherita", portion: "1/2 pizza (200 g)", kcal: 500, proteinG: 20, carbsG: 60, fatG: 18 },
      { id: "sandwich-jambon", name: "Sandwich jambon-beurre", portion: "1 pièce", kcal: 420, proteinG: 18, carbsG: 50, fatG: 15 },
      { id: "huile-olive", name: "Huile d'olive", portion: "1 c. à soupe (10 g)", kcal: 90, proteinG: 0, carbsG: 0, fatG: 10 },
      { id: "amandes", name: "Amandes", portion: "1 poignée (20 g)", kcal: 120, proteinG: 4, carbsG: 2, fatG: 10 },
      { id: "chocolat-noir", name: "Chocolat noir 70 %", portion: "2 carrés (20 g)", kcal: 115, proteinG: 2, carbsG: 7, fatG: 8 },
      { id: "biscuits", name: "Biscuits secs", portion: "3 biscuits (25 g)", kcal: 115, proteinG: 2, carbsG: 18, fatG: 4 },
      { id: "soda", name: "Soda sucré", portion: "1 canette (33 cl)", kcal: 140, proteinG: 0, carbsG: 35, fatG: 0 },
      { id: "vin-rouge", name: "Vin rouge", portion: "1 verre (12,5 cl)", kcal: 85, proteinG: 0, carbsG: 3, fatG: 0 },
      { id: "biere", name: "Bière blonde", portion: "1 demi (25 cl)", kcal: 105, proteinG: 1, carbsG: 9, fatG: 0 },
    ],
  },
];

const BY_ID = new Map(FOOD_GROUPS.flatMap((g) => g.foods).map((f) => [f.id, f]));

export function findFood(id: string): Food | undefined {
  return BY_ID.get(id);
}

export const MEALS = {
  petit_dejeuner: "Petit-déjeuner",
  dejeuner: "Déjeuner",
  diner: "Dîner",
  collation: "Collation",
} as const;

export type Meal = keyof typeof MEALS;
