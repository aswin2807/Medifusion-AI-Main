import React from "react";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";

const ICON = { Critical: ShieldAlert, High: AlertTriangle, Moderate: AlertTriangle, Info: Info, Low: Info };
const STYLE = {
  Critical: "border-rose-200 bg-rose-50 text-rose-800",
  High: "border-orange-200 bg-orange-50 text-orange-800",
  Moderate: "border-amber-200 bg-amber-50 text-amber-800",
  Info: "border-stone-200 bg-stone-50 text-stone-700",
  Low: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export default function AlertsPanel({ alerts }) {
  return (
    <div className="border border-stone-200 rounded-xl bg-white" data-testid="alerts-panel">
      <div className="p-5 border-b border-stone-100">
        <div className="overline">Alerts</div>
        <div className="font-heading text-xl font-bold mt-1">Clinical notifications</div>
      </div>
      <div className="p-5 space-y-2 max-h-72 overflow-y-auto">
        {(alerts || []).length === 0 && <div className="text-xs text-stone-500 font-mono">No active alerts.</div>}
        {(alerts || []).map((a, i) => {
          const Icon = ICON[a.level] || Info;
          return (
            <div key={i} data-testid={`alert-item-${i}`} className={`border rounded-lg p-3 flex items-start gap-3 ${STYLE[a.level] || STYLE.Info}`}>
              <Icon className="h-4 w-4 mt-0.5" />
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest opacity-80">{a.level}</div>
                <div className="text-sm">{a.message}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
