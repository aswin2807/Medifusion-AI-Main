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
import { Search, Sparkles, StickyNote, ArrowLeft, UserPlus, FileDown, Activity, Award, FileText, FileSpreadsheet, Image, Clock, Users, Bell, Stethoscope } from "lucide-react";
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
        <div className="flex items-center gap-2 border border-stone-200 rounded-lg px-3 py-2 bg-white flex-1 max-w-md" data-testid="patient-search-box">
          <Search className="h-4 w-4 text-stone-400" />
          <input data-testid="patient-search-input" placeholder="Search by name, email, disease..."
                 value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()}
                 className="flex-1 outline-none text-sm bg-transparent" />
          <button data-testid="patient-search-btn" onClick={load} className="text-xs font-semibold text-emerald-900">Search</button>
        </div>
        <button data-testid="open-invite-btn" onClick={() => setInviteOpen(true)}
                className="px-3 py-2 rounded-lg bg-emerald-900 text-white text-xs font-semibold hover:bg-emerald-800 flex items-center gap-1.5">
          <UserPlus className="h-3.5 w-3.5" /> Invite patient
        </button>
      </div>
      <div className="border border-stone-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-stone-100 text-[10px] uppercase tracking-widest font-semibold text-stone-500 bg-stone-50">
          <div className="col-span-4">Patient Name</div>
          <div className="col-span-4">Email Address</div>
          <div className="col-span-2">Overall Risk</div>
          <div className="col-span-2 text-right">Clinical Action</div>
        </div>
        {loading && <div className="p-5 text-xs font-mono text-stone-400">Loading roster...</div>}
        {!loading && items.length === 0 && <div className="p-5 text-xs font-mono text-stone-400">No patient records found.</div>}
        {items.map((p) => (
          <div key={p.id} className="grid grid-cols-12 px-5 py-3 border-b border-stone-100 items-center hover:bg-stone-50/50 transition" data-testid={`patient-row-${p.id}`}>
            <div className="col-span-4 font-semibold text-sm text-stone-900">{p.full_name}</div>
            <div className="col-span-4 text-xs font-mono text-stone-600 truncate">{p.email}</div>
            <div className="col-span-2">
              {p.overall_risk ? <RiskBadge severity={p.overall_risk.severity} value={p.overall_risk.score} /> : <span className="text-[10px] font-mono text-stone-400">—</span>}
            </div>
            <div className="col-span-2 text-right">
              <button data-testid={`open-patient-${p.id}`} onClick={() => onSelect(p)} className="px-3 py-1.5 rounded-lg bg-emerald-900 text-white text-xs font-semibold hover:bg-emerald-800">
                Open Patient EHR
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PatientDetail({ patient, onBack }) {
  const pid = patient.id;
  const [activeTab, setActiveTab] = useState("overview"); // overview | ehr | healthscore | lab | images | timeline | similarity | alerts
  const [dash, setDash] = useState(null);
  const [interp, setInterp] = useState("");
  const [interpBusy, setInterpBusy] = useState(false);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);

  const load = async () => {
    try {
      const riskRes = await api.get(`/risk?patient_id=${pid}`).catch(() => ({ data: {} }));
      const twinRes = await api.get(`/twin/${pid}`).catch(() => ({ data: {} }));
      setDash({
        overall: riskRes.data.overall,
        predictions: riskRes.data.predictions,
        twin: twinRes.data,
      });

      const n = await api.get(`/doctor/notes/${pid}`).catch(() => ({ data: [] }));
      setNotes(n.data || []);
    } catch (err) {}
  };

  useEffect(() => { load(); }, [pid]);

  const generate = async () => {
    setInterpBusy(true);
    try {
      const r = await api.get(`/interpretation?patient_id=${pid}`);
      setInterp(r.data.interpretation);
    } catch { toast.error("Interpretation failed"); }
    finally { setInterpBusy(false); }
  };

  const submitNote = async () => {
    if (!note.trim()) return;
    try {
      await api.post("/doctor/notes", { patient_id: pid, text: note });
      toast.success("Clinical note added");
      setNote("");
      load();
    } catch { toast.error("Failed to add note"); }
  };

  const downloadPdf = () => {
    const token = localStorage.getItem("ht_token");
    window.open(`${api.defaults.baseURL}/reports/pdf/risk/${pid}?auth=${encodeURIComponent(token)}`, "_blank");
  };

  const DOCTOR_NAV = [
    { id: "overview", label: "Overview & CDSS", icon: Activity },
    { id: "ehr", label: "EHR Management", icon: FileText },
    { id: "healthscore", label: "10-Param Health Score", icon: Award },
    { id: "lab", label: "Lab Analyzer", icon: FileSpreadsheet },
    { id: "images", label: "Medical Image Repo", icon: Image },
    { id: "timeline", label: "Interactive Timeline", icon: Clock },
    { id: "similarity", label: "AI Patient Similarity", icon: Users },
    { id: "alerts", label: "Clinical Alerts", icon: Bell },
  ];

  return (
    <div className="grid gap-6">
      <button data-testid="back-to-patients" onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 self-start">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to patient list
      </button>

      {/* Patient Header Banner */}
      <div className="flex items-center justify-between border border-stone-200 rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-900 text-white grid place-items-center font-heading font-bold text-lg">
            {patient.full_name?.[0] || "P"}
          </div>
          <div>
            <div className="font-heading font-bold text-xl text-stone-900">{patient.full_name}</div>
            <div className="text-xs font-mono text-stone-500">{patient.email} · ID: {patient.id}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {dash?.overall && <RiskBadge severity={dash.overall.severity} value={dash.overall.score} />}
          <button onClick={downloadPdf} className="px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1.5">
            <FileDown className="h-3.5 w-3.5" /> Download PDF
          </button>
        </div>
      </div>

      {/* Navigation Sub-Header */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-stone-200">
        {DOCTOR_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isActive ? "bg-emerald-900 text-white shadow" : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Rendering */}
      {activeTab === "overview" && (
        <div className="grid gap-6">
          {dash?.overall && <RiskPanel overall={dash.overall} predictions={dash.predictions} />}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid gap-6">
              <XAIPanel patientId={pid} />
              <VitalsTrend items={dash?.twin?.vitals_history || (dash?.twin?.vitals ? [{at: dash.twin.created_at, ...dash.twin.vitals}] : [])} />
            </div>
            <div className="grid gap-6">
              <div className="border border-stone-200 rounded-xl bg-white p-5 shadow-sm" data-testid="doctor-interpretation">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="overline">AI clinical narrative</div>
                    <div className="font-heading text-xl font-bold mt-1">Claude 4.5 Synthesis</div>
                  </div>
                  <button onClick={generate} disabled={interpBusy} className="px-3 py-2 rounded-lg bg-emerald-900 text-white text-xs font-semibold hover:bg-emerald-800 flex items-center gap-1.5 disabled:opacity-50">
                    <Sparkles className="h-3.5 w-3.5" /> {interpBusy ? "Thinking…" : "Generate"}
                  </button>
                </div>
                <div className="mt-3 text-sm text-stone-700 leading-relaxed whitespace-pre-wrap min-h-20">
                  {interp || <span className="text-stone-400 font-mono text-xs">Generate an AI-written narrative for this patient.</span>}
                </div>
              </div>

              {/* Doctor Clinical Notes Panel */}
              <div className="border border-stone-200 rounded-xl bg-white p-5 shadow-sm" data-testid="doctor-notes-panel">
                <div className="overline">Diagnostic notes</div>
                <div className="font-heading text-xl font-bold mt-1">Clinical Annotations</div>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Impressions, treatment plan, referrals..." className="w-full mt-3 px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:border-emerald-900 min-h-24 font-mono" />
                <button onClick={submitNote} className="mt-2 px-3 py-2 rounded-lg bg-emerald-900 text-white text-xs font-semibold hover:bg-emerald-800 flex items-center gap-1.5">
                  <StickyNote className="h-3.5 w-3.5" /> Add Clinical Note
                </button>
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                  {notes.map((n) => (
                    <div key={n.id} className="border-b border-dashed border-stone-200 pb-2">
                      <div className="text-[10px] font-mono text-stone-500">{n.doctor_name} · {n.created_at?.slice(0, 10)}</div>
                      <div className="text-sm text-stone-700">{n.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DigitalTwin twin={dash?.twin} patientId={pid} onSaved={load} />
        </div>
      )}

      {activeTab === "ehr" && <EHRManagement patientId={pid} isDoctor={true} />}
      {activeTab === "healthscore" && <HealthScoreCard patientId={pid} />}
      {activeTab === "lab" && <LabAnalyzer patientId={pid} />}
      {activeTab === "images" && <ImageRepository patientId={pid} />}
      {activeTab === "timeline" && <HealthTimeline patientId={pid} />}
      {activeTab === "similarity" && <PatientSimilarity patientId={pid} />}
      {activeTab === "alerts" && <ClinicalAlerts patientId={pid} />}
    </div>
  );
}

export default function DoctorDashboard() {
  const [selected, setSelected] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);

  useEffect(() => {
    api.get("/doctor/profile").then(r => setDoctorProfile(r.data)).catch(() => {});
  }, []);

  return (
    <AppShell
      title={selected ? "Clinical Decision Support" : "Patient Roster & Cohort Management"}
      subtitle="Doctor · Clinical Decision Support System"
      onSelectPatientFromSearch={(p) => setSelected(p)}
    >
      {!selected && doctorProfile && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-900 text-white grid place-items-center font-bold">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-stone-900 text-sm">{doctorProfile.user?.full_name}</div>
              <div className="text-xs text-blue-900 font-medium">
                {doctorProfile.doctor_profile?.specialization || "General Medicine"} · {doctorProfile.doctor_profile?.hospital_name || "HealthTwin Hospital"}
              </div>
            </div>
          </div>
          <div className="text-xs text-stone-600 font-mono">
            Medical Reg #: <span className="font-bold text-stone-900">{doctorProfile.doctor_profile?.medical_registration_number || "MED-REG-DEFAULT"}</span>
          </div>
        </div>
      )}

      {selected ? <PatientDetail patient={selected} onBack={() => setSelected(null)} /> : <PatientList onSelect={setSelected} />}
    </AppShell>
  );
}
