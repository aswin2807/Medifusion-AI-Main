import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Users, Sparkles, CheckCircle2, ChevronRight, UserCheck } from "lucide-react";

export default function PatientSimilarity({ patientId }) {
  const [similarityData, setSimilarityData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      setLoading(true);
      api.get(`/patient-similarity/${patientId}`)
        .then((r) => setSimilarityData(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [patientId]);

  if (loading) {
    return <div className="p-6 bg-white border rounded-xl text-stone-400 text-xs font-mono text-center">Executing AI Patient Similarity Engine...</div>;
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm" data-testid="patient-similarity">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
        <div>
          <div className="overline text-emerald-800 flex items-center gap-1 font-bold">
            <Users className="h-4 w-4" /> Module 13: AI Patient Similarity Engine
          </div>
          <h2 className="text-xl font-bold font-heading text-stone-900 mt-1">Clinical Cohort & Case Matcher</h2>
        </div>
      </div>

      <div className="space-y-4">
        {similarityData?.matches?.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs font-mono">No matching patient cohorts found in database.</div>
        ) : (
          similarityData?.matches?.map((m, idx) => (
            <div key={m.patient_id || idx} className="p-4 border border-stone-200 rounded-xl bg-stone-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-emerald-800" />
                  <div>
                    <div className="font-bold text-stone-900 text-sm">{m.patient_name}</div>
                    <div className="text-[11px] font-mono text-stone-500">ID: {m.patient_id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 font-bold font-mono text-xs border border-emerald-800">
                  <Sparkles className="h-3.5 w-3.5" /> {m.match_percentage}% Match
                </div>
              </div>

              {/* Overlapping Conditions */}
              <div className="grid md:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="font-semibold text-stone-700 mb-1">Overlapping Conditions:</div>
                  <div className="flex flex-wrap gap-1">
                    {m.overlapping_conditions?.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-stone-200 text-stone-800 text-[11px]">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-stone-700 mb-1">Matching Similarity Factors:</div>
                  <div className="flex flex-wrap gap-1">
                    {m.similarity_factors?.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[11px]">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Effective Treatments */}
              <div className="pt-2 border-t border-stone-200 text-xs">
                <div className="font-semibold text-stone-800 mb-1">Effective Treatment Interventions:</div>
                <div className="space-y-1">
                  {m.effective_treatments?.map((t, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-stone-700 font-mono text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
