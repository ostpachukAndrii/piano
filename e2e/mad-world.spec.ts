import { expect, test, Page } from '@playwright/test';
import { gotoE2E, waitForApp } from './helpers/midi-simulator';

/**
 * Mad World — E2E Tests
 *
 * Tests for the Mad World piano lesson (36 measures, 92 BPM, 4/4, Ab major).
 * Covers: full song playthrough, hand separation, and cursor/playhead behavior.
 *
 * At 92 BPM: 1 beat ≈ 652ms
 * We use 200% tempo (184 effective BPM) to halve the playback time:
 *   Lead-in: 8 beats ≈ 2609ms
 *   Music: 144 beats ≈ 46957ms (~47s)
 *   Buffer: 2 beats ≈ 652ms
 *   Total: ~51s
 */

const TEMPO_PERCENT = 200; // 2x speed to keep tests under 60s
const LEAD_IN_BEATS = 8; // 2 bars × 4 beats

async function clickPlay(page: Page): Promise<void> {
    await page.locator('.play-btn').evaluate((el) => (el as HTMLElement).click());
}

async function switchToFlowMode(page: Page): Promise<void> {
    const flowToggle = page.locator('mat-button-toggle[value="flow"]');
    await flowToggle.evaluate((el) => (el as HTMLElement).querySelector('button')?.click());
    await page.waitForTimeout(200);
}

/**
 * Set the tempo percentage on the scrolling player component.
 */
async function setTempoPercent(page: Page, percent: number): Promise<void> {
    await page.evaluate((pct) => {
        const comp = document.querySelector('app-scrolling-player');
        const ngComp = (window as any).ng.getComponent(comp);
        ngComp.tempoPercent.set(pct);
    }, percent);
}

/**
 * Toggle left hand off/on by clicking the L button in playback controls.
 */
async function toggleLeftHand(page: Page): Promise<void> {
    await page.locator('button[aria-label="Left Hand"]').evaluate(
        (el) => (el as HTMLElement).click()
    );
    await page.waitForTimeout(100);
}

/**
 * Toggle right hand off/on by clicking the R button in playback controls.
 */
async function toggleRightHand(page: Page): Promise<void> {
    await page.locator('button[aria-label="Right Hand"]').evaluate(
        (el) => (el as HTMLElement).click()
    );
    await page.waitForTimeout(100);
}

/**
 * Schedule all note presses from the loaded scrolling player component.
 * Reads note data and the current effective BPM (including tempo percent),
 * then schedules simulateChord/simulateNoteOff calls via setTimeout.
 *
 * @param handFilter - 'both' to play all notes, 'right' or 'left' for one hand only
 */
async function scheduleNotes(page: Page, handFilter: 'both' | 'right' | 'left'): Promise<void> {
    await page.evaluate(({ handFilter, leadInBeats }) => {
        const comp = document.querySelector('app-scrolling-player');
        const ngComp = (window as any).ng.getComponent(comp);
        const backend = (window as any).__mockBackend;

        // Use the effective BPM (base tempo × tempo percent)
        const effectiveBpm = ngComp.lesson.tempo * (ngComp.tempoPercent() / 100);
        const msPerBeat = 60000 / effectiveBpm;

        for (const note of ngComp.scrollingNotes) {
            if (note.isRest) continue;
            if (handFilter !== 'both' && note.hand !== handFilter) continue;

            const pressTime = (note.startBeat + leadInBeats) * msPerBeat;
            const releaseTime = pressTime + note.durationBeats * msPerBeat;

            setTimeout(() => {
                backend.simulateChord(note.midi, note.hand);
            }, pressTime);

            for (const m of note.midi) {
                setTimeout(() => {
                    backend.simulateNoteOff(m);
                }, releaseTime);
            }
        }
    }, { handFilter, leadInBeats: LEAD_IN_BEATS });
}

