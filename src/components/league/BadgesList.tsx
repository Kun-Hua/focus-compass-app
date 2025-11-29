"use client"
import React from 'react'
import type { UserBadgeRow } from '@/lib/leagueApi'

type Props = { rows: UserBadgeRow[] }

export default function BadgesList({ rows }: Props) {
  return (
    <div className="rounded-md border">
      <div className="px-4 py-2 border-b text-sm text-gray-600">徽章</div>
      <div className="divide-y">
        {rows.map((r, idx) => (
          <div key={r.badge_id + '-' + idx} className="px-4 py-2 text-sm flex items-center justify-between">
            <div className="font-medium">{r.badge?.badge_name || r.badge_id}</div>
            <div className="text-xs text-gray-500">{new Date(r.granted_at).toLocaleString()}</div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="px-4 py-6 text-sm text-gray-500">尚無徽章</div>
        )}
      </div>
    </div>
  )
}
