import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import AppShell, { RiskBadge } from "@/components/app/AppShell";
import DigitalTwin from "@/components/app/DigitalTwin";
import RiskPanel from "@/components/app/RiskPanel";
import XAIPanel from "@/components/app/XAIPanel";
import VitalsTrend from "@/components/app/VitalsTrend";
import EHRManagement from "@/components/app/EHRManagement";
import HealthScoreCard from "@/components/app/HealthScoreCard";
import LabAnalyzer from "@/components/app/LabAnalyzer";
import ImageRepository from "@/components/app/ImageRepository";
import HealthTimeline from "@/components/app/HealthTimeline";
import PatientSimilarity from "@/components/app/PatientSimilarity";
import ClinicalAlerts from "@/components/app/ClinicalAlerts";
import { Search, Sparkles, StickyNote, ArrowLeft, UserPlus, FileDown, Activity, Award, FileText, FileSpreadsheet, Image, Clock, Users, Bell, ShieldCheck, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import InvitePatientModal from "@/components/app/InvitePatientModal";

function PatientList({ onSelect }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/patients", { params: q ? { q } : {} });
      setItems(r.data || []);
    } catch (e) {
      toast.error("Failed to load patient roster");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="grid gap-4">
      <InvitePatientModal open={inviteOpen} onClose={() => setInviteOpen(false)} onCreated={load} />
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 border border-stone-200 rounded-lg px-3 py-2 bg-white flex-1 max-w-md" data-testid="clinical-search-box">
          <Search className="h-4 w-4 text-stone-400" />
          <input data-testid="clinical-search-input" placeholder="Clinical patient search (name, email, ICD code)..."
                 value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()}
                 className="flex-1 outline-none text-sm bg-transparent" />
          <button data-testid="clinical-search-btn" onClick={load} className="text-xs font-semibold text-purple-900">Search</button>
        </div>
        <button data-testid="open-invite-btn" onClick={() => setInviteOpen(true)}
                className="px-3 py-2 rounded-lg bg-purple-900 text-white text-xs font-semibold hover:bg-purple-800 flex items-center gap-1.5">
          <UserPlus className="h-3.5 w-3.5" /> Register Patient
        </button>
      </div>
      <div className="border border-stone-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-stone-100 text-[10px] uppercase tracking-widest font-semibold text-stone-500 bg-stone-50">
          <div className="col-span-4">Patient Name</div>
          <div className="col-span-4">Email Address</div>
          <div className="col-span-2">Clinical Risk Tier</div>
          <div className="col-span-2 text-right">Clinical Record</div>
        </div>
        {loading && <div className="p-5 text-xs font-mono text-stone-400">Loading clinical roster...</div>}
        {!loading && items.length === 0 && <div className="p-5 text-xs font-mono text-stone-400">No matching patient records found.</div>}
        {items.map((p) => (
          <div key={p.id} className="grid grid-cols-12 px-5 py-3 border-b border-stone-100 items-center hover:bg-stone-50/50 transition" data-testid={`clinical-patient-row-${p.id}`}>
            <div className="col-span-4 font-semibold text-sm text-stone-900">{p.full_name}</div>
            <div className="col-span-4 text-xs font-mono text-stone-600 truncate">{p.email}</div>
            <div className="col-span-2">
              {p.overall_risk ? <RiskBadge severity={p.overall_risk.severity} value={p.overall_risk.score} /> : <span className="text-[10px] font-mono text-stone-400">—</span>}
            </div>
            <div className="col-span-2 text-right">
              <button data-testid={`open-patient-${p.id}`} onClick={() => onSelect(p)} className="px-3 py-1.5 rounded-lg bg-purple-900 text-white text-xs font-semibold hover:bg-purple-800">
                Inspect Clinical File
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ClinicalDashboard() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [subTab, setSubTab] = useState("overview"); // overview | twin | risk | xai | labs | alerts | similarity | profile | ehr
  const [clinicalProfile, setClinicalProfile] = useState(null);

  useEffect(() => {
    api.get("/clinical/profile").then(r => setClinicalProfile(r.data)).catch(() => {});
  }, []);

  const loadNotes = async (pid) => {
    if (!pid) return;
    try {
      const r = await api.get(`/doctor/notes/${pid}`);
      setNotes(r.data || []);
    } catch {
      setNotes([]);
    }
  };

  useEffect(() => {
    if (selectedPatient) loadNotes(selectedPatient.id);
  }, [selectedPatient]);

  const addNote = async () => {
    if (!note.trim() || !selectedPatient) return;
    try {
      await api.post(`/doctor/notes/${selectedPatient.id}`, { note: note.trim() });
      toast.success("Clinical note added");
      setNote("");
      loadNotes(selectedPatient.id);
    } catch {
      toast.error("Failed to add note");
    }
  };

  return (
    <AppShell title="Clinical Patient Workspace" subtitle="Clinical · Health & Diagnostics Portal">
      {!selectedPatient ? (
        <div className="space-y-6">
          {/* Clinical Profile Banner */}
          {clinicalProfile && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-900 text-white grid place-items-center font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-stone-900 text-sm">{clinicalProfile.user?.full_name}</div>
                  <div className="text-xs text-purple-900 font-medium">
                    {clinicalProfile.clinical_profile?.specialization || "Clinical Specialist"} · {clinicalProfile.clinical_profile?.hospital_name || "Medical Center"}
                  </div>
                </div>
              </div>
              <div className="text-xs text-stone-600 font-mono">
                License: <span className="font-bold text-stone-900">{clinicalProfile.clinical_profile?.clinical_registration_number || "CLN-LIC-DEFAULT"}</span>
              </div>
            </div>
          )}

          <PatientList onSelect={setSelectedPatient} />
        </div>
      ) : (
        <div className="space-y-6" data-testid="clinical-patient-detail">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-4 flex-wrap">
            <button data-testid="back-to-patients" onClick={() => setSelectedPatient(null)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-3 py-1.5 rounded-lg shadow-sm">
              <ArrowLeft className="h-4 w-4" /> Back to Clinical Roster
            </button>
            
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold text-stone-900">{selectedPatient.full_name}</span>
              <span className="text-xs font-mono text-stone-500">({selectedPatient.email})</span>
            </div>

            <div className="flex items-center gap-2">
              <a href={`${api.defaults.baseURL || "http://127.0.0.1:8001/api"}/reports/pdf/health_score/${selectedPatient.id}?auth=${localStorage.getItem("ht_token")}`}
                 target="_blank" rel="noreferrer"
                 className="px-3 py-1.5 rounded-lg bg-purple-900 text-white text-xs font-semibold hover:bg-purple-800 flex items-center gap-1.5 shadow-sm">
                <FileDown className="h-3.5 w-3.5" /> PDF Clinical Summary
              </a>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-stone-200 overflow-x-auto pb-1">
            {[
              { id: "overview", label: "Overview & CDSS", icon: Activity },
              { id: "twin", label: "Digital Twin", icon: Users },
              { id: "risk", label: "Disease Risk", icon: Sparkles },
              { id: "xai", label: "Explainable AI", icon: Award },
              { id: "labs", label: "Lab Reports", icon: FileSpreadsheet },
              { id: "alerts", label: "Clinical Alerts", icon: Bell },
              { id: "similarity", label: "Patient Similarity", icon: Users },
              { id: "timeline", label: "Timeline", icon: Clock },
              { id: "images", label: "Medical Imaging & AI Scans", icon: Image },
              { id: "ehr", label: "Medical Documentation", icon: StickyNote },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setSubTab(t.id)}
                  className={`px-3 py-2 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap ${
                    subTab === t.id ? "bg-purple-900 text-white shadow-sm" : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENTS */}
          {subTab === "overview" && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <HealthScoreCard patientId={selectedPatient.id} />
                <VitalsTrend patientId={selectedPatient.id} />
              </div>
              <div className="space-y-6">
                <div className="border border-stone-200 rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 font-heading font-bold text-stone-900 mb-3">
                    <StickyNote className="h-4 w-4 text-purple-800" /> Add Clinical Observation Note
                  </div>
                  <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)}
                            placeholder="Enter clinical notes, progress summaries, or therapy updates..."
                            className="w-full p-2.5 text-xs border border-stone-200 rounded-lg mb-3 outline-none focus:border-purple-900" />
                  <button onClick={addNote} className="w-full py-2 bg-purple-900 text-white text-xs font-semibold rounded-lg hover:bg-purple-800">
                    Save Note
                  </button>
                </div>
                <div className="border border-stone-200 rounded-xl bg-white p-4 shadow-sm">
                  <div className="font-heading font-bold text-sm text-stone-900 mb-3">Observation History</div>
                  {notes.length === 0 ? <div className="text-xs font-mono text-stone-400">No notes recorded yet.</div> : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {notes.map(n => (
                        <div key={n.id} className="p-2.5 bg-stone-50 rounded-lg border border-stone-100 text-xs">
                          <div className="text-stone-800">{n.note}</div>
                          <div className="text-[10px] text-stone-400 mt-1 font-mono">{new Date(n.created_at).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {subTab === "twin" && <DigitalTwin patientId={selectedPatient.id} isDoctor={true} />}
          {subTab === "risk" && <RiskPanel patientId={selectedPatient.id} />}
          {subTab === "xai" && <XAIPanel patientId={selectedPatient.id} />}
          {subTab === "labs" && <LabAnalyzer patientId={selectedPatient.id} isDoctor={true} />}
          {subTab === "images" && <ImageRepository patientId={selectedPatient.id} />}
          {subTab === "alerts" && <ClinicalAlerts patientId={selectedPatient.id} />}
          {subTab === "similarity" && <PatientSimilarity patientId={selectedPatient.id} />}
          {subTab === "timeline" && <HealthTimeline patientId={selectedPatient.id} />}
          {subTab === "ehr" && <EHRManagement patientId={selectedPatient.id} />}
        </div>
      )}
    </AppShell>
  );
}
