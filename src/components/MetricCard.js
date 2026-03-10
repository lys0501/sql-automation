"use client";

export default function MetricCard({ label, value, change, up }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-2">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      <span
        className={`text-xs font-semibold ${
          up ? "text-emerald-600" : "text-rose-500"
        }`}
      >
        {up ? "▲" : "▼"} {change} <span className="text-slate-400 font-normal">vs 전월</span>
      </span>
    </div>
  );
}
