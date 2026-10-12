import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { X, Eye, ImageOff } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function imgUrl(id) {
  const t = localStorage.getItem("ht_token");
  return `${BACKEND_URL}/api/images/${id}/download?auth=${encodeURIComponent(t)}`;
}

export default function ImageViewer({ patientId, refreshKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/images", { params: patientId ? { patient_id: patientId } : {} });
      setItems(r.data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [patientId, refreshKey]); // eslint-disable-line

  return (
    <div className="border border-stone-200 rounded-xl bg-white" data-testid="image-viewer">
      <div className="p-5 border-b border-stone-100 flex items-center justify-between">
        <div>
          <div className="overline">Medical imaging</div>
          <div className="font-heading text-xl font-bold mt-1">X-Ray, CT, MRI, Ultrasound</div>
        </div>
        <div className="text-[10px] font-mono text-stone-500">{items.length} scans</div>
      </div>
      <div className="p-5">
        {loading ? (
          <div className="text-xs font-mono text-stone-400">Loading…</div>
        ) : items.length === 0 ? (
          <div className="flex items-center gap-2 text-xs font-mono text-stone-400"><ImageOff className="h-4 w-4" /> No scans uploaded yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((im) => (
              <button key={im.id} data-testid={`image-thumb-${im.id}`} onClick={() => setActive(im)}
                      className="group text-left border border-stone-200 rounded-lg overflow-hidden hover:border-emerald-900 transition-colors">
                <div className="relative aspect-square bg-stone-100 overflow-hidden">
                  {(im.content_type || "").startsWith("image/") ? (
                    <img src={imgUrl(im.id)} alt={im.modality} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-[10px] font-mono text-stone-400">{im.original_filename?.split(".").pop()?.toUpperCase()}</div>
                  )}
                  <div className="absolute inset-0 bg-stone-950/0 group-hover:bg-stone-950/25 grid place-items-center transition-colors">
                    <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />
                  </div>
                </div>
                <div className="p-2">
                  <div className="text-[10px] font-mono text-emerald-900 font-semibold">{im.modality}</div>
                  <div className="text-xs truncate">{im.original_filename}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 grid place-items-center p-6" data-testid="image-modal" onClick={() => setActive(null)}>
          <div className="bg-white rounded-xl border border-stone-200 max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <div className="overline">{active.modality}</div>
                <div className="font-heading text-lg font-bold">{active.original_filename}</div>
              </div>
              <div className="flex items-center gap-2">
                <a data-testid="image-download-link" href={imgUrl(active.id)} download={active.original_filename}
                   className="text-xs font-semibold px-3 py-2 rounded-lg border border-stone-200 hover:bg-stone-100">Download</a>
                <button data-testid="image-modal-close" onClick={() => setActive(null)} className="p-2 rounded-lg hover:bg-stone-100"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="p-4 bg-stone-900 grid place-items-center">
              {(active.content_type || "").startsWith("image/") ? (
                <img src={imgUrl(active.id)} alt={active.modality} className="max-h-[70vh] object-contain" />
              ) : (
                <div className="text-white font-mono text-sm p-8">Preview unavailable — click Download.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
