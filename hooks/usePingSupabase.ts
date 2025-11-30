import { supabase } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';

export function usePingSupabase() {
  const [hasData, setHasData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('Goal').select('*').limit(1);
      if (error) throw error;
      setHasData(true);
      setError(null);
    } catch (err: any) {
      setHasData(false);
      setError(err.message ?? String(err));
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return { hasData, error, checkConnection };
}
