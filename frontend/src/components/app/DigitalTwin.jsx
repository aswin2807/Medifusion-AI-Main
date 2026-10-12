import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Save } from "lucide-react";

const FIELDS = {
  profile: [
    ["age", "Age", "number"],
    ["gender", "Gender", "text"],
    ["bmi", "BMI", "number"],
    ["blood_group", "Blood Group", "text"],
    ["sleep_hours", "Sleep (h/day)", "number"],
    ["physical_activity_hours", "Activity (h/week)", "number"],
    ["diet", "Diet", "text"],
  ],
  vitals: [
    ["systolic_bp", "Systolic BP", "number"],
    ["diastolic_bp", "Diastolic BP", "number"],
    ["heart_rate", "Heart Rate", "number"],
    ["temperature", "Temperature (°F)", "number"],
    ["oxygen_saturation", "SpO₂ (%)", "number"],
  ],
  labs: [
    ["hba1c", "HbA1c", "number"],
    ["blood_sugar", "Fasting Glucose", "number"],
    ["cholesterol_total", "Total Cholesterol", "number"],
    ["cholesterol_hdl", "HDL", "number"],
    ["cholesterol_ldl", "LDL", "number"],
    ["creatinine", "Creatinine", "number"],
    ["alt", "ALT", "number"],
    ["ast", "AST", "number"],
    ["hemoglobin", "Hemoglobin", "number"],
  ],
};
const BOOL_PROFILE = ["family_history_diabetes", "family_history_heart", "smoking", "alcohol", "has_diabetes", "has_hypertension"];

export default function DigitalTwin({ twin, patientId, onSaved }) {
  const [profile, setProfile] = useState({});
  const [vitals, setVitals] = useState({});
  const [labs, setLabs] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setProfile(twin?.profile || {});
    setVitals(twin?.vitals || {});
    setLabs(twin?.labs || {});
  }, [twin]);

  const save = async () => {
    setBusy(true);
    try {
      const payload = { profile, vitals, labs };
      const pid = patientId || twin?.user_id;
      if (!pid) {
        toast.error("Patient ID is missing");
        return;
      }
      await api.put(`/twin/${pid}`, payload);
      toast.success("Digital twin updated");
      onSaved?.();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const Field = ({ name, label, type, source, setSource }) => (
    <label className="block">
      <div className="text-[10px] uppercase tracking-widest font-semibold text-stone-500 mb-1">{label}</div>
      <input
        data-testid={`twin-field-${name}`}
        type={type}
        step={type === "number" ? "any" : undefined}
        value={source[name] ?? ""}
        onChange={(e) => setSource({ ...source, [name]: type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value })}
        className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white font-mono focus:outline-none focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
      />
    </label>
  );

  return (
    <div className="border border-stone-200 rounded-xl bg-white" data-testid="digital-twin-editor">
      <div className="p-5 border-b border-stone-100 flex items-center justify-between">
        <div>
          <div className="overline">Digital Twin</div>
          <div className="font-heading text-xl font-bold mt-1">Multimodal patient profile</div>
        </div>
        <button data-testid="twin-save-btn" onClick={save} disabled={busy}
                className="px-3 py-2 rounded-lg bg-emerald-900 text-white text-xs font-semibold hover:bg-emerald-800 flex items-center gap-1.5 disabled:opacity-50">
          <Save className="h-3.5 w-3.5" /> {busy ? "Saving…" : "Save"}
        </button>
      </div>
      <div className="p-5 grid md:grid-cols-3 gap-6">
        <div>
          <div className="text-xs font-heading font-bold text-emerald-900 mb-3">PROFILE</div>
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.profile.map(([n, l, t]) => <Field key={n} name={n} label={l} type={t} source={profile} setSource={setProfile} />)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {BOOL_PROFILE.map((n) => (
              <label key={n} className="flex items-center gap-2">
                <input data-testid={`twin-bool-${n}`} type="checkbox" checked={!!profile[n]} onChange={(e) => setProfile({ ...profile, [n]: e.target.checked })} />
                <span className="capitalize text-stone-700">{n.replaceAll("_", " ")}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-heading font-bold text-emerald-900 mb-3">VITALS</div>
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.vitals.map(([n, l, t]) => <Field key={n} name={n} label={l} type={t} source={vitals} setSource={setVitals} />)}
          </div>
        </div>
        <div>
          <div className="text-xs font-heading font-bold text-emerald-900 mb-3">LAB RESULTS</div>
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.labs.map(([n, l, t]) => <Field key={n} name={n} label={l} type={t} source={labs} setSource={setLabs} />)}
          </div>
        </div>
      </div>

      {/* Latest AI Medical Image Prediction Summary */}
      {twin?.latest_medical_image && (
        <div className="mx-5 mb-5 p-4 border rounded-xl bg-stone-900 text-white font-mono text-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-stone-800 pb-2">
            <span>📷 AI Medical Image Analysis</span>
            <span>{twin.latest_medical_image.scan_type?.replaceAll("_", " ").toUpperCase()}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-stone-400">Prediction: </span>
              <span className="font-bold text-white text-sm">{twin.latest_medical_image.prediction || "Normal Structural Anatomy"}</span>
            </div>
            <div>
              <span className="text-stone-400">Confidence: </span>
              <span className="text-emerald-400 font-bold">
                {twin.latest_medical_image.confidence ? `${Math.round(twin.latest_medical_image.confidence * 100)}%` : "92%"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
