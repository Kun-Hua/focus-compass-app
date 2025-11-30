"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'

type LeaderboardRow = {
  display_name: string
  weekly_honest_minutes: number
  rank_in_group: number
}

export default function FocusLeagueLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchLeaderboard = useCallback(async (opts?: { initial?: boolean }) => {
    if (opts?.initial) {
      setLoading(true)
      setError(null)
    } else {
      setRefreshing(true)
    }

    const { data, error } = await supabase
      .from('focus_league_user_details')
      .select('display_name, weekly_honest_minutes, rank_in_group')
      .order('rank_in_group', { ascending: true })

    if (error) {
      setError(error.message)
      console.error('Error fetching leaderboard:', error)
    } else {
      setLeaderboard(data || [])
    }

    if (opts?.initial) {
      setLoading(false)
    }
    setRefreshing(false)
  }, [])

  useEffect(() => {
    let isActive = true

    fetchLeaderboard({ initial: true })

    // 即時訂閱：排行榜統計表異動
    const statsChannel = supabase
      .channel('focus_league_leaderboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'focus_league_user_stats' },
        () => {
          if (isActive) {
            fetchLeaderboard()
          }
        }
      )
      .subscribe()

    // 即時訂閱：專注紀錄新增時，也觸發排行榜刷新
    const sessionChannel = supabase
      .channel('focus_league_sessions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'FocusSessionLog' },
        () => {
          if (isActive) {
            fetchLeaderboard()
          }
        }
      )
      .subscribe()

    // 定時補捉（避免遺漏任何事件）
    const intervalId = setInterval(() => {
      if (isActive) {
        fetchLeaderboard()
      }
    }, 60_000)

    return () => {
      isActive = false
      supabase.removeChannel(statsChannel)
      supabase.removeChannel(sessionChannel)
      clearInterval(intervalId)
    }
  }, [fetchLeaderboard])

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">即時聯盟排行榜</h2>

      {loading && <div>讀取中...</div>}
      {error && <div className="text-red-600">錯誤: {error}</div>}
      {!loading && !error && (
        <div className="border rounded-lg overflow-hidden">
          {refreshing && <div className="px-4 py-2 text-xs text-gray-500">更新中…</div>}
          <div className="divide-y">
            {leaderboard.map((row, idx) => {
              const size = leaderboard.length
              const upCount = size >= 8 ? 4 : Math.ceil(size / 2)
              const downCount = size >= 8 ? 4 : Math.floor(size / 2)
              const upMax = Math.min(upCount, size)
              const downMin = size - downCount + 1
              const rank = row.rank_in_group
              const isUp = rank <= upMax
              const isDown = rank >= downMin

              return (
                <div
                  key={row.display_name + '-' + idx}
                  className={`px-4 py-2 flex items-center gap-4 ${isUp ? 'bg-green-50' : isDown ? 'bg-red-50' : ''} ${isUp ? 'border-l-4 border-l-green-500' : isDown ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="w-10 text-right font-semibold tabular-nums">{rank}</div>
                  <div className="flex-1 text-sm text-gray-800">{row.display_name}</div>
                  <div className="text-sm text-gray-700 tabular-nums">{row.weekly_honest_minutes} 分鐘</div>
                </div>
              )
            })}
            {leaderboard.length === 0 && null}
          </div>
        </div>
      )}
    </div>
  )
}