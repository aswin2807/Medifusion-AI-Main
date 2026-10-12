import React, { useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { UserPlus, X, Copy } from "lucide-react";

const GENDERS = ["male", "female", "other"];
const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function InvitePatientModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ email: "", full_name: "", password: "", age: "", gender: "", blood_group: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [autoPw, setAutoPw] = useState(false);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        email: form.email, full_name: form.full_name,
        password: autoPw || !form.password ? undefined : form.password,
        age: form.age === "" ? undefined : Number(form.age),
        gender: form.gender || undefined,
        blood_group: form.blood_group || undefined,
        phone: form.phone || undefined,
      };
      const r = await api.post("/doctor/invite-patient", payload);
      setResult(r.data);
      toast.success("Patient account created");
      onCreated?.(r.data.patient);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invite failed");
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setResult(null);
    setForm({ email: "", full_name: "", password: "", age: "", gender: "", blood_group: "", phone: "" });
    setAutoPw(false);
    onClose?.();
  };

  const copy = (txt) => { navigator.clipboard?.writeText(txt); toast.success("Copied"); };

  const inp = "w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-emerald-900";
  const lbl = "text-[10px] uppercase tracking-widest font-semibold text-stone-500 mb-1";

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/50 grid place-items-center p-4" data-testid="invite-patient-modal">
      <div className="bg-white rounded-xl border border-stone-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <div className="overline">Doctor invite</div>
            <div className="font-heading text-xl font-bold mt-1">Create a patient account</div>
          </div>
          <button data-testid="invite-close-btn" onClick={close} className="p-1 rounded-lg hover:bg-stone-100"><X className="h-4 w-4" /></button>
        </div>
        {!result ? (
          <form onSubmit={submit} className="p-5 grid grid-cols-2 gap-3" data-testid="invite-patient-form">
            <label className="col-span-2 block"><div className={lbl}>Full name</div>
              <input data-testid="invite-name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inp} /></label>
            <label className="col-span-2 block"><div className={lbl}>Email</div>
              <input data-testid="invite-email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} /></label>
            <label className="col-span-2 block">
              <div className="flex items-center justify-between mb-1">
                <div className={lbl}>Password</div>
                <label className="text-[10px] font-mono text-stone-500 flex items-center gap-1">
                  <input data-testid="invite-autopw" type="checkbox" checked={autoPw} onChange={(e) => setAutoPw(e.target.checked)} /> auto-generate
                </label>
              </div>
              <input data-testid="invite-password" type="text" minLength={autoPw ? 0 : 6} required={!autoPw} disabled={autoPw}
                     placeholder={autoPw ? "will be generated" : "min 6 characters"}
                     value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inp + " disabled:bg-stone-50"} />
            </label>
            <label><div className={lbl}>Age</div>
              <input data-testid="invite-age" type="number" min="0" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className={inp} /></label>
            <label><div className={lbl}>Gender</div>
              <select data-testid="invite-gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inp}>
                <option value="">—</option>{GENDERS.map(g => <option key={g}>{g}</option>)}
              </select></label>
            <label><div className={lbl}>Blood group</div>
              <select data-testid="invite-blood" value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} className={inp}>
                <option value="">—</option>{BLOOD.map(b => <option key={b}>{b}</option>)}
              </select></label>
            <label><div className={lbl}>Phone (optional)</div>
              <input data-testid="invite-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} /></label>
            <button data-testid="invite-submit-btn" disabled={busy} className="col-span-2 mt-2 py-2.5 rounded-lg bg-emerald-900 text-white font-semibold hover:bg-emerald-800 disabled:opacity-60 flex items-center justify-center gap-2">
              <UserPlus className="h-4 w-4" /> {busy ? "Creating…" : "Create patient"}
            </button>
          </form>
        ) : (
          <div className="p-5" data-testid="invite-result">
            <div className="text-sm text-stone-700 mb-3">
              {result.password_was_custom
                ? "Account created with the password you chose. Share it with the patient."
                : "Account created. Share this auto-generated temp password — the patient will be prompted to reset it on first login."}
            </div>
            <div className="p-3 bg-stone-100 rounded-lg text-xs font-mono space-y-2">
              <div className="flex items-center justify-between"><span>email</span><span className="font-semibold">{result.patient.email}</span></div>
              <div className="flex items-center justify-between gap-2">
                <span>password</span>
                <span className="font-semibold text-emerald-900 flex items-center gap-2">
                  {result.temp_password}
                  <button data-testid="invite-copy-btn" onClick={() => copy(result.temp_password)}><Copy className="h-3 w-3" /></button>
                </span>
              </div>
            </div>
            <button data-testid="invite-done-btn" onClick={close} className="mt-4 w-full py-2.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-sm font-semibold">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
