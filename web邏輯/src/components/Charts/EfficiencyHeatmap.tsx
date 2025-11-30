"use client";
import React from 'react';

export type HeatmapMatrix = number[][]; // [7][24] => week(0-6 Mon..Sun) x hour(0-23)

function scaleColor(v: number, max: number) {
  if (max <= 0) return '#e5e7eb';
  const t = Math.min(1, v / max);
  const g = 229 - Math.round(t * 120);
  const r = 229;
  const b = 229 - Math.round(t * 180);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function EfficiencyHeatmap({ matrix }: { matrix: HeatmapMatrix }) {
  const max = Math.max(0, ...matrix.flat());
  const weekdays = ['一','二','三','四','五','六','日'];
  return (
    <div className="rounded border p-4 space-y-3">
      <h3 className="text-lg font-semibold">專注效率熱力圖（中斷頻率）</h3>
      <div className="grid" style={{ gridTemplateColumns: '40px repeat(24, 1fr)', gap: 2 }}>
        <div />
        {Array.from({ length: 24 }).map((_, h) => (
          <div key={h} className="text-[10px] text-gray-500 text-center">{h}</div>
        ))}
        {matrix.map((row, d) => (
          <React.Fragment key={d}>
            <div className="text-[10px] text-gray-500 text-right pr-1">{weekdays[d]}</div>
            {row.map((v, h) => (
              <div key={h} className="h-4 rounded" style={{ background: scaleColor(v, max) }} title={`${v}`} />
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className="text-xs text-gray-500">顏色越深表示該時段中斷次數越多。</div>
    </div>
  );
}
