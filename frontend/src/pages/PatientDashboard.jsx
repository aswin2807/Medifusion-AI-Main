import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import AppShell from "@/components/app/AppShell";
import DigitalTwin from "@/components/app/DigitalTwin";
import RiskPanel from "@/components/app/RiskPanel";
import XAIPanel from "@/components/app/XAIPanel";
import VitalsTrend from "@/components/app/VitalsTrend";
import EHRManagement from "@/components/app/EHRManagement";
import HealthScoreCard from "@/components/app/HealthScoreCard";
import LabAnalyzer from "@/components/app/LabAnalyzer";
import ImageRepository from "@/components/app/ImageRepository";
import HealthTimeline from "@/components/app/HealthTimeline";
import ClinicalAlerts from "@/components/app/ClinicalAlerts";
import Pharmacy from "@/components/app/Pharmacy";
import { Sparkles, RefreshCw, FileDown, Activity, Award, FileText, FileSpreadsheet, Image, Clock, Bell, Pill } from "lucide-react";
import { toast } from "sonner";

export default function PatientDashboard() {
  const [dash, setDash] = useState(null);
  const [activeNav, setActiveNav] = useState("overview"); // overview | ehr | healthscore | lab | images | timeline | alerts
  const [interpretation, setInterpretation] = useState("");
  const [interpBusy, setInterpBusy] = useState(false);

  const load = async () => {
    try {
      const r = await api.get("/auth/me");
      const user = r.data;
      const riskRes = await api.get(`/risk?patient_id=${user.id}`).catch(() => ({ data: {} }));
      const twinRes = await api.get(`/twin/${user.id}`).catch(() => ({ data: {} }));

      setDash({
        patient: user,
        twin: twinRes.data,
        overall: riskRes.data.overall,
        predictions: riskRes.data.predictions,
      });
    } catch (e) {
      toast.error("Failed to load patient profile");
    }
  };

  useEffect(() => { load(); }, []);

  const genInterpretation = async () => {
    if (!dash?.patient?.id) return;
    setInterpBusy(true);
    try {
      const r = await api.get(`/interpretation?patient_id=${dash.patient.id}`);
      setInterpretation(r.data.interpretation);
      toast.success("AI clinical interpretation generated");
    } catch {
      toast.error("Interpretation failed");
    } finally {
      setInterpBusy(false);
    }
  };

  const downloadPdf = () => {
    if (dash?.patient?.id) {
      const token = localStorage.getItem("ht_token");
      window.open(`${api.defaults.baseURL}/reports/pdf/risk/${dash.patient.id}?auth=${encodeURIComponent(token)}`, "_blank");
    }
  };

  if (!dash) return <AppShell title="Loading…" subtitle="Patient console" />;

  const NAV_ITEMS = [
    { id: "overview", label: "Overview & Risk", icon: Activity },
    { id: "ehr", label: "EHR Management", icon: FileText },
    { id: "healthscore", label: "10-Param Health Score", icon: Award },
    { id: "lab", label: "Intelligent Lab Analysis", icon: FileSpreadsheet },
    { id: "images", label: "Image Repository", icon: Image },
    { id: "timeline", label: "Health Timeline", icon: Clock },
    { id: "alerts", label: "Clinical Alerts", icon: Bell },
    { id: "pharmacy", label: "Pharmacy Store", icon: Pill },
  ];

  return (
    <AppShell
      title={`Hello, ${dash.patient?.full_name?.split(" ")[0] || "there"}.`}
      subtitle="Patient · Digital Twin Console"
      right={
        <div className="flex items-center gap-2">
          <button onClick={downloadPdf} className="px-3 py-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <FileDown className="h-3.5 w-3.5" /> PDF Risk Report
          </button>
          <button onClick={load} className="px-3 py-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      }
    >
      {/* Navigation Sub-Header */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-stone-200">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isActive ? "bg-emerald-950 text-white shadow" : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Main View Area */}
      <div className="space-y-6">
        {activeNav === "overview" && (
          <>
            <RiskPanel overall={dash.overall} predictions={dash.predictions} />
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <VitalsTrend items={dash?.twin?.vitals_history || (dash?.twin?.vitals ? [{at: dash.twin.created_at, ...dash.twin.vitals}] : [])} />
                <XAIPanel patientId={dash.patient.id} />
              </div>
              <div className="space-y-6">
                <div className="border border-stone-200 rounded-xl bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="overline">AI clinical interpretation</div>
                      <div className="font-heading text-xl font-bold mt-1">Ask Claude 4.5</div>
                    </div>
                    <button onClick={genInterpretation} disabled={interpBusy} className="px-3 py-2 rounded-lg bg-emerald-900 text-white text-xs font-semibold hover:bg-emerald-800 flex items-center gap-1.5 disabled:opacity-50">
                      <Sparkles className="h-3.5 w-3.5" /> {interpBusy ? "Thinking…" : "Generate"}
                    </button>
                  </div>
                  <div className="mt-3 text-sm text-stone-700 leading-relaxed whitespace-pre-wrap min-h-16">
                    {interpretation || <span className="text-stone-400 font-mono text-xs">Click "Generate" for an AI-written clinical summary based on your latest twin data.</span>}
                  </div>
                </div>
              </div>
            </div>
            <DigitalTwin twin={dash.twin} onSaved={load} />
          </>
        )}

        {activeNav === "ehr" && <EHRManagement patientId={dash.patient.id} />}
        {activeNav === "healthscore" && <HealthScoreCard patientId={dash.patient.id} />}
        {activeNav === "lab" && <LabAnalyzer patientId={dash.patient.id} />}
        {activeNav === "images" && <ImageRepository patientId={dash.patient.id} />}
        {activeNav === "timeline" && <HealthTimeline patientId={dash.patient.id} />}
        {activeNav === "alerts" && <ClinicalAlerts patientId={dash.patient.id} />}
        {activeNav === "pharmacy" && <Pharmacy patientId={dash.patient.id} />}
      </div>
    </AppShell>
  );
}
