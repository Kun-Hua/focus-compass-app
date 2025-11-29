export type InterruptionStat = { reason: string; count: number };
export type Suggestion = { reason: string; suggestion: string };

const RULES: Record<string, string> = {
  '社交媒體': '使用專注 App 或系統勿擾模式，排程集中查看訊息的時間。',
  '通知': '關閉高干擾應用的推播，設定專注時段的靜音白名單。',
  '噪音': '準備降噪耳機或穩定噪音音源，安排在安靜時段做深度工作。',
  '多人打擾': '設置可見的專注指示（例如：專注燈/狀態卡），並在日曆預留不可打擾時段。',
  '疲勞': '調整番茄時長與休息節奏，將高認知任務安排在個人高峰時段。'
};

export function topNInterruptionReasons(records: Array<{ interruption_reason: string | null }>, n: number): InterruptionStat[] {
  const map = new Map<string, number>();
  for (const r of records) {
    const key = (r.interruption_reason || '').trim();
    if (!key) continue;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

export function suggestionsForReasons(stats: InterruptionStat[]): Suggestion[] {
  return stats.map(s => ({ reason: s.reason, suggestion: RULES[s.reason] || '建立明確開工儀式與環境隔離，降低情境切換成本。' }));
}
