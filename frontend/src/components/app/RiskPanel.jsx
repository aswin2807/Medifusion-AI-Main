import React from "react";
import { RiskBadge } from "./AppShell";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";

const COLOR = { Low: "#047857", Moderate: "#b45309", High: "#c2410c", Critical: "#be123c" };

export default function RiskPanel({ overall, predictions, onOpen }) {
  return (
    <div className="grid lg:grid-cols-12 gap-4">
      <div className="lg:col-span-4 border border-stone-200 rounded-xl bg-white p-5" data-testid="risk-overall">
        <div className="overline">Aggregate risk score</div>
        <div className="font-heading text-xl font-bold">Patient Health Risk</div>
        <div className="mt-2 h-48 relative">
          <ResponsiveContainer>
            <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: "risk", value: overall?.score || 0, fill: COLOR[overall?.severity || "Low"] }]} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar background dataKey="value" cornerRadius={20} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="text-center">
              <div className="font-mono text-4xl font-bold text-stone-900">{overall?.score ?? "—"}</div>
              <div className="text-[10px] font-mono text-stone-500">/ 100</div>
            </div>
          </div>
        </div>
        <div className="mt-2 flex justify-center">
          <RiskBadge severity={overall?.severity || "Low"} value={overall?.score} />
        </div>
      </div>
      <div className="lg:col-span-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(predictions || []).map((p) => (
          <button
            key={p.disease}
            data-testid={`risk-card-${p.disease.toLowerCase().replaceAll(" ", "-")}`}
            onClick={() => onOpen?.(p)}
            className="text-left border border-stone-200 rounded-xl bg-white p-4 hover:border-emerald-900 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="font-heading font-semibold text-sm">{p.disease}</div>
              <RiskBadge severity={p.severity} />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <div className="font-mono text-3xl font-bold text-stone-900">{p.risk_percent}<span className="text-sm text-stone-400">%</span></div>
              <div className="text-[10px] font-mono text-stone-500">conf {p.confidence}</div>
            </div>
            <div className="mt-3 space-y-1">
              {p.contributions.slice(0, 3).map((c) => (
                <div key={c.feature} className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-stone-500">{c.feature}</span>
                  <span className={c.direction === "positive" ? "text-orange-700" : "text-emerald-700"}>
                    {c.direction === "positive" ? "+" : "−"}{c.impact_pct}%
                  </span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
