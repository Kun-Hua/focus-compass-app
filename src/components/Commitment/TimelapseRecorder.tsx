'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button'; // 假設 buttonVariants 存在
import { Video, VideoOff, Play, Square, Download, Trash2, Loader2 } from 'lucide-react';

interface TimelapseRecorderProps {
    videoWidth?: number;
    videoHeight?: number;
    onStop: (result: { estimatedMinutes: number }) => void;
    frameIntervalMs?: number; // 擷取畫面的間隔 (ms)
}

// Wake Lock API 的類型定義
interface WakeLockSentinel extends EventTarget {
    release(): Promise<void>;
    readonly released: boolean;
    type: 'screen';
}

const TimelapseRecorder: React.FC<TimelapseRecorderProps> = ({
    videoWidth = 640, // 降低預設解析度以減少 getImageData 負載
    videoHeight = 480,
    onStop,
    frameIntervalMs = 1000, // 預設每秒擷取一幀
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const capturedFramesRef = useRef<ImageData[]>([]);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);
    // 使用 requestAnimationFrame 相關的 ref
    const animationFrameRef = useRef<number | null>(null);
    const synthesisAnimationFrameRef = useRef<number | null>(null); // 新增：用於影片合成的 requestAnimationFrame
    const isRecordingRef = useRef(false); // 使用 ref 來追蹤錄製狀態，避免閉包問題
    const isProcessingRef = useRef(false); // 新增：用於追蹤處理狀態，避免閉包問題
    const startTsRef = useRef<number | null>(null);
    const elapsedIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); // 新增：處理中狀態
    const [hasPermission, setHasPermission] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    // 新增：計時器狀態
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const STORAGE_KEY = 'timelapse_state_v1';
    const recomputeElapsed = useCallback(() => {
        if (!startTsRef.current) return;
        const secs = Math.max(0, Math.floor((Date.now() - startTsRef.current) / 1000));
        setElapsedSeconds(secs);
    }, []);

    // 請求攝影機權限
    const requestCameraPermission = useCallback(async () => {
        setError(null);
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: videoWidth, height: videoHeight },
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            // --- 解決方案：新增串流終止監聽器 ---
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.onended = () => {
                    console.error('[Timelapse] MediaStream Track Ended unexpectedly! 錄影意外中斷。');
                    setError('錄影意外中斷：攝影機串流停止。請檢查其他應用程式是否佔用或系統權限問題。');
                    handleStop(); // 強制停止錄製流程
                };
            }
            setHasPermission(true);
        } catch (err) {
            console.error("無法取得攝影機權限:", err);
            setError("無法取得攝影機權限。請檢查您的瀏覽器設定。");
            setHasPermission(false);
        }
    }, [videoWidth, videoHeight]);

    // 請求螢幕保持喚醒
    const requestWakeLock = async () => {
        if ('wakeLock' in navigator) {
            try {
                wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                console.log('螢幕喚醒鎖已啟動');
            } catch (err: any) {
                console.error(`無法取得螢幕喚醒鎖: ${err.name}, ${err.message}`);
            }
        }
    };

    // 釋放螢幕喚醒鎖
    const releaseWakeLock = async () => {
        if (wakeLockRef.current) {
            await wakeLockRef.current.release();
            wakeLockRef.current = null;
            console.log('螢幕喚醒鎖已釋放');
        }
    };

    // 開始錄影
    const handleStart = () => {
        if (!hasPermission || !videoRef.current || !canvasRef.current) {
            setError("請先啟動攝影機。");
            return;
        }
        setVideoUrl(null); // 清除上一個影片
        capturedFramesRef.current = []; // 清空上一輪的畫面
        setError(null);
        setIsRecording(true);
        isRecordingRef.current = true; // 同步更新 ref
        startTsRef.current = Date.now();
        setElapsedSeconds(0); // 初始顯示
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ start_ts: startTsRef.current, isRecording: true })); } catch {}
        // 以低頻 interval 確保背景/切頁依然精準
        if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
        elapsedIntervalRef.current = setInterval(recomputeElapsed, 1000);
        requestWakeLock(); // 請求喚醒鎖

        // --- 使用 requestAnimationFrame 重構畫面擷取與計時邏輯 ---
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });

        let lastCaptureTime = 0;
        let lastSecondTime = 0; // 保留，但實際顯示改以時間戳為準

        const loop = (currentTime: number) => {
            if (!isRecordingRef.current) return; // 使用 ref 的值來判斷

            // 更新顯示（時間戳）
            recomputeElapsed();

            // 擷取畫面 (根據 frameIntervalMs)
            if (currentTime - lastCaptureTime >= frameIntervalMs) {
                lastCaptureTime = currentTime;
                if (context && videoRef.current) {
                    context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
                    const frameData = context.getImageData(0, 0, videoWidth, videoHeight);
                    capturedFramesRef.current.push(frameData);
                }
            }

            animationFrameRef.current = requestAnimationFrame(loop);
        };

        // 啟動迴圈
        animationFrameRef.current = requestAnimationFrame(loop);
    };

    // 停止錄影
    const handleStop = async () => {
        setIsRecording(false);
        isRecordingRef.current = false; // 同步更新 ref
        releaseWakeLock(); // 釋放喚醒鎖
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
        if (elapsedIntervalRef.current) { clearInterval(elapsedIntervalRef.current); elapsedIntervalRef.current = null; }

        // 停止 requestAnimationFrame 迴圈
        if (animationFrameRef.current) { // 停止畫面擷取迴圈
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        const estimatedSeconds = startTsRef.current ? Math.max(0, Math.floor((Date.now() - startTsRef.current) / 1000)) : elapsedSeconds;
        const estimatedMinutes = Math.floor(estimatedSeconds / 60);
        if (estimatedMinutes > 0) {
            onStop({ estimatedMinutes });
        }
        setElapsedSeconds(0); // 重置計時器
        startTsRef.current = null;

        if (capturedFramesRef.current.length === 0) {
            // 無擷取畫面：僅做時間追蹤，不合成影片
            return;
        }

        console.log(
            `[Timelapse] handleStop: 開始合成影片。總共 ${capturedFramesRef.current.length} 幀。`,
            { capturedFrames: capturedFramesRef.current }
        );

        // --- 開始合成影片 ---
        setIsProcessing(true);
        isProcessingRef.current = true; // 同步更新 ref

        const FINAL_VIDEO_FPS = 10; // 定義最終影片的播放幀率 (10 FPS 是縮時攝影的良好標準)
        
        // 使用 Promise 確保非同步操作完成
        await new Promise<void>(async resolve => {
            const canvas = canvasRef.current;
            if (!canvas) return resolve();

            const context = canvas.getContext('2d', { willReadFrequently: true });
            if (!context) return resolve();

            // --- 解決方案：預先繪製第一幀 ---
            // 在啟動錄製器前，先將第一張圖片繪製到 Canvas 上
            console.log('[Timelapse] handleStop: 正在預先繪製第 0 幀。');
            const firstFrame = capturedFramesRef.current[0];
            context.putImageData(firstFrame, 0, 0);

            const stream = canvas.captureStream(FINAL_VIDEO_FPS);
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            const chunks: Blob[] = [];

            recorder.ondataavailable = e => {
                if (e.data.size > 0) {
                    console.log(`[Timelapse] ondataavailable: 收到資料 chunk，大小: ${e.data.size}`);
                    chunks.push(e.data);
                }
            };
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                console.log(`[Timelapse] onstop: 影片合成完畢。Blob 大小: ${blob.size}, URL: ${url}`);
                setVideoUrl(url);
                setIsProcessing(false);
                isProcessingRef.current = false; // 同步更新 ref
                capturedFramesRef.current = []; // 清空記憶體
                resolve();
            };

            recorder.start();
            console.log('[Timelapse] handleStop: MediaRecorder 已啟動。');

            // --- 精確的繪圖循環 ---
            // 根據目標 FPS 計算出每一幀需要繪製的間隔時間
            const drawingIntervalMs = 1000 / FINAL_VIDEO_FPS;
            let frameIndex = 1; // 從索引 1 (第二張圖片) 開始

            const drawNextFrame = () => {
                console.log(`[Timelapse] drawNextFrame: 準備繪製第 ${frameIndex} 幀 / 共 ${capturedFramesRef.current.length - 1} 幀。`);
                if (frameIndex < capturedFramesRef.current.length) {
                    context.putImageData(capturedFramesRef.current[frameIndex], 0, 0);
                    frameIndex++;
                    setTimeout(drawNextFrame, drawingIntervalMs);
                } else {
                    console.log('[Timelapse] drawNextFrame: 所有幀已繪製完畢，準備停止錄製。');
                    // 確保最後一幀被捕捉
                    setTimeout(() => {
                        recorder.stop();
                        console.log('[Timelapse] drawNextFrame: 已呼叫 recorder.stop()。');
                    }, drawingIntervalMs);
                }
            };

            // 在 recorder.start() 後稍作延遲，然後開始繪圖循環
            setTimeout(drawNextFrame, drawingIntervalMs);
        });
    };

    // 捨棄影片並重設
    const handleDiscard = () => {
        if (videoUrl) {
            URL.revokeObjectURL(videoUrl);
        }
        setVideoUrl(null);
        setIsProcessing(false);
        isProcessingRef.current = false; // 同步更新 ref
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
        if (elapsedIntervalRef.current) { clearInterval(elapsedIntervalRef.current); elapsedIntervalRef.current = null; }
    };

    // 清理資源
    // 移除 videoUrl 相關的 useEffect，因為 URL.revokeObjectURL 應該在 videoUrl 改變時立即執行
    // 並且在元件卸載時，如果 videoUrl 存在，也會被最外層的 cleanup 處理
    // 這樣可以避免在 videoUrl 改變時，舊的 URL 沒有被立即釋放的問題
    useEffect(() => {
        if (videoUrl) {
            return () => {
                URL.revokeObjectURL(videoUrl);
            };
        }
    }, [videoUrl]); // 當 videoUrl 改變時，釋放舊的 URL

    useEffect(() => {
        // 掛載時嘗試恢復
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const s = JSON.parse(raw) as { start_ts?: number; isRecording?: boolean };
                if (s.start_ts) {
                    startTsRef.current = s.start_ts;
                    setIsRecording(!!s.isRecording);
                    isRecordingRef.current = !!s.isRecording;
                    recomputeElapsed();
                    if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
                    elapsedIntervalRef.current = setInterval(recomputeElapsed, 1000);
                }
            }
        } catch {}

        // 可見性補算
        const onVis = () => { if (document.visibilityState === 'visible') recomputeElapsed(); };
        document.addEventListener('visibilitychange', onVis);

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (synthesisAnimationFrameRef.current) { // 清理合成迴圈
                cancelAnimationFrame(synthesisAnimationFrameRef.current);
            }
            if (videoUrl) { // 確保在組件卸載時釋放 videoUrl
                URL.revokeObjectURL(videoUrl);
            }
            releaseWakeLock();
            if (elapsedIntervalRef.current) { clearInterval(elapsedIntervalRef.current); elapsedIntervalRef.current = null; }
            try { localStorage.removeItem(STORAGE_KEY); } catch {}
            document.removeEventListener('visibilitychange', onVis);
        };
    }, [recomputeElapsed, videoUrl]);

    // 格式化時間顯示
    const formattedTime = useMemo(() => {
        const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
        const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }, [elapsedSeconds]);

    return (
        <div className="space-y-4 text-center">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video w-full">
                {/* 影片播放器，錄製時顯示即時影像，錄製後顯示成果 */}
                <video ref={videoRef} src={videoUrl ?? undefined} autoPlay playsInline muted={!videoUrl && !isProcessing} controls={!!videoUrl} className={`w-full h-full object-cover ${videoUrl ? 'block' : 'block'}`}></video>
                {/* 用於擷取畫面的隱藏畫布 */}
                <canvas ref={canvasRef} width={videoWidth} height={videoHeight} className="hidden"></canvas>

                {!hasPermission && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                        <VideoOff className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-300">攝影機未啟動</p>
                    </div>
                )}
                {(isRecording || isProcessing) && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-sm font-mono px-2 py-1 rounded flex items-center gap-2">
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isProcessing ? '合成中...' : formattedTime}
                    </div>
                )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {isProcessing ? (
                <Button disabled className="w-full">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    正在處理影片...
                </Button>
            ) : videoUrl ? (
                <div className="grid grid-cols-2 gap-2">
                    <a href={videoUrl} download={`focus-compass-timelapse-${new Date().toISOString()}.webm`} className={buttonVariants({ variant: 'default' })}>
                        <Download className="mr-2 h-4 w-4" /> 下載影片
                    </a>
                    <Button onClick={handleDiscard} variant="outline">
                        <Trash2 className="mr-2 h-4 w-4" /> 捨棄
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col space-y-2">
                    {!hasPermission ? (
                        <Button onClick={requestCameraPermission} className="w-full">
                            <Video className="mr-2 h-4 w-4" /> 啟動攝影機
                        </Button>
                    ) : !isRecording ? (
                        <Button onClick={handleStart} className="w-full bg-green-600 hover:bg-green-700">
                            <Play className="mr-2 h-4 w-4" /> 開始專注
                        </Button>
                    ) : (
                        <Button onClick={handleStop} className="w-full bg-red-600 hover:bg-red-700">
                            <Square className="mr-2 h-4 w-4" /> 停止並記錄
                        </Button>
                    )}
                </div>
            )}
            <p className="text-xs text-gray-500">
                {isRecording ? "此模式將在專注期間保持螢幕開啟。" : (isProcessing ? "請稍候，正在為您產生縮時影片。" : "錄製的影片將可供下載。")}
            </p>
        </div>
    );
};

export default TimelapseRecorder;