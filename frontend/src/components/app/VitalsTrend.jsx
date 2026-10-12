import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import dayjs from "dayjs";

export default function VitalsTrend({ items }) {
  const data = (items || []).map((v) => ({
    at: v.at ? dayjs(v.at).format("MMM D HH:mm") : "",
    sbp: v.systolic_bp,
    dbp: v.diastolic_bp,
    hr: v.heart_rate,
    spo2: v.oxygen_saturation,
  }));
  return (
    <div className="border border-stone-200 rounded-xl bg-white" data-testid="vitals-trend">
      <div className="p-5 border-b border-stone-100">
        <div className="overline">Vital signs trend</div>
        <div className="font-heading text-xl font-bold mt-1">Last {data.length} measurements</div>
      </div>
      <div className="p-5 h-72">
        {data.length === 0 ? (
          <div className="h-full grid place-items-center text-xs text-stone-400 font-mono">No vitals recorded yet.</div>
        ) : (
          <ResponsiveContainer>
            <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid stroke="#f5f5f4" />
              <XAxis dataKey="at" tick={{ fontFamily: "IBM Plex Mono", fontSize: 10, fill: "#78716c" }} />
              <YAxis tick={{ fontFamily: "IBM Plex Mono", fontSize: 10, fill: "#78716c" }} />
              <Tooltip contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11, border: "1px solid #e7e5e4", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontFamily: "IBM Plex Mono", fontSize: 11 }} />
              <Line type="monotone" dataKey="sbp" stroke="#064e3b" strokeWidth={2} dot={false} name="Systolic BP" />
              <Line type="monotone" dataKey="dbp" stroke="#0f766e" strokeWidth={2} dot={false} name="Diastolic BP" />
              <Line type="monotone" dataKey="hr" stroke="#c2410c" strokeWidth={2} dot={false} name="Heart Rate" />
              <Line type="monotone" dataKey="spo2" stroke="#a16207" strokeWidth={2} dot={false} name="SpO₂" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
