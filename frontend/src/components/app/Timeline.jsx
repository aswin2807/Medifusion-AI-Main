import React from "react";
import dayjs from "dayjs";
import { FileText, HeartPulse, Image as ImgIcon, MessageSquare, TestTube } from "lucide-react";

const ICON = { lab: TestTube, vitals: HeartPulse, note: MessageSquare, image: ImgIcon, admission: FileText };

export default function Timeline({ items }) {
  return (
    <div className="border border-stone-200 rounded-xl bg-white" data-testid="timeline-panel">
      <div className="p-5 border-b border-stone-100">
        <div className="overline">Health Timeline</div>
        <div className="font-heading text-xl font-bold mt-1">Chronological events</div>
      </div>
      <div className="p-5 max-h-96 overflow-y-auto">
        {(items || []).length === 0 && <div className="text-xs text-stone-500 font-mono">No events yet.</div>}
        <ol className="relative border-l border-stone-200 ml-3 space-y-4">
          {(items || []).map((it) => {
            const Icon = ICON[it.kind] || FileText;
            return (
              <li key={it.id} className="ml-4">
                <span className="absolute -left-2.5 mt-1 h-5 w-5 rounded-full bg-white border border-stone-200 grid place-items-center">
                  <Icon className="h-3 w-3 text-emerald-900" />
                </span>
                <div className="text-[10px] font-mono text-stone-500">{dayjs(it.created_at).format("MMM D, YYYY · HH:mm")}</div>
                <div className="font-semibold text-sm">{it.title}</div>
                {it.detail && <div className="text-xs text-stone-600">{it.detail}</div>}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
