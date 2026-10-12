import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Bell, ShieldAlert, AlertTriangle, Info, Check, X } from "lucide-react";

export default function ClinicalAlerts({ patientId }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const url = patientId ? `/alerts?patient_id=${patientId}` : "/alerts";
      const r = await api.get(url);
      setAlerts(r.data);
    } catch (err) {
      toast.error("Failed to load clinical alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [patientId]);

  const handleDismiss = async (id) => {
    try {
      await api.post(`/alerts/dismiss/${id}`);
      setAlerts(alerts.filter((a) => a.id !== id));
      toast.success("Alert acknowledged & dismissed");
    } catch (err) {}
  };

  if (loading) {
    return <div className="p-6 bg-white border rounded-xl text-stone-400 text-xs font-mono text-center">Evaluating real-time clinical alerts...</div>;
  }

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "critical":
        return "bg-rose-600 text-white font-bold animate-pulse";
      case "urgent":
        return "bg-orange-100 text-orange-900 border border-orange-300 font-bold";
      default:
        return "bg-amber-100 text-amber-900 border border-amber-300 font-medium";
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm" data-testid="clinical-alerts">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
        <div>
          <div className="overline text-emerald-800 flex items-center gap-1 font-bold">
            <Bell className="h-4 w-4" /> Module 14: Clinical Alert System
          </div>
          <h2 className="text-xl font-bold font-heading text-stone-900 mt-1">Real-time Automated Health Triggers</h2>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-mono font-bold">
          {alerts.length} Active Triggers
        </span>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs font-mono">No active clinical alerts triggered. All vitals and lab baseline targets are normal.</div>
        ) : (
          alerts.map((a) => (
            <div key={a.id} className="p-4 border border-stone-200 rounded-xl bg-stone-50/60 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-700" />
                  <span className="font-bold text-stone-900 text-sm">{a.alert_type}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${getSeverityBadge(a.severity)}`}>
                    {a.severity}
                  </span>
                </div>
                <div className="text-xs text-stone-700 font-medium">{a.message}</div>
                {a.patient_name && <div className="text-[11px] font-mono text-stone-500">Patient: {a.patient_name}</div>}
              </div>
              <button
                onClick={() => handleDismiss(a.id)}
                className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 transition shrink-0"
                title="Acknowledge & Dismiss Alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
