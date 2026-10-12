import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Search, X, User, Activity, ChevronRight } from "lucide-react";

export default function SearchModal({ isOpen, onClose, onSelectPatient }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      api.get(`/search?q=${encodeURIComponent(query)}`)
        .then((r) => setResults(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-sm grid place-items-start pt-20 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="font-bold text-sm text-stone-900 flex items-center gap-2">
            <Search className="h-4 w-4 text-emerald-800" /> Advanced Healthcare Search Engine
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-stone-100 text-stone-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Input */}
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3.5 text-stone-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search by Patient ID, Name, Disease, Doctor, Blood Group, Age..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-3 border border-stone-200 rounded-xl text-sm bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
          />
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto space-y-2">
          {loading ? (
            <div className="p-6 text-center text-xs font-mono text-stone-400">Searching records...</div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-stone-400">
              {query ? "No matching patient records found." : "Type a query above to search patient database."}
            </div>
          ) : (
            results.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  if (onSelectPatient) onSelectPatient(p);
                  onClose();
                }}
                className="p-3 border border-stone-100 rounded-xl bg-stone-50/60 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-emerald-900 text-white grid place-items-center font-bold text-xs">
                    {p.full_name?.charAt(0) || "P"}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-stone-900 group-hover:text-emerald-950">{p.full_name}</div>
                    <div className="text-[11px] font-mono text-stone-500">{p.email} · ID: {p.id.slice(0, 8)}</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-stone-400 group-hover:text-emerald-800" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
