import { daysBetween, formatDate } from "@/lib/dates";
import { formatKg } from "@/lib/health";

type Point = { date: string; weightKg: number };

const W = 640;
const H = 260;
const PAD = { top: 24, right: 20, bottom: 36, left: 48 };

/** Courbe de poids dessinée côté serveur, avec la ligne d'objectif. */
export function WeightChart({ points, targetKg }: { points: Point[]; targetKg: number }) {
  if (points.length < 2) {
    return (
      <p className="hint py-8 text-center">
        Votre courbe apparaîtra dès la deuxième pesée.
      </p>
    );
  }

  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0].date;
  const span = Math.max(1, daysBetween(first, sorted[sorted.length - 1].date));
  const weights = sorted.map((p) => p.weightKg);
  const lo = Math.floor(Math.min(...weights, targetKg) - 1);
  const hi = Math.ceil(Math.max(...weights) + 1);

  const x = (date: string) => PAD.left + (daysBetween(first, date) / span) * (W - PAD.left - PAD.right);
  const y = (kg: number) => PAD.top + ((hi - kg) / (hi - lo)) * (H - PAD.top - PAD.bottom);

  const path = sorted.map((p, i) => `${i ? "L" : "M"}${x(p.date).toFixed(1)},${y(p.weightKg).toFixed(1)}`).join(" ");
  const step = Math.max(1, Math.round((hi - lo) / 4));
  const ticks: number[] = [];
  for (let v = lo; v <= hi; v += step) ticks.push(v);

  const last = sorted[sorted.length - 1];
  const summary = `Poids du ${formatDate(first)} au ${formatDate(last.date)} : de ${formatKg(sorted[0].weightKg)} à ${formatKg(last.weightKg)}. Objectif : ${formatKg(targetKg)}.`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={summary}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#e3e9df" />
          <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="15" fill="#5a675e">
            {t}
          </text>
        </g>
      ))}
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={y(targetKg)}
        y2={y(targetKg)}
        stroke="#d9434f"
        strokeWidth="1.5"
        strokeDasharray="6 5"
      />
      <text x={W - PAD.right} y={y(targetKg) - 6} textAnchor="end" fontSize="15" fontWeight="600" fill="#d9434f">
        Objectif {formatKg(targetKg)}
      </text>
      <path d={path} fill="none" stroke="#2f6b45" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {sorted.map((p) => (
        <circle key={p.date} cx={x(p.date)} cy={y(p.weightKg)} r="4" fill="#fff" stroke="#2f6b45" strokeWidth="2">
          <title>{`${formatDate(p.date)} : ${formatKg(p.weightKg)}`}</title>
        </circle>
      ))}
      <text x={PAD.left} y={H - 8} fontSize="15" fill="#5a675e">
        {formatDate(first)}
      </text>
      <text x={W - PAD.right} y={H - 8} textAnchor="end" fontSize="15" fill="#5a675e">
        {formatDate(last.date)}
      </text>
    </svg>
  );
}