test.describe('Mad World — Flow Mode', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/lesson/mad-world-piano');
        await waitForApp(page);

        await expect(page.locator('app-lesson-player')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Mad World' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('app-scrolling-player')).toBeVisible({ timeout: 5000 });
        await page.locator('app-scrolling-player').scrollIntoViewIfNeeded();
    });

    // ---------------------------------------------------------------
    // Test: Lesson loads with correct metadata
    // ---------------------------------------------------------------
    test('lesson loads with correct structure', async ({ page }) => {
        const info = await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            const ngComp = (window as any).ng.getComponent(comp);
            const notes = ngComp.scrollingNotes;
            return {
                totalBeats: ngComp._totalBeats,
                beatsPerMeasure: ngComp.beatsPerMeasure,
                totalMeasures: ngComp.totalMeasures,
                noteCount: notes.length,
                rightHandCount: notes.filter((n: any) => n.hand === 'right').length,
                leftHandCount: notes.filter((n: any) => n.hand === 'left').length,
                hasChords: notes.some((n: any) => n.midi.length > 1),
                hasRests: notes.some((n: any) => n.isRest),
            };
        });

        expect(info.totalBeats).toBe(144);
        expect(info.beatsPerMeasure).toBe(4);
        expect(info.totalMeasures).toBe(36);
        expect(info.rightHandCount).toBeGreaterThan(100);
        expect(info.leftHandCount).toBeGreaterThan(50);
        expect(info.hasChords).toBe(true);
        expect(info.hasRests).toBe(true);

        console.log(`[MadWorld] ${info.noteCount} total notes: ${info.rightHandCount} right, ${info.leftHandCount} left`);
    });

    // ---------------------------------------------------------------
    // Test: Full song — play all notes, both hands
    // ---------------------------------------------------------------
    test('full song: completion popup appears with high accuracy', async ({ page }) => {
        test.setTimeout(90000);

        await switchToFlowMode(page);
        await setTempoPercent(page, TEMPO_PERCENT);
        await scheduleNotes(page, 'both');
        await clickPlay(page);

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 75000 });
        await expect(page.getByText('Lesson Complete')).toBeVisible();

        // Check accuracy — should be high since all notes are scheduled on time
        const accuracyText = await dialog.locator('.stat-card').filter({ hasText: 'Accuracy' })
            .locator('.stat-value').textContent();
        const accuracy = parseInt(accuracyText || '0');
        expect(accuracy).toBeGreaterThanOrEqual(70);

        console.log(`[MadWorld] Full song accuracy: ${accuracy}%`);

        // Breakdown should exist (flow mode produces extended stats)
        await expect(dialog.locator('.breakdown-section')).toBeVisible();

        // Should have Play Again and Back buttons
        await expect(dialog.getByRole('button', { name: /Play Again/i })).toBeVisible();
        await expect(dialog.getByRole('button', { name: /Back to Lessons/i })).toBeVisible();
    });

    // ---------------------------------------------------------------
    // Test: Right hand only — left hand auto-completes
    // ---------------------------------------------------------------
    test('right hand only: left hand notes auto-complete', async ({ page }) => {
        test.setTimeout(90000);

        await switchToFlowMode(page);
        await setTempoPercent(page, TEMPO_PERCENT);

        // Disable left hand (toggle it off)
        await toggleLeftHand(page);

        // Verify left hand is disabled
        const leftEnabled = await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            return (window as any).ng.getComponent(comp).leftHandEnabled();
        });
        expect(leftEnabled).toBe(false);

        // Only schedule right-hand notes
        await scheduleNotes(page, 'right');
        await clickPlay(page);

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 75000 });
        await expect(page.getByText('Lesson Complete')).toBeVisible();

        // Should still have high accuracy — left-hand notes are auto-completed
        const accuracyText = await dialog.locator('.stat-card').filter({ hasText: 'Accuracy' })
            .locator('.stat-value').textContent();
        const accuracy = parseInt(accuracyText || '0');
        expect(accuracy).toBeGreaterThanOrEqual(70);

        console.log(`[MadWorld] Right hand only accuracy: ${accuracy}%`);
    });

    // ---------------------------------------------------------------
    // Test: Left hand only — right hand auto-completes
    // ---------------------------------------------------------------
    test('left hand only: right hand notes auto-complete', async ({ page }) => {
        test.setTimeout(90000);

        await switchToFlowMode(page);
        await setTempoPercent(page, TEMPO_PERCENT);

        // Disable right hand (toggle it off)
        await toggleRightHand(page);

        // Verify right hand is disabled
        const rightEnabled = await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            return (window as any).ng.getComponent(comp).rightHandEnabled();
        });
        expect(rightEnabled).toBe(false);

        // Only schedule left-hand notes
        await scheduleNotes(page, 'left');
        await clickPlay(page);

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 75000 });
        await expect(page.getByText('Lesson Complete')).toBeVisible();

        const accuracyText = await dialog.locator('.stat-card').filter({ hasText: 'Accuracy' })
            .locator('.stat-value').textContent();
        const accuracy = parseInt(accuracyText || '0');
        expect(accuracy).toBeGreaterThanOrEqual(70);

        console.log(`[MadWorld] Left hand only accuracy: ${accuracy}%`);
    });

    // ---------------------------------------------------------------
    // Test: Cursor/playhead advances at correct rate
    // ---------------------------------------------------------------
    test('cursor: playhead advances through measures at correct tempo', async ({ page }) => {
        test.setTimeout(60000);

        await switchToFlowMode(page);
        // Use normal tempo for timing verification
        await scheduleNotes(page, 'both');
        await clickPlay(page);

        // Install a beat monitor to record when each bar boundary is crossed
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
                const bar = beat < 0 ? 0 : Math.floor(beat / bpm) + 1;
                if (bar !== lastBar && bar > 0) {
                    w.__barTimings.push({ bar, wallMs: performance.now() - startWall, beat });
                    lastBar = bar;
                }
                requestAnimationFrame(monitor);
            }
            requestAnimationFrame(monitor);
        });

        // Wait for bar 10 (roughly 10 bars × 4 beats × 652ms ≈ 26s plus lead-in ≈ 5s ≈ 31s)
        await page.waitForFunction(() => {
            return (window as any).__barTimings?.some((t: any) => t.bar >= 10);
        }, null, { timeout: 45000 });

        // Stop the monitor and collect data
        const barTimings = await page.evaluate(() => {
            const w = window as any;
            w.__barMonitorRunning = false;
            return w.__barTimings as { bar: number; wallMs: number; beat: number }[];
        });

        const msPerBeat = 60000 / 92;
        const LEAD_IN_MS = LEAD_IN_BEATS * msPerBeat;
        const BAR_DURATION_MS = 4 * msPerBeat;
        const TOLERANCE_MS = 1000;

        console.log('[MadWorld] Bar timings (first 10):');
        for (const t of barTimings.filter(t => t.bar <= 10)) {
            const expectedMs = LEAD_IN_MS + (t.bar - 1) * BAR_DURATION_MS;
            console.log(`  Bar ${t.bar}: wall=${t.wallMs.toFixed(0)}ms, expected=${expectedMs.toFixed(0)}ms, beat=${t.beat.toFixed(2)}`);
        }

        expect(barTimings.length).toBeGreaterThanOrEqual(10);

        for (const timing of barTimings.filter(t => t.bar <= 10)) {
            const expectedMs = LEAD_IN_MS + (timing.bar - 1) * BAR_DURATION_MS;
            const drift = Math.abs(timing.wallMs - expectedMs);
            expect(drift).toBeLessThan(TOLERANCE_MS);
        }
    });

    // ---------------------------------------------------------------
    // Test: Completion happens at end of last bar (beat 144), not before
    // ---------------------------------------------------------------
    test('completion happens at end of last bar, not before', async ({ page }) => {
        test.setTimeout(90000);

        await switchToFlowMode(page);
        await setTempoPercent(page, TEMPO_PERCENT);

        // Read lesson structure
        const layout = await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            const ngComp = (window as any).ng.getComponent(comp);
            const playableNotes = ngComp.scrollingNotes.filter((n: any) => !n.isRest);
            const lastPlayable = playableNotes[playableNotes.length - 1];
            return {
                totalBeats: ngComp._totalBeats,
                lastNoteStartBeat: lastPlayable.startBeat,
                lastNoteDuration: lastPlayable.durationBeats,
                lastNoteEndBeat: lastPlayable.startBeat + lastPlayable.durationBeats,
            };
        });

        // Mad World: 36 measures × 4 beats = 144 total beats
        expect(layout.totalBeats).toBe(144);
        expect(layout.lastNoteEndBeat).toBeLessThanOrEqual(144);

        console.log(`[MadWorld] Last note: beat ${layout.lastNoteStartBeat}–${layout.lastNoteEndBeat}, totalBeats: ${layout.totalBeats}`);

        // Schedule all notes and play
        await scheduleNotes(page, 'both');
        await clickPlay(page);

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 75000 });

        // Read the completion state
        const finalState = await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            const ngComp = (window as any).ng.getComponent(comp);
            return {
                finalBeat: ngComp.currentBeat(),
                allNotesCompleteBeat: ngComp.allNotesCompleteBeat,
                totalBeats: ngComp._totalBeats,
            };
        });

        console.log(`[MadWorld] Final beat: ${finalState.finalBeat.toFixed(2)}, allNotesComplete: ${finalState.allNotesCompleteBeat?.toFixed(2)}, totalBeats: ${finalState.totalBeats}`);

        // The final beat should be at or past the end of the last bar (totalBeats = 144)
        expect(finalState.finalBeat).toBeGreaterThanOrEqual(finalState.totalBeats);
        expect(finalState.finalBeat).toBeLessThanOrEqual(finalState.totalBeats + 4);
    });

    // ---------------------------------------------------------------
    // Test: No input → all notes missed
    // ---------------------------------------------------------------
    test('no input: most notes missed → very low accuracy', async ({ page }) => {
        test.setTimeout(90000);

        // Suppress unhandled promise rejections from missed-note evaluation
        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        await switchToFlowMode(page);
        await setTempoPercent(page, TEMPO_PERCENT);
        await clickPlay(page);

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 75000 });
        await expect(page.getByText('Lesson Complete')).toBeVisible();

        // Very low accuracy — some simultaneous notes may auto-complete
        const accuracyText = await dialog.locator('.stat-card').filter({ hasText: 'Accuracy' })
            .locator('.stat-value').textContent();
        const accuracy = parseInt(accuracyText || '0');
        expect(accuracy).toBeLessThanOrEqual(15);

        // Breakdown should show missed notes
        const breakdown = dialog.locator('.breakdown-grid');
        const missedItem = breakdown.locator('.breakdown-item.error').filter({ hasText: 'Missed' });
        await expect(missedItem).toBeVisible();

        const missedCount = parseInt(await missedItem.locator('.count').textContent() || '0');
        expect(missedCount).toBeGreaterThan(50);

        console.log(`[MadWorld] No-input accuracy: ${accuracy}%, missed: ${missedCount}`);
    });
});
