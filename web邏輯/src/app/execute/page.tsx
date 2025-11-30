'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Circle, Video, Timer, Hourglass } from 'lucide-react';
import { useGoals } from '@/components/GoalsContext';
import FocusTimer from '@/components/FocusTimer';
import { useToast } from '@/hooks/use-toast';
import PomodoroTimer from '@/components/Commitment/PomodoroTimer';
import TimelapseRecorder from '@/components/Commitment/TimelapseRecorder';
import { useSubgoals } from '@/hooks/useSubgoals';

type TimerTab = 'stopwatch' | 'pomodoro' | 'timelapse';

const ExecutePage: React.FC = () => {
    const { goalPlans, calendarTasks, toggleCalendarTask, addFocusSession } = useGoals();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<TimerTab>('stopwatch');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState<string>('');
    const [honestyMode, setHonestyMode] = useState(false);
    const [selectedSubgoalId, setSelectedSubgoalId] = useState<string>('');
    // 停止後彈窗用的暫存狀態
    const [interruptReason, setInterruptReason] = useState<string>('');
    const [interruptCount, setInterruptCount] = useState<number>(0);
    const [showInterruptModal, setShowInterruptModal] = useState<boolean>(false);
    const [pendingDuration, setPendingDuration] = useState<number>(0);
    const [pendingGoalId, setPendingGoalId] = useState<string>('');
    const [pendingHonesty, setPendingHonesty] = useState<boolean>(false);
    const [pendingSubgoalId, setPendingSubgoalId] = useState<string>('');

    const todayKey = useMemo(() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }, []);

    const todaysTasks = calendarTasks[todayKey] || [];

    // 讀取 URL 的 goalId 參數並預設專注目標
    useEffect(() => {
        const gid = searchParams.get('goalId');
        if (gid) setSelectedGoalId(gid);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // 載入選定大目標的小目標
    const { subgoals } = useSubgoals(selectedGoalId || null);
    useEffect(() => {
        // 切換大目標時重置小目標選擇
        setSelectedSubgoalId('');
    }, [selectedGoalId]);

    const handleSessionComplete = async (durationMinutes: number, goalId: string, honesty?: boolean) => {
        if (!goalId) {
            alert('請先選擇一個要專注的目標！');
            return;
        }
        // 暫存，開啟中斷輸入彈窗
        setPendingDuration(durationMinutes);
        setPendingGoalId(goalId);
        setPendingHonesty(typeof honesty === 'boolean' ? honesty : honestyMode);
        setPendingSubgoalId(selectedSubgoalId || '');
        // 重置並開啟
        setInterruptReason('');
        setInterruptCount(0);
        setShowInterruptModal(true);
    };

    const handleConfirmInterruption = async (skip: boolean) => {
        setIsSubmitting(true);
        try {
            const reason = skip ? undefined : interruptReason;
            const count = skip ? 0 : interruptCount;

            await addFocusSession(pendingGoalId, pendingDuration, pendingHonesty, {
                interruptionCount: count,
                interruptionReason: reason,
                subgoalId: pendingSubgoalId || null,
            });

            toast({
                title: "儲存成功",
                description: `已為目標記錄 ${pendingDuration} 分鐘的專注時長。`,
            });
        } catch (error) {
            toast({
                title: "儲存失敗",
                description: error instanceof Error ? error.message : "發生未知錯誤",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
            setShowInterruptModal(false);
        }
    };

    const proEnabled = true; // 開發期間暫時開啟

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">行動 (Execute)</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Tasks and Goals */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 目標選擇 */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. 選擇專注目標</h2>
                        <select
                            value={selectedGoalId}
                            onChange={(e) => setSelectedGoalId(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="">-- 請選擇一個目標 --</option>
                            {goalPlans.map(g => (
                                <option key={g.goalId} value={g.goalId}>{g.goalName}</option>
                            ))}
                        </select>
                        {selectedGoalId && (
                          <div className="mt-4">
                            <label className="block text-sm text-gray-700 mb-1">選擇小目標（可選）</label>
                            <select
                              value={selectedSubgoalId}
                              onChange={(e) => setSelectedSubgoalId(e.target.value)}
                              className="w-full p-2 border rounded-md"
                            >
                              <option value="">-- 不指定小目標 --</option>
                              {subgoals.map(sg => (
                                <option key={sg.subgoal_id} value={sg.subgoal_id}>{sg.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                    </section>

                    {/* Today's Tasks */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">今日待辦</h2>
                        <div className="bg-white rounded-lg shadow p-6 space-y-4">
                            {todaysTasks.length > 0 ? (
                                todaysTasks.map(task => (
                                    <div key={task.id} className="flex items-center gap-3">
                                        <button onClick={() => toggleCalendarTask(todayKey, task.id)}>
                                            {task.done ? <CheckCircle2 className="text-green-500" /> : <Circle className="text-gray-400" />}
                                        </button>
                                        <span className={`flex-1 ${task.done ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                            {task.text}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">今天沒有安排任務。請至「承諾」頁面新增。</p>
                            )}
                        </div>
                    </section>

                    {/* Weekly Goals */}
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">本週計畫回顧</h2>
                        <div className="space-y-4">
                            {goalPlans.map(g => g.plans.weekly && (
                                <div key={g.goalId} className="bg-white rounded-lg shadow p-4">
                                    <h3 className="font-semibold text-gray-700">{g.goalName}</h3>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap mt-1">{g.plans.weekly}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column: Timers */}
                <div className="flex flex-col items-center lg:items-start">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. 選擇計時器</h2>
                    <div className="w-full max-w-sm">
                        {/* Honesty Mode Toggle */}
                        <div className="mb-4 p-3 border rounded-md bg-white shadow-sm space-y-3">
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="font-medium text-gray-700">
                                    誠實問責模式
                                    <span className={`ml-2 text-xs font-mono px-2 py-0.5 rounded ${honestyMode ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {honestyMode ? 'true' : 'false'}
                                    </span>
                                </span>
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only"
                                        checked={honestyMode}
                                        onChange={() => setHonestyMode(!honestyMode)}
                                    />
                                    <div className={`block w-14 h-8 rounded-full ${honestyMode ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${honestyMode ? 'transform translate-x-6' : ''}`}></div>
                                </div>
                            </label>
                            <p className="mt-2 text-xs text-gray-500">
                                {honestyMode ? (
                                    <>
                                        你現在是完全專注的，不會被任何事物干擾。選擇此模式將<strong className="text-gray-700">會</strong>納入時間複利分析。
                                    </>
                                ) : (
                                    <>
                                        你現在是無法專注的，會被事物干擾。選擇此模式將<strong className="text-gray-700">不會</strong>納入時間複利分析。
                                    </>
                                )}
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b mb-4">
                            <button onClick={() => setActiveTab('stopwatch')} className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'stopwatch' ? 'border-b-2 border-black text-black' : 'text-gray-500'}`}>
                                <Hourglass size={16} /> 碼表
                            </button>
                            <button onClick={() => setActiveTab('pomodoro')} className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'pomodoro' ? 'border-b-2 border-black text-black' : 'text-gray-500'}`}>
                                <Timer size={16} /> 番茄鐘
                            </button>
                            <button onClick={() => setActiveTab('timelapse')} className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'timelapse' ? 'border-b-2 border-black text-black' : 'text-gray-500'}`}>
                                <Video size={16} /> 縮時錄影
                            </button>
                        </div>

                        {/* Timer Content */}
                        <div className="relative p-4 bg-gray-50 rounded-lg">
                            {/* 碼表和番茄鐘：只有在 active 時才顯示 */}
                            <div className={activeTab === 'stopwatch' ? 'block' : 'hidden'}>
                                <FocusTimer
                                    onSessionComplete={handleSessionComplete}
                                    isSubmitting={isSubmitting}
                                    goalId={selectedGoalId}
                                    currentHonestyMode={honestyMode}
                                />
                            </div>
                            <div className={activeTab === 'pomodoro' ? 'block' : 'hidden'}>
                                <PomodoroTimer
                                  proEnabled={proEnabled}
                                  currentHonestyMode={honestyMode}
                                  onFocusComplete={({ minutes }) => {
                                      if (!selectedGoalId) {
                                          alert('請先選擇一個要專注的目標！');
                                          return;
                                      }
                                      handleSessionComplete(minutes, selectedGoalId, honestyMode);
                                  }}
                                />
                            </div>

                            {/* 縮時錄影：保持掛載，僅透過 CSS 切換可見性，避免切換分頁時中止錄影 */}
                            <div className={activeTab === 'timelapse' ? 'space-y-4' : 'hidden'}>
                                <TimelapseRecorder
                                    videoWidth={640}
                                    videoHeight={360}
                                    onStop={({ estimatedMinutes }) => {
                                        if (!selectedGoalId) return;
                                        // 確保有選擇目標且時間大於0
                                        if (selectedGoalId && estimatedMinutes > 0) {
                                            handleSessionComplete(estimatedMinutes, selectedGoalId, honestyMode);
                                        }
                                    }}
                                />
                                {!proEnabled && (
                                    <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
                                        升級至 Pro
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* 停止後：中斷紀錄彈窗 */}
            {showInterruptModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative bg-white w-full max-w-md p-6 rounded-lg shadow-xl z-10">
                  <h3 className="text-lg font-semibold mb-4">記錄此次中斷</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">中斷原因</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={interruptReason}
                        onChange={(e) => setInterruptReason(e.target.value)}
                      >
                        <option value="">請選擇...</option>
                        <option value="雜務">雜務</option>
                        <option value="通知">通知</option>
                        <option value="疲勞">疲勞</option>
                        <option value="走神">走神</option>
                        <option value="社群媒體">社群媒體</option>
                        <option value="生理需求">生理需求</option>
                        <option value="會議/打擾">會議/打擾</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">中斷次數</label>
                      <input
                        type="number"
                        min={0}
                        className="w-full border rounded px-3 py-2"
                        value={interruptCount}
                        onChange={(e) => setInterruptCount(Math.max(0, Number(e.target.value || 0)))}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded px-4 py-2 text-sm border"
                        onClick={() => handleConfirmInterruption(true)}
                        disabled={isSubmitting}
                      >
                        完全專注
                      </button>
                      <button
                        className="rounded px-4 py-2 text-sm bg-black text-white disabled:bg-gray-400"
                        disabled={!interruptReason || isSubmitting}
                        onClick={() => handleConfirmInterruption(false)}
                      >
                        {isSubmitting ? '儲存中...' : '確認儲存'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
    );
};

export default ExecutePage;