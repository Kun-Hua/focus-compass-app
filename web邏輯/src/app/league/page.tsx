"use client"
import React, { useEffect, useState } from 'react'
import {
  getLeagues,
  getLeagueName,
  getMyBadges,
  getMyLeagueHistory,
  getMyLeagueMapping,
  type LeagueHistoryRow,
  type UserBadgeRow,
  getWeekStartISO,
} from '@/lib/leagueApi'
import type { League, LeagueMapping } from '@/lib/leagueApi'
import HistoryList from '@/components/league/HistoryList'
import BadgesList from '@/components/league/BadgesList'
import FocusLeagueLeaderboard from '@/components/FocusLeagueLeaderboard'
import LeagueCard from '@/components/league/LeagueCard'

export default function LeaguePage() {
  const [leagues, setLeagues] = useState<League[] | null>(null)
  const [mapping, setMapping] = useState<LeagueMapping | null>(null)
  const [history, setHistory] = useState<LeagueHistoryRow[]>([])
  const [badges, setBadges] = useState<UserBadgeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const weekStart = getWeekStartISO()
        const [ls, mp, his, bgs] = await Promise.all([
          getLeagues(),
          getMyLeagueMapping(),
          getMyLeagueHistory(50),
          getMyBadges(),
        ])
        if (!mounted) return
        setLeagues(ls)
        setMapping(mp)
        setHistory(his)
        setBadges(bgs)
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || '載入失敗')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className={`max-w-4xl mx-auto px-4 py-6 space-y-6`}>
      <h1 className="text-2xl font-semibold">專注聯賽</h1>
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="text-sm text-gray-500">載入中...</div>}

      {/* 段位卡 */}
      <section>
        <LeagueCard leagues={leagues || []} mapping={mapping} />
      </section>

      {/* 即時聯盟排行榜 */}
      <section>
        <FocusLeagueLeaderboard />
      </section>

      {/* 保留：排行榜、徽章、歷史 */}

      <section className="grid md:grid-cols-2 gap-6">
        <BadgesList rows={badges} />
      </section>

      <section>
        <HistoryList rows={history} />
      </section>
    </div>
  )
}
