import CohortTable from "@/components/CohortTable";
import SegmentFilter from "@/components/SegmentFilter";

export const metadata = {
  title: "유저 행동 분석 | CVR Dashboard",
};

export default function BehaviorPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">유저 행동 분석</h1>
        <p className="text-slate-500 text-sm mt-1">코호트 잔존율 및 세그먼트별 행동 특성</p>
      </div>

      {/* Segment Filter */}
      <SegmentFilter />

      {/* Cohort Table */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          코호트 잔존율 분석
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <CohortTable />
        </div>
      </section>

      {/* Segment Summary */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          세그먼트별 행동 요약
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              segment: "Mobile",
              cvr: "2.81%",
              avgSession: "4분 12초",
              bounceRate: "48.2%",
              color: "bg-violet-50 border-violet-200",
              badge: "bg-violet-100 text-violet-700",
            },
            {
              segment: "PC",
              cvr: "4.53%",
              avgSession: "7분 34초",
              bounceRate: "31.5%",
              color: "bg-blue-50 border-blue-200",
              badge: "bg-blue-100 text-blue-700",
            },
            {
              segment: "Tablet",
              cvr: "3.12%",
              avgSession: "5분 48초",
              bounceRate: "39.7%",
              color: "bg-emerald-50 border-emerald-200",
              badge: "bg-emerald-100 text-emerald-700",
            },
          ].map((s) => (
            <div
              key={s.segment}
              className={`rounded-2xl border p-5 space-y-3 ${s.color}`}
            >
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.badge}`}>
                {s.segment}
              </span>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">CVR</span>
                  <span className="font-bold text-slate-800">{s.cvr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">평균 세션</span>
                  <span className="font-semibold text-slate-700">{s.avgSession}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">이탈률</span>
                  <span className="font-semibold text-slate-700">{s.bounceRate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
