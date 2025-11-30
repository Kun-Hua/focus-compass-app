import { supabase } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';

export function useFocusDiagnostics(userId: string | null) {
  const [interruptionReasonCounts, setInterruptionReasonCounts] = useState<Record<string, number>>({});
  const [topInterruptionReason, setTopInterruptionReason] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('FocusSessionLog')
        .select('interruption_reason')
        .eq('user_id', userId)
        .not('interruption_reason', 'is', null);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((session) => {
        if (session.interruption_reason) {
          counts[session.interruption_reason] = (counts[session.interruption_reason] || 0) + 1;
        }
      });

      setInterruptionReasonCounts(counts);

      let maxCount = 0;
      let maxReason = null;
      for (const [reason, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count;
          maxReason = reason;
        }
      }
      setTopInterruptionReason(maxReason);

    } catch (error) {
      console.error('Failed to load focus diagnostics:', error);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { interruptionReasonCounts, topInterruptionReason, refresh };
}
