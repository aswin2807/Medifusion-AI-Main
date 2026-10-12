import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import AppShell from "@/components/app/AppShell";
import HospitalAnalytics from "@/components/app/HospitalAnalytics";
import { toast } from "sonner";
import { Users, Stethoscope, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [doctorRegistrations, setDoctorRegistrations] = useState([]);
  const [clinicalRegistrations, setClinicalRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(null);

  const loadAll = async () => {
    try {
      const uRes = await api.get("/patients").catch(() => ({ data: [] }));
      setUsers(uRes.data || []);

      const dRes = await api.get("/admin/doctors/registrations").catch(() => ({ data: [] }));
      setDoctorRegistrations(dRes.data || []);

      const cRes = await api.get("/admin/clinical/registrations").catch(() => ({ data: [] }));
      setClinicalRegistrations(cRes.data || []);
    } catch (e) {
      toast.error("Failed to load admin governance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // Doctor governance actions
  const approveDoctor = async (id, name) => {
    setActionBusy(id);
    try {
      await api.put(`/admin/doctors/${id}/approve`);
      toast.success(`Approved doctor registration for ${name}`);
      loadAll();
    } catch (e) {
      toast.error("Failed to approve doctor registration");
    } finally {
      setActionBusy(null);
    }
  };

  const rejectDoctor = async (id, name) => {
    setActionBusy(id);
    try {
      await api.put(`/admin/doctors/${id}/reject`);
      toast.warning(`Rejected doctor registration for ${name}`);
      loadAll();
    } catch (e) {
      toast.error("Failed to reject doctor registration");
    } finally {
      setActionBusy(null);
    }
  };

  // Clinical governance actions
  const approveClinical = async (id, name) => {
    setActionBusy(id);
    try {
      await api.put(`/admin/clinical/${id}/approve`);
      toast.success(`Approved clinical access for ${name}`);
      loadAll();
    } catch (e) {
      toast.error("Failed to approve clinical registration");
    } finally {
      setActionBusy(null);
    }
  };

  const rejectClinical = async (id, name) => {
    setActionBusy(id);
    try {
      await api.put(`/admin/clinical/${id}/reject`);
      toast.warning(`Rejected clinical registration for ${name}`);
      loadAll();
    } catch (e) {
      toast.error("Failed to reject clinical registration");
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <AppShell title="System Governance & Analytics" subtitle="Admin · Hospital Operations Console">
      <div className="space-y-8">
        {/* Module 15: Hospital Analytics Dashboard */}
        <HospitalAnalytics />

        {/* SECTION 1: DOCTOR MANAGEMENT */}
        <div className="border border-stone-200 rounded-xl bg-white shadow-sm" data-testid="doctor-management-table">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="overline text-blue-800 flex items-center gap-1 font-bold">
                <Stethoscope className="h-4 w-4 text-blue-800" /> Medical Staff Governance
              </div>
              <div className="font-heading text-xl font-bold text-stone-900 mt-1">Doctor Management & Medical Verification</div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-mono font-bold border border-blue-200">
              {doctorRegistrations.filter(d => d.verification_status === "pending").length} Pending Doctors
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-[10px] uppercase tracking-widest font-semibold text-stone-500 bg-stone-50">
                  <th className="py-3 px-4">Doctor Name</th>
                  <th className="py-3 px-4">Medical Registration #</th>
                  <th className="py-3 px-4">Specialization & Dept</th>
                  <th className="py-3 px-4">Hospital Name</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs font-mono">
                {loading ? (
                  <tr><td colSpan={7} className="p-5 text-stone-400">Loading doctor registrations...</td></tr>
                ) : doctorRegistrations.length === 0 ? (
                  <tr><td colSpan={7} className="p-5 text-stone-400">No doctor registrations found.</td></tr>
                ) : (
                  doctorRegistrations.map((d) => {
                    const status = d.verification_status || "approved";
                    const prof = d.doctor_profile || {};
                    return (
                      <tr key={d.id} className="hover:bg-stone-50/50 transition" data-testid={`doctor-row-${d.id}`}>
                        <td className="py-3.5 px-4 font-sans font-bold text-stone-900">
                          <div>{d.full_name}</div>
                          <div className="text-[10px] text-stone-400 font-mono font-normal">{d.email}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-stone-700">
                          {prof.medical_registration_number || "MED-REG-DEFAULT"}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 font-sans">
                          <div className="font-semibold text-stone-800">{prof.specialization || "General Medicine"}</div>
                          <div className="text-[10px] text-stone-500">{prof.department || "Cardiology"}</div>
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 font-sans">
                          {prof.hospital_name || "HealthTwin Hospital"}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600">
                          {prof.years_of_experience ?? 10} yrs
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            status === "approved" ? "bg-emerald-100 text-emerald-900 border border-emerald-200" :
                            status === "rejected" ? "bg-rose-100 text-rose-900 border border-rose-200" :
                            "bg-amber-100 text-amber-900 border border-amber-200 animate-pulse"
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {status !== "approved" && (
                              <button onClick={() => approveDoctor(d.id, d.full_name)} disabled={actionBusy === d.id}
                                      className="px-2.5 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded text-[11px] font-bold font-sans flex items-center gap-1 transition">
                                <CheckCircle2 className="h-3 w-3" /> Approve Doctor
                              </button>
                            )}
                            {status !== "rejected" && (
                              <button onClick={() => rejectDoctor(d.id, d.full_name)} disabled={actionBusy === d.id}
                                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded text-[11px] font-bold font-sans flex items-center gap-1 transition">
                                <XCircle className="h-3 w-3 text-rose-700" /> Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: CLINICAL MANAGEMENT */}
        <div className="border border-stone-200 rounded-xl bg-white shadow-sm" data-testid="clinical-management-table">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="overline text-purple-800 flex items-center gap-1 font-bold">
                <ShieldAlert className="h-4 w-4 text-purple-800" /> Clinical Operations
              </div>
              <div className="font-heading text-xl font-bold text-stone-900 mt-1">Clinical Management & License Approval</div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-mono font-bold border border-purple-200">
              {clinicalRegistrations.filter(c => c.verification_status === "pending").length} Pending Clinical Users
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-100 text-[10px] uppercase tracking-widest font-semibold text-stone-500 bg-stone-50">
                  <th className="py-3 px-4">Clinical User Name</th>
                  <th className="py-3 px-4">Clinical License #</th>
                  <th className="py-3 px-4">Specialization & Dept</th>
                  <th className="py-3 px-4">Hospital / Clinic</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs font-mono">
                {loading ? (
                  <tr><td colSpan={7} className="p-5 text-stone-400">Loading clinical registrations...</td></tr>
                ) : clinicalRegistrations.length === 0 ? (
                  <tr><td colSpan={7} className="p-5 text-stone-400">No clinical registrations found.</td></tr>
                ) : (
                  clinicalRegistrations.map((c) => {
                    const status = c.verification_status || "approved";
                    const prof = c.clinical_profile || {};
                    return (
                      <tr key={c.id} className="hover:bg-stone-50/50 transition" data-testid={`clinical-row-${c.id}`}>
                        <td className="py-3.5 px-4 font-sans font-bold text-stone-900">
                          <div>{c.full_name}</div>
                          <div className="text-[10px] text-stone-400 font-mono font-normal">{c.email}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-stone-700">
                          {prof.clinical_registration_number || "CLN-LIC-DEFAULT"}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 font-sans">
                          <div className="font-semibold text-stone-800">{prof.specialization || "Clinical Diagnostics"}</div>
                          <div className="text-[10px] text-stone-500">{prof.department || "Internal Medicine"}</div>
                        </td>
                        <td className="py-3.5 px-4 text-stone-600 font-sans">
                          {prof.hospital_name || "HealthTwin Medical Center"}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600">
                          {prof.years_of_experience ?? 8} yrs
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            status === "approved" ? "bg-emerald-100 text-emerald-900 border border-emerald-200" :
                            status === "rejected" ? "bg-rose-100 text-rose-900 border border-rose-200" :
                            "bg-amber-100 text-amber-900 border border-amber-200 animate-pulse"
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {status !== "approved" && (
                              <button onClick={() => approveClinical(c.id, c.full_name)} disabled={actionBusy === c.id}
                                      className="px-2.5 py-1 bg-purple-900 hover:bg-purple-800 text-white rounded text-[11px] font-bold font-sans flex items-center gap-1 transition">
                                <CheckCircle2 className="h-3 w-3" /> Approve Clinical User
                              </button>
                            )}
                            {status !== "rejected" && (
                              <button onClick={() => rejectClinical(c.id, c.full_name)} disabled={actionBusy === c.id}
                                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded text-[11px] font-bold font-sans flex items-center gap-1 transition">
                                <XCircle className="h-3 w-3 text-rose-700" /> Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: PATIENT & ACCOUNT DIRECTORY */}
        <div className="border border-stone-200 rounded-xl bg-white shadow-sm" data-testid="users-table">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <div className="overline">Security & User Directory</div>
              <div className="font-heading text-xl font-bold text-stone-900 mt-1">Patient Management & System Accounts</div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-mono font-bold">
              {users.length} Active Accounts
            </span>
          </div>

          <div className="grid grid-cols-12 px-5 py-3 border-b border-stone-100 text-[10px] uppercase tracking-widest font-semibold text-stone-500 bg-stone-50">
            <div className="col-span-4">Full Name</div>
            <div className="col-span-4">Email Address</div>
            <div className="col-span-2">System Role</div>
            <div className="col-span-2 text-right">Account Status</div>
          </div>

          {loading ? (
            <div className="p-5 text-xs font-mono text-stone-400">Loading accounts...</div>
          ) : users.length === 0 ? (
            <div className="p-5 text-xs font-mono text-stone-400">No accounts in directory.</div>
          ) : (
            users.map((u) => (
              <div key={u.id} className="grid grid-cols-12 px-5 py-3 border-b border-stone-100 items-center hover:bg-stone-50/50" data-testid={`user-row-${u.id}`}>
                <div className="col-span-4 text-sm font-semibold text-stone-900">{u.full_name}</div>
                <div className="col-span-4 text-xs font-mono text-stone-600 truncate">{u.email}</div>
                <div className="col-span-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    u.role === "patient" ? "bg-emerald-100 text-emerald-900" :
                    u.role === "doctor" ? "bg-blue-100 text-blue-900" :
                    u.role === "clinical" ? "bg-purple-100 text-purple-900" :
                    "bg-amber-100 text-amber-900"
                  }`}>{u.role}</span>
                </div>
                <div className="col-span-2 text-right text-xs font-mono font-bold text-emerald-700">
                  Active
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
