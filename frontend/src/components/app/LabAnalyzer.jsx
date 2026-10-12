import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Activity, AlertTriangle, CheckCircle2, FileSpreadsheet, History, Search } from "lucide-react";

const PANELS = [
  { key: "Blood Sugar", name: "Blood Sugar Panel", fields: [{ k: "blood_sugar", l: "Fasting Blood Sugar (mg/dL)" }, { k: "hba1c", l: "HbA1c (%)" }] },
  { key: "Lipid Profile", name: "Lipid Profile", fields: [{ k: "cholesterol_total", l: "Total Cholesterol (mg/dL)" }, { k: "cholesterol_hdl", l: "HDL Cholesterol (mg/dL)" }, { k: "cholesterol_ldl", l: "LDL Cholesterol (mg/dL)" }, { k: "triglycerides", l: "Triglycerides (mg/dL)" }] },
  { key: "CBC", name: "Complete Blood Count (CBC)", fields: [{ k: "hemoglobin", l: "Hemoglobin (g/dL)" }, { k: "wbc_count", l: "WBC Count (/mcL)" }, { k: "platelets", l: "Platelets (10^3/mcL)" }] },
  { key: "Liver Function Test", name: "Liver Function (LFT)", fields: [{ k: "alt", l: "ALT / SGPT (U/L)" }, { k: "ast", l: "AST / SGOT (U/L)" }, { k: "bilirubin", l: "Bilirubin (mg/dL)" }] },
  { key: "Kidney Function Test", name: "Kidney Function (KFT)", fields: [{ k: "creatinine", l: "Serum Creatinine (mg/dL)" }, { k: "bun", l: "Blood Urea Nitrogen (mg/dL)" }, { k: "egfr", l: "eGFR (mL/min/1.73m²)" }] },
  { key: "Thyroid Profile", name: "Thyroid Profile", fields: [{ k: "tsh", l: "TSH (mIU/L)" }, { k: "free_t3", l: "Free T3 (pg/mL)" }, { k: "free_t4", l: "Free T4 (ng/dL)" }] },
  { key: "Vitamin Profile", name: "Vitamin Profile", fields: [{ k: "vitamin_d", l: "Vitamin D3 (ng/mL)" }, { k: "vitamin_b12", l: "Vitamin B12 (pg/mL)" }] },
];

