import { expect, test, Page } from '@playwright/test';
import { gotoE2E, waitForApp, simulateNotePress, simulateNoteRelease } from './helpers/midi-simulator';

/**
 * Full Ode to Joy playthrough in FLOW mode (scrolling view).
 *
 * Flow mode scrolls continuously at the lesson tempo (100 BPM).
 * Notes must be played as they reach the playhead — missed notes
 * are counted as errors. Flow mode starts with a 2-bar lead-in.
 *
 * At tempo 100 BPM: 1 beat = 600ms
 * Lead-in: 2 bars × 4 beats = 8 beats = 4800ms
 *
 * Beat positions for each note:
 *   Measure 1 (beat 0–4):  E@0, E@1, F@2, G@3
 *   Measure 2 (beat 4–8):  G@4, F@5, E@6, D@7
 *   Measure 3 (beat 8–12): C@8, C@9, D@10, E@11
 *   Measure 4 (beat 12–16): E@12, D@13.5, D@14
 *   Measure 5 (beat 16–20): E@16, E@17, F@18, G@19
 *   Measure 6 (beat 20–24): G@20, F@21, E@22, D@23
 *   Measure 7 (beat 24–28): C@24, C@25, D@26, E@27
 *   Measure 8 (beat 28–32): D@28, C@29.5, C@30
 */

// [midi, startBeat, durationBeats]
const ODE_TO_JOY_TIMED: [number, number, number][] = [
    // Measure 1
    [64, 0, 1.0], [64, 1, 1.0], [65, 2, 1.0], [67, 3, 1.0],
    // Measure 2
    [67, 4, 1.0], [65, 5, 1.0], [64, 6, 1.0], [62, 7, 1.0],
    // Measure 3
    [60, 8, 1.0], [60, 9, 1.0], [62, 10, 1.0], [64, 11, 1.0],
    // Measure 4: dotted quarter + eighth + half
    [64, 12, 1.5], [62, 13.5, 0.5], [62, 14, 2.0],
    // Measure 5
    [64, 16, 1.0], [64, 17, 1.0], [65, 18, 1.0], [67, 19, 1.0],
    // Measure 6
    [67, 20, 1.0], [65, 21, 1.0], [64, 22, 1.0], [62, 23, 1.0],
    // Measure 7
    [60, 24, 1.0], [60, 25, 1.0], [62, 26, 1.0], [64, 27, 1.0],
    // Measure 8: dotted quarter + eighth + half
    [62, 28, 1.5], [60, 29.5, 0.5], [60, 30, 2.0],
];

const LEAD_IN_BEATS = 8; // 2 bars × 4 beats
const MS_PER_BEAT = 600; // tempo 100 BPM

/**
 * Click the play button via JS to bypass any overlay.
 */
async function clickPlay(page: Page): Promise<void> {
    await page.locator('.play-btn').evaluate((el) => (el as HTMLElement).click());
}

/**
 * Switch to flow mode by clicking the flow toggle.
 */
async function switchToFlowMode(page: Page): Promise<void> {
    const flowToggle = page.locator('mat-button-toggle[value="flow"]');
    await flowToggle.evaluate((el) => (el as HTMLElement).querySelector('button')?.click());
    await page.waitForTimeout(200);
}

/**
 * Schedule all note presses inside the browser using setTimeout.
 * This avoids Playwright round-trip latency for precise timing.
 * Each note is pressed at (startBeat + leadIn) * msPerBeat after startTime,
 * and released after durationBeats * msPerBeat.
 */
async function scheduleAllNotes(page: Page): Promise<void> {
    await page.evaluate(({ notes, leadIn, msPerBeat }) => {
        const backend = (window as any).__mockBackend;
        const startTime = performance.now();

        for (const [midi, startBeat, duration] of notes) {
            const pressTime = (startBeat + leadIn) * msPerBeat;
            const releaseTime = pressTime + duration * msPerBeat;

            setTimeout(() => {
                backend.simulateChord([midi], 'right');
            }, pressTime);

            setTimeout(() => {
                backend.simulateNoteOff(midi);
            }, releaseTime);
        }
    }, {
        notes: ODE_TO_JOY_TIMED,
        leadIn: LEAD_IN_BEATS,
        msPerBeat: MS_PER_BEAT,
    });
}

