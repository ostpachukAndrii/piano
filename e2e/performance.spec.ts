import { expect, test, Page } from '@playwright/test';
import { gotoE2E, waitForApp, simulateNotePress, simulateNoteRelease } from './helpers/midi-simulator';

/**
 * Performance tests for the scrolling player.
 *
 * These tests verify that the game loop runs smoothly during gameplay:
 *   1. FPS stays consistently above a minimum threshold
 *   2. Individual frame budgets are not exceeded (no long frames / jank)
 *   3. Memory does not leak over a full song playthrough
 *   4. Multiple back-to-back playthroughs don't degrade performance
 *
 * All measurements happen inside the browser via performance.now()
 * to avoid Playwright round-trip latency skewing the results.
 */

// Ode to Joy note data — [midi, startBeat, durationBeats]
const ODE_TO_JOY_TIMED: [number, number, number][] = [
    [64, 0, 1.0], [64, 1, 1.0], [65, 2, 1.0], [67, 3, 1.0],
    [67, 4, 1.0], [65, 5, 1.0], [64, 6, 1.0], [62, 7, 1.0],
    [60, 8, 1.0], [60, 9, 1.0], [62, 10, 1.0], [64, 11, 1.0],
    [64, 12, 1.5], [62, 13.5, 0.5], [62, 14, 2.0],
    [64, 16, 1.0], [64, 17, 1.0], [65, 18, 1.0], [67, 19, 1.0],
    [67, 20, 1.0], [65, 21, 1.0], [64, 22, 1.0], [62, 23, 1.0],
    [60, 24, 1.0], [60, 25, 1.0], [62, 26, 1.0], [64, 27, 1.0],
    [62, 28, 1.5], [60, 29.5, 0.5], [60, 30, 2.0],
];

const LEAD_IN_BEATS = 8;
const MS_PER_BEAT = 600; // 100 BPM

async function clickPlay(page: Page): Promise<void> {
    await page.locator('.play-btn').evaluate((el) => (el as HTMLElement).click());
}

async function switchToFlowMode(page: Page): Promise<void> {
    const flowToggle = page.locator('mat-button-toggle[value="flow"]');
    await flowToggle.evaluate((el) => (el as HTMLElement).querySelector('button')?.click());
    await page.waitForTimeout(200);
}

async function scheduleAllNotes(page: Page): Promise<void> {
    await page.evaluate(({ notes, leadIn, msPerBeat }) => {
        const backend = (window as any).__mockBackend;
        for (const [midi, startBeat, duration] of notes) {
            const pressTime = (startBeat + leadIn) * msPerBeat;
            const releaseTime = pressTime + duration * msPerBeat;
            setTimeout(() => backend.simulateChord([midi], 'right'), pressTime);
            setTimeout(() => backend.simulateNoteOff(midi), releaseTime);
        }
    }, { notes: ODE_TO_JOY_TIMED, leadIn: LEAD_IN_BEATS, msPerBeat: MS_PER_BEAT });
}

/**
 * Install a lightweight FPS monitor inside the browser.
 * It hooks into requestAnimationFrame independently of the game loop
 * and records per-frame timestamps for later analysis.
 */
