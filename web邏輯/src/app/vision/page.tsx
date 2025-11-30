'use client';

import { Trash2, Pencil } from 'lucide-react';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useGoals } from '@/components/GoalsContext';
import { Goal } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSubgoals } from '@/hooks/useSubgoals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 單一目標卡片元件
const GoalCard = ({ goal, onDelete, onRename, isOverlay = false }: { goal: Goal; onDelete?: (id: string) => void; onRename?: (id: string, newName: string) => void | Promise<void>; isOverlay?: boolean; }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: goal.goal_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging || isOverlay ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
    cursor: isOverlay ? 'grabbing' : 'grab',
  };

  const [renaming, setRenaming] = React.useState(false);
  const [tempName, setTempName] = React.useState(goal.goal_name);

  const saveRename = async () => {
    const newName = tempName.trim();
    if (!newName || newName === goal.goal_name) { setRenaming(false); return; }
    await onRename?.(goal.goal_id, newName);
    setRenaming(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group p-4 mb-2 bg-white border rounded-lg shadow-sm flex items-center justify-between ${isOverlay ? 'ring-2 ring-blue-500' : ''}`}
    >
      {renaming ? (
        <div className="flex-1 flex items-center gap-2">
          <input
            className="flex-1 border rounded px-2 py-1"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setRenaming(false); }}
            autoFocus
          />
          <Button size="sm" variant="default" onClick={saveRename}>儲存</Button>
          <Button size="sm" variant="outline" onClick={() => { setTempName(goal.goal_name); setRenaming(false); }}>取消</Button>
        </div>
      ) : (
        <>
          <p {...listeners} className="font-medium flex-grow cursor-grab">{goal.goal_name}</p>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onRename && (
              <button
                onClick={() => { setTempName(goal.goal_name); setRenaming(true); }}
                className="text-gray-500 hover:text-gray-700 p-1 rounded"
                aria-label="更名"
                title="更名"
              >
                <Pencil size={16} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(goal.goal_id)}
                className="text-gray-400 hover:text-red-500 p-1 rounded-full"
                aria-label={`刪除目標 ${goal.goal_name}`}
                title={`刪除目標`}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// 可拖放的容器元件
const DroppableContainer = ({
  id,
  title,
  items,
  count,
  limit,
  onDelete,
  onSort,
  onRename,
}: {
  id: string;
  title: string;
  items: Goal[];
  count: number;
  limit: number;
  onDelete: (id: string) => void;
  onSort: (event: DragEndEvent) => void;
  onRename: (id: string, newName: string) => void | Promise<void>;
}) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className="bg-gray-100 p-4 rounded-lg w-full md:w-1/2 min-h-[200px]"
    >
      <h3 className="text-lg font-bold mb-4 text-gray-700">
        {title} ({count}/{limit})
      </h3>
      <SortableContext id={id} items={items.map((i) => i.goal_id)} strategy={verticalListSortingStrategy}>
        {items.map((goal) => (
          <GoalCard key={goal.goal_id} goal={goal} onDelete={onDelete} onRename={onRename} />
        ))}
      </SortableContext>
    </div>
  );
};

const VisionPage: React.FC = () => {
  const { allGoals, loading, error, addGoal, updateGoalCategory, deleteGoal, reorderGoals, updateGoalName, coreTop5, goalPlans, updatePlan, calendarTasks, setCalendarTasks } = useGoals();
  const [newGoalName, setNewGoalName] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [skipStep1, setSkipStep1] = useState<boolean>(false);
  const [step1Answers, setStep1Answers] = useState<{
    q1: string;
    q2: string;
    q3: string;
    q4: string;
  }>({ q1: '', q2: '', q3: '', q4: '' });
  const [savedMsg, setSavedMsg] = useState<string>('');

  // Commitment calendar & plans states
  type DayTask = { id: string; text: string; done: boolean; goalId?: string | null };
  const [current, setCurrent] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });
  const [draftTaskText, setDraftTaskText] = useState<Record<string, string>>({});
  const [assignTarget, setAssignTarget] = useState<{ key: string; taskId: string } | null>(null);

  const activeGoal = useMemo(() => allGoals?.find(g => g.goal_id === activeId), [activeId, allGoals]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { coreGoals, avoidanceGoals, displayedCoreGoals, displayedAvoidanceGoals } = useMemo(() => {    
    const split = (allGoals || []).reduce<{ coreGoals: Goal[]; avoidanceGoals: Goal[] }>(
      (acc, goal) => {
        if (goal.goal_category === 'Core') {
          acc.coreGoals.push(goal);
        } else {
          acc.avoidanceGoals.push(goal);
        }
        return acc;
      },
      { coreGoals: [], avoidanceGoals: [] }
    );
    const displayedCore = split.coreGoals.slice(0, 5);
    const displayedAvoidance = split.avoidanceGoals.slice(0, 20);
    return {
      coreGoals: split.coreGoals,
      avoidanceGoals: split.avoidanceGoals,
      displayedCoreGoals: displayedCore,
      displayedAvoidanceGoals: displayedAvoidance,
    };
  }, [allGoals]);

  // Calendar helpers
  const firstDay = useMemo(() => new Date(current.year, current.month, 1), [current]);
  const daysInMonth = useMemo(() => new Date(current.year, current.month + 1, 0).getDate(), [current]);
  const startWeekday = firstDay.getDay();
  const gridDays = useMemo(() => {
    const days: (Date | null)[] = Array(42).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days[startWeekday + d - 1] = new Date(current.year, current.month, d);
    }
    return days;
  }, [current, startWeekday, daysInMonth]);
  const toKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // MIT 導航：讀取 query 並定位月份
  const searchParams = useSearchParams();
  const mitDate = searchParams.get('mitDate');
  const mitId = searchParams.get('mitId');

  useEffect(() => {
    if (!mitDate) return;
    const [yy, mm, dd] = mitDate.split('-').map(Number);
    if (!yy || !mm || !dd) return;
    const mit = new Date(yy, mm - 1, dd);
    setCurrent({ year: mit.getFullYear(), month: mit.getMonth() });
  }, [mitDate]);

  // Subgoal management states
  const [selectedCoreGoalId, setSelectedCoreGoalId] = useState<string>('');
  useEffect(() => {
    // Default select first core goal when available
    if (!selectedCoreGoalId && coreGoals.length > 0) {
      setSelectedCoreGoalId(coreGoals[0].goal_id);
    }
  }, [coreGoals, selectedCoreGoalId]);
  const { subgoals, addSubgoal, updateSubgoalName, deleteSubgoal, reorderSubgoals, error: subgoalError } = useSubgoals(selectedCoreGoalId || null);
  const [newSubgoalName, setNewSubgoalName] = useState('');

  const moveSubgoal = useCallback((idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= subgoals.length) return;
    const newOrder = [...subgoals].map(s => s.subgoal_id);
    const [a, b] = [newOrder[idx], newOrder[target]];
    newOrder[idx] = b; newOrder[target] = a;
    reorderSubgoals(newOrder);
  }, [subgoals, reorderSubgoals]);

  // Local persistence for STEP 1
  useEffect(() => {
    try {
      const s1 = localStorage.getItem('vision.step1Answers'); // 保持和舊版一致
      const sk = localStorage.getItem('vision.skipStep1'); // 保持和舊版一致
      if (s1) setStep1Answers(JSON.parse(s1));
      if (sk) setSkipStep1(sk === 'true');
    } catch (_) {
      // ignore
    }
  }, []);

  const saveStep1 = () => {
    try {
      localStorage.setItem('vision.step1Answers', JSON.stringify(step1Answers)); // 保持和舊版一致
      setSavedMsg('已儲存 STEP 1 回答');
      setTimeout(() => setSavedMsg(''), 1500);
    } catch (_) {
      // ignore
    }
  };

  // Step 3 已移除

  const handleAddGoal = async () => {
    if (newGoalName.trim()) {
      await addGoal(newGoalName, 'Avoidance');
      setNewGoalName('');
    }
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !activeId) return;

    const activeContainer = active.data.current?.sortable.containerId;
    const overContainer = over.data.current?.sortable.containerId || over.id;

    if (activeContainer && overContainer && activeContainer !== overContainer) {
      const newCategory = overContainer === 'core-goals' ? 'Core' : 'Avoidance';
      updateGoalCategory(activeId, newCategory);
    }
  }, [activeId, updateGoalCategory]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    // 僅處理列表內排序
    if (over && active.id !== over.id && active.data.current?.sortable.containerId === over.data.current?.sortable.containerId) {
      const containerId = active.data.current.sortable.containerId;
      const items = containerId === 'core-goals' ? coreGoals : avoidanceGoals;
      const oldIndex = items.findIndex((item) => item.goal_id === active.id);
      const newIndex = items.findIndex((item) => item.goal_id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        const otherItems = allGoals.filter(g => g.goal_category !== (containerId === 'core-goals' ? 'Core' : 'Avoidance'));
        reorderGoals([...otherItems, ...reorderedItems]);
      }
    }

    setActiveId(null);
  }, [coreGoals, avoidanceGoals, allGoals, reorderGoals]);

  const handleRenameGoal = useCallback(async (goalId: string, newName: string) => {
    await updateGoalName(goalId, newName.trim());
  }, [updateGoalName]);

  // Commitment actions
  const addTask = (date: Date) => {
    const key = toKey(date);
    const text = (draftTaskText[key] || '').trim();
    if (!text) return;
    const newTask: DayTask = { id: crypto.randomUUID(), text, done: false };
    setCalendarTasks((prev) => ({ ...prev, [key]: [...(prev[key] || []), newTask] }));
    setDraftTaskText((prev) => ({ ...prev, [key]: '' }));
    setAssignTarget({ key, taskId: newTask.id });
  };
  const toggleTask = (key: string, taskId: string) => {
    setCalendarTasks((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
    }));
  };
  const removeTask = (key: string, taskId: string) => {
    setCalendarTasks((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((t) => t.id !== taskId),
    }));
  };
  const gotoPrevMonth = () => {
    setCurrent((c) => {
      const m = c.month - 1;
      return m < 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: m };
    });
  };
  const gotoNextMonth = () => {
    setCurrent((c) => {
      const m = c.month + 1;
      return m > 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: m };
    });
  };
  const monthLabel = useMemo(() => `${current.year} 年 ${current.month + 1} 月`, [current]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">願景 (Vision)</h1>
      <p className="text-gray-600 mb-6">
        根據巴菲特 5/25 法則，專注於 5 個核心目標，其餘的列為避免清單。
      </p>

      {/* 以終為始 */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>以終為始</CardTitle>
            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={skipStep1}
                onChange={(e) => {
                  const v = e.target.checked;
                  setSkipStep1(v);
                  try { localStorage.setItem('vision.skipStep1', String(v)); } catch (_) {} // 保持和舊版一致
                }}
              />
              <span>我已清楚目標，暫時跳過 STEP 1</span>
            </label>
          </div>
        </CardHeader>
        {!skipStep1 && (
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              問自己最終想被怎麼記得，這是定義「終點」的關鍵。
            </p>
            <div className="space-y-6">
              <div>
                <label className="block font-medium mb-2">1. 如果你今天80歲回顧今生，你希望別人怎麼形容你？（三句話內）</label>
                <textarea
                  className="w-full min-h-[80px] p-3 border rounded-md"
                  value={step1Answers.q1}
                  onChange={(e) => setStep1Answers((s) => ({ ...s, q1: e.target.value }))}
                  placeholder="例如：誠信可靠、願意助人、持續成長的人…"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">2. 你希望你的人生「留下什麼」？（對誰有幫助、創造什麼影響）</label>
                <textarea
                  className="w-full min-h-[80px] p-3 border rounded-md"
                  value={step1Answers.q2}
                  onChange={(e) => setStep1Answers((s) => ({ ...s, q2: e.target.value }))}
                />
              </div>
              <div>
                <label className="block font-medium mb-2">3. 你理想的一天長什麼樣子？（從早到晚：你在哪裡、在做什麼、和誰在一起）</label>
                <textarea
                  className="w-full min-h-[80px] p-3 border rounded-md"
                  value={step1Answers.q3}
                  onChange={(e) => setStep1Answers((s) => ({ ...s, q3: e.target.value }))}
                />
              </div>
              <div>
                <label className="block font-medium mb-2">4. 若人生只能留下3個價值觀，它們是什麼？（如：成長、自由、影響力、誠信、創造力…）</label>
                <textarea
                  className="w-full min-h-[80px] p-3 border rounded-md"
                  value={step1Answers.q4}
                  onChange={(e) => setStep1Answers((s) => ({ ...s, q4: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={saveStep1}>儲存 STEP 1</Button>
                {savedMsg && <span className="text-sm text-green-600">{savedMsg}</span>}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 巴菲特 5/25 法 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>巴菲特 5/25 法</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700">
            先寫多，再刪光。寫下 25 個具體目標，圈出最重要的 5 個，其餘列為避免清單。
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>職業生涯（例：創立 AI 教育品牌）</li>
            <li>財務（例：財務自由、年投報 10%）</li>
            <li>學習（例：雅思 7.0、學會德文）</li>
            <li>人際（例：找到志同道合的夥伴）</li>
            <li>健康與生活（例：體脂 15%、固定冥想）</li>
          </ul>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
            小提示：評估依據－是否直接貢獻你的北極星？若完成這 5 項，是否足以讓你今生滿意？
          </div>

          <div className="mt-4 p-4 border rounded-lg bg-white shadow">
            <h2 className="text-xl font-semibold mb-3">新增目標</h2>
            <div className="flex space-x-2">
              <Input
                type="text"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                placeholder="輸入一個新目標，它會先進入避免清單..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
              />
              <Button onClick={handleAddGoal} disabled={loading}>
                新增
              </Button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-center">讀取目標中...</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col md:flex-row gap-8">
            <DroppableContainer
              id="core-goals"
              title="核心目標 (Core Goals)"
              items={displayedCoreGoals}
              count={displayedCoreGoals.length}
              limit={5}
              onDelete={deleteGoal}
              onSort={(e) => {}} // 內部排序由 handleDragEnd 處理
              onRename={handleRenameGoal}
            />
            <DroppableContainer
              id="avoidance-goals"
              title="避免清單 (Avoidance List)"
              items={displayedAvoidanceGoals}
              count={displayedAvoidanceGoals.length}
              limit={20}
              onDelete={deleteGoal}
              onSort={(e) => {}} // 內部排序由 handleDragEnd 處理
              onRename={handleRenameGoal}
            />
          </div>
          <DragOverlay>
            {activeGoal ? <GoalCard goal={activeGoal} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* 針對每個核心目標的就地小目標管理 */}
      {coreGoals.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>為每個核心目標新增/管理小目標</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayedCoreGoals.map((g) => (
              <div key={g.goal_id} className="border rounded-lg p-3 bg-white space-y-2">
                <div className="text-sm font-semibold text-gray-700">{g.goal_name}</div>
                <PerGoalSubgoalManager goalId={g.goal_id} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 核心目標拆解：年/季/月/週（來自 Commitment） */}
      <section className="space-y-4 mt-8">
        <h2 className="text-xl font-semibold">核心目標拆解：年/季/月/週</h2>
        <p className="text-sm text-gray-600">此處的五個核心目標來自「願景 (Vision)」頁面。請為每個目標設定可量化的子計畫。</p>
        <div className="space-y-4">
          {goalPlans.map((g) => (
            <div key={g.goalId} className="rounded border p-4 space-y-3 bg-white">
              <h3 className="text-lg font-medium">{g.goalName}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <label className="text-sm text-gray-600">年度目標</label>
                  <textarea
                    className="w-full rounded border p-2 min-h-[84px]"
                    value={g.plans.annual}
                    onChange={(e) => updatePlan(g.goalId, 'annual', e.target.value)}
                    placeholder="輸入實際可量化的年度目標"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-600">季度目標</label>
                  <textarea
                    className="w-full rounded border p-2 min-h-[84px]"
                    value={g.plans.quarterly}
                    onChange={(e) => updatePlan(g.goalId, 'quarterly', e.target.value)}
                    placeholder="配合年度目標的季度里程碑"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-600">月度目標</label>
                  <textarea
                    className="w-full rounded border p-2 min-h-[84px]"
                    value={g.plans.monthly}
                    onChange={(e) => updatePlan(g.goalId, 'monthly', e.target.value)}
                    placeholder="配合季度目標的月度計畫"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-600">周度目標</label>
                  <textarea
                    className="w-full rounded border p-2 min-h-[84px]"
                    value={g.plans.weekly}
                    onChange={(e) => updatePlan(g.goalId, 'weekly', e.target.value)}
                    placeholder="下週的具體行動清單"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-gray-600">一週承諾時數</label>
                  <input
                    type="number"
                    className="w-full rounded border p-2"
                    value={g.plans.weeklyHours || ''}
                    onChange={(e) => updatePlan(g.goalId, 'weeklyHours', e.target.value)}
                    placeholder="小時"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 日曆：安排每日任務（來自 Commitment） */}
      <section className="space-y-4 mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">日曆：安排每日任務</h2>
          <div className="flex items-center gap-2">
            <button className="rounded border px-3 py-1" onClick={gotoPrevMonth}>上個月</button>
            <span className="text-gray-700">{monthLabel}</span>
            <button className="rounded border px-3 py-1" onClick={gotoNextMonth}>下個月</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {["日","一","二","三","四","五","六"].map((w) => (
            <div key={w} className="bg-white p-2 text-center text-xs font-medium text-gray-500">{w}</div>
          ))}
          {gridDays.map((d, idx) => (
            <div key={idx} className="min-h-32 bg-white p-2 align-top">
              {d ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">{d.getDate()}</div>
                  <div className="space-y-1">
                    {(calendarTasks[toKey(d)] || []).map((t) => (
                      <div
                        key={t.id}
                        className={`flex items-center justify-between rounded px-2 py-1 border ${mitDate === toKey(d) && mitId === t.id ? 'bg-yellow-100 border-yellow-300' : 'bg-blue-50 border-blue-100'}`}
                      >
                        <div className="flex items-center gap-2">
                          {t.goalId && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white">
                              {allGoals.find(g => g.goal_id === t.goalId)?.goal_name || '目標'}
                            </span>
                          )}
                          <button
                            className={`text-xs ${t.done ? 'line-through text-gray-400' : ''}`}
                            onClick={() => toggleTask(toKey(d), t.id)}
                          >{t.text}</button>
                        </div>
                        <button className="text-xs text-red-600" onClick={() => removeTask(toKey(d), t.id)}>刪除</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <input
                      className="flex-1 rounded border px-2 py-1 text-xs"
                      placeholder="新增"
                      value={draftTaskText[toKey(d)] || ''}
                      onChange={(e) => setDraftTaskText((prev) => ({ ...prev, [toKey(d)]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') addTask(d); }}
                    />
                    <button className="rounded bg-black px-2 py-1 text-xs text-white" onClick={() => addTask(d)}>+</button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* 指派目標的對話框（來自 Commitment） */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-md p-4 space-y-3">
            <div className="text-lg font-semibold">這個任務屬於哪個目標？</div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {((coreTop5.length > 0 ? coreTop5 : allGoals.filter(g => g.goal_category === 'Core'))).map(g => (
                <button
                  key={g.goal_id}
                  className="w-full text-left px-3 py-2 rounded border hover:bg-gray-50"
                  onClick={() => {
                    const { key, taskId } = assignTarget;
                    setCalendarTasks(prev => ({
                      ...prev,
                      [key]: (prev[key] || []).map(t => t.id === taskId ? { ...t, goalId: g.goal_id } : t)
                    }));
                    setAssignTarget(null);
                  }}
                >{g.goal_name}</button>
              ))}
              {coreTop5.length === 0 && allGoals.filter(g => g.goal_category === 'Core').length === 0 && (
                <div className="text-sm text-gray-600">尚未設定核心目標，請先到願景/目標頁設定。</div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button className="px-3 py-1 rounded border" onClick={() => setAssignTarget(null)}>稍後再說</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 針對單一核心目標的小目標管理元件（就地新增/列出/改名/刪除/排序：上下移）
function PerGoalSubgoalManager({ goalId }: { goalId: string }) {
  const { subgoals, addSubgoal, updateSubgoalName, deleteSubgoal, reorderSubgoals } = useSubgoals(goalId);
  const [name, setName] = React.useState('');

  const move = React.useCallback((idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= subgoals.length) return;
    const ordered = [...subgoals].map(s => s.subgoal_id);
    const [a, b] = [ordered[idx], ordered[target]];
    ordered[idx] = b; ordered[target] = a;
    reorderSubgoals(ordered);
  }, [subgoals, reorderSubgoals]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="輸入小目標名稱"
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { addSubgoal(name.trim()); setName(''); } }}
        />
        <Button onClick={() => { if (name.trim()) { addSubgoal(name.trim()); setName(''); } }}>新增</Button>
      </div>
      <div className="space-y-2">
        {subgoals.length === 0 ? (
          <p className="text-xs text-gray-500">尚無小目標</p>
        ) : subgoals.map((sg, idx) => (
          <div key={sg.subgoal_id} className="flex items-center gap-2">
            <input
              className="flex-1 border rounded px-2 py-1"
              value={sg.name}
              onChange={(e) => updateSubgoalName(sg.subgoal_id, e.target.value)}
            />
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => move(idx, -1)} disabled={idx === 0}>上移</Button>
              <Button variant="outline" size="sm" onClick={() => move(idx, 1)} disabled={idx === subgoals.length - 1}>下移</Button>
              <Button variant="destructive" size="sm" onClick={() => deleteSubgoal(sg.subgoal_id)}>刪除</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VisionPage;