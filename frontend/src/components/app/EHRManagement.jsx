import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { FileText, Pill, Syringe, AlertTriangle, Activity, Plus, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function EHRManagement({ patientId, isDoctor = false }) {
  const [ehr, setEhr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("prescriptions");
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState("prescription"); // prescription | vaccination | allergy | surgery

  // Form states
  const [rxForm, setRxForm] = useState({ medication_name: "", dosage: "", frequency: "", start_date: "", prescribed_by: "Dr. System" });
  const [vaxForm, setVaxForm] = useState({ vaccine_name: "", date_administered: "", batch_no: "" });
  const [allergyForm, setAllergyForm] = useState({ allergen: "", severity: "mild", reaction: "" });
  const [surgeryForm, setSurgeryForm] = useState({ procedure_name: "", date: "", hospital: "", surgeon: "", notes: "" });

  const fetchEhr = async () => {
    try {
      const r = await api.get(`/ehr/${patientId}`);
      setEhr(r.data);
    } catch (err) {
      toast.error("Failed to load EHR record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchEhr();
  }, [patientId]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === "prescription") {
        await api.post(`/ehr/prescription?patient_id=${patientId}`, rxForm);
        toast.success("Prescription added");
      } else if (modalType === "vaccination") {
        await api.post(`/ehr/vaccination?patient_id=${patientId}`, vaxForm);
        toast.success("Vaccination record added");
      } else if (modalType === "allergy") {
        await api.post(`/ehr/allergy?patient_id=${patientId}`, allergyForm);
        toast.success("Allergy record added");
      } else if (modalType === "surgery") {
        await api.post(`/ehr/surgery?patient_id=${patientId}`, surgeryForm);
        toast.success("Surgery record added");
      }
      setShowAddModal(false);
      fetchEhr();
    } catch (err) {
      toast.error("Failed to save EHR entry");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-stone-500 font-mono text-sm">Loading EHR records...</div>;
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm" data-testid="ehr-management">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-stone-100">
        <div>
          <div className="overline text-emerald-800 flex items-center gap-1.5 font-bold">
            <FileText className="h-4 w-4" /> Module 8: Electronic Health Record
          </div>
          <h2 className="text-xl font-bold font-heading text-stone-900 mt-1">Centralized Digital Patient Record</h2>
        </div>
        <button
          onClick={() => { setModalType(activeTab === "allergies" ? "allergy" : activeTab === "vaccinations" ? "vaccination" : activeTab === "surgeries" ? "surgery" : "prescription"); setShowAddModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-900 text-white text-xs font-semibold hover:bg-emerald-800 transition"
        >
          <Plus className="h-3.5 w-3.5" /> Add Entry
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-stone-100 pb-2 overflow-x-auto">
        {[
          { id: "prescriptions", label: "Prescriptions", icon: Pill, count: ehr?.prescriptions?.length || 0 },
          { id: "vaccinations", label: "Vaccinations", icon: Syringe, count: ehr?.vaccinations?.length || 0 },
          { id: "allergies", label: "Allergies", icon: AlertTriangle, count: ehr?.allergies_detailed?.length || 0 },
          { id: "surgeries", label: "Surgical History", icon: Activity, count: ehr?.surgeries_detailed?.length || 0 },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                isActive ? "bg-emerald-900 text-white shadow-sm" : "bg-stone-50 text-stone-600 hover:bg-stone-100"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? "bg-emerald-800 text-white" : "bg-stone-200 text-stone-700"}`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === "prescriptions" && (
        <div className="grid md:grid-cols-2 gap-3">
          {ehr?.prescriptions?.length === 0 ? (
            <div className="col-span-2 p-8 text-center text-stone-400 text-xs font-mono">No active prescriptions recorded.</div>
          ) : (
            ehr?.prescriptions?.map((p, idx) => (
              <div key={p.id || idx} className="p-4 border border-stone-200 rounded-lg bg-stone-50/50">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <Pill className="h-4 w-4 text-emerald-800" /> {p.medication_name}
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] font-bold font-mono">Active</span>
                </div>
                <div className="text-xs text-stone-600 mt-2 space-y-1">
                  <div><span className="font-semibold text-stone-700">Dosage:</span> {p.dosage} — {p.frequency}</div>
                  <div><span className="font-semibold text-stone-700">Start Date:</span> {p.start_date}</div>
                  <div><span className="font-semibold text-stone-700">Prescribed by:</span> {p.prescribed_by}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "vaccinations" && (
        <div className="grid md:grid-cols-2 gap-3">
          {ehr?.vaccinations?.length === 0 ? (
            <div className="col-span-2 p-8 text-center text-stone-400 text-xs font-mono">No vaccination records.</div>
          ) : (
            ehr?.vaccinations?.map((v, idx) => (
              <div key={v.id || idx} className="p-4 border border-stone-200 rounded-lg bg-stone-50/50 flex items-start justify-between">
                <div>
                  <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <Syringe className="h-4 w-4 text-blue-700" /> {v.vaccine_name}
                  </div>
                  <div className="text-xs text-stone-600 mt-2 space-y-1">
                    <div><span className="font-semibold">Administered:</span> {v.date_administered}</div>
                    {v.batch_no && <div><span className="font-semibold">Batch No:</span> {v.batch_no}</div>}
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "allergies" && (
        <div className="grid md:grid-cols-2 gap-3">
          {ehr?.allergies_detailed?.length === 0 ? (
            <div className="col-span-2 p-8 text-center text-stone-400 text-xs font-mono">No known drug/food allergies recorded.</div>
          ) : (
            ehr?.allergies_detailed?.map((a, idx) => (
              <div key={a.id || idx} className="p-4 border border-amber-200 bg-amber-50/40 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-amber-700" /> {a.allergen}
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold uppercase">{a.severity}</span>
                </div>
                <div className="text-xs text-amber-900 mt-2 font-mono">Reaction: {a.reaction}</div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "surgeries" && (
        <div className="grid md:grid-cols-2 gap-3">
          {ehr?.surgeries_detailed?.length === 0 ? (
            <div className="col-span-2 p-8 text-center text-stone-400 text-xs font-mono">No past surgical procedures recorded.</div>
          ) : (
            ehr?.surgeries_detailed?.map((s, idx) => (
              <div key={s.id || idx} className="p-4 border border-stone-200 rounded-lg bg-stone-50/50">
                <div className="font-bold text-stone-900 text-sm">{s.procedure_name}</div>
                <div className="text-xs text-stone-600 mt-2 space-y-1">
                  <div><span className="font-semibold">Date:</span> {s.date}</div>
                  <div><span className="font-semibold">Surgeon & Hospital:</span> {s.surgeon} ({s.hospital})</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm grid place-items-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <h3 className="font-bold font-heading text-lg mb-4 text-stone-900 capitalize">Add {modalType}</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              {modalType === "prescription" && (
                <>
                  <input required placeholder="Medication Name (e.g. Metformin)" value={rxForm.medication_name} onChange={(e) => setRxForm({ ...rxForm, medication_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-xs" />
                  <input required placeholder="Dosage (e.g. 500mg)" value={rxForm.dosage} onChange={(e) => setRxForm({ ...rxForm, dosage: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-xs" />
                  <input required placeholder="Frequency (e.g. Twice daily)" value={rxForm.frequency} onChange={(e) => setRxForm({ ...rxForm, frequency: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-xs" />
                  <input required type="date" value={rxForm.start_date} onChange={(e) => setRxForm({ ...rxForm, start_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-xs" />
                </>
              )}
              {modalType === "vaccination" && (
                <>
                  <input required placeholder="Vaccine Name" value={vaxForm.vaccine_name} onChange={(e) => setVaxForm({ ...vaxForm, vaccine_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-xs" />
                  <input required type="date" value={vaxForm.date_administered} onChange={(e) => setVaxForm({ ...vaxForm, date_administered: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-xs" />
                  <input placeholder="Batch Number (optional)" value={vaxForm.batch_no} onChange={(e) => setVaxForm({ ...vaxForm, batch_no: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-xs" />
                </>
              )}
              {modalType === "allergy" && (
                <>
                  <input required placeholder="Allergen (e.g. Penicillin)" value={allergyForm.allergen} onChange={(e) => setAllergyForm({ ...allergyForm, allergen: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-xs" />
                  <select value={allergyForm.severity} onChange={(e) => setAllergyForm({ ...allergyForm, severity: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-xs">
                    <option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option>
                  </select>
                  <input required placeholder="Reaction (e.g. Hives, Anaphylaxis)" value={allergyForm.reaction} onChange={(e) => setAllergyForm({ ...allergyForm, reaction: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-xs" />
                </>
              )}
              {modalType === "surgery" && (
                <>
                  <input required placeholder="Procedure Name" value={surgeryForm.procedure_name} onChange={(e) => setSurgeryForm({ ...surgeryForm, procedure_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-xs" />
                  <input required type="date" value={surgeryForm.date} onChange={(e) => setSurgeryForm({ ...surgeryForm, date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-xs" />
                  <input required placeholder="Hospital" value={surgeryForm.hospital} onChange={(e) => setSurgeryForm({ ...surgeryForm, hospital: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-xs" />
                  <input required placeholder="Surgeon Name" value={surgeryForm.surgeon} onChange={(e) => setSurgeryForm({ ...surgeryForm, surgeon: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-xs" />
                </>
              )}
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 rounded text-xs font-semibold text-stone-600 bg-stone-100">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded text-xs font-semibold text-white bg-emerald-900">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
