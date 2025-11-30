"use client"
import React from 'react'
import type { League, LeagueMapping } from '@/lib/leagueApi'
import { getLeagueName } from '@/lib/leagueApi'

type Props = {
  leagues: League[]
  mapping: LeagueMapping | null
}

export default function LeagueCard({ leagues, mapping }: Props) {
  const id = mapping?.current_league_id ?? 1
  const name = getLeagueName(leagues, id)
  const isL10 = id === 10
  const hqc = !!mapping?.hqc_status
  const lastPromo = mapping?.last_promotion_date ? new Date(mapping.last_promotion_date).toLocaleString() : null

  return (
    <div className="rounded-md border p-4">
      <div className="text-sm text-gray-500">目前段位</div>
      <div className="mt-2 flex items-center gap-3">
        <div className={`relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 text-white select-none ${isL10 && hqc ? 'shadow-[0_0_0_3px_rgba(34,197,94,0.4),0_0_20px_6px_rgba(34,197,94,0.25)] ring-2 ring-green-400 animate-pulse' : ''}`}>
          <span className="text-lg font-bold">{id ?? '-'}</span>
        </div>
        <div>
          <div className="text-2xl font-semibold flex items-center gap-2">
            <span>{name}</span>
            {isL10 && (
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${hqc ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {hqc ? '委員會光環 • 已啟用' : '委員會光環 • 未達標'}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            L{id ?? '-'}{isL10 ? ' • 榮譽段位（永久）' : ''}
            {lastPromo && <span className="ml-2">上次晉升：{lastPromo}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
