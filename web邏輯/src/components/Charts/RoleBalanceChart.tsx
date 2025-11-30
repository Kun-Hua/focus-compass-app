"use client";
import React from 'react';

export type PieDatum = { label: string; value: number; color?: string };

function pickColor(i: number) {
  const palette = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#fb7185'];
  return palette[i % palette.length];
}

export default function RoleBalanceChart({ data }: { data: PieDatum[] }) {
  const total = data.reduce((s, d, i) => s + (d.value || 0), 0);
  const slices = data.map((d, i) => ({ ...d, color: d.color || pickColor(i) }));

  // 簡易環狀圖（使用 conic-gradient），在老舊瀏覽器可退化為清單
  let gradient = '';
  let acc = 0;
  slices.forEach((s, i) => {
    const pct = total > 0 ? (s.value / total) * 100 : 0;
    const start = acc;
    const end = acc + pct;
    acc = end;
    gradient += `${s.color} ${start}% ${end}%,`;
  });
  gradient = gradient.replace(/,$/, '');

  return (
    <div className="rounded border p-4 space-y-4">
      <h3 className="text-lg font-semibold">角色平衡（高誠實度時長）</h3>
      <div className="flex items-center gap-6">
        <div
          className="w-40 h-40 rounded-full"
          style={{
            background: total > 0 ? `conic-gradient(${gradient})` : '#e5e7eb',
            mask: 'radial-gradient(circle at center, transparent 52%, black 53%)',
            WebkitMask: 'radial-gradient(circle at center, transparent 52%, black 53%)'
          }}
          aria-label="角色平衡環狀圖"
        />
        <div className="space-y-2">
          {slices.length === 0 ? (
            <div className="text-sm text-gray-500">沒有資料</div>
          ) : (
            slices.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="inline-block w-3 h-3 rounded" style={{ background: s.color }} />
                <span className="text-gray-700">{s.label || '未分類'}</span>
                <span className="ml-auto font-medium">{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