export default function LabAnalyzer({ patientId }) {
  const [selectedPanel, setSelectedPanel] = useState(PANELS[0]);
  const [formValues, setFormValues] = useState({});
  const [analysisResult, setAnalysisResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [twinLabs, setTwinLabs] = useState(null);

  const fetchHistory = async () => {
    try {
      const r = await api.get(`/labs/history/${patientId}`);
      setHistory(r.data);
    } catch (err) {}
  };

  const fetchTwinData = async () => {
    try {
      const r = await api.get(`/twin/${patientId}`);
      if (r.data && r.data.labs) {
        setTwinLabs(r.data.labs);
      }
    } catch (err) {
      console.error("Failed to load patient twin labs", err);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchHistory();
      fetchTwinData();
    }
  }, [patientId]);

  useEffect(() => {
    if (twinLabs) {
      const initial = {};
      selectedPanel.fields.forEach((f) => {
        if (twinLabs[f.k] !== undefined && twinLabs[f.k] !== null) {
          initial[f.k] = twinLabs[f.k];
        }
      });
      setFormValues(initial);
    } else {
      setFormValues({});
    }
  }, [selectedPanel, twinLabs]);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post("/labs/analyze", {
        patient_id: patientId,
        panel_type: selectedPanel.key,
        values: formValues,
      });
      setAnalysisResult(r.data);
      toast.success("Lab report analyzed successfully");
      fetchHistory();
    } catch (err) {
      toast.error("Failed to analyze lab report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm" data-testid="lab-analyzer">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
        <div>
          <div className="overline text-emerald-800 flex items-center gap-1 font-bold">
            <FileSpreadsheet className="h-4 w-4" /> Module 10: Intelligent Lab Analysis
          </div>
          <h2 className="text-xl font-bold font-heading text-stone-900 mt-1">Automated Lab Parser & Anomaly Detection</h2>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-1 space-y-4">
          <label className="block text-xs font-semibold text-stone-600 mb-1">Select Laboratory Panel</label>
          <select
            value={selectedPanel.key}
            onChange={(e) => {
              const p = PANELS.find((x) => x.key === e.target.value);
              if (p) { setSelectedPanel(p); setFormValues({}); }
            }}
            className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:outline-none focus:border-emerald-900"
          >
            {PANELS.map((p) => (
              <option key={p.key} value={p.key}>{p.name}</option>
            ))}
          </select>

          <form onSubmit={handleAnalyze} className="space-y-3">
            {selectedPanel.fields.map((f) => (
              <div key={f.k}>
                <label className="block text-xs text-stone-600 font-medium mb-1">{f.l}</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Enter value"
                  value={formValues[f.k] || ""}
                  onChange={(e) => setFormValues({ ...formValues, [f.k]: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:outline-none focus:border-emerald-900"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-emerald-900 text-white font-semibold text-xs hover:bg-emerald-800 transition"
            >
              {loading ? "Analyzing..." : "Analyze Lab Panel"}
            </button>
          </form>
        </div>

        {/* Results View */}
        <div className="lg:col-span-2 space-y-4">
          {analysisResult ? (
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div className="font-bold text-stone-900">{analysisResult.panel_type} Analysis Result</div>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                    {analysisResult.abnormal_count} Abnormal
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-bold">
                    {analysisResult.critical_count} Critical
                  </span>
                </div>
              </div>

              {/* Summary banner */}
              <div className={`p-3 rounded-lg text-xs font-semibold ${analysisResult.critical_count > 0 ? "bg-rose-100 text-rose-950 border border-rose-200" : "bg-emerald-100 text-emerald-950 border border-emerald-200"}`}>
                {analysisResult.summary}
              </div>

              {/* Table of parameters */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-200 text-stone-700 font-mono text-[11px]">
                      <th className="p-2">Parameter</th>
                      <th className="p-2">Value</th>
                      <th className="p-2">Reference Range</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {analysisResult.parameters?.map((p, idx) => (
                      <tr key={idx} className="hover:bg-white">
                        <td className="p-2 font-semibold text-stone-800">{p.name}</td>
                        <td className="p-2 font-mono font-bold">{p.value} {p.unit}</td>
                        <td className="p-2 text-stone-500 font-mono">{p.reference_range}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.status === "normal" ? "bg-emerald-100 text-emerald-800" :
                            p.status === "critical" ? "bg-rose-600 text-white animate-pulse" : "bg-amber-100 text-amber-900"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Followup Actions */}
              {analysisResult.suggested_followups?.length > 0 && (
                <div className="p-3 rounded-lg bg-stone-100 text-xs space-y-1">
                  <div className="font-bold text-stone-800 mb-1">Suggested Clinical Follow-up:</div>
                  {analysisResult.suggested_followups.map((f, i) => (
                    <div key={i} className="text-stone-700 font-mono">• {f}</div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center border-2 border-dashed rounded-xl border-stone-200 text-stone-400 text-xs font-mono">
              Select a panel on the left and enter values to trigger intelligent automated analysis.
            </div>
          )}

          {/* Past History */}
          {history.length > 0 && (
            <div className="mt-6">
              <h4 className="font-bold text-xs text-stone-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                <History className="h-3.5 w-3.5" /> Recent Lab Reports History
              </h4>
              <div className="space-y-2">
                {history.slice(0, 3).map((h) => (
                  <div key={h.id} className="p-3 border rounded-lg bg-white text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-stone-900">{h.panel_type}</span>
                      <span className="text-stone-400 ml-2 font-mono text-[11px]">{h.timestamp?.slice(0, 10)}</span>
                    </div>
                    <span className="text-stone-600 font-mono text-[11px]">{h.abnormal_count} Flagged</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
