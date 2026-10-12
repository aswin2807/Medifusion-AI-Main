import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { Building2, Users, Calendar, TrendingUp, ShieldAlert, Award, FileText, CheckCircle2 } from "lucide-react";

const COLORS = ["#064e3b", "#0284c7", "#d97706", "#dc2626", "#7c3aed"];

export default function HospitalAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/analytics")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-stone-400 font-mono text-xs">Computing Hospital Executive Analytics...</div>;
  }

  if (!data) return null;

  const diseaseChartData = Object.entries(data.disease_distribution || {}).map(([k, v]) => ({ name: k, value: v }));
  const ageChartData = Object.entries(data.age_distribution || {}).map(([k, v]) => ({ age: k, patients: v }));
  const genderChartData = Object.entries(data.gender_distribution || {}).map(([k, v]) => ({ name: k, value: v }));

  const downloadExecutivePdf = () => {
    const token = localStorage.getItem("ht_token");
    window.open(`${api.defaults.baseURL}/reports/pdf/hospital_analytics/all?auth=${encodeURIComponent(token)}`, "_blank");
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-6" data-testid="hospital-analytics">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-100 gap-4">
        <div>
          <div className="overline text-emerald-800 flex items-center gap-1 font-bold">
            <Building2 className="h-4 w-4" /> Module 15: Hospital Analytics Dashboard
          </div>
          <h2 className="text-xl font-bold font-heading text-stone-900 mt-1">Hospital Operations & Population Metrics</h2>
        </div>
        <button
          onClick={downloadExecutivePdf}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-900 text-white text-xs font-semibold hover:bg-emerald-800 transition shadow-sm"
        >
          <FileText className="h-3.5 w-3.5" /> Export Executive PDF Report
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border rounded-xl bg-stone-50 border-stone-200">
          <div className="text-[11px] font-mono uppercase text-stone-500">Total Registered Patients</div>
          <div className="text-3xl font-black font-heading text-stone-900 mt-2">{data.total_patients}</div>
          <div className="text-xs text-emerald-700 font-medium mt-1">Active Electronic Records</div>
        </div>

        <div className="p-4 border rounded-xl bg-stone-50 border-stone-200">
          <div className="text-[11px] font-mono uppercase text-stone-500">Daily Appointments</div>
          <div className="text-3xl font-black font-heading text-stone-900 mt-2">{data.daily_appointments}</div>
          <div className="text-xs text-blue-700 font-medium mt-1">Scheduled Consultations</div>
        </div>

        <div className="p-4 border rounded-xl bg-stone-50 border-stone-200">
          <div className="text-[11px] font-mono uppercase text-stone-500">High Risk Patients</div>
          <div className="text-3xl font-black font-heading text-rose-700 mt-2">
            {data.high_risk_patients} <span className="text-xs text-rose-500 font-normal">({data.high_risk_percentage}%)</span>
          </div>
          <div className="text-xs text-rose-600 font-medium mt-1">Priority Triage Category</div>
        </div>

        <div className="p-4 border rounded-xl bg-gradient-to-br from-emerald-950 to-emerald-900 text-white">
          <div className="text-[11px] font-mono uppercase text-emerald-300">AI Model Accuracy</div>
          <div className="text-3xl font-black font-heading mt-2">{data.ai_prediction_accuracy}%</div>
          <div className="text-xs text-emerald-200 font-medium mt-1">Validated SHAP/LIME Model</div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Patient Growth */}
        <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/50">
          <h3 className="font-bold text-xs text-stone-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-800" /> Patient Volume & Monthly Consultations Growth
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthly_growth}>
                <XAxis dataKey="month" stroke="#a8a29e" fontSize={11} />
                <YAxis stroke="#a8a29e" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="patients" stroke="#064e3b" fill="#064e3b" fillOpacity={0.15} />
                <Area type="monotone" dataKey="consultations" stroke="#0284c7" fill="#0284c7" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disease Distribution */}
        <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/50">
          <h3 className="font-bold text-xs text-stone-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-amber-800" /> Population Disease Distribution Breakdown
          </h3>
          <div className="h-48 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diseaseChartData}>
                <XAxis dataKey="name" stroke="#a8a29e" fontSize={10} />
                <YAxis stroke="#a8a29e" fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" fill="#064e3b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Demographic Distributions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/50">
          <h3 className="font-bold text-xs text-stone-800 uppercase tracking-wider mb-3">Age Distribution</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageChartData}>
                <XAxis dataKey="age" stroke="#a8a29e" fontSize={11} />
                <YAxis stroke="#a8a29e" fontSize={11} />
                <Tooltip />
                <Bar dataKey="patients" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 border border-stone-200 rounded-xl bg-stone-50/50">
          <h3 className="font-bold text-xs text-stone-800 uppercase tracking-wider mb-3">Gender Distribution</h3>
          <div className="h-40 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} label>
                  {genderChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
