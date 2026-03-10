"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard,
  Database,
  TableProperties,
  History,
  Settings,
  Rocket,
  SlidersHorizontal,
  Waypoints,
  Plus,
  Trash2,
  Play,
  Info,
  Zap,
  BrainCircuit,
  LayoutList,
  CalendarDays,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ─────────────────────────────────────────
// SQL 신택스 하이라이터
// ─────────────────────────────────────────
const KEYWORDS = [
  "WITH", "AS", "SELECT", "FROM", "WHERE", "AND", "OR", "IN",
  "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "JOIN",
  "OVER", "PARTITION BY", "ORDER BY", "GROUP BY",
  "DISTINCT", "INTERVAL", "BETWEEN", "ON", "USING",
  "COUNT", "MIN", "MAX", "DATE", "NULLIF", "ROUND",
];

function SqlLine({ line }) {
  if (line.trimStart().startsWith("--")) {
    return <div className="leading-relaxed text-[#8b949e]">{line}</div>;
  }

  const parts = [];
  let remaining = line;
  let k = 0;

  while (remaining.length > 0) {
    // string literal
    const strM = remaining.match(/^('.*?')/);
    if (strM) {
      parts.push(<span key={k++} className="text-[#a5d6ff]">{strM[1]}</span>);
      remaining = remaining.slice(strM[1].length);
      continue;
    }

    let matched = false;
    for (const kw of KEYWORDS) {
      if (
        remaining.toUpperCase().startsWith(kw) &&
        (remaining.length === kw.length || /[\s(,;]/.test(remaining[kw.length]))
      ) {
        const isFn = ["COUNT", "MIN", "MAX", "DATE", "NULLIF", "ROUND"].includes(kw);
        parts.push(
          <span key={k++} className={isFn ? "text-[#d2a8ff]" : "text-[#ff7b72]"}>
            {remaining.slice(0, kw.length)}
          </span>
        );
        remaining = remaining.slice(kw.length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      parts.push(<span key={k++}>{remaining[0]}</span>);
      remaining = remaining.slice(1);
    }
  }

  return <div className="leading-relaxed">{parts}</div>;
}

// ─────────────────────────────────────────
// 상수
// ─────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Dashboard",     Icon: LayoutDashboard, active: false },
  { label: "Mart Builder",  Icon: Database,        active: true  },
  { label: "Source Mgmt",   Icon: TableProperties, active: false },
  { label: "Query History", Icon: History,         active: false },
];

const INITIAL_STEPS = [
  { id: 1, label: "View Landing", event: "page_view_home"      },
  { id: 2, label: "Start App",    event: "click_apply_now"     },
  { id: 3, label: "Submit Form",  event: "api_submit_success"  },
];

const LOADING_SQL = "-- SQL 생성 중...";
const PLACEHOLDER_SQL = "-- 설정을 입력하면 SQL이 자동으로 생성됩니다.";

// ─────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────
export default function SqlMartBuilder() {
  const [martName,      setMartName]      = useState("Card_Application_Funnel_2024");
  const [sourceTable,   setSourceTable]   = useState("raw_events_log");
  const [analysisPeriod, setAnalysisPeriod] = useState("Last 30 Days");
  const [steps,         setSteps]         = useState(INITIAL_STEPS);

  const [sql,     setSql]     = useState(PLACEHOLDER_SQL);
  const [status,  setStatus]  = useState("idle"); // idle | loading | ok | error
  const [errMsg,  setErrMsg]  = useState("");

  const debounceRef = useRef(null);

  // ── API 호출 ──
  const generateSql = useCallback(
    async (config) => {
      setStatus("loading");
      setSql(LOADING_SQL);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "API 오류");
        setSql(data.sql);
        setStatus("ok");
      } catch (e) {
        setErrMsg(e.message);
        setStatus("error");
        setSql(`-- 오류: ${e.message}`);
      }
    },
    []
  );

  // ── 입력값 변경 시 300ms 디바운스로 자동 생성 ──
  useEffect(() => {
    if (steps.length < 2) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      generateSql({ martName, sourceTable, analysisPeriod, steps });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [martName, sourceTable, analysisPeriod, steps, generateSql]);

  // ── Step 조작 ──
  const addStep = () => {
    const nextId = steps.length ? Math.max(...steps.map((s) => s.id)) + 1 : 1;
    setSteps([...steps, { id: nextId, label: "New Step", event: "event_name" }]);
  };
  const removeStep = (id) => setSteps(steps.filter((s) => s.id !== id));
  const updateStep = (id, field, value) =>
    setSteps(steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  // ── 상태 뱃지 ──
  const StatusBadge = () => {
    if (status === "loading")
      return (
        <span className="flex items-center gap-1 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
          <Loader2 size={12} className="animate-spin" /> Generating...
        </span>
      );
    if (status === "ok")
      return (
        <span className="flex items-center gap-1 text-green-400 text-[10px] uppercase tracking-widest font-bold">
          <CheckCircle2 size={12} /> Ready
        </span>
      );
    if (status === "error")
      return (
        <span className="flex items-center gap-1 text-red-400 text-[10px] uppercase tracking-widest font-bold">
          <AlertCircle size={12} /> Error
        </span>
      );
    return <span className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Waiting</span>;
  };

  const lineCount = sql.split("\n").length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f6f8] text-slate-900">

      {/* ── Sidebar ── */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between p-4 shrink-0">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-[#001b94] rounded-xl flex items-center justify-center text-white">
              <Database size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Toss Bank</h1>
              <p className="text-xs text-slate-500 font-medium">SQL Mart Admin</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ label, Icon, active }) => (
              <a
                key={label}
                href="#"
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-sm ${
                  active
                    ? "bg-[#001b94]/10 text-[#001b94] font-semibold"
                    : "text-slate-600 hover:bg-slate-100 font-medium"
                }`}
              >
                <Icon size={18} />
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-4">
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600 text-sm font-medium">
            <Settings size={18} />
            Settings
          </a>
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Status</span>
            </div>
            <p className="text-xs font-medium">All systems operational</p>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-tight">SQL Mart Builder</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#001b94]/10 text-[#001b94] border border-[#001b94]/20">
              V2.4 BETA
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Save Draft
            </button>
            <button
              onClick={() => generateSql({ martName, sourceTable, analysisPeriod, steps })}
              disabled={status === "loading"}
              className="px-5 py-2 text-sm font-bold text-white bg-[#001b94] rounded-xl shadow-lg shadow-[#001b94]/20 hover:bg-[#001b94]/90 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "loading" ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
              Deploy SQL Mart
            </button>
          </div>
        </header>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-12 gap-8">

          {/* ── Left ── */}
          <section className="col-span-5 flex flex-col gap-6">

            {/* Configuration */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-[#001b94]" />
                Configuration
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mart Name</label>
                  <input
                    type="text"
                    value={martName}
                    onChange={(e) => setMartName(e.target.value)}
                    placeholder="e.g. user_onboarding_funnel"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#001b94]/20 focus:border-[#001b94] outline-none transition-all text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Source Table</label>
                    <select
                      value={sourceTable}
                      onChange={(e) => setSourceTable(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#001b94]/20 text-sm"
                    >
                      <option>raw_events_log</option>
                      <option>user_interactions</option>
                      <option>transaction_history</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Analysis Period</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={analysisPeriod}
                        onChange={(e) => setAnalysisPeriod(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 outline-none focus:ring-2 focus:ring-[#001b94]/20 text-sm"
                      />
                      <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step Builder */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Waypoints size={18} className="text-[#001b94]" />
                  Step Builder
                </h3>
                <button onClick={addStep} className="text-[#001b94] text-sm font-bold flex items-center gap-1 hover:underline">
                  <Plus size={16} />
                  Add Step
                </button>
              </div>
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      idx === steps.length - 1
                        ? "bg-[#001b94]/5 border-[#001b94]/20"
                        : "bg-slate-50 border-transparent hover:border-[#001b94]/30"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#001b94] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={step.label}
                        onChange={(e) => updateStep(step.id, "label", e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium outline-none focus:border-[#001b94]"
                      />
                      <input
                        type="text"
                        value={step.event}
                        onChange={(e) => updateStep(step.id, "event", e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-500 font-mono outline-none focus:border-[#001b94]"
                      />
                    </div>
                    <button onClick={() => removeStep(step.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {steps.length < 2 && (
                  <p className="text-xs text-amber-500 text-center pt-2">퍼널 단계를 2개 이상 추가해야 SQL이 생성됩니다.</p>
                )}
              </div>
            </div>
          </section>

          {/* ── Right ── */}
          <section className="col-span-7 flex flex-col gap-6">

            {/* SQL Editor */}
            <div className="bg-[#0f1323] text-slate-300 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[500px]">
              {/* Toolbar */}
              <div className="bg-slate-800/50 px-6 py-3 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 mr-4">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <span className="text-xs font-mono opacity-50">preview_query.sql</span>
                </div>
                <button
                  onClick={() => generateSql({ martName, sourceTable, analysisPeriod, steps })}
                  disabled={status === "loading"}
                  className="bg-[#001b94] px-4 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-2 hover:bg-[#001b94]/90 transition-all disabled:opacity-60"
                >
                  {status === "loading"
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Play size={14} />
                  }
                  Run Preview
                </button>
              </div>

              {/* SQL Content */}
              <div className="flex-1 p-6 font-mono text-sm overflow-auto">
                {status === "loading" ? (
                  <div className="flex items-center gap-3 text-slate-500 h-full justify-center">
                    <Loader2 size={20} className="animate-spin" />
                    <span>builder.py 실행 중...</span>
                  </div>
                ) : (
                  sql.split("\n").map((line, i) => <SqlLine key={i} line={line} />)
                )}
              </div>

              {/* Status Bar */}
              <div className="bg-slate-800/30 p-3 px-6 flex justify-between items-center">
                <StatusBadge />
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                  Lines: {lineCount}
                </span>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Query Complexity</p>
                  <div className="flex items-center gap-2">
                    <h4 className="text-2xl font-black text-amber-500">
                      {steps.length <= 3 ? "Low" : steps.length <= 6 ? "Medium" : "High"}
                    </h4>
                    <Zap size={20} className="text-amber-500" />
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                  <BrainCircuit size={22} className="text-amber-500" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Steps</p>
                  <div className="flex items-center gap-2">
                    <h4 className="text-2xl font-black text-[#001b94]">
                      {String(steps.length).padStart(2, "0")}
                    </h4>
                    <span className="text-xs font-bold text-slate-400">Defined</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#001b94]/5 flex items-center justify-center">
                  <LayoutList size={22} className="text-[#001b94]" />
                </div>
              </div>
            </div>

            {/* Tip / Error */}
            {status === "error" ? (
              <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-start gap-4">
                <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-bold text-red-600 mb-1">SQL 생성 오류</h5>
                  <p className="text-sm text-red-500 font-mono leading-relaxed">{errMsg}</p>
                </div>
              </div>
            ) : (
              <div className="bg-[#001b94]/5 border border-[#001b94]/20 p-5 rounded-2xl flex items-start gap-4">
                <Info size={20} className="text-[#001b94] shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-bold text-[#001b94] mb-1">Optimization Suggestion</h5>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    단계를 수정하면 <strong>300ms 후 자동으로 SQL이 재생성</strong>됩니다.{" "}
                    <code className="bg-[#001b94]/10 px-1 rounded text-[#001b94] text-xs">Run Preview</code>를 눌러도 즉시 실행됩니다.
                  </p>
                </div>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
