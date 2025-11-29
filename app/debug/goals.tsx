import { useEffect, useMemo, useState } from 'react';
import { Button, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useGoals } from '@/core/hooks/useGoals';
import { useSubgoals } from '@/core/hooks/useSubgoals';
import { useHabitStreak } from '@/core/hooks/useHabitStreak';
import { useWeeklyStreak } from '@/core/hooks/useWeeklyStreak';
import { useFocusAnalytics } from '@/core/hooks/useFocusAnalytics';
import { useFocusDiagnostics } from '@/core/hooks/useFocusDiagnostics';
import { usePingSupabase } from '@/core/hooks/usePingSupabase';
import { useGoalsContext } from '@/core/context/GoalsContext';
import type { Goal } from '@/core/types/database';

export default function GoalsDebugScreen() {
  const { goals, addGoal, updateGoalName, updateGoalCategory, deleteGoal, reorderGoals } = useGoals();
  const { addFocusSession } = useGoalsContext();

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedSubgoalId, setSelectedSubgoalId] = useState<string | null>(null);

  const { subgoals, addSubgoal, updateSubgoalName, deleteSubgoal, reorderSubgoals } = useSubgoals(selectedGoalId);

  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<'Core' | 'Avoidance'>('Avoidance');
  const [renameGoalName, setRenameGoalName] = useState('');

  const [newSubgoalName, setNewSubgoalName] = useState('');
  const [renameSubgoalName, setRenameSubgoalName] = useState('');

  const [sessionMinutes, setSessionMinutes] = useState('25');
  const [sessionHonesty, setSessionHonesty] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);

  const habit = useHabitStreak();
  const weekly = useWeeklyStreak();
  const analytics = useFocusAnalytics();
  const diagnostics = useFocusDiagnostics();
  const ping = usePingSupabase();

  const selectedGoal: Goal | null = useMemo(
    () => goals.find((g) => g.goal_id === selectedGoalId) ?? null,
    [goals, selectedGoalId],
  );

  useEffect(() => {
    if (selectedGoal) {
      setRenameGoalName(selectedGoal.goal_name);
    } else {
      setRenameGoalName('');
    }
  }, [selectedGoal]);

  useEffect(() => {
    const sub = subgoals.find((s) => s.subgoal_id === selectedSubgoalId) ?? null;
    if (sub) {
      setRenameSubgoalName(sub.name);
    } else {
      setRenameSubgoalName('');
    }
  }, [subgoals, selectedSubgoalId]);

  const handleAddGoal = async () => {
    const name = newGoalName.trim();
    if (!name) return;
    const created = await addGoal(name, newGoalCategory);
    if (created && created.goal_id) {
      setSelectedGoalId(created.goal_id);
      setNewGoalName('');
    }
  };

  const handleRenameGoal = async () => {
    if (!selectedGoalId) return;
    const name = renameGoalName.trim();
    if (!name) return;
    await updateGoalName(selectedGoalId, name);
  };

  const handleToggleGoalCategory = async () => {
    if (!selectedGoal) return;
    const next: 'Core' | 'Avoidance' = selectedGoal.goal_category === 'Core' ? 'Avoidance' : 'Core';
    await updateGoalCategory(selectedGoal.goal_id, next);
  };

  const handleDeleteGoal = async () => {
    if (!selectedGoalId) return;
    await deleteGoal(selectedGoalId);
    setSelectedGoalId(null);
    setSelectedSubgoalId(null);
  };

  const handleMoveGoal = (direction: -1 | 1) => {
    if (!selectedGoalId) return;
    const index = goals.findIndex((g) => g.goal_id === selectedGoalId);
    if (index === -1) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= goals.length) return;
    const reordered = [...goals];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    reorderGoals(reordered);
  };

  const handleAddSubgoal = async () => {
    const name = newSubgoalName.trim();
    if (!selectedGoalId || !name) return;
    const created = await addSubgoal(name);
    if (created && created.subgoal_id) {
      setSelectedSubgoalId(created.subgoal_id);
      setNewSubgoalName('');
    }
  };

  const handleRenameSubgoal = async () => {
    if (!selectedSubgoalId) return;
    const name = renameSubgoalName.trim();
    if (!name) return;
    await updateSubgoalName(selectedSubgoalId, name);
  };

  const handleDeleteSubgoal = async () => {
    if (!selectedSubgoalId) return;
    await deleteSubgoal(selectedSubgoalId);
    setSelectedSubgoalId(null);
  };

  const handleMoveSubgoal = (subgoalId: string, direction: -1 | 1) => {
    const index = subgoals.findIndex((s) => s.subgoal_id === subgoalId);
    if (index === -1) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= subgoals.length) return;
    const ordered = [...subgoals];
    const [moved] = ordered.splice(index, 1);
    ordered.splice(targetIndex, 0, moved);
    const orderedIds = ordered.map((s) => s.subgoal_id);
    reorderSubgoals(orderedIds);
  };

  const handleAddFocusSession = async () => {
    if (!selectedGoalId) {
      setSessionStatus('請先選取 Goal');
      return;
    }
    const minutes = parseInt(sessionMinutes, 10);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setSessionStatus('請輸入有效的分鐘數');
      return;
    }
    setSessionStatus('寫入中...');
    try {
      await addFocusSession(selectedGoalId, minutes, sessionHonesty, {
        subgoalId: selectedSubgoalId,
      });
      setSessionStatus('已寫入 FocusSessionLog');
    } catch (e: any) {
      setSessionStatus(`寫入失敗: ${e?.message ?? String(e)}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedView style={styles.section}>
        <ThemedText type="title">Goals / Subgoals Debug</ThemedText>
        <ThemedText>用來驗證 Goals、Subgoals CRUD 與 FocusSession 寫入。</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Goals 列表</ThemedText>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="新增 Goal 名稱"
            value={newGoalName}
            onChangeText={setNewGoalName}
          />
          <Button
            title={newGoalCategory === 'Core' ? 'Core ✅' : 'Core'}
            onPress={() => setNewGoalCategory('Core')}
          />
          <Button
            title={newGoalCategory === 'Avoidance' ? 'Avoidance ✅' : 'Avoidance'}
            onPress={() => setNewGoalCategory('Avoidance')}
          />
          <Button title="新增 Goal" onPress={handleAddGoal} />
        </View>

        {goals.map((g, index) => (
          <ThemedView
            key={g.goal_id}
            style={[styles.card, selectedGoalId === g.goal_id && styles.cardSelected]}
          >
            <ThemedText type="defaultSemiBold">
              {index + 1}. {g.goal_name} ({g.goal_category})
            </ThemedText>
            <View style={styles.row}>
              <Button title="選取" onPress={() => setSelectedGoalId(g.goal_id)} />
            </View>
          </ThemedView>
        ))}

        {selectedGoal && (
          <ThemedView style={styles.subSection}>
            <ThemedText type="subtitle">選取中的 Goal 操作</ThemedText>
            <ThemedText>目前選取：{selectedGoal.goal_name}</ThemedText>
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                placeholder="新的 Goal 名稱"
                value={renameGoalName}
                onChangeText={setRenameGoalName}
              />
              <Button title="更新名稱" onPress={handleRenameGoal} />
            </View>
            <View style={styles.row}>
              <Button title="切換 Core/Avoidance" onPress={handleToggleGoalCategory} />
              <Button title="上移" onPress={() => handleMoveGoal(-1)} />
              <Button title="下移" onPress={() => handleMoveGoal(1)} />
              <Button title="刪除 Goal" onPress={handleDeleteGoal} />
            </View>
          </ThemedView>
        )}
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Subgoals</ThemedText>
        {!selectedGoal && <ThemedText>請先在上方選取一個 Goal。</ThemedText>}
        {selectedGoal && (
          <>
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                placeholder="新增 Subgoal 名稱"
                value={newSubgoalName}
                onChangeText={setNewSubgoalName}
              />
              <Button title="新增 Subgoal" onPress={handleAddSubgoal} />
            </View>
            {subgoals.map((s, idx) => (
              <ThemedView
                key={s.subgoal_id}
                style={[styles.card, selectedSubgoalId === s.subgoal_id && styles.cardSelected]}
              >
                <ThemedText>
                  {idx + 1}. {s.name}
                </ThemedText>
                <View style={styles.row}>
                  <Button title="選取" onPress={() => setSelectedSubgoalId(s.subgoal_id)} />
                  <Button title="上移" onPress={() => handleMoveSubgoal(s.subgoal_id, -1)} />
                  <Button title="下移" onPress={() => handleMoveSubgoal(s.subgoal_id, 1)} />
                </View>
              </ThemedView>
            ))}

            {selectedSubgoalId && (
              <ThemedView style={styles.subSection}>
                <ThemedText>選取中的 Subgoal 操作</ThemedText>
                <View style={styles.row}>
                  <TextInput
                    style={styles.input}
                    placeholder="新的 Subgoal 名稱"
                    value={renameSubgoalName}
                    onChangeText={setRenameSubgoalName}
                  />
                  <Button title="更新名稱" onPress={handleRenameSubgoal} />
                  <Button title="刪除 Subgoal" onPress={handleDeleteSubgoal} />
                </View>
              </ThemedView>
            )}
          </>
        )}
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">FocusSession 寫入</ThemedText>
        {!selectedGoal && <ThemedText>請先選取一個 Goal，必要時再選 Subgoal。</ThemedText>}
        {selectedGoal && (
          <>
            <ThemedText>目前 Goal：{selectedGoal.goal_name}</ThemedText>
            {selectedSubgoalId && (
              <ThemedText>目前 Subgoal：{renameSubgoalName}</ThemedText>
            )}
            <View style={styles.row}>
              <TextInput
                style={styles.input}
                placeholder="分鐘數"
                keyboardType="numeric"
                value={sessionMinutes}
                onChangeText={setSessionMinutes}
              />
              <Button
                title={sessionHonesty ? '誠實模式 ✅' : '非誠實模式'}
                onPress={() => setSessionHonesty((prev) => !prev)}
              />
              <Button title="寫入 FocusSessionLog" onPress={handleAddFocusSession} />
            </View>
            {sessionStatus && <ThemedText>{sessionStatus}</ThemedText>}
          </>
        )}
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Habit / Weekly Streak</ThemedText>
        <View style={styles.row}>
          <Button title="重新整理 Habit" onPress={habit.refresh} />
          <Button title="重新整理 Weekly" onPress={weekly.refresh} />
        </View>
        <ThemedText>
          Habit currentStreak: {habit.currentStreak}，今日是否完成：{habit.didCompleteToday ? '是' : '否'}
        </ThemedText>
        {habit.error && <ThemedText>Habit 錯誤：{habit.error}</ThemedText>}
        <ThemedText>
          Weekly streak: {weekly.weeklyStreak}，本週是否達標：{weekly.achievedThisWeek ? '是' : '否'}
        </ThemedText>
        {weekly.error && <ThemedText>Weekly 錯誤：{weekly.error}</ThemedText>}
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Focus Analytics</ThemedText>
        <View style={styles.row}>
          <Button title="重新整理 Analytics" onPress={analytics.refreshAnalytics} />
        </View>
        {analytics.error && <ThemedText>Analytics 錯誤：{analytics.error}</ThemedText>}
        <ThemedText>淨投入時間（分鐘）：{analytics.netCommittedMinutes}</ThemedText>
        <ThemedText>自我欺騙時間（分鐘）：{analytics.selfDeceptionMinutes}</ThemedText>
        <ThemedText>總時數（分鐘）：{analytics.totalDurationMinutes}</ThemedText>
        <ThemedText>誠實度比例：{analytics.honestyRatio}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Focus Diagnostics</ThemedText>
        <View style={styles.row}>
          <Button title="重新整理 Diagnostics" onPress={diagnostics.refresh} />
        </View>
        {diagnostics.error && <ThemedText>Diagnostics 錯誤：{diagnostics.error}</ThemedText>}
        <ThemedText>最常見中斷原因：{diagnostics.mostCommonReason ?? '無 / 平手'}</ThemedText>
        <ThemedText>中斷原因統計：</ThemedText>
        {Object.keys(diagnostics.reasonCounts).length === 0 && (
          <ThemedText>目前沒有中斷原因資料。</ThemedText>
        )}
        {Object.entries(diagnostics.reasonCounts).map(([reason, count]) => (
          <ThemedText key={reason}>
            {reason}: {count}
          </ThemedText>
        ))}
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Supabase 連線測試</ThemedText>
        <View style={styles.row}>
          <Button title="重新測試" onPress={ping.refresh} />
        </View>
        {ping.isLoading && <ThemedText>測試中...</ThemedText>}
        {!ping.isLoading && !ping.error && (
          <ThemedText>
            連線結果：{ping.hasData ? '成功（Goal 表有資料）' : '成功（Goal 表目前查不到資料）'}
          </ThemedText>
        )}
        {ping.error && <ThemedText>Supabase 連線錯誤：{ping.error}</ThemedText>}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 16,
  },
  section: {
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  subSection: {
    marginTop: 8,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 160,
  },
  card: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 4,
    gap: 4,
  },
  cardSelected: {
    borderColor: '#0a7ea4',
  },
});
