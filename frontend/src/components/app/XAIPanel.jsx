import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

const DISEASES = [
  { key: "diabetes", label: "Diabetes" },
  { key: "heart_disease", label: "Heart Disease" },
  { key: "ckd", label: "Chronic Kidney" },
  { key: "liver_disease", label: "Liver Disease" },
  { key: "hypertension", label: "Hypertension" },
];

export default function XAIPanel({ patientId }) {
  const [active, setActive] = useState("diabetes");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = patientId ? `?patient_id=${patientId}` : "";
    api
      .get(`/xai/${active}${q}`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [active, patientId]);

  const shap = (data?.shap || []).map((s) => ({
    name: s.feature,
    value: Number((s.weight || 0).toFixed(2)),
    direction: s.direction,
    raw: s.value,
    impact: s.impact_pct,
  }));

  return (
    <div className="border border-stone-200 rounded-xl bg-white" data-testid="xai-panel">
      <div className="p-5 border-b border-stone-100">
        <div className="overline">Explainable AI</div>
        <div className="font-heading text-xl font-bold mt-1">SHAP + LIME contribution analysis</div>
        <div className="text-xs text-stone-500 mt-1">Feature-level attribution for the selected disease model.</div>
      </div>
      <div className="px-5 pt-4 flex flex-wrap gap-2">
        {DISEASES.map((d) => (
          <button key={d.key}
            data-testid={`xai-disease-${d.key}`}
            onClick={() => setActive(d.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${active === d.key ? "bg-emerald-900 text-white border-emerald-900" : "border-stone-200 text-stone-700 hover:bg-stone-100"}`}>
            {d.label}
          </button>
        ))}
      </div>
      <div className="p-5 grid lg:grid-cols-2 gap-6">
        <div>
          <div className="overline mb-2">SHAP Feature Importance</div>
          <div className="h-72" data-testid="xai-shap-chart">
            {loading || !shap.length ? (
              <div className="h-full grid place-items-center text-xs text-stone-400 font-mono">Loading…</div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={shap} layout="vertical" margin={{ left: 24, right: 24 }}>
                  <XAxis type="number" tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#57534e" }} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#292524" }} />
                  <Tooltip
                    contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 12, border: "1px solid #e7e5e4", borderRadius: 8 }}
                    formatter={(v, _n, p) => [`${v} (${p.payload.impact}%)`, "weight"]}
                  />
                  <ReferenceLine x={0} stroke="#a8a29e" />
                  <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                    {shap.map((s, i) => (
                      <Cell key={i} fill={s.direction === "positive" ? "#c2410c" : "#047857"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div>
          <div className="overline mb-2">LIME Local Explanation</div>
          <div className="space-y-2 font-mono text-sm" data-testid="xai-lime-list">
            {(data?.lime || []).map((l, i) => (
              <div key={i} className="flex items-center justify-between border-b border-dashed border-stone-200 py-1.5">
                <div>
                  <div className="text-stone-900">{l.feature}</div>
                  <div className="text-[11px] text-stone-500">value = {String(l.value)}</div>
                </div>
                <div className={`text-sm font-bold ${l.direction === "positive" ? "text-orange-700" : "text-emerald-700"}`}>
                  {l.direction === "positive" ? "+" : ""}{l.weight}
                </div>
              </div>
            ))}
          </div>
          {data?.prediction && (
            <div className="mt-4 p-3 rounded-lg bg-stone-100 text-xs font-mono">
              <div className="text-stone-500">Prediction summary</div>
              <div className="mt-1">
                <span className="text-stone-500">risk</span> <span className="text-stone-900 font-bold">{data.prediction.risk_percent}%</span> ·
                <span className="text-stone-500 ml-2">severity</span> <span className="text-stone-900 font-bold">{data.prediction.severity}</span> ·
                <span className="text-stone-500 ml-2">confidence</span> <span className="text-stone-900 font-bold">{data.prediction.confidence}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
