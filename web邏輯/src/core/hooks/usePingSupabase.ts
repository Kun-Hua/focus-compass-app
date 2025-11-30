'use client';

import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/core/lib/supabaseClient';

interface PingState {
  isLoading: boolean;
  error: string | null;
  hasData: boolean;
  refresh: () => void;
}

export const usePingSupabase = (): PingState => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  const run = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase.from('Goal').select('*').limit(1);
      if (fetchError) {
        throw fetchError;
      }
      setHasData(!!data && data.length > 0);
    } catch (err: any) {
      setError(err.message ?? String(err));
      setHasData(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  const refresh = () => {
    run();
  };

  return { isLoading, error, hasData, refresh };
};
