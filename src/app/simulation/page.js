"use client";

/**
 * Simulation Lab Page
 * 슬라이더 기반 가상 AB 테스트 시뮬레이터
 */

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// 기준 수치
const BASE = {
  visitors:      100000,
  baseCVR:       3.27,   // %
  avgOrderValue: 52300,  // 원
  shippingFee:   3000,   // 원
};

export default function SimulationPage() {
  // 시뮬레이션 변수 슬라이더
  const [freeShipping, setFreeShipping]     = useState(false);
  const [ctaImprovement, setCtaImprovement] = useState(0);   // % 단위 CTA 버튼 개선
  const [discountRate, setDiscountRate]     = useState(0);   // % 할인율

  // 시뮬레이션 계산
  const result = useMemo(() => {
    let newCVR = BASE.baseCVR;
    if (freeShipping)    newCVR += 0.45;                        // 무료배송 효과
    newCVR += (ctaImprovement / 100) * 1.2;                    // CTA 개선 효과
    newCVR += (discountRate / 100) * 2.5;                      // 할인 효과

    const beforeOrders = Math.round((BASE.visitors * BASE.baseCVR) / 100);
    const afterOrders  = Math.round((BASE.visitors * newCVR) / 100);

    const beforeRevenue = beforeOrders * BASE.avgOrderValue;
    const afterRevenue  = afterOrders  * BASE.avgOrderValue * (1 - discountRate / 100);

    return {
      beforeCVR: BASE.baseCVR.toFixed(2),
      afterCVR:  Math.min(newCVR, 15).toFixed(2),
      beforeOrders,
      afterOrders,
      beforeRevenue,
      afterRevenue,
      revenueDelta: afterRevenue - beforeRevenue,
      orderDelta:   afterOrders  - beforeOrders,
    };
  }, [freeShipping, ctaImprovement, discountRate]);

  const chartData = [
    { name: "Before", CVR: parseFloat(result.beforeCVR), fill: "#94a3b8" },
    { name: "After",  CVR: parseFloat(result.afterCVR),  fill: "#3b82f6" },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">시뮬레이션 랩</h1>
        <p className="text-slate-500 text-sm mt-1">가설을 설정하고 예상 전환율 및 매출 변화를 확인하세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 가설 설정 패널 */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h2 className="font-semibold text-slate-800">가설 설정</h2>

            {/* 무료 배송 전환 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">무료 배송 전환</label>
                <button
                  onClick={() => setFreeShipping(!freeShipping)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    freeShipping ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      freeShipping ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-slate-400">
                배송비 ₩{BASE.shippingFee.toLocaleString()} 무료화 → 예상 CVR +0.45%p
              </p>
            </div>

            {/* CTA 버튼 개선 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">CTA 버튼 개선</label>
                <span className="text-xs font-bold text-blue-600">{ctaImprovement}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={5}
                value={ctaImprovement}
                onChange={(e) => setCtaImprovement(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0%</span><span>50%</span>
              </div>
              <p className="text-xs text-slate-400">버튼 문구/색상 개선으로 클릭률 향상</p>
            </div>

            {/* 할인율 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">할인율 적용</label>
                <span className="text-xs font-bold text-blue-600">{discountRate}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                step={5}
                value={discountRate}
                onChange={(e) => setDiscountRate(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0%</span><span>30%</span>
              </div>
              <p className="text-xs text-slate-400">가격 할인으로 구매 결정 유도</p>
            </div>
          </div>
        </div>

        {/* 오른쪽: 결과 패널 */}
        <div className="lg:col-span-2 space-y-5">
          {/* KPI 비교 카드 */}
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label:  "예상 CVR",
                before: `${result.beforeCVR}%`,
                after:  `${result.afterCVR}%`,
                delta:  `+${(result.afterCVR - result.beforeCVR).toFixed(2)}%p`,
                up:     true,
              },
              {
                label:  "예상 주문 수",
                before: result.beforeOrders.toLocaleString(),
                after:  result.afterOrders.toLocaleString(),
                delta:  `+${result.orderDelta.toLocaleString()}`,
                up:     result.orderDelta >= 0,
              },
              {
                label:  "예상 매출",
                before: `₩${(result.beforeRevenue / 1e8).toFixed(2)}억`,
                after:  `₩${(result.afterRevenue  / 1e8).toFixed(2)}억`,
                delta:  `${result.revenueDelta >= 0 ? "+" : ""}₩${(result.revenueDelta / 1e6).toFixed(1)}백만`,
                up:     result.revenueDelta >= 0,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
              >
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  {item.label}
                </p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Before</p>
                    <p className="text-base font-semibold text-slate-600">{item.before}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">After</p>
                    <p className="text-xl font-bold text-slate-900">{item.after}</p>
                  </div>
                </div>
                <div className={`mt-2 text-xs font-bold ${item.up ? "text-emerald-600" : "text-rose-500"}`}>
                  {item.delta}
                </div>
              </div>
            ))}
          </div>

          {/* CVR 비교 차트 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-4">CVR Before / After 비교</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={60}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[0, Math.max(parseFloat(result.afterCVR) * 1.3, 6)]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(v) => [`${v}%`, "CVR"]} />
                <Bar dataKey="CVR" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <rect key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
