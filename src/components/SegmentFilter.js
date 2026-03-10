"use client";
import { useState } from "react";

const DEVICES  = ["전체", "Mobile", "PC", "Tablet"];
const CHANNELS = ["전체", "Organic", "Paid", "SNS", "Direct"];

export default function SegmentFilter() {
  const [device,  setDevice]  = useState("전체");
  const [channel, setChannel] = useState("전체");

  return (
    <div className="flex flex-wrap items-center gap-4 bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm">
      {/* Device filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">기기</span>
        <div className="flex gap-1">
          {DEVICES.map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                device === d
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-5 bg-slate-200" />

      {/* Channel filter */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">유입 경로</span>
        <div className="flex gap-1">
          {CHANNELS.map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                channel === c
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
