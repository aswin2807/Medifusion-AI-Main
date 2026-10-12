import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Activity, ShieldAlert, Award, FileText, CheckCircle2, ChevronRight } from "lucide-react";

export default function HealthScoreCard({ patientId }) {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      api.get(`/health-score/${patientId}`)
        .then((r) => setScoreData(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [patientId]);

  if (loading) {
    return <div className="p-6 bg-white border rounded-xl text-stone-400 text-xs font-mono text-center">Calculating 10-Parameter Health Score...</div>;
  }

  if (!scoreData) return null;

  const getCategoryColor = (cat) => {
    switch (cat) {
      case "Critical": return "bg-rose-100 text-rose-800 border-rose-300";
      case "High": return "bg-orange-100 text-orange-800 border-orange-300";
      case "Moderate": return "bg-amber-100 text-amber-800 border-amber-300";
      default: return "bg-emerald-100 text-emerald-800 border-emerald-300";
    }
  };

  const downloadPdf = () => {
    const token = localStorage.getItem("ht_token");
    window.open(`${api.defaults.baseURL}/reports/pdf/health_score/${patientId}?auth=${encodeURIComponent(token)}`, "_blank");
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm" data-testid="health-score-card">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
        <div>
          <div className="overline text-emerald-800 flex items-center gap-1 font-bold">
            <Award className="h-4 w-4" /> Module 9: AI Health Risk Scoring Engine
          </div>
          <h2 className="text-xl font-bold font-heading text-stone-900 mt-1">Unified Health & Risk Profile</h2>
        </div>
        <button
          onClick={downloadPdf}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition"
        >
          <FileText className="h-3.5 w-3.5" /> PDF Score Report
        </button>
      </div>

      {/* Main Score Metrics */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950 to-emerald-900 text-white flex flex-col justify-between">
          <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-300">Overall Health Score</div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-4xl font-black font-heading">{scoreData.overall_health_score}</span>
            <span className="text-sm text-emerald-200 font-mono">/ 100</span>
          </div>
          <div className="text-xs text-emerald-200">100 = Optimal Baseline</div>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between">
          <div className="text-[11px] font-mono uppercase tracking-widest text-stone-500">Computed Risk Index</div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-4xl font-black font-heading text-stone-900">{scoreData.overall_risk_score}</span>
            <span className="text-sm text-stone-500 font-mono">/ 100</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCategoryColor(scoreData.risk_category)}`}>
              {scoreData.risk_category} Risk
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between">
          <div className="text-[11px] font-mono uppercase tracking-widest text-stone-500">Triage Priority</div>
          <div className="my-2">
            <div className="text-xl font-bold font-heading text-stone-900">{scoreData.priority_level}</div>
          </div>
          <div className="text-xs text-stone-500 flex items-center gap-1 font-mono">
            <Activity className="h-3.5 w-3.5 text-emerald-700" /> Clinical CDS Triggered
          </div>
        </div>
      </div>

      {/* 10 Sub-Scores Progress Grid */}
      <h3 className="font-bold text-sm text-stone-900 mb-3 flex items-center gap-1.5">
        10-Parameter Sub-Score Index Breakdown
      </h3>
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        {Object.entries(scoreData.sub_scores || {}).map(([key, score]) => (
          <div key={key} className="p-2.5 rounded-lg border border-stone-100 bg-stone-50/50">
            <div className="flex justify-between text-xs font-semibold mb-1 text-stone-800">
              <span>{key}</span>
              <span className="font-mono">{score} / 100</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${
                  score >= 60 ? "bg-rose-600" : score >= 35 ? "bg-amber-500" : "bg-emerald-600"
                }`}
                style={{ width: `${Math.min(100, score)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Suggested Medical Actions */}
      <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
        <h4 className="font-bold text-xs text-emerald-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-800" /> Suggested Medical Actions
        </h4>
        <ul className="space-y-1.5 text-xs text-emerald-900 font-medium">
          {scoreData.suggested_actions?.map((act, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-emerald-700 shrink-0 mt-0.5" />
              <span>{act}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
