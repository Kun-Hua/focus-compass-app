import FocusLeagueLeaderboard from '@/components/FocusLeagueLeaderboard'

export default function LeaderboardPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Focus League</h1>
        <p className="text-gray-500">與志同道合的夥伴一起成長</p>
      </header>
      <FocusLeagueLeaderboard />
    </div>
  )
}