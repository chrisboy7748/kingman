// Valeurs MET issues du Compendium of Physical Activities (Ainsworth et al.).

export const ACTIVITIES: { id: string; label: string; met: number }[] = [
  { id: "marche", label: "Marche (5 km/h)", met: 3.5 },
  { id: "marche-rapide", label: "Marche rapide (6 km/h)", met: 4.3 },
  { id: "course", label: "Course à pied (8 km/h)", met: 8.3 },
  { id: "velo", label: "Vélo tranquille", met: 4.0 },
  { id: "velo-soutenu", label: "Vélo soutenu", met: 8.0 },
  { id: "natation", label: "Natation", met: 6.0 },
  { id: "renforcement", label: "Renforcement musculaire", met: 3.5 },
  { id: "yoga", label: "Yoga, pilates", met: 2.8 },
  { id: "danse", label: "Danse", met: 5.0 },
  { id: "aquagym", label: "Aquagym", met: 5.3 },
  { id: "randonnee", label: "Randonnée", met: 6.0 },
  { id: "menage", label: "Ménage, jardinage", met: 3.3 },
];

export function findActivity(id: string) {
  return ACTIVITIES.find((a) => a.id === id);
}
