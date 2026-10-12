import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { Activity, KeyRound } from "lucide-react";

export default function ResetPassword() {
  const nav = useNavigate();
  const [stage, setStage] = useState("request"); // request | confirm
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const requestToken = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.post("/auth/password-reset/request", { email });
      if (r.data.reset_token) {
        setToken(r.data.reset_token);
        toast.success("Reset token generated");
        setStage("confirm");
      } else {
        toast.success("If the email is registered, a reset token has been generated.");
        setStage("confirm");
      }
    } catch (err) {
      const d = err?.response?.data?.detail;
      const s = err?.response?.status;
      let msg;
      if (s === 404 || d === "Not Found") {
        msg = "Reset endpoint not found (404). Rebuild the frontend and confirm the backend is up-to-date.";
      } else if (s === 0 || err?.code === "ERR_NETWORK" || err?.message === "Network Error") {
        msg = "Cannot reach the backend. Check REACT_APP_BACKEND_URL.";
      } else if (typeof d === "string") {
        msg = d;
      } else if (Array.isArray(d)) {
        msg = d.map(e => e?.msg || JSON.stringify(e)).join("; ");
      } else {
        msg = err?.message || "Request failed";
      }
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const confirmReset = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/password-reset/confirm", { token, new_password: password });
      toast.success("Password updated — sign in with your new password");
      nav("/login");
    } catch (err) {
      const d = err?.response?.data?.detail;
      const msg = typeof d === "string" ? d
        : Array.isArray(d) ? d.map(e => e?.msg || JSON.stringify(e)).join("; ")
        : err?.message || "Reset failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-stone-50 p-8" data-testid="reset-password-page">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-md bg-emerald-900 grid place-items-center text-white"><Activity className="h-4 w-4" /></div>
          <div className="font-heading font-black text-lg">HealthTwin<span className="text-emerald-800">.AI</span></div>
        </Link>
        <div className="overline mb-2 flex items-center gap-2"><KeyRound className="h-3 w-3" /> Password reset</div>
        <h1 className="font-heading text-3xl font-bold mb-6">{stage === "request" ? "Recover access" : "Set a new password"}</h1>

        {stage === "request" ? (
          <form onSubmit={requestToken} data-testid="reset-request-form">
            <label className="block text-xs font-semibold text-stone-600 mb-1">Email</label>
            <input data-testid="reset-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                   className="w-full px-3 py-2.5 border border-stone-200 rounded-lg mb-6 bg-white focus:outline-none focus:border-emerald-900" />
            <button data-testid="reset-request-btn" disabled={busy} className="w-full py-2.5 rounded-lg bg-emerald-900 text-white font-semibold hover:bg-emerald-800 disabled:opacity-60">
              {busy ? "Generating…" : "Get reset token"}
            </button>
            <div className="text-xs text-stone-500 mt-4 text-center">
              <Link to="/login" className="text-emerald-900 font-semibold">Back to sign in</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={confirmReset} data-testid="reset-confirm-form">
            <label className="block text-xs font-semibold text-stone-600 mb-1">Reset token</label>
            <input data-testid="reset-token" required value={token} onChange={(e) => setToken(e.target.value)}
                   className="w-full px-3 py-2.5 border border-stone-200 rounded-lg mb-3 bg-white font-mono text-xs focus:outline-none focus:border-emerald-900" />
            <div className="text-[10px] text-stone-500 font-mono mb-3">Note: no email provider is configured yet — the reset token was returned to you in the previous step.</div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">New password</label>
            <input data-testid="reset-new-password" required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                   className="w-full px-3 py-2.5 border border-stone-200 rounded-lg mb-6 bg-white focus:outline-none focus:border-emerald-900" />
            <button data-testid="reset-confirm-btn" disabled={busy} className="w-full py-2.5 rounded-lg bg-emerald-900 text-white font-semibold hover:bg-emerald-800 disabled:opacity-60">
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
