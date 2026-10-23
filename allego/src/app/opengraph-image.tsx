import { ImageResponse } from "next/og";

export const alt = "Allégo — Perdre du poids sans régime extrême";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Aperçu affiché quand le lien du site est partagé (réseaux sociaux, messageries). */
export default function OpengraphImage() {
  const kg = [84, 83.6, 83.1, 83.3, 82.6, 82.1, 81.8, 81.9, 81.1, 80.4, 79.9, 79.2, 78.6];
  const d = kg.map((v, i) => `${i ? "L" : "M"}${40 + i * 40},${30 + (84.5 - v) * 38}`).join(" ");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#fafbf6", padding: 72, color: "#1e2b22" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 560 }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#2f6b45" }}>Allégo</div>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>Perdre du poids sans régime extrême.</div>
          <div style={{ fontSize: 28, color: "#5a675e" }}>7 jours d&apos;essai gratuit</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginLeft: 40, background: "#ffffff", borderRadius: 32, padding: 24 }}>
          <svg width="520" height="300" viewBox="0 0 540 300">
            <line x1="30" x2="530" y1={30 + 6 * 38} y2={30 + 6 * 38} stroke="#d9434f" strokeWidth="3" strokeDasharray="10 8" />
            <path d={d} fill="none" stroke="#2f6b45" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={40 + 12 * 40} cy={30 + 5.9 * 38} r="12" fill="#d9434f" />
          </svg>
        </div>
      </div>
    ),
    size,
  );
}
