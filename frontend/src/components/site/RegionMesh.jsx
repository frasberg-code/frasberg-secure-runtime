const STATUS_COLOR = { healthy: "#34D399", degraded: "#F87171", failover: "#FBBF24" };

export function RegionMap({ regions }) {
  const pairs = [];
  for (let i = 0; i < regions.length; i++)
    for (let j = i + 1; j < regions.length; j++) pairs.push([regions[i], regions[j]]);
  return (
    <svg viewBox="0 0 720 300" className="w-full" data-testid="region-map">
      {Array.from({ length: 11 }, (_, i) => (
        <line key={`v${i}`} x1={i * 72} y1="0" x2={i * 72} y2="300" stroke="rgba(255,255,255,0.05)" />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 60} x2="720" y2={i * 60} stroke="rgba(255,255,255,0.05)" />
      ))}
      {pairs.map(([a, b], i) => {
        const mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - 40;
        const hot = a.status !== "healthy" || b.status !== "healthy";
        const path = `M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`;
        return (
          <g key={i}>
            <path d={path} fill="none" stroke={hot ? "#FBBF24" : "rgba(0,240,255,0.22)"} strokeWidth="1" strokeDasharray="3 4" />
            <circle r="2.5" fill={hot ? "#FBBF24" : "#00F0FF"} opacity="0.8">
              <animateMotion dur={`${3 + i * 0.6}s`} repeatCount="indefinite" path={path} />
            </circle>
          </g>
        );
      })}
      {regions.map((r) => {
        const c = STATUS_COLOR[r.status] || "#34D399";
        return (
          <g key={r.id} data-testid={`region-node-${r.id}`}>
            <circle cx={r.x} cy={r.y} r={14 + r.load * 10} fill={c} opacity="0.12">
              <animate attributeName="opacity" values="0.12;0.28;0.12" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle cx={r.x} cy={r.y} r="7" fill="#0d1418" stroke={c} strokeWidth="2" />
            <circle cx={r.x} cy={r.y} r="2.5" fill={c} />
            <text x={r.x} y={r.y - 16} textAnchor="middle" fill="#EDEDED" fontSize="12" fontWeight="600">{r.name}</text>
            <text x={r.x} y={r.y + 22} textAnchor="middle" fill="#8A8F98" fontSize="10.5" fontFamily="monospace">
              {r.status} · {Math.round(r.load * 100)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function RegionCards({ regions }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="region-cards">
      {regions.map((r) => {
        const c = STATUS_COLOR[r.status] || "#34D399";
        return (
          <div key={r.id} className="rounded-xl border border-white/10 bg-black/30 p-4" data-testid={`region-card-${r.id}`}>
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-700">{r.name}</p>
              <span className="rounded-full border px-2 py-0.5 font-mono text-[11px]" style={{ borderColor: c, color: c }}>{r.status}</span>
            </div>
            <div className="mt-3 space-y-2 font-mono text-[12px] text-gray-400">
              <p className="flex items-center gap-2">load
                <span className="h-1 flex-1 rounded-full bg-white/10"><span className="block h-1 rounded-full" style={{ width: `${r.load * 100}%`, background: c }} /></span>
                {Math.round(r.load * 100)}%
              </p>
              <p>safety <span style={{ color: r.safety >= 90 ? "#34D399" : "#22D3EE" }}>{r.safety}/100</span> · {r.agents} agents</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
