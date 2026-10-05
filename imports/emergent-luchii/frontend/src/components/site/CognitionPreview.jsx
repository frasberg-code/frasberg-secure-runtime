const STEPS = ["P", "I", "R", "D", "A"];
const LABELS = ["Perception", "Interpretation", "Reasoning", "Decision", "Action"];

const hash = (s) => {
  let h = 7;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
};

export function CognitionPreview({ seed, height = 52, labels = false }) {
  const acts = STEPS.map((_, i) => ((hash(seed + i) % 55) + 40) / 100);
  const w = 230;
  const y = labels ? 26 : height / 2;
  return (
    <svg viewBox={`0 0 ${w} ${labels ? 58 : height}`} style={{ width: "100%", height: "auto" }} data-testid="cognition-preview">
      {acts.slice(0, -1).map((_, i) => {
        const x1 = 22 + i * 46.5, x2 = 22 + (i + 1) * 46.5;
        return <line key={i} x1={x1} y1={y} x2={x2} y2={y} stroke="rgba(0,240,255,0.3)" strokeWidth="1" strokeDasharray="2 3" />;
      })}
      {acts.map((a, i) => {
        const x = 22 + i * 46.5;
        const r = 5.5 + a * 5;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={r + 3.5} fill="#00F0FF" opacity={a * 0.16} />
            <circle cx={x} cy={y} r={r} fill="#0d1418" stroke="#00F0FF" strokeWidth="1.1" strokeOpacity={0.3 + a * 0.7} />
            <text x={x} y={y + 3} textAnchor="middle" fill="#9adbe3" fontSize="7.5" fontFamily="monospace">{STEPS[i]}</text>
            {labels && <text x={x} y={y + 24} textAnchor="middle" fill="#8A8F98" fontSize="6.5">{LABELS[i]}</text>}
          </g>
        );
      })}
    </svg>
  );
}
