"use client"
import React from 'react'
import type { LeagueHistoryRow } from '@/lib/leagueApi'

type Props = { rows: LeagueHistoryRow[] }

export default function HistoryList({ rows }: Props) {
  return (
    <div className="rounded-md border">
      <div className="px-4 py-2 border-b text-sm text-gray-600">升降歷史</div>
      <div className="divide-y">
        {rows.map(r => (
          <div key={r.history_id} className="px-4 py-2 text-sm flex items-center justify-between">
            <div className="text-gray-600">{r.week_start}</div>
            <div className="font-medium">
              L{r.prev_league_id} → L{r.new_league_id}
              <span className={`ml-2 text-xs ${r.movement === 'up' ? 'text-green-600' : r.movement === 'down' ? 'text-red-600' : 'text-gray-500'}`}>{r.movement}</span>
            </div>
            <div className="text-gray-700">{r.weekly_honest_minutes} 分鐘</div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="px-4 py-6 text-sm text-gray-500">尚無歷史</div>
        )}
      </div>
    </div>
  )
}
