import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Activity, User, Stethoscope, ShieldAlert, ArrowRight } from "lucide-react";

export default function Login() {
  const { loginPatient, loginDoctor, loginClinical } = useAuth();
  const nav = useNavigate();

  // Separate states for each login card
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPassword, setPatientPassword] = useState("");
  const [patientBusy, setPatientBusy] = useState(false);

  const [doctorEmail, setDoctorEmail] = useState("");
  const [doctorPassword, setDoctorPassword] = useState("");
  const [doctorBusy, setDoctorBusy] = useState(false);

  const [clinicalEmail, setClinicalEmail] = useState("");
  const [clinicalPassword, setClinicalPassword] = useState("");
  const [clinicalBusy, setClinicalBusy] = useState(false);

  // Helper error handler
  const handleAuthError = (err, defaultMsg) => {
    const detail = err?.response?.data?.detail;
    const status = err?.response?.status;
    if (status === 0 || err?.code === "ERR_NETWORK" || err?.message === "Network Error") {
      return "Cannot reach backend server. Check REACT_APP_BACKEND_URL in frontend/.env.";
    }
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map(e => e?.msg || JSON.stringify(e)).join("; ");
    return err?.message || defaultMsg;
  };

  const submitPatient = async (e) => {
    e.preventDefault();
    setPatientBusy(true);
    try {
      const u = await loginPatient(patientEmail, patientPassword);
      toast.success(`Welcome back, ${u.full_name}`);
      nav(u.role === "admin" ? "/admin/dashboard" : "/patient/dashboard");
    } catch (err) {
      toast.error(handleAuthError(err, "Invalid patient credentials"));
    } finally {
      setPatientBusy(false);
    }
  };

  const submitDoctor = async (e) => {
    e.preventDefault();
    setDoctorBusy(true);
    try {
      const u = await loginDoctor(doctorEmail, doctorPassword);
      toast.success(`Welcome back, Dr. ${u.full_name}`);
      nav("/doctor/dashboard");
    } catch (err) {
      toast.error(handleAuthError(err, "Invalid doctor credentials"));
    } finally {
      setDoctorBusy(false);
    }
  };

  const submitClinical = async (e) => {
    e.preventDefault();
    setClinicalBusy(true);
    try {
      const u = await loginClinical(clinicalEmail, clinicalPassword);
      toast.success(`Welcome back, ${u.full_name}`);
      nav("/clinical/dashboard");
    } catch (err) {
      toast.error(handleAuthError(err, "Invalid clinical credentials"));
    } finally {
      setClinicalBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-between py-10 px-4 md:px-8" data-testid="login-page">
      {/* Header */}
      <div className="max-w-7xl mx-auto w-full mb-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-emerald-900 grid place-items-center text-white shadow">
            <Activity className="h-5 w-5" />
          </div>
          <div className="font-heading font-black text-xl text-stone-900">
            HealthTwin<span className="text-emerald-800">.AI</span>
          </div>
        </Link>
        <div className="text-xs text-stone-500 font-medium">
          Select your login category card below to proceed
        </div>
      </div>

      {/* Main 3-Column Login Cards Grid */}
      <div className="max-w-7xl mx-auto w-full my-auto">
        <div className="text-center mb-10">
          <div className="overline text-emerald-800 font-bold mb-1">Unified Health Portal</div>
          <h1 className="font-heading text-3xl font-extrabold text-stone-900">Sign in to HealthTwin.AI</h1>
          <p className="text-sm text-stone-500 mt-1">Choose your respective user tier column below to authenticate.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch" data-testid="login-cards-grid">
          
          {/* CARD 1: PATIENT */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between" data-testid="card-patient-login">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-wider">
                  PATIENT
                </span>
                <User className="h-5 w-5 text-emerald-800" />
              </div>
              <h2 className="font-heading text-xl font-bold text-stone-900 mb-1">Patient Login</h2>
              <p className="text-xs text-stone-500 mb-6">Manage your digital twin, labs, risk reports & pharmacy.</p>

              <form onSubmit={submitPatient} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Email</label>
                  <input
                    data-testid="patient-login-email"
                    required
                    type="email"
                    placeholder="patient@demo.com"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-xs bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
                  <input
                    data-testid="patient-login-password"
                    required
                    type="password"
                    placeholder="••••••••"
                    value={patientPassword}
                    onChange={(e) => setPatientPassword(e.target.value)}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-xs bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-900"
                  />
                </div>

                <button
                  data-testid="patient-login-submit"
                  disabled={patientBusy}
                  className="w-full py-2.5 rounded-lg bg-emerald-900 text-white font-semibold text-xs hover:bg-emerald-800 disabled:opacity-60 transition"
                >
                  {patientBusy ? "Signing in…" : "Login as Patient"}
                </button>
              </form>
            </div>

            <div className="pt-6 border-t border-stone-100 mt-6 text-center">
              <span className="text-xs text-stone-500">Need a patient profile? </span>
              <Link to="/register?role=patient" className="text-xs font-bold text-emerald-900 hover:underline">
                Create Account
              </Link>
            </div>
          </div>

          {/* CARD 2: DOCTOR */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between" data-testid="card-doctor-login">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-black uppercase tracking-wider">
                  DOCTOR
                </span>
                <Stethoscope className="h-5 w-5 text-blue-800" />
              </div>
              <h2 className="font-heading text-xl font-bold text-stone-900 mb-1">Doctor Login</h2>
              <p className="text-xs text-stone-500 mb-6">Patient roster, medical diagnostics & clinical decision support.</p>

              <form onSubmit={submitDoctor} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Email</label>
                  <input
                    data-testid="doctor-login-email"
                    required
                    type="email"
                    placeholder="dr.rao@healthtwin.ai"
                    value={doctorEmail}
                    onChange={(e) => setDoctorEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-xs bg-stone-50 focus:bg-white focus:outline-none focus:border-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
                  <input
                    data-testid="doctor-login-password"
                    required
                    type="password"
                    placeholder="••••••••"
                    value={doctorPassword}
                    onChange={(e) => setDoctorPassword(e.target.value)}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-xs bg-stone-50 focus:bg-white focus:outline-none focus:border-blue-900"
                  />
                </div>

                <button
                  data-testid="doctor-login-submit"
                  disabled={doctorBusy}
                  className="w-full py-2.5 rounded-lg bg-blue-900 text-white font-semibold text-xs hover:bg-blue-800 disabled:opacity-60 transition"
                >
                  {doctorBusy ? "Signing in…" : "Login as Doctor"}
                </button>
              </form>
            </div>

            <div className="pt-6 border-t border-stone-100 mt-6 text-center">
              <span className="text-xs text-stone-500">Need doctor access? </span>
              <Link to="/register?role=doctor" className="text-xs font-bold text-blue-900 hover:underline">
                Create Account
              </Link>
            </div>
          </div>

          {/* CARD 3: CLINICAL */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between" data-testid="card-clinical-login">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-black uppercase tracking-wider">
                  CLINICAL
                </span>
                <ShieldAlert className="h-5 w-5 text-purple-800" />
              </div>
              <h2 className="font-heading text-xl font-bold text-stone-900 mb-1">Clinical Login</h2>
              <p className="text-xs text-stone-500 mb-6">Clinical monitoring, lab evaluation & medical documentation.</p>

              <form onSubmit={submitClinical} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Email</label>
                  <input
                    data-testid="clinical-login-email"
                    required
                    type="email"
                    placeholder="clinical@hospital.org"
                    value={clinicalEmail}
                    onChange={(e) => setClinicalEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-xs bg-stone-50 focus:bg-white focus:outline-none focus:border-purple-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
                  <input
                    data-testid="clinical-login-password"
                    required
                    type="password"
                    placeholder="••••••••"
                    value={clinicalPassword}
                    onChange={(e) => setClinicalPassword(e.target.value)}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-xs bg-stone-50 focus:bg-white focus:outline-none focus:border-purple-900"
                  />
                </div>

                <button
                  data-testid="clinical-login-submit"
                  disabled={clinicalBusy}
                  className="w-full py-2.5 rounded-lg bg-purple-900 text-white font-semibold text-xs hover:bg-purple-800 disabled:opacity-60 transition"
                >
                  {clinicalBusy ? "Signing in…" : "Login as Clinical User"}
                </button>
              </form>
            </div>

            <div className="pt-6 border-t border-stone-100 mt-6 text-center">
              <span className="text-xs text-stone-500">Need clinical license access? </span>
              <Link to="/register?role=clinical" className="text-xs font-bold text-purple-900 hover:underline">
                Create Account
              </Link>
            </div>
          </div>

        </div>

        {/* System Admin Notice */}
        <div className="mt-8 text-center text-xs text-stone-500">
          Hospital Administrator? Sign in with patient card or <Link to="/login" onClick={(e) => {
            e.preventDefault();
            setPatientEmail("admin@healthtwin.ai");
            setPatientPassword("Admin@123");
          }} className="underline text-stone-700 font-bold">Autofill Admin Credentials</Link>.
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full text-center text-[11px] text-stone-400 mt-6">
        © HealthTwin.AI — Explainable Digital Twin & Clinical Intelligence Platform
      </div>
    </div>
  );
}
