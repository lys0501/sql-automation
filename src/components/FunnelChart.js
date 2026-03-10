"use client";

/**
 * FunnelChart.js
 * 구매 퍼널 단계별 이탈률 시각화 컴포넌트
 *
 * 사용 라이브러리: Recharts (BarChart)
 * 표시 단계: 방문 → 상품 클릭 → 장바구니 → 결제
 *
 * Props:
 *   data  - 퍼널 단계 배열 (기본값: MOCK_DATA). 실제 연동 시 API 응답으로 교체.
 *           형태: [{ step, users, conversionRate, dropRate }]
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

// 가상 퍼널 데이터
const MOCK_DATA = [
  { step: "방문",      users: 100000, conversionRate: 100,  dropRate: 0 },
  { step: "상품 클릭", users:  61000, conversionRate:  61.0, dropRate: 39.0 },
  { step: "장바구니",  users:  24400, conversionRate:  40.0, dropRate: 60.0 },
  { step: "결제 완료", users:   8150, conversionRate:  33.4, dropRate: 66.6 },
];

// 단계별 색상 그라데이션
const BAR_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7"];

// 커스텀 툴팁
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-sm min-w-[160px]">
      <p className="font-bold text-slate-800 mb-2">{d.step}</p>
      <p className="text-slate-600">
        방문자 수: <span className="font-semibold text-slate-900">{d.users.toLocaleString()}</span>
      </p>
      {d.dropRate > 0 && (
        <p className="text-rose-500 mt-1">
          이탈률: <span className="font-semibold">{d.dropRate.toFixed(1)}%</span>
        </p>
      )}
      <p className="text-blue-600 mt-1">
        전환율: <span className="font-semibold">{d.conversionRate.toFixed(1)}%</span>
      </p>
    </div>
  );
}

export default function FunnelChart({ data = MOCK_DATA }) {
  // 전체 CVR (마지막 단계 / 첫 단계)
  const overallCVR = ((data[data.length - 1].users / data[0].users) * 100).toFixed(2);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">구매 퍼널</h3>
          <p className="text-xs text-slate-500 mt-0.5">단계별 이탈 현황 및 전환율</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">전체 CVR</p>
          <p className="text-xl font-bold text-blue-600">{overallCVR}%</p>
        </div>
      </div>

      {/* 퍼널 시각화: 막대 그래프 */}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 10, bottom: 0 }}
          barSize={36}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis
            type="number"
            domain={[0, data[0].users]}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="step"
            width={72}
            tick={{ fontSize: 12, fontWeight: 600, fill: "#475569" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
          <Bar dataKey="users" radius={[0, 6, 6, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.step} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
            <LabelList
              dataKey="users"
              position="right"
              formatter={(v) => v.toLocaleString()}
              style={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* 단계 간 전환율 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        {data.slice(1).map((step, i) => {
          const prev = data[i];
          const rate = ((step.users / prev.users) * 100).toFixed(1);
          return (
            <div key={step.step} className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[11px] text-slate-500">
                {prev.step} → {step.step}
              </p>
              <p className="text-base font-bold text-slate-800 mt-1">{rate}%</p>
              <p className="text-[10px] text-rose-500 mt-0.5">
                이탈 {step.dropRate.toFixed(1)}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
