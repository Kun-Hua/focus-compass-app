'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/core/lib/supabaseClient';

export interface FocusDiagnosticsResult {
  isLoading: boolean;
  error: string | null;
  mostCommonReason: string | null;
  reasonCounts: Record<string, number>;
  refresh: () => void;
}

export function useFocusDiagnostics(): FocusDiagnosticsResult {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reasonCounts, setReasonCounts] = useState<Record<string, number>>({});

  const fetchDiagnostics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_interruption_reason_counts');

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const reasonCountsMap = (data || []).reduce((acc: Record<string, number>, item: { reason: string; count: number }) => {
        if (item.reason) acc[item.reason] = item.count;
        return acc;
      }, {});
      setReasonCounts(reasonCountsMap);
    } catch (err: any) {
      setError(err.message || 'Failed to load diagnostics');
      setReasonCounts({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  const mostCommonReason = useMemo(() => {
    let topReason: string | null = null;
    let topCount = -1;
    let isTie = false;

    Object.entries(reasonCounts).forEach(([reason, count]) => {
      if (count > topCount) {
        topReason = reason;
        topCount = count;
        isTie = false;
      } else if (count === topCount) {
        isTie = true;
      }
    });
    return isTie ? null : topReason;
  }, [reasonCounts]);

  const refresh = useCallback(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  return { isLoading, error, mostCommonReason, reasonCounts, refresh };
}
