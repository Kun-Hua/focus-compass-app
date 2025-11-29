import { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getMyLeagueMapping } from '@/core/services/leagueApi';

export default function LeagueDebugScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyLeagueMapping();
      setResult(data ?? null);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.block}>
        <ThemedText type="title">聯賽 API Debug</ThemedText>
        <ThemedText style={styles.caption}>
          呼叫 getMyLeagueMapping()，顯示回傳結果或錯誤訊息。
        </ThemedText>
        <Button title={loading ? '讀取中…' : '重新載入'} onPress={run} disabled={loading} />
        {error && (
          <ThemedText style={styles.error}>
            錯誤：
            {error}
          </ThemedText>
        )}
        <ThemedText style={styles.resultLabel}>回傳結果：</ThemedText>
        <ThemedText style={styles.resultText}>
          {result ? JSON.stringify(result, null, 2) : '尚無資料（可能尚未登入或沒有對應紀錄）。'}
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  block: {
    gap: 12,
  },
  caption: {
    marginBottom: 8,
  },
  error: {
    marginTop: 8,
    color: 'red',
  },
  resultLabel: {
    marginTop: 12,
    fontWeight: '600',
  },
  resultText: {
    marginTop: 4,
    fontFamily: 'monospace',
  },
});
