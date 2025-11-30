"use client"
import React from 'react'
import type { AnonymousBoardRow } from '@/lib/leagueApi'

type Props = { rows: AnonymousBoardRow[]; selfMaskedId?: string }

export default function AnonymousBoard({ rows, selfMaskedId }: Props) {
  const size = rows.length
  const upMax = Math.min(4, size)
  const downMin = Math.max(size - 4 + 1, 1)
  const maxMinutes = Math.max(1, ...rows.map(r => r.weekly_honest_minutes || 0))

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="px-4 py-2 border-b text-sm text-gray-600 bg-white sticky top-[60px] z-10">當週匿名排名</div>
      <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b">
        <div className="col-span-1 text-right">名次</div>
        <div className="col-span-4">匿名 ID</div>
        <div className="col-span-7">本週誠實分鐘</div>
      </div>
      <div className="divide-y">
        {rows.map((r, idx) => {
          const rank = r.rank_in_group ?? idx + 1
          const up = rank <= upMax
          const down = rank >= downMin
          const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : ''
          const ratio = Math.min(1, (r.weekly_honest_minutes || 0) / maxMinutes)
          const isMe = selfMaskedId && r.masked_id === selfMaskedId

          return (
            <div
              key={r.masked_id + '-' + idx}
              className={`px-4 py-2 transition-colors ${up ? 'bg-green-50' : down ? 'bg-red-50' : ''} ${up ? 'border-l-4 border-l-green-500' : down ? 'border-l-4 border-l-red-500' : ''} ${isMe ? 'ring-2 ring-offset-1 ring-indigo-400 bg-indigo-50/50' : ''}`}
            >
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-1 text-right font-semibold tabular-nums">
                  {rank}
                </div>
                <div className="col-span-4 flex items-center gap-2">
                  <span className={`text-lg leading-none ${isMe ? 'animate-pulse' : ''}`}>{medal}</span>
                  <span className={`font-mono text-sm ${isMe ? 'text-indigo-800 font-semibold' : 'text-gray-700'}`}>{r.masked_id}{isMe ? '（You）' : ''}</span>
                </div>
                <div className="col-span-7">
                  <div className="h-2 w-full bg-gray-200 rounded">
                    <div className={`h-2 rounded transition-all duration-500 ${up ? 'bg-green-600' : down ? 'bg-red-600' : isMe ? 'bg-indigo-600' : 'bg-gray-800'}`} style={{ width: `${Math.max(2, Math.round(ratio * 100))}%` }} />
                  </div>
                  <div className="mt-1 text-xs text-gray-700 tabular-nums">{r.weekly_honest_minutes} 分鐘</div>
                </div>
              </div>
            </div>
          )
        })}
        {rows.length === 0 && (
          <div className="px-4 py-6 text-sm text-gray-500">目前沒有資料</div>
        )}
      </div>
      <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 flex items-center gap-4">
        <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 bg-green-500" />升級區 1–4</div>
        <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 bg-red-500" />降級區 末 4</div>
      </div>
    </div>
  )
}
