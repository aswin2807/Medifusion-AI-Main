import React, { useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Upload } from "lucide-react";

const MODALITIES = ["X-Ray", "CT Scan", "MRI", "Ultrasound"];

export default function UploadImage({ patientId, onUploaded }) {
  const [modality, setModality] = useState("X-Ray");
  const [anatomicalSite, setAnatomicalSite] = useState("Chest");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("modality", modality);
    fd.append("anatomical_site", anatomicalSite);
    fd.append("file", file);
    if (patientId) fd.append("patient_id", patientId);
    try {
      await api.post("/images/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`${modality} (${anatomicalSite}) uploaded`);
      setFile(null);
      onUploaded?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="border border-stone-200 rounded-xl bg-white p-5" data-testid="upload-image-form">
      <div className="overline">Medical Imaging</div>
      <div className="font-heading text-xl font-bold mt-1">Upload scan</div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <label className="block">
          <div className="text-[10px] uppercase tracking-widest font-semibold text-stone-500 mb-1">Modality</div>
          <select data-testid="upload-modality" value={modality} onChange={(e) => setModality(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:border-emerald-900">
            {MODALITIES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label className="block">
          <div className="text-[10px] uppercase tracking-widest font-semibold text-stone-500 mb-1">Anatomical Site</div>
          <select data-testid="upload-site" value={anatomicalSite} onChange={(e) => setAnatomicalSite(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:border-emerald-900">
            <option value="Chest">Chest / Thorax</option>
            <option value="Hand">Hand / Musculoskeletal</option>
            <option value="Brain">Brain / Head</option>
            <option value="Abdomen">Abdomen</option>
          </select>
        </label>
        <label className="block">
          <div className="text-[10px] uppercase tracking-widest font-semibold text-stone-500 mb-1">File</div>
          <input data-testid="upload-file-input" type="file" accept="image/*,.dcm,application/pdf" onChange={(e) => setFile(e.target.files?.[0])}
                 className="w-full text-xs font-mono file:mr-2 file:px-2 file:py-1 file:rounded file:bg-emerald-900 file:text-white file:border-0" />
        </label>
      </div>
      <button data-testid="upload-submit-btn" disabled={busy || !file}
              className="mt-4 px-3 py-2 rounded-lg bg-emerald-900 text-white text-xs font-semibold hover:bg-emerald-800 flex items-center gap-1.5 disabled:opacity-50">
        <Upload className="h-3.5 w-3.5" /> {busy ? "Uploading…" : "Upload scan"}
      </button>
    </form>
  );
}