test.describe('Ode to Joy — Flow Mode', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/lesson/ode-to-joy');
        await waitForApp(page);

        await expect(page.locator('app-lesson-player')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Ode to Joy' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('app-scrolling-player')).toBeVisible({ timeout: 5000 });

        // Scroll the player into view so it's visible during headed runs
        await page.locator('app-scrolling-player').scrollIntoViewIfNeeded();
    });

    test('can switch to flow mode', async ({ page }) => {
        await switchToFlowMode(page);

        const flowToggle = page.locator('mat-button-toggle[value="flow"]');
        await expect(flowToggle).toHaveClass(/mat-button-toggle-checked/);
    });

    test('flow mode: no input → all notes missed → 0% accuracy', async ({ page }) => {
        test.setTimeout(60000);

        // Suppress unhandled promise rejections from missed-note evaluation
        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        await switchToFlowMode(page);
        await clickPlay(page);

        // Total: lead-in (8) + music (32) + miss window (~0.35) + buffer (2) ≈ 43 beats
        // 43 × 600ms ≈ 25800ms, use generous timeout
        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 45000 });
        await expect(page.getByText('Lesson Complete')).toBeVisible();

        // All notes missed → 0% accuracy
        await expect(dialog.locator('.stat-card').filter({ hasText: 'Accuracy' })
            .locator('.stat-value')).toHaveText('0%');

        // Breakdown: 30 missed, 0 perfect
        const breakdown = dialog.locator('.breakdown-grid');
        const missedItem = breakdown.locator('.breakdown-item.error').filter({ hasText: 'Missed' });
        await expect(missedItem).toBeVisible();
        await expect(missedItem.locator('.count')).toHaveText('30');

        // No perfect notes
        await expect(breakdown.locator('.breakdown-item.success')).toHaveCount(0);
    });

    test('flow mode: play all notes on time → completion with high accuracy', async ({ page }) => {
        test.setTimeout(60000);

        await switchToFlowMode(page);

        // Schedule all notes before starting playback
        await scheduleAllNotes(page);

        await clickPlay(page);

        // Wait for completion: lead-in + music + buffer + margin
        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 35000 });
        await expect(page.getByText('Lesson Complete')).toBeVisible();

        // Should have high accuracy (timing may cause some early/late)
        const accuracyText = await dialog.locator('.stat-card').filter({ hasText: 'Accuracy' })
            .locator('.stat-value').textContent();
        const accuracy = parseInt(accuracyText || '0');
        expect(accuracy).toBeGreaterThanOrEqual(80);

        // Check note detail shows note count (may be 29-30 due to flow mode timing)
        const detailText = await dialog.locator('.stat-card').filter({ hasText: 'Accuracy' })
            .locator('.stat-detail').textContent();
        const totalMatch = detailText?.match(/of (\d+) notes/);
        expect(totalMatch).toBeTruthy();
        const totalNotes = parseInt(totalMatch![1]);
        expect(totalNotes).toBeGreaterThanOrEqual(28);
        expect(totalNotes).toBeLessThanOrEqual(30);
    });

    test('flow mode: partial play → some missed, some hit', async ({ page }) => {
        test.setTimeout(60000);

        // Suppress unhandled promise rejections
        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        await switchToFlowMode(page);

        // Only schedule the first 12 notes (measures 1-3), skip the rest
        const firstThreeMeasures = ODE_TO_JOY_TIMED.slice(0, 12);
        await page.evaluate(({ notes, leadIn, msPerBeat }) => {
            const backend = (window as any).__mockBackend;

            for (const [midi, startBeat, duration] of notes) {
                const pressTime = (startBeat + leadIn) * msPerBeat;
                const releaseTime = pressTime + duration * msPerBeat;

                setTimeout(() => {
                    backend.simulateChord([midi], 'right');
                }, pressTime);

                setTimeout(() => {
                    backend.simulateNoteOff(midi);
                }, releaseTime);
            }
        }, {
            notes: firstThreeMeasures,
            leadIn: LEAD_IN_BEATS,
            msPerBeat: MS_PER_BEAT,
        });

        await clickPlay(page);

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 45000 });

        // Should have partial accuracy — 12 of 30 notes played
        const accuracyText = await dialog.locator('.stat-card').filter({ hasText: 'Accuracy' })
            .locator('.stat-value').textContent();
        const accuracy = parseInt(accuracyText || '0');
        expect(accuracy).toBeGreaterThan(0);
        expect(accuracy).toBeLessThan(100);

        // Breakdown should show both hit and missed notes
        const breakdown = dialog.locator('.breakdown-grid');
        const missedItem = breakdown.locator('.breakdown-item.error').filter({ hasText: 'Missed' });
        await expect(missedItem).toBeVisible();
        const missedCount = parseInt(await missedItem.locator('.count').textContent() || '0');
        expect(missedCount).toBeGreaterThan(0);
    });

    test('flow mode: completion shows performance breakdown with timing', async ({ page }) => {
        test.setTimeout(60000);

        await switchToFlowMode(page);
        await scheduleAllNotes(page);
        await clickPlay(page);

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 35000 });

        // Breakdown section should exist with extended stats
        await expect(dialog.locator('.breakdown-section')).toBeVisible();
        await expect(dialog.getByText('Performance Breakdown')).toBeVisible();

        // At least some notes should appear in the breakdown
        const breakdown = dialog.locator('.breakdown-grid');
        const allItems = breakdown.locator('.breakdown-item');
        const itemCount = await allItems.count();
        expect(itemCount).toBeGreaterThan(0);

        // Performance message should be visible
        await expect(dialog.locator('.performance-message')).toBeVisible();
    });

    test('flow mode: real-time playback duration matches expected beat timing', async ({ page }) => {
        test.setTimeout(60000);

        await switchToFlowMode(page);

        // Schedule all notes to be played at correct beat positions
        await scheduleAllNotes(page);

        // Record start time and click play
        const startTime = Date.now();
        await clickPlay(page);

        // Wait for completion dialog
        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 45000 });
        const endTime = Date.now();

        const actualDurationMs = endTime - startTime;

        // Expected timing breakdown:
        //   Lead-in:  8 beats (2 bars × 4 beats/bar)
        //   Music:   32 beats (8 bars of 4/4)
        //   Buffer:   2 beats (COMPLETION_BUFFER_BEATS, visual scroll after last note)
        //   Total:   42 beats
        //   At 100 BPM (600ms/beat): 42 × 600 = 25,200ms
        //   Plus ~500ms setTimeout delay before emitting completion event
        //   Expected total: ~25,700ms
        const TOTAL_BEATS = LEAD_IN_BEATS + 32 + 2; // 42 beats
        const expectedDurationMs = TOTAL_BEATS * MS_PER_BEAT + 500; // ~25,700ms

        // Allow ±2.5 seconds tolerance for requestAnimationFrame drift and browser scheduling
        expect(actualDurationMs).toBeGreaterThan(expectedDurationMs - 2500);
        expect(actualDurationMs).toBeLessThan(expectedDurationMs + 2500);

        // Verify the lead-in period is included by checking minimum duration
        // Without lead-in (8 beats = 4800ms), the test would be ~4800ms shorter
        const durationWithoutLeadIn = (32 + 2) * MS_PER_BEAT + 500; // ~21,100ms
        expect(actualDurationMs).toBeGreaterThan(durationWithoutLeadIn);
    });

    test('flow mode: lesson ends at the last bar with notes — not before, not after', async ({ page }) => {
        test.setTimeout(60000);

        await switchToFlowMode(page);

        // Read the internal state to verify note layout matches last bar
        const noteLayout = await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            const ngComp = (window as any).ng.getComponent(comp);
            const notes: { startBeat: number; durationBeats: number; midi: number[] }[] = [];

            for (const n of ngComp.scrollingNotes) {
                if (!n.isRest) {
                    notes.push({
                        startBeat: n.startBeat,
                        durationBeats: n.durationBeats,
                        midi: n.midi
                    });
                }
            }

            return {
                totalBeats: ngComp._totalBeats,
                beatsPerMeasure: ngComp.beatsPerMeasure,
                totalMeasures: ngComp.totalMeasures,
                noteCount: notes.length,
                lastNote: notes[notes.length - 1],
                allNotes: notes
            };
        });

        // Ode to Joy: 8 measures × 4 beats = 32 total beats
        expect(noteLayout.totalBeats).toBe(32);
        expect(noteLayout.beatsPerMeasure).toBe(4);
        expect(noteLayout.totalMeasures).toBe(8);
        expect(noteLayout.noteCount).toBe(30);

        // Last note: C4 (midi 60) at beat 30, duration 2.0 (half note)
        // Its end beat = 30 + 2.0 = 32 = totalBeats = end of measure 8
        const lastNote = noteLayout.lastNote;
        expect(lastNote.startBeat + lastNote.durationBeats).toBe(noteLayout.totalBeats);

        // No note extends beyond the last measure
        for (const note of noteLayout.allNotes) {
            expect(note.startBeat + note.durationBeats).toBeLessThanOrEqual(noteLayout.totalBeats);
        }

        // Now play through and verify the completion beat matches last bar
        await scheduleAllNotes(page);
        await clickPlay(page);

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 45000 });

        // After completion, read the final beat position from the component
        const finalState = await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            const ngComp = (window as any).ng.getComponent(comp);
            return {
                finalBeat: ngComp.currentBeat(),
                allNotesCompleteBeat: ngComp.allNotesCompleteBeat,
                totalBeats: ngComp._totalBeats
            };
        });

        // allNotesCompleteBeat should be at or just after the last note's start beat (30)
        // In flow mode, notes are marked complete as they pass the hit window,
        // which can be slightly past the totalBeats boundary.
        expect(finalState.allNotesCompleteBeat).toBeGreaterThanOrEqual(29);
        expect(finalState.allNotesCompleteBeat).toBeLessThanOrEqual(34);

        // The final beat should be near totalBeats (32) + COMPLETION_BUFFER_BEATS (2)
        // i.e. around 32-34, confirming the lesson scrolls to the end of the last bar
        expect(finalState.finalBeat).toBeGreaterThanOrEqual(finalState.totalBeats - 1);
        expect(finalState.finalBeat).toBeLessThanOrEqual(finalState.totalBeats + 3);
    });

    test('flow mode: each bar finishes at the expected wall-clock time', async ({ page }) => {
        test.setTimeout(60000);

        await switchToFlowMode(page);
        await scheduleAllNotes(page);
        await clickPlay(page);

        // Install beat monitor AFTER clicking play — the beat is now -8 (lead-in).
        // Record timestamps when each bar boundary is crossed.
        await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            const ngComp = (window as any).ng.getComponent(comp);
            const w = window as any;

            w.__barTimings = [] as { bar: number; wallMs: number; beat: number }[];
            w.__barMonitorRunning = true;
            let lastBar = -999;
            const startWall = performance.now();

            function monitor() {
                if (!w.__barMonitorRunning) return;
                const beat = ngComp.currentBeat();
                const bpm = ngComp.beatsPerMeasure || 4;
                // Bars are 1-indexed: bar 1 = beats 0–4, bar 2 = beats 4–8, etc.
                // During lead-in (negative beats), bar is 0 or negative
                const bar = beat < 0 ? 0 : Math.floor(beat / bpm) + 1;
                if (bar !== lastBar && bar > 0) {
                    w.__barTimings.push({
                        bar,
                        wallMs: performance.now() - startWall,
                        beat
                    });
                    lastBar = bar;
                }
                requestAnimationFrame(monitor);
            }
            requestAnimationFrame(monitor);
        });

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 45000 });

        // Collect bar timing data
        const barTimings = await page.evaluate(() => {
            const w = window as any;
            w.__barMonitorRunning = false;
            return w.__barTimings as { bar: number; wallMs: number; beat: number }[];
        });

        console.log('[Timing] Bar timings:');
        for (const t of barTimings) {
            console.log(`  Bar ${t.bar}: wall=${t.wallMs.toFixed(0)}ms, beat=${t.beat.toFixed(2)}`);
        }

        // Expected: lead-in = 8 beats = 4800ms from when monitor started
        // (monitor starts just after clickPlay, so beat is ~-8)
        // Bar 1 (beat 0): ~4800ms from monitor start
        // Bar 2 (beat 4): ~7200ms
        // Bar N: ~4800 + (N-1) × 2400ms
        const LEAD_IN_MS = LEAD_IN_BEATS * MS_PER_BEAT; // 4800ms
        const BAR_DURATION_MS = 4 * MS_PER_BEAT; // 2400ms
        const TOLERANCE_MS = 800; // Allow ±800ms for rAF drift and scheduling

        expect(barTimings.length).toBeGreaterThanOrEqual(8);

        for (const timing of barTimings) {
            const expectedMs = LEAD_IN_MS + (timing.bar - 1) * BAR_DURATION_MS;

            const drift = Math.abs(timing.wallMs - expectedMs);
            console.log(`  Bar ${timing.bar}: expected=${expectedMs.toFixed(0)}ms, actual=${timing.wallMs.toFixed(0)}ms, drift=${drift.toFixed(0)}ms`);

            expect(drift).toBeLessThan(TOLERANCE_MS);
        }
    });
});
