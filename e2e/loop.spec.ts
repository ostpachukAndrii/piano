import { expect, test, Page } from '@playwright/test';
import { gotoE2E, waitForApp, simulateNotePress, simulateNoteRelease } from './helpers/midi-simulator';

/**
 * Loop functionality tests — Ode to Joy (8 measures, 4/4, 100 BPM)
 *
 * Beat layout:
 *   Measure 1 (beat 0–4):  E@0, E@1, F@2, G@3   → MIDI 64, 64, 65, 67
 *   Measure 2 (beat 4–8):  G@4, F@5, E@6, D@7   → MIDI 67, 65, 64, 62
 *   Measure 3 (beat 8–12): C@8, C@9, D@10, E@11  → MIDI 60, 60, 62, 64
 *   ...
 *   8 measures × 4 beats = 32 total beats
 *   Tempo 100 BPM → 600ms/beat → 1 measure = 2400ms
 */

const MS_PER_BEAT = 600; // 100 BPM

/** Click play via JS to bypass overlays */
async function clickPlay(page: Page): Promise<void> {
    await page.locator('.play-btn').evaluate((el) => (el as HTMLElement).click());
}

/** Switch to flow mode */
async function switchToFlowMode(page: Page): Promise<void> {
    const flowToggle = page.locator('mat-button-toggle[value="flow"]');
    await flowToggle.evaluate((el) => (el as HTMLElement).querySelector('button')?.click());
    await page.waitForTimeout(200);
}

/** Get loop range from component state */
async function getLoopRange(page: Page): Promise<{ startMeasure: number; endMeasure: number } | null> {
    return page.evaluate(() => {
        const comp = document.querySelector('app-scrolling-player');
        const ngComp = (window as any).ng.getComponent(comp);
        return ngComp.loopRange();
    });
}

/** Set loop range programmatically via component methods */
async function setLoopRange(page: Page, startMeasure: number, endMeasure: number): Promise<void> {
    await page.evaluate(({ start, end }) => {
        const comp = document.querySelector('app-scrolling-player');
        const ngComp = (window as any).ng.getComponent(comp);
        ngComp.setLoopStart(start);
        ngComp.setLoopEnd(end);
    }, { start: startMeasure, end: endMeasure });
}

/** Get current beat from component */
async function getCurrentBeat(page: Page): Promise<number> {
    return page.evaluate(() => {
        const comp = document.querySelector('app-scrolling-player');
        return (window as any).ng.getComponent(comp).currentBeat();
    });
}

/** Get note states within a beat range */
async function getNoteStatesInRange(page: Page, startBeat: number, endBeat: number):
    Promise<{ midi: number[]; startBeat: number; state: string }[]> {
    return page.evaluate(({ s, e }) => {
        const comp = document.querySelector('app-scrolling-player');
        const ngComp = (window as any).ng.getComponent(comp);
        const results: { midi: number[]; startBeat: number; state: string }[] = [];
        for (const n of ngComp.scrollingNotes) {
            if (!n.isRest && n.startBeat >= s && n.startBeat < e) {
                results.push({ midi: [...n.midi], startBeat: n.startBeat, state: n.state });
            }
        }
        return results;
    }, { s: startBeat, e: endBeat });
}

