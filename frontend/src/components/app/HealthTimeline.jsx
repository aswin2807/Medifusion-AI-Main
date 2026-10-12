import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Clock, Filter, Search, Calendar, FileText, Pill, Activity, Syringe, Image } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Events" },
  { id: "visit", label: "Doctor Visits" },
  { id: "lab", label: "Lab Reports" },
  { id: "image", label: "Medical Scans" },
  { id: "medication", label: "Medications" },
  { id: "surgery", label: "Surgeries" },
  { id: "vaccination", label: "Vaccinations" },
  { id: "note", label: "Clinical Notes" },
];

export default function HealthTimeline({ patientId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (patientId) {
      api.get(`/timeline/${patientId}`)
        .then((r) => setEvents(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [patientId]);

  const filteredEvents = events.filter((e) => {
    const matchesCat = category === "all" || e.kind === category;
    const matchesSearch = !searchQuery || e.title?.toLowerCase().includes(searchQuery.toLowerCase()) || e.detail?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getEventIcon = (kind) => {
    switch (kind) {
      case "medication": return <Pill className="h-4 w-4 text-emerald-600" />;
      case "vaccination": return <Syringe className="h-4 w-4 text-blue-600" />;
      case "surgery": return <Activity className="h-4 w-4 text-rose-600" />;
      case "image": return <Image className="h-4 w-4 text-purple-600" />;
      case "lab": return <FileText className="h-4 w-4 text-amber-600" />;
      default: return <Clock className="h-4 w-4 text-stone-600" />;
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm" data-testid="health-timeline">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-stone-100 gap-4">
        <div>
          <div className="overline text-emerald-800 flex items-center gap-1 font-bold">
            <Clock className="h-4 w-4" /> Module 12: Interactive Patient Health Timeline
          </div>
          <h2 className="text-xl font-bold font-heading text-stone-900 mt-1">Chronological Health Events</h2>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-stone-400" />
          <input
            type="text"
            placeholder="Search timeline events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-xs bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-900"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-6">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              category === c.id ? "bg-emerald-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Vertical Timeline */}
      {loading ? (
        <div className="p-8 text-center text-stone-400 text-xs font-mono">Loading health timeline...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-8 text-center text-stone-400 text-xs font-mono">No timeline events match the filter criteria.</div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
          {filteredEvents.map((evt, idx) => (
            <div key={evt.id || idx} className="relative flex items-start gap-4">
              <div className="absolute -left-6 top-0.5 h-6 w-6 rounded-full bg-white border border-stone-300 grid place-items-center shadow-sm">
                {getEventIcon(evt.kind)}
              </div>
              <div className="p-4 border border-stone-200 bg-stone-50/50 rounded-xl w-full">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-stone-900">{evt.title}</span>
                  <span className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {evt.created_at?.slice(0, 10)}
                  </span>
                </div>
                {evt.detail && <div className="text-xs text-stone-600 mt-2 font-mono">{evt.detail}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
