import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { FileText, Upload, Download } from "lucide-react";
import dayjs from "dayjs";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const DOC_TYPES = ["Lab Report", "Prescription", "Discharge Summary", "Referral", "Other"];

function docUrl(id) {
  const t = localStorage.getItem("ht_token");
  return `${BACKEND_URL}/api/documents/${id}/download?auth=${encodeURIComponent(t)}`;
}

export default function MedicalReports({ patientId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState("Lab Report");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/documents", { params: patientId ? { patient_id: patientId } : {} });
      setItems(r.data.items || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [patientId]); // eslint-disable-line

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("doc_type", docType);
    fd.append("title", title);
    if (patientId) fd.append("patient_id", patientId);
    try {
      await api.post("/documents/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`${docType} uploaded`);
      setFile(null);
      setTitle("");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-stone-200 rounded-xl bg-white" data-testid="medical-reports">
      <div className="p-5 border-b border-stone-100">
        <div className="overline">Medical reports</div>
        <div className="font-heading text-xl font-bold mt-1">Documents & lab PDFs</div>
      </div>
      <form onSubmit={upload} className="p-5 border-b border-stone-100 grid sm:grid-cols-2 gap-3" data-testid="report-upload-form">
        <label className="block">
          <div className="text-[10px] uppercase tracking-widest font-semibold text-stone-500 mb-1">Type</div>
          <select data-testid="report-type-select" value={docType} onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-emerald-900">
            {DOC_TYPES.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <label className="block">
          <div className="text-[10px] uppercase tracking-widest font-semibold text-stone-500 mb-1">Title (optional)</div>
          <input data-testid="report-title-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., CBC — Jan 2026"
                 className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-emerald-900" />
        </label>
        <label className="block sm:col-span-2">
          <div className="text-[10px] uppercase tracking-widest font-semibold text-stone-500 mb-1">File</div>
          <input data-testid="report-file-input" type="file" accept=".pdf,.doc,.docx,.txt,.csv,image/*"
                 onChange={(e) => setFile(e.target.files?.[0])}
                 className="w-full text-xs font-mono file:mr-2 file:px-2 file:py-1 file:rounded file:bg-emerald-900 file:text-white file:border-0" />
        </label>
        <button data-testid="report-upload-submit" type="submit" disabled={busy || !file}
                className="sm:col-span-2 px-3 py-2 rounded-lg bg-emerald-900 text-white text-xs font-semibold hover:bg-emerald-800 flex items-center justify-center gap-1.5 disabled:opacity-50">
          <Upload className="h-3.5 w-3.5" /> {busy ? "Uploading…" : "Upload report"}
        </button>
      </form>
      <div className="p-5">
        {loading ? (
          <div className="text-xs font-mono text-stone-400">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-xs font-mono text-stone-400">No reports uploaded yet.</div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {items.map((d) => (
              <li key={d.id} className="py-3 flex items-center justify-between" data-testid={`report-row-${d.id}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-stone-100 grid place-items-center"><FileText className="h-4 w-4 text-emerald-900" /></div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{d.title || d.original_filename}</div>
                    <div className="text-[10px] font-mono text-stone-500">{d.doc_type} · {dayjs(d.created_at).format("MMM D, YYYY")} · {Math.round((d.size || 0) / 1024)} KB</div>
                  </div>
                </div>
                <a data-testid={`report-download-${d.id}`} href={docUrl(d.id)} download={d.original_filename}
                   className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-xs font-semibold flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
