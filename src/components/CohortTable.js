"use client";

/**
 * CohortTable.js
 * 가입 월별 유저 잔존율(Retention Rate) 코호트 표 컴포넌트
 *
 * 히트맵 형태로 잔존율을 색상 강도로 표현.
 * - 짙은 파란색: 높은 잔존율
 * - 연한 색 / 빨간계열: 낮은 잔존율
 *
 * Props:
 *   cohorts - 코호트 데이터 배열 (기본값: MOCK_COHORTS). API 연동 시 교체.
 *             형태: [{ month, totalUsers, retention: [week0%, week1%, ...] }]
 *   weeks   - 표시할 주차 수 (기본값: 8)
 */

// 가상 코호트 데이터 (주차별 잔존율 %)
const MOCK_COHORTS = [
  { month: "2024-08", totalUsers: 3200, retention: [100, 42, 31, 26, 22, 19, 17, 15] },
  { month: "2024-09", totalUsers: 3850, retention: [100, 45, 33, 28, 24, 21, 18, 16] },
  { month: "2024-10", totalUsers: 4100, retention: [100, 48, 36, 30, 25, 22, 19,  0] },
  { month: "2024-11", totalUsers: 4720, retention: [100, 51, 38, 32, 27, 23,  0,  0] },
  { month: "2024-12", totalUsers: 5380, retention: [100, 55, 41, 34, 28,  0,  0,  0] },
  { month: "2025-01", totalUsers: 4950, retention: [100, 53, 39, 31,  0,  0,  0,  0] },
  { month: "2025-02", totalUsers: 5210, retention: [100, 58, 42,  0,  0,  0,  0,  0] },
  { month: "2025-03", totalUsers: 5640, retention: [100, 61,  0,  0,  0,  0,  0,  0] },
];

/**
 * 잔존율 값에 따라 배경색 반환
 * 100%: 기준 (회색)
 * 높을수록 짙은 파란색, 낮을수록 빨간색 계열
 */
function getHeatmapStyle(value, isBaseline) {
  if (isBaseline) return { backgroundColor: "#e2e8f0", color: "#475569" };
  if (value === 0)  return { backgroundColor: "transparent", color: "transparent" };

  if (value >= 50) return { backgroundColor: "#1d4ed8", color: "#ffffff" };
  if (value >= 40) return { backgroundColor: "#2563eb", color: "#ffffff" };
  if (value >= 30) return { backgroundColor: "#3b82f6", color: "#ffffff" };
  if (value >= 20) return { backgroundColor: "#93c5fd", color: "#1e3a8a" };
  if (value >= 10) return { backgroundColor: "#fca5a5", color: "#7f1d1d" };
  return           { backgroundColor: "#ef4444", color: "#ffffff" };
}

export default function CohortTable({ cohorts = MOCK_COHORTS, weeks = 8 }) {
  const weekLabels = Array.from({ length: weeks }, (_, i) => `W${i}`);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">코호트 잔존율</h3>
          <p className="text-xs text-slate-500 mt-0.5">가입 월별 주차 잔존율 (%)</p>
        </div>
        {/* 범례 */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span>낮음</span>
          <div className="flex gap-0.5">
            {["#ef4444","#fca5a5","#93c5fd","#3b82f6","#2563eb","#1d4ed8"].map((c) => (
              <div key={c} className="w-4 h-4 rounded-sm" style={{ backgroundColor: c }} />
            ))}
          </div>
          <span>높음</span>
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 whitespace-nowrap w-28">
                가입 월
              </th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 whitespace-nowrap w-24">
                신규 유저
              </th>
              {weekLabels.map((w) => (
                <th
                  key={w}
                  className="py-2 px-2 text-xs font-semibold text-slate-500 text-center w-16"
                >
                  {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cohorts.map((cohort) => (
              <tr key={cohort.month} className="hover:bg-slate-50 transition-colors">
                {/* 가입 월 */}
                <td className="py-2 px-3 font-medium text-slate-700 whitespace-nowrap">
                  {cohort.month}
                </td>
                {/* 신규 유저 수 */}
                <td className="py-2 px-3 text-right text-slate-600 font-mono text-xs">
                  {cohort.totalUsers.toLocaleString()}
                </td>
                {/* 주차별 잔존율 셀 */}
                {weekLabels.map((_, wi) => {
                  const val = cohort.retention[wi] ?? 0;
                  const isBaseline = wi === 0;
                  const style = getHeatmapStyle(val, isBaseline);
                  return (
                    <td key={wi} className="py-1.5 px-1 text-center">
                      {val > 0 ? (
                        <div
                          className="rounded-md mx-auto flex items-center justify-center text-[11px] font-semibold h-8 w-12"
                          style={style}
                        >
                          {val}%
                        </div>
                      ) : (
                        <div className="h-8 w-12 mx-auto" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 평균 잔존율 요약 행 */}
      <div className="bg-slate-50 rounded-xl px-4 py-3">
        <p className="text-xs font-semibold text-slate-500 mb-2">전체 평균 잔존율</p>
        <div className="flex gap-3">
          {weekLabels.map((w, wi) => {
            const vals = cohorts.map((c) => c.retention[wi]).filter((v) => v > 0);
            const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "-";
            return (
              <div key={w} className="text-center">
                <p className="text-[10px] text-slate-400">{w}</p>
                <p className="text-sm font-bold text-slate-700">{avg}{avg !== "-" ? "%" : ""}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
