/**
 * Timelapse Utility
 * 
 * Captures frames at 4-second intervals and synthesizes them into
 * a timelapse video at 30fps using FFmpeg (Backend Service).
 * 
 * Parameters:
 * - Capture Interval: 4.0 seconds
 * - Playback FPS: 30 fps
 * - Compression Ratio: 120x (120s real time = 1s video)
 * - Output Format: HEVC (H.265)
 * 
 * Example: 30 min focus = 450 frames = 15 sec video
 */

// Use legacy API to avoid deprecation errors in Expo SDK 52+
// @ts-ignore
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabaseClient';

// Backend Service URL
const BACKEND_URL = 'https://timelapse-backend-781873682796.asia-east1.run.app';

// Flag to track if FFmpeg is available (set after first attempt)
let ffmpegAvailable: boolean | null = null;

// Timelapse configuration
export const TIMELAPSE_CONFIG = {
    captureIntervalMs: 4000, // 4 seconds
    playbackFps: 30,
    compressionRatio: 120,
    outputFormat: 'hevc', // H.265
};

// Get temp directory for storing frames
export const getFramesDirectory = async (): Promise<string> => {
    const dir = `${FileSystem.cacheDirectory}timelapse_frames/`;
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    return dir;
};

// Clean up frames after synthesis
export const cleanupFrames = async (): Promise<void> => {
    try {
        const dir = await getFramesDirectory();
        await FileSystem.deleteAsync(dir, { idempotent: true });
        console.log('[Timelapse] Cleaned up frames directory');
    } catch (error) {
        console.error('[Timelapse] Failed to cleanup frames:', error);
    }
};

// Get output video path
export const getOutputVideoPath = (): string => {
    const timestamp = Date.now();
    return `${FileSystem.cacheDirectory}timelapse_${timestamp}.mp4`;
};

/**
 * Synthesize all captured frames into a timelapse video
 * 
 * @param framesDir Directory containing frame images (frame_0001.jpg, frame_0002.jpg, etc.)
 * @param outputPath Path for the output video file (Local path, ignored for cloud synthesis but kept for compat)
 * @param onProgress Optional callback for progress updates
 * @returns Promise<string | null> - Path to the synthesized video (Public URL), or null if failed
 */
export const synthesizeVideo = async (
    framesDir: string,
    outputPath: string,
    onProgress?: (progress: number) => void
): Promise<string | null> => {
    console.log('[Timelapse] Cloud synthesis requested');

    // Generate a unique session ID for this batch
    const sessionId = Crypto.randomUUID();
    console.log(`[Timelapse] Session ID: ${sessionId}`);

    try {
        // 1. Check and List Frames
        const files = await FileSystem.readDirectoryAsync(framesDir);
        // Supports both .jpg (old way) and .mp4 (new anti-flicker way)
        const frameFiles = files.filter((f: string) =>
            f.startsWith('frame_') && (f.endsWith('.jpg') || f.endsWith('.mp4'))
        ).sort();

        if (frameFiles.length === 0) {
            console.error('[Timelapse] No frames found');
            return null;
        }

        console.log(`[Timelapse] Found ${frameFiles.length} frames. Uploading to Cloud...`);
        if (onProgress) onProgress(0.1);

        // 2. Upload Frames to Supabase Storage
        // Upload in batches to avoid overwhelming network/memory
        const BATCH_SIZE = 3;
        let uploadedCount = 0;

        for (let i = 0; i < frameFiles.length; i += BATCH_SIZE) {
            const batch = frameFiles.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (filename) => {
                const fileUri = `${framesDir}${filename}`;
                const contentType = filename.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg';

                const formData = new FormData();
                formData.append('files', {
                    uri: fileUri,
                    name: filename,
                    type: contentType,
                } as any);

                const { error } = await supabase.storage
                    .from('timelapse_frames')
                    .upload(`${sessionId}/${filename}`, formData, {
                        upsert: true
                    });

                if (error) {
                    console.error(`[Timelapse] Upload error for ${filename}:`, error);
                }
            }));

            uploadedCount += batch.length;
            const progress = 0.1 + (0.6 * (uploadedCount / frameFiles.length)); // 10% -> 70%
            if (onProgress) onProgress(progress);
        }

        console.log('[Timelapse] Upload complete. Triggering Cloud Synthesis...');
        if (onProgress) onProgress(0.75);

        // 3. Trigger Cloud Run Synthesis
        const response = await fetch(`${BACKEND_URL}/synthesize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, fps: TIMELAPSE_CONFIG.playbackFps })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cloud synthesis failed: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log('[Timelapse] Cloud synthesis Result:', result);

        if (result.success && result.url) {
            if (onProgress) onProgress(1.0);
            return result.url; // Return the Public URL of the video
        } else {
            throw new Error('Cloud response success=false');
        }

    } catch (error) {
        console.error('[Timelapse] Synthesis error:', error);
        return null; // Return null on failure so UI handles it
    }
};

/**
 * Calculate expected video duration based on frames captured
 * 
 * @param frameCount Number of frames captured
 * @returns Duration in seconds
 */
export const calculateVideoDuration = (frameCount: number): number => {
    return frameCount / TIMELAPSE_CONFIG.playbackFps;
};

/**
 * Format frame filename with zero-padding
 * 
 * @param index Frame index (0-based)
 * @returns Formatted filename (e.g., "frame_0001.jpg")
 */
export const getFrameFilename = (index: number): string => {
    return `frame_${(index + 1).toString().padStart(4, '0')}.jpg`;
};
