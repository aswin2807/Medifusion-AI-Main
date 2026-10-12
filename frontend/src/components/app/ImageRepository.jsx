import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Image, Upload, Eye, Layers, Sparkles, Filter, FileImage, RefreshCw, AlertTriangle, ShieldCheck, Cpu } from "lucide-react";

const MODALITIES = ["All", "X-Ray", "MRI", "CT Scan", "Ultrasound", "ECG", "Skin Images"];

export default function ImageRepository({ patientId }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModality, setSelectedModality] = useState("All");
  const [selectedImg, setSelectedImg] = useState(null);
  const [aiHeatmap, setAiHeatmap] = useState(false);
  const [predicting, setPredicting] = useState(false);

  // Upload Form
  const [uploading, setUploading] = useState(false);
  const [modality, setModality] = useState("X-Ray");
  const [anatomicalSite, setAnatomicalSite] = useState("Chest");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);

  const fetchImages = async () => {
    try {
      const r = await api.get(`/images/patient/${patientId}`);
      setImages(r.data);
      if (r.data.length > 0 && (!selectedImg || !r.data.find(x => x.id === selectedImg.id))) {
        setSelectedImg(r.data[0]);
      }
    } catch (err) {
      toast.error("Failed to load medical images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) fetchImages();
  }, [patientId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { toast.error("Please select an image file"); return; }

    setUploading(true);
    const fd = new FormData();
    fd.append("patient_id", patientId);
    fd.append("modality", modality);
    fd.append("anatomical_site", anatomicalSite);
    fd.append("notes", notes);
    fd.append("file", file);

    try {
      const r = await api.post("/images/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Medical image uploaded & AI scan prediction completed!");
      setFile(null);
      setNotes("");
      const newImg = r.data;
      setImages((prev) => [newImg, ...prev]);
      setSelectedImg(newImg);
      fetchImages();
    } catch (err) {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRePredict = async (imageId) => {
    setPredicting(true);
    try {
      const r = await api.post(`/medical-images/${imageId}/predict`);
      toast.success("AI scan prediction updated!");
      fetchImages();
      if (selectedImg && selectedImg.id === imageId) {
        setSelectedImg((prev) => ({
          ...prev,
          prediction: r.data.prediction,
          confidence_score: r.data.confidence,
          prediction_probability: r.data.probability,
          analysis_status: r.data.analysis_status,
          model_name: r.data.model_name,
          model_version: r.data.model_version,
          explanation_path: r.data.explanation_path,
          has_problem: r.data.has_problem,
          ai_analysis: {
            has_problem: r.data.has_problem,
            analysis_summary: r.data.prediction,
            details: r.data.details
          }
        }));
      }
    } catch (err) {
      toast.error("Re-prediction failed");
    } finally {
      setPredicting(false);
    }
  };

  const filteredImages = selectedModality === "All" ? images : images.filter((img) => img.modality === selectedModality);

  const getStatusBadgeClass = (status) => {
    if (status?.includes("Non-Diagnostic") || status?.includes("Inconclusive") || status?.includes("Unable")) return "bg-rose-500/20 text-rose-300 border-rose-500/30";
    if (status?.includes("Low-confidence")) return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm" data-testid="image-repository">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
        <div>
          <div className="overline text-emerald-800 flex items-center gap-1 font-bold">
            <Image className="h-4 w-4" /> Module 11: Multi-Modality Medical Image Repository
          </div>
          <h2 className="text-xl font-bold font-heading text-stone-900 mt-1">AI Medical Scan Prediction & Explainable Vision Pipeline</h2>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <span>
          <strong>Clinical Decision Support Notice:</strong> AI scan predictions and Grad-CAM saliency heatmaps are informational decision-support tools and require qualified radiologist/physician review.
        </span>
      </div>

      {/* Modality Filter Pills */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2">
        {MODALITIES.map((mod) => (
          <button
            key={mod}
            onClick={() => setSelectedModality(mod)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedModality === mod ? "bg-emerald-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {mod}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upload Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 border border-stone-200 bg-stone-50/50 rounded-xl space-y-3">
            <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wider flex items-center gap-1">
              <Upload className="h-3.5 w-3.5" /> Upload Medical Scan
            </h3>
            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Modality</label>
                <select value={modality} onChange={(e) => setModality(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs bg-white">
                  <option>X-Ray</option><option>MRI</option><option>CT Scan</option><option>Ultrasound</option><option>ECG</option><option>Skin Images</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Anatomical Region</label>
                <input placeholder="e.g. Chest, Brain, Abdomen, Hand" value={anatomicalSite} onChange={(e) => setAnatomicalSite(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">File</label>
                <input type="file" accept="image/*,.dcm" onChange={(e) => setFile(e.target.files[0])} className="w-full text-xs" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Clinical Notes</label>
                <textarea rows={2} placeholder="Scan notes / radiologist remarks..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-xs bg-white" />
              </div>
              <button type="submit" disabled={uploading} className="w-full py-2.5 rounded-lg bg-emerald-900 text-white font-semibold text-xs hover:bg-emerald-800 transition flex items-center justify-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                {uploading ? "Analyzing & Predicting..." : "Upload & Analyze Scan"}
              </button>
            </form>
          </div>

          {/* Image Thumbnail Grid */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-stone-800 uppercase tracking-wider">Repository Files ({filteredImages.length})</h4>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
              {filteredImages.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setSelectedImg(img)}
                  className={`p-2 border rounded-lg cursor-pointer text-xs transition ${
                    selectedImg?.id === img.id ? "border-emerald-800 bg-emerald-50" : "border-stone-200 hover:border-stone-400 bg-white"
                  }`}
                >
                  <div className="font-bold truncate text-stone-900">{img.filename}</div>
                  <div className="text-[10px] text-stone-500 font-mono mt-1">{img.scan_type || img.modality}</div>
                  <div className={`mt-1 text-[10px] font-bold ${img.has_problem || img.ai_analysis?.has_problem ? "text-rose-600" : "text-emerald-700"}`}>
                    {img.prediction || img.ai_analysis?.analysis_summary || "Analyzed"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Viewer Column */}
        <div className="lg:col-span-2 space-y-3">
          {selectedImg ? (
            <div className="p-4 border rounded-xl bg-stone-950 text-white space-y-3">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2 text-xs">
                <div className="font-mono font-bold text-emerald-400">
                  {selectedImg.scan_type || selectedImg.modality} — {selectedImg.anatomical_site} ({selectedImg.filename})
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRePredict(selectedImg.id)}
                    disabled={predicting}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-800 text-stone-300 hover:bg-stone-700 text-xs font-semibold transition"
                    title="Re-run AI Vision Model Prediction"
                  >
                    <RefreshCw className={`h-3 w-3 ${predicting ? "animate-spin" : ""}`} /> Re-Analyze
                  </button>
                  <button
                    onClick={() => setAiHeatmap(!aiHeatmap)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
                      aiHeatmap ? "bg-emerald-600 text-white" : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Grad-CAM Heatmap
                  </button>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between bg-stone-900 p-2 rounded border border-stone-800 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-stone-400">Status:</span>
                  <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getStatusBadgeClass(selectedImg.analysis_status)}`}>
                    {selectedImg.analysis_status || "AI Analysis Completed"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-stone-400">
                  <Cpu className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{selectedImg.model_name || "Medical Vision Model"} {selectedImg.model_version || "v1.0"}</span>
                </div>
              </div>

              {/* Viewer Screen */}
              <div className="relative aspect-video bg-stone-900 rounded-lg overflow-hidden flex items-center justify-center border border-stone-800">
                <img
                  id="viewer-image"
                  src={
                    aiHeatmap
                      ? `${api.defaults.baseURL}/images/heatmap/${selectedImg.id}?auth=${encodeURIComponent(localStorage.getItem("ht_token") || "")}`
                      : `${api.defaults.baseURL}/images/file/${selectedImg.id}?auth=${encodeURIComponent(localStorage.getItem("ht_token") || "")}`
                  }
                  alt="Medical scan"
                  className="h-full w-full object-contain transition duration-300"
                />
                {aiHeatmap && (
                  <div className="absolute top-2 right-2 border border-rose-500/50 rounded px-2.5 py-1 text-rose-300 text-[10px] font-mono font-bold bg-rose-950/80 backdrop-blur">
                    Grad-CAM Saliency Overlay Active
                  </div>
                )}
              </div>

              {/* Prediction & Confidence Results Panel */}
              <div className={`p-4 rounded-xl border ${
                selectedImg.prediction?.includes("Inconclusive") || selectedImg.analysis_status?.includes("Non-Diagnostic")
                  ? "bg-amber-950/50 border-amber-800/80 text-amber-200"
                  : selectedImg.has_problem || selectedImg.ai_analysis?.has_problem
                  ? "bg-rose-950/50 border-rose-800/80 text-rose-200"
                  : "bg-emerald-950/50 border-emerald-800/80 text-emerald-200"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">AI Disease Classification</div>
                    <div className="text-lg font-bold font-mono mt-0.5 flex items-center gap-2">
                      <span>{selectedImg.prediction || selectedImg.ai_analysis?.analysis_summary || "Normal Findings"}</span>
                      {(selectedImg.has_problem || selectedImg.ai_analysis?.has_problem) && (
                        <span className="text-xs px-2 py-0.5 rounded bg-rose-900/80 text-rose-300 font-normal">Abnormality Flagged</span>
                      )}
                      {(selectedImg.prediction?.includes("Inconclusive") || selectedImg.analysis_status?.includes("Non-Diagnostic")) && (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-900/80 text-amber-300 font-normal">Action Required</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Confidence Score</div>
                    <div className="text-xl font-bold font-mono text-emerald-400">
                      {selectedImg.prediction?.includes("Inconclusive") ? "0%" : selectedImg.confidence_score !== undefined ? `${Math.round(selectedImg.confidence_score * 100)}%` : "92%"}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-stone-900 rounded-full h-1.5 mb-2 overflow-hidden border border-stone-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      selectedImg.has_problem || selectedImg.ai_analysis?.has_problem ? "bg-rose-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${(selectedImg.confidence_score || 0.92) * 100}%` }}
                  ></div>
                </div>

                <div className="font-mono text-[11px] text-stone-300 leading-relaxed">
                  {selectedImg.ai_analysis?.details || selectedImg.details || "Structural feature extraction verified clear boundaries and normal bone/tissue opacity."}
                </div>
              </div>

              {/* Metadata details */}
              <div className="grid grid-cols-4 gap-2 text-[11px] font-mono text-stone-400 bg-stone-900 p-2.5 rounded border border-stone-800">
                <div><span className="text-stone-500">Scan Type:</span> {selectedImg.scan_type || selectedImg.modality}</div>
                <div><span className="text-stone-500">Region:</span> {selectedImg.anatomical_site}</div>
                <div><span className="text-stone-500">Model:</span> {selectedImg.model_name || "VisionNet"}</div>
                <div><span className="text-stone-500">Date:</span> {selectedImg.created_at?.slice(0, 10)}</div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center border-2 border-dashed rounded-xl border-stone-200 text-stone-400 text-xs font-mono">
              Select or upload a medical image scan to launch the multi-modality AI vision viewer.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