async function installFpsMonitor(page: Page): Promise<void> {
    await page.evaluate(() => {
        const w = window as any;
        w.__perfFrames = [] as number[];
        w.__perfRunning = true;

        let lastTime = performance.now();
        function tick() {
            if (!w.__perfRunning) return;
            const now = performance.now();
            w.__perfFrames.push(now - lastTime);
            lastTime = now;
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    });
}

/**
 * Stop the FPS monitor and return collected frame times.
 */
async function collectFpsData(page: Page): Promise<number[]> {
    return page.evaluate(() => {
        const w = window as any;
        w.__perfRunning = false;
        return w.__perfFrames as number[];
    });
}

/**
 * Take a heap snapshot (Chrome only — returns 0 in other browsers).
 */
async function getHeapUsageMB(page: Page): Promise<number> {
    return page.evaluate(() => {
        const mem = (performance as any).memory;
        if (!mem) return 0;
        return mem.usedJSHeapSize / (1024 * 1024);
    });
}

test.describe('Performance — Scrolling Player', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/lesson/ode-to-joy');
        await waitForApp(page);

        await expect(page.locator('app-lesson-player')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Ode to Joy' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('app-scrolling-player')).toBeVisible({ timeout: 5000 });
        await page.locator('app-scrolling-player').scrollIntoViewIfNeeded();
    });

    // ---------------------------------------------------------------
    // Test 1: FPS Monitoring
    // ---------------------------------------------------------------
    test('flow mode maintains smooth frame rate (>= 30 FPS average)', async ({ page }) => {
        test.setTimeout(60000);

        await switchToFlowMode(page);
        await installFpsMonitor(page);
        await scheduleAllNotes(page);
        await clickPlay(page);

        // Wait for completion
        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 45000 });

        const frameTimes = await collectFpsData(page);

        // Need enough frames to be meaningful (at least 5 seconds of data)
        expect(frameTimes.length).toBeGreaterThan(100);

        // Calculate average FPS
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const avgFps = 1000 / avgFrameTime;

        // Average FPS should be at least 30
        console.log(`[Perf] Average FPS: ${avgFps.toFixed(1)}, Average frame time: ${avgFrameTime.toFixed(1)}ms, Total frames: ${frameTimes.length}`);
        expect(avgFps).toBeGreaterThanOrEqual(30);

        // 95th percentile frame time should be under 50ms (20 FPS floor for spikes)
        const sorted = [...frameTimes].sort((a, b) => a - b);
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        console.log(`[Perf] P95 frame time: ${p95.toFixed(1)}ms, P99: ${sorted[Math.floor(sorted.length * 0.99)].toFixed(1)}ms`);
        expect(p95).toBeLessThan(50);
    });

    // ---------------------------------------------------------------
    // Test 2: Frame Budget — No Long Frames (Jank Detection)
    // ---------------------------------------------------------------
    test('flow mode has no severe jank (no frames > 100ms)', async ({ page }) => {
        test.setTimeout(60000);

        await switchToFlowMode(page);
        await installFpsMonitor(page);
        await scheduleAllNotes(page);
        await clickPlay(page);

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 45000 });

        const frameTimes = await collectFpsData(page);

        // Count frames that exceed budget thresholds
        const longFrames = frameTimes.filter(t => t > 50);   // > 50ms = below 20 FPS
        const jankFrames = frameTimes.filter(t => t > 100);  // > 100ms = severe jank
        const totalFrames = frameTimes.length;

        console.log(`[Perf] Total frames: ${totalFrames}`);
        console.log(`[Perf] Long frames (>50ms): ${longFrames.length} (${(longFrames.length / totalFrames * 100).toFixed(1)}%)`);
        console.log(`[Perf] Jank frames (>100ms): ${jankFrames.length}`);

        if (longFrames.length > 0) {
            const maxFrame = Math.max(...frameTimes);
            console.log(`[Perf] Worst frame: ${maxFrame.toFixed(1)}ms`);
        }

        // No frame should take longer than 100ms (severe jank = visible stutter)
        expect(jankFrames.length).toBe(0);

        // Less than 5% of frames should exceed 50ms
        const longFramePercent = longFrames.length / totalFrames;
        expect(longFramePercent).toBeLessThan(0.05);
    });

    // ---------------------------------------------------------------
    // Test 3: Memory Leak Detection
    // ---------------------------------------------------------------
    test('flow mode does not leak memory over a full song', async ({ page }) => {
        test.setTimeout(60000);

        await switchToFlowMode(page);

        // Force GC if available and take baseline measurement
        const baselineHeap = await page.evaluate(() => {
            if ((window as any).gc) (window as any).gc();
            const mem = (performance as any).memory;
            return mem ? mem.usedJSHeapSize / (1024 * 1024) : 0;
        });

        // Skip if performance.memory is not available (non-Chrome)
        if (baselineHeap === 0) {
            console.log('[Perf] performance.memory not available — skipping memory test');
            return;
        }

        console.log(`[Perf] Baseline heap: ${baselineHeap.toFixed(1)} MB`);

        // Take periodic heap snapshots during playback
        const heapSamples: number[] = [baselineHeap];

        await scheduleAllNotes(page);
        await clickPlay(page);

        // Sample heap every 5 seconds during playback
        const sampleInterval = setInterval(async () => {
            const heap = await getHeapUsageMB(page);
            heapSamples.push(heap);
        }, 5000);

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 45000 });

        clearInterval(sampleInterval);

        // Final measurement
        const finalHeap = await page.evaluate(() => {
            if ((window as any).gc) (window as any).gc();
            const mem = (performance as any).memory;
            return mem ? mem.usedJSHeapSize / (1024 * 1024) : 0;
        });
        heapSamples.push(finalHeap);

        console.log(`[Perf] Heap samples (MB): ${heapSamples.map(h => h.toFixed(1)).join(' → ')}`);
        console.log(`[Perf] Heap growth: ${(finalHeap - baselineHeap).toFixed(1)} MB`);

        // Heap should not grow more than 50MB during a single song
        // (generous threshold — a real leak would grow unboundedly)
        const heapGrowth = finalHeap - baselineHeap;
        expect(heapGrowth).toBeLessThan(50);
    });

    // ---------------------------------------------------------------
    // Test 4: Stress Test — Multiple Back-to-Back Playthroughs
    // ---------------------------------------------------------------
    test('performance stays stable across 3 consecutive playthroughs', async ({ page }) => {
        test.setTimeout(120000);

        // Suppress unhandled promise rejections
        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        await switchToFlowMode(page);

        const fpsResults: number[] = [];
        const p95Results: number[] = [];

        for (let run = 1; run <= 3; run++) {
            console.log(`[Perf] === Run ${run} of 3 ===`);

            await installFpsMonitor(page);

            // Schedule notes and play
            await page.evaluate(({ notes, leadIn, msPerBeat }) => {
                const backend = (window as any).__mockBackend;
                for (const [midi, startBeat, duration] of notes) {
                    const pressTime = (startBeat + leadIn) * msPerBeat;
                    const releaseTime = pressTime + duration * msPerBeat;
                    setTimeout(() => backend.simulateChord([midi], 'right'), pressTime);
                    setTimeout(() => backend.simulateNoteOff(midi), releaseTime);
                }
            }, { notes: ODE_TO_JOY_TIMED, leadIn: LEAD_IN_BEATS, msPerBeat: MS_PER_BEAT });

            await clickPlay(page);

            // Wait for completion
            const dialog = page.locator('mat-dialog-container');
            await expect(dialog).toBeVisible({ timeout: 45000 });

            // Collect FPS data
            const frameTimes = await collectFpsData(page);
            const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
            const avgFps = 1000 / avgFrameTime;
            const sorted = [...frameTimes].sort((a, b) => a - b);
            const p95 = sorted[Math.floor(sorted.length * 0.95)];

            fpsResults.push(avgFps);
            p95Results.push(p95);
            console.log(`[Perf] Run ${run}: avgFPS=${avgFps.toFixed(1)}, p95=${p95.toFixed(1)}ms, frames=${frameTimes.length}`);

            // Click "Play Again" to restart
            await dialog.getByRole('button', { name: /Play Again/i }).evaluate(
                (el) => (el as HTMLElement).click()
            );
            await expect(dialog).not.toBeVisible({ timeout: 5000 });

            // Wait for lesson to reset
            await page.waitForTimeout(1000);

            // Re-switch to flow mode (Play Again resets to wait mode)
            await switchToFlowMode(page);
        }

        console.log(`[Perf] FPS across runs: ${fpsResults.map(f => f.toFixed(1)).join(', ')}`);
        console.log(`[Perf] P95 across runs: ${p95Results.map(p => p.toFixed(1)).join(', ')}ms`);

        // All runs should maintain at least 30 FPS
        for (let i = 0; i < fpsResults.length; i++) {
            expect(fpsResults[i]).toBeGreaterThanOrEqual(30);
        }

        // Performance should not degrade significantly between runs
        // Last run's FPS should be at least 80% of the first run's FPS
        const firstFps = fpsResults[0];
        const lastFps = fpsResults[fpsResults.length - 1];
        const degradation = lastFps / firstFps;
        console.log(`[Perf] FPS degradation ratio (last/first): ${degradation.toFixed(2)}`);
        expect(degradation).toBeGreaterThan(0.8);
    });

    // ---------------------------------------------------------------
    // Test 5: Wait Mode Performance (note-by-note with MIDI input)
    // ---------------------------------------------------------------
    test('wait mode handles MIDI input without frame drops', async ({ page }) => {
        test.setTimeout(120000);

        await installFpsMonitor(page);
        await clickPlay(page);
        await page.waitForTimeout(2000);

        // Play all 30 notes using the same duration-aware approach as the
        // working scrolling test. The FPS monitor runs independently via
        // requestAnimationFrame so it still measures frame rate accurately.
        const odeToJoyNotes: [number, number][] = [
            [64, 1.0], [64, 1.0], [65, 1.0], [67, 1.0],
            [67, 1.0], [65, 1.0], [64, 1.0], [62, 1.0],
            [60, 1.0], [60, 1.0], [62, 1.0], [64, 1.0],
            [64, 1.5], [62, 0.5], [62, 2.0],
            [64, 1.0], [64, 1.0], [65, 1.0], [67, 1.0],
            [67, 1.0], [65, 1.0], [64, 1.0], [62, 1.0],
            [60, 1.0], [60, 1.0], [62, 1.0], [64, 1.0],
            [62, 1.5], [60, 0.5], [60, 2.0],
        ];

        for (const [midi, dur] of odeToJoyNotes) {
            const holdMs = Math.max(400, dur * MS_PER_BEAT);
            await simulateNotePress(page, [midi]);
            await page.waitForTimeout(holdMs);
            await simulateNoteRelease(page, midi);
            await page.waitForTimeout(400);
        }

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 30000 });

        const frameTimes = await collectFpsData(page);

        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const avgFps = 1000 / avgFrameTime;
        const jankFrames = frameTimes.filter(t => t > 100);

        console.log(`[Perf] Wait mode — avgFPS: ${avgFps.toFixed(1)}, frames: ${frameTimes.length}, jank: ${jankFrames.length}`);

        expect(avgFps).toBeGreaterThanOrEqual(30);

        // Allow up to 5 jank frames for wait mode — sequential Playwright calls add
        // overhead, and parallel test workers can cause occasional system-level delays
        expect(jankFrames.length).toBeLessThanOrEqual(5);
    });
});