test.describe('Loop Functionality — Ode to Joy', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/lesson/ode-to-joy');
        await waitForApp(page);
        await expect(page.locator('app-lesson-player')).toBeVisible();
        await expect(page.locator('app-scrolling-player')).toBeVisible({ timeout: 5000 });
        await page.locator('app-scrolling-player').scrollIntoViewIfNeeded();
    });

    // ── UI Tests ──────────────────────────────────────────────────────────

    test('clicking loop button creates a loop at current measure', async ({ page }) => {
        // Initially, single loop button is visible (no active loop)
        const loopBtn = page.locator('.loop-btn');
        await expect(loopBtn).toBeVisible();

        // No loop-clear button yet
        await expect(page.locator('.loop-clear-btn')).toHaveCount(0);

        // Click the loop button
        await loopBtn.click();

        // Loop controls should now be visible
        await expect(page.locator('.loop-clear-btn')).toBeVisible();

        // Verify loop range: currentMeasure is 1 at start
        const range = await getLoopRange(page);
        expect(range).not.toBeNull();
        expect(range!.startMeasure).toBe(1);
        expect(range!.endMeasure).toBe(1);

        // Loop numbers should show "1" for both start and end
        const loopNumbers = page.locator('.loop-number');
        await expect(loopNumbers.first()).toHaveText('1');
        await expect(loopNumbers.last()).toHaveText('1');
    });

    test('loop range can be adjusted with +/- buttons', async ({ page }) => {
        // Create initial loop at measure 1
        await page.locator('.loop-btn').click();
        await expect(page.locator('.loop-clear-btn')).toBeVisible();

        // Increment end measure: 1→2
        await page.locator('[aria-label="Increase loop end"]').click();
        let range = await getLoopRange(page);
        expect(range!.startMeasure).toBe(1);
        expect(range!.endMeasure).toBe(2);

        // Increment end again: 2→3
        await page.locator('[aria-label="Increase loop end"]').click();
        range = await getLoopRange(page);
        expect(range!.endMeasure).toBe(3);

        // Increment start: 1→2
        await page.locator('[aria-label="Increase loop start"]').click();
        range = await getLoopRange(page);
        expect(range!.startMeasure).toBe(2);
        expect(range!.endMeasure).toBe(3);

        // Decrement start back: 2→1
        await page.locator('[aria-label="Decrease loop start"]').click();
        range = await getLoopRange(page);
        expect(range!.startMeasure).toBe(1);

        // Decrement end: 3→2
        await page.locator('[aria-label="Decrease loop end"]').click();
        range = await getLoopRange(page);
        expect(range!.endMeasure).toBe(2);

        // Verify UI numbers
        const loopNumbers = page.locator('.loop-number');
        await expect(loopNumbers.first()).toHaveText('1');
        await expect(loopNumbers.last()).toHaveText('2');
    });

    test('start cannot exceed end, end cannot go below start', async ({ page }) => {
        // Create loop at measure 1
        await page.locator('.loop-btn').click();

        // Start and end are both 1 — increment start should be disabled
        const incStart = page.locator('[aria-label="Increase loop start"]');
        await expect(incStart).toBeDisabled();

        // Decrement end should be disabled (can't go below start)
        const decEnd = page.locator('[aria-label="Decrease loop end"]');
        await expect(decEnd).toBeDisabled();

        // Decrement start at measure 1 should be disabled
        const decStart = page.locator('[aria-label="Decrease loop start"]');
        await expect(decStart).toBeDisabled();

        // Expand end to 3
        await page.locator('[aria-label="Increase loop end"]').click();
        await page.locator('[aria-label="Increase loop end"]').click();
        const range = await getLoopRange(page);
        expect(range!.endMeasure).toBe(3);

        // Now start can increment (but only up to end)
        await expect(incStart).toBeEnabled();
    });

    test('increment loop end is disabled at last measure', async ({ page }) => {
        // Create loop at measure 1
        await page.locator('.loop-btn').click();

        // Expand end to the last measure (8)
        for (let i = 1; i < 8; i++) {
            await page.locator('[aria-label="Increase loop end"]').click();
        }

        const range = await getLoopRange(page);
        expect(range!.endMeasure).toBe(8);

        // Increment end should now be disabled
        await expect(page.locator('[aria-label="Increase loop end"]')).toBeDisabled();
    });

    test('clear loop returns to full lesson playback', async ({ page }) => {
        // Create a loop
        await page.locator('.loop-btn').click();
        await expect(page.locator('.loop-clear-btn')).toBeVisible();

        // Clear the loop
        await page.locator('.loop-clear-btn').click();

        // Verify loop is gone
        const range = await getLoopRange(page);
        expect(range).toBeNull();

        // Original single loop button should be visible again
        await expect(page.locator('.loop-btn')).toBeVisible();
        await expect(page.locator('.loop-clear-btn')).toHaveCount(0);
    });

    test('loop range indicator appears on progress bar', async ({ page }) => {
        // No indicator initially
        await expect(page.locator('.loop-range-indicator')).toHaveCount(0);

        // Create loop at measure 1, expand to measures 1-4
        await page.locator('.loop-btn').click();
        for (let i = 0; i < 3; i++) {
            await page.locator('[aria-label="Increase loop end"]').click();
        }

        // Indicator should now be visible on the progress bar
        const indicator = page.locator('.loop-range-indicator');
        await expect(indicator).toBeVisible();

        // Measures 1-4 out of 8 = 50% width, starting at 0%
        // left should be ~0%, width should be ~50%
        const style = await indicator.evaluate((el) => ({
            left: el.style.left,
            width: el.style.width
        }));
        expect(parseFloat(style.left)).toBeCloseTo(0, 0);
        expect(parseFloat(style.width)).toBeCloseTo(50, 0);
    });

    // ── Flow Mode Loop Tests ──────────────────────────────────────────────

    test('flow mode: playback loops back to start when reaching end of range', async ({ page }) => {
        test.setTimeout(45000);

        await switchToFlowMode(page);

        // Set loop to measures 3-4 (beats 8-16) — avoids lead-in
        await setLoopRange(page, 3, 4);

        // Install a monitor that counts beat drops (loop back events)
        await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            const ngComp = (window as any).ng.getComponent(comp);
            const w = window as any;
            w.__loopCount = 0;
            w.__loopMonitorRunning = true;
            let lastBeat = ngComp.currentBeat();
            function check() {
                const beat = ngComp.currentBeat();
                // A significant beat drop (> 2 beats backwards) indicates a loop
                if (lastBeat - beat > 2) {
                    w.__loopCount++;
                }
                lastBeat = beat;
                if (w.__loopMonitorRunning) {
                    requestAnimationFrame(check);
                }
            }
            requestAnimationFrame(check);
        });

        // Start playback
        await clickPlay(page);

        // Wait for at least 2 complete loops
        // Measures 3-4 = 8 beats × 600ms = 4800ms per loop
        // Wait ~12 seconds for safety
        await page.waitForTimeout(12000);

        // Stop monitoring and check
        const loopCount = await page.evaluate(() => {
            const w = window as any;
            w.__loopMonitorRunning = false;
            return w.__loopCount;
        });

        console.log(`[Loop] Flow mode loop count: ${loopCount}`);
        expect(loopCount).toBeGreaterThanOrEqual(2);
    });

    test('flow mode: completion dialog does NOT appear when loop is active', async ({ page }) => {
        test.setTimeout(30000);

        await switchToFlowMode(page);

        // Set loop to measure 1 only (beats 0-4) — very short loop
        await setLoopRange(page, 1, 1);

        // Suppress unhandled promise rejections from missed notes
        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        // Start playback
        await clickPlay(page);

        // Wait much longer than a single measure (2400ms) — multiple loops
        await page.waitForTimeout(8000);

        // Completion dialog should NOT appear
        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toHaveCount(0);

        // Verify we're still playing
        const isPlaying = await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            return (window as any).ng.getComponent(comp).isPlaying();
        });
        expect(isPlaying).toBe(true);
    });

    test('flow mode: notes in loop range reset to upcoming on each iteration', async ({ page }) => {
        test.setTimeout(30000);

        await switchToFlowMode(page);

        // Set loop to measures 1-2 (beats 0-8)
        await setLoopRange(page, 1, 2);

        // Suppress unhandled rejections
        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        // Start playback
        await clickPlay(page);

        // Wait for one full loop (8 beats = 4800ms) + extra for beat 0 lead-in
        // Since loop starts at measure 1, lead-in may apply (8 beats = 4800ms)
        await page.waitForTimeout(11000);

        // After looping, notes in the range should include upcoming/active states
        // (not all missed/hit from previous iteration)
        const notes = await getNoteStatesInRange(page, 0, 8);
        const hasUpcomingOrActive = notes.some(n => n.state === 'upcoming' || n.state === 'active');
        expect(hasUpcomingOrActive).toBe(true);

        console.log('[Loop] Note states after loop:',
            notes.map(n => `${n.midi}@${n.startBeat}=${n.state}`).join(', '));
    });

    // ── Wait Mode Loop Tests ──────────────────────────────────────────────

    test('wait mode: loop resets after playing all notes in range', async ({ page }) => {
        test.setTimeout(45000);

        // Default mode is wait — verify
        const waitToggle = page.locator('mat-button-toggle[value="wait"]');
        await expect(waitToggle).toHaveClass(/mat-button-toggle-checked/);

        // Set loop to measures 1-2 (beats 0-8)
        // Notes: E@0, E@1, F@2, G@3, G@4, F@5, E@6, D@7
        await setLoopRange(page, 1, 2);

        // Start playback
        await clickPlay(page);
        await page.waitForTimeout(300);

        // Play all 8 notes in measures 1-2
        const notesM1M2 = [64, 64, 65, 67, 67, 65, 64, 62]; // E E F G G F E D
        for (const midi of notesM1M2) {
            await simulateNotePress(page, [midi], 'right');
            await page.waitForTimeout(150);
            await simulateNoteRelease(page, midi);
            await page.waitForTimeout(200);
        }

        // After playing all notes, the beat should advance to end and loop back
        // Wait for the loop boundary to trigger
        await page.waitForTimeout(1500);

        // Notes should be reset to upcoming (looped back)
        const notes = await getNoteStatesInRange(page, 0, 8);
        const states = notes.map(n => n.state);
        console.log('[Loop] Wait mode note states after loop:', states.join(', '));

        // At least some notes should be upcoming or active (not all hit)
        const nonHitCount = notes.filter(n => n.state === 'upcoming' || n.state === 'active').length;
        expect(nonHitCount).toBeGreaterThan(0);

        // No completion dialog
        await expect(page.locator('mat-dialog-container')).toHaveCount(0);
    });

    test('wait mode: can play through loop multiple times', async ({ page }) => {
        test.setTimeout(60000);

        // Set loop to measures 1-2
        await setLoopRange(page, 1, 2);

        // Start playback
        await clickPlay(page);
        await page.waitForTimeout(300);

        const notesM1M2 = [64, 64, 65, 67, 67, 65, 64, 62];

        // Play through twice
        for (let iteration = 0; iteration < 2; iteration++) {
            for (const midi of notesM1M2) {
                await simulateNotePress(page, [midi], 'right');
                await page.waitForTimeout(150);
                await simulateNoteRelease(page, midi);
                await page.waitForTimeout(200);
            }

            // Wait for loop to reset
            await page.waitForTimeout(1500);

            if (iteration === 0) {
                // After first iteration, verify notes reset
                const notes = await getNoteStatesInRange(page, 0, 8);
                const nonHitCount = notes.filter(n =>
                    n.state === 'upcoming' || n.state === 'active'
                ).length;
                expect(nonHitCount).toBeGreaterThan(0);
                console.log(`[Loop] Iteration ${iteration + 1} complete, notes reset`);
            }
        }

        // Still no completion dialog after two iterations
        await expect(page.locator('mat-dialog-container')).toHaveCount(0);

        // Still playing
        const isPlaying = await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            return (window as any).ng.getComponent(comp).isPlaying();
        });
        expect(isPlaying).toBe(true);
    });

    // ── Restart & Navigation with Loop ────────────────────────────────────

    test('restart with active loop jumps to loop start, not beginning', async ({ page }) => {
        // Set loop to measures 3-4 (beats 8-16)
        await setLoopRange(page, 3, 4);

        // Verify current beat is at loop start (beat 8)
        let beat = await getCurrentBeat(page);
        expect(beat).toBeCloseTo(8, 0);

        // Start and let it advance a bit
        await clickPlay(page);
        await page.waitForTimeout(1000);

        // Click restart
        await page.locator('.restart-btn').evaluate((el) => (el as HTMLElement).click());
        await page.waitForTimeout(200);

        // Beat should be back at loop start (beat 8), not at 0
        beat = await getCurrentBeat(page);
        expect(beat).toBeCloseTo(8, 0);
    });

    test('clearing loop during playback allows normal completion', async ({ page }) => {
        test.setTimeout(60000);

        await switchToFlowMode(page);

        // Set loop to measures 1-2
        await setLoopRange(page, 1, 2);

        // Suppress unhandled rejections
        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        // Start playback
        await clickPlay(page);
        await page.waitForTimeout(2000);

        // Clear the loop while playing
        await page.locator('.loop-clear-btn').click();

        // Now the lesson should play through to completion
        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 40000 });
        await expect(page.getByText('Lesson Complete')).toBeVisible();
    });
});
