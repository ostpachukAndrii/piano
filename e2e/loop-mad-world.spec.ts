import { expect, test, Page } from '@playwright/test';
import { gotoE2E, waitForApp } from './helpers/midi-simulator';

/**
 * Loop functionality tests — Mad World (36 measures, 4/4, 92 BPM, Ab major)
 *
 * Beat layout: 36 measures × 4 beats = 144 total beats
 * At 92 BPM: 1 beat ≈ 652ms → 1 measure ≈ 2609ms
 * Uses 200% tempo for faster tests → 1 measure ≈ 1304ms
 */

const TEMPO_PERCENT = 200;
const LEAD_IN_BEATS = 8;

async function clickPlay(page: Page): Promise<void> {
    await page.locator('.play-btn').evaluate((el) => (el as HTMLElement).click());
}

async function switchToFlowMode(page: Page): Promise<void> {
    const flowToggle = page.locator('mat-button-toggle[value="flow"]');
    await flowToggle.evaluate((el) => (el as HTMLElement).querySelector('button')?.click());
    await page.waitForTimeout(200);
}

async function setTempoPercent(page: Page, percent: number): Promise<void> {
    await page.evaluate((pct) => {
        const comp = document.querySelector('app-scrolling-player');
        (window as any).ng.getComponent(comp).tempoPercent.set(pct);
    }, percent);
}

async function setLoopRange(page: Page, startMeasure: number, endMeasure: number): Promise<void> {
    await page.evaluate(({ start, end }) => {
        const comp = document.querySelector('app-scrolling-player');
        const ngComp = (window as any).ng.getComponent(comp);
        ngComp.setLoopStart(start);
        ngComp.setLoopEnd(end);
    }, { start: startMeasure, end: endMeasure });
}

async function getLoopRange(page: Page): Promise<{ startMeasure: number; endMeasure: number } | null> {
    return page.evaluate(() => {
        const comp = document.querySelector('app-scrolling-player');
        return (window as any).ng.getComponent(comp).loopRange();
    });
}

async function getCurrentBeat(page: Page): Promise<number> {
    return page.evaluate(() => {
        const comp = document.querySelector('app-scrolling-player');
        return (window as any).ng.getComponent(comp).currentBeat();
    });
}

async function getCurrentActiveBeat(page: Page): Promise<number | null> {
    return page.evaluate(() => {
        const comp = document.querySelector('app-scrolling-player');
        return (window as any).ng.getComponent(comp).currentActiveBeat();
    });
}

async function getHintNotes(page: Page): Promise<number[]> {
    return page.evaluate(() => {
        const comp = document.querySelector('app-scrolling-player');
        return (window as any).ng.getComponent(comp).hintNotes();
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

test.describe('Loop — Mad World', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/lesson/mad-world-piano');
        await waitForApp(page);
        await expect(page.locator('app-lesson-player')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Mad World' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('app-scrolling-player')).toBeVisible({ timeout: 5000 });
        await page.locator('app-scrolling-player').scrollIntoViewIfNeeded();
    });

    // ── UI Tests ──────────────────────────────────────────────────────────

    test('loop button creates loop, controls appear', async ({ page }) => {
        // Click loop button
        await page.locator('.loop-btn').click();

        // Loop controls should be visible
        await expect(page.locator('.loop-clear-btn')).toBeVisible();
        const loopNumbers = page.locator('.loop-number');
        await expect(loopNumbers.first()).toBeVisible();

        // Verify loop range: start=end=1 (current measure at start)
        const range = await getLoopRange(page);
        expect(range).not.toBeNull();
        expect(range!.startMeasure).toBe(1);
        expect(range!.endMeasure).toBe(1);
    });

    test('loop range adjustable across 36 measures', async ({ page }) => {
        // Create loop and expand to measures 10-20
        await page.locator('.loop-btn').click();

        // Expand end to 20
        for (let i = 1; i < 20; i++) {
            await page.locator('[aria-label="Increase loop end"]').click();
        }
        // Expand start to 10
        for (let i = 1; i < 10; i++) {
            await page.locator('[aria-label="Increase loop start"]').click();
        }

        const range = await getLoopRange(page);
        expect(range!.startMeasure).toBe(10);
        expect(range!.endMeasure).toBe(20);

        const loopNumbers = page.locator('.loop-number');
        await expect(loopNumbers.first()).toHaveText('10');
        await expect(loopNumbers.last()).toHaveText('20');
    });

    test('loop range indicator scales correctly for 36-measure song', async ({ page }) => {
        // Set loop to measures 10-18 (approximately 25% of the song)
        await setLoopRange(page, 10, 18);

        const indicator = page.locator('.loop-range-indicator');
        await expect(indicator).toBeVisible();

        // Measures 10-18 out of 36:
        // left = (10-1)/36 × 100 = 25%
        // width = (18-(10-1))/36 × 100 = 25%
        const style = await indicator.evaluate((el) => ({
            left: parseFloat(el.style.left),
            width: parseFloat(el.style.width)
        }));
        expect(style.left).toBeCloseTo(25, 0);
        expect(style.width).toBeCloseTo(25, 0);
    });

    // ── Flow Mode Loop Tests ──────────────────────────────────────────────

    test('flow mode: loop plays through selected measures and loops back', async ({ page }) => {
        test.setTimeout(45000);

        await switchToFlowMode(page);
        await setTempoPercent(page, TEMPO_PERCENT);

        // Set loop to measures 5-8 (beats 16-32)
        await setLoopRange(page, 5, 8);

        // Suppress unhandled rejections from missed notes
        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        // Install loop counter
        await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            const ngComp = (window as any).ng.getComponent(comp);
            const w = window as any;
            w.__loopCount = 0;
            w.__loopMonitorRunning = true;
            let lastBeat = ngComp.currentBeat();
            function check() {
                const beat = ngComp.currentBeat();
                if (lastBeat - beat > 4) {
                    w.__loopCount++;
                }
                lastBeat = beat;
                if (w.__loopMonitorRunning) requestAnimationFrame(check);
            }
            requestAnimationFrame(check);
        });

        await clickPlay(page);

        // 4 measures × 2609ms at 200% → ~5200ms per loop. Wait for 2+ loops.
        await page.waitForTimeout(14000);

        const loopCount = await page.evaluate(() => {
            (window as any).__loopMonitorRunning = false;
            return (window as any).__loopCount;
        });

        console.log(`[MadWorld Loop] Flow mode loop count: ${loopCount}`);
        expect(loopCount).toBeGreaterThanOrEqual(2);
    });

    test('flow mode: no completion when loop is active on a long song', async ({ page }) => {
        test.setTimeout(30000);

        await switchToFlowMode(page);
        await setTempoPercent(page, TEMPO_PERCENT);

        // Set loop to measures 34-36 (the last 3 measures)
        await setLoopRange(page, 34, 36);

        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        await clickPlay(page);

        // Wait ~10 seconds — more than enough for several loops of 3 measures
        await page.waitForTimeout(10000);

        // No completion dialog
        await expect(page.locator('mat-dialog-container')).toHaveCount(0);

        // Still playing
        const isPlaying = await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            return (window as any).ng.getComponent(comp).isPlaying();
        });
        expect(isPlaying).toBe(true);
    });

    test('flow mode: notes reset to upcoming after loop boundary', async ({ page }) => {
        test.setTimeout(30000);

        await switchToFlowMode(page);
        await setTempoPercent(page, TEMPO_PERCENT);

        // Set loop to measures 1-2 (beats 0-8)
        await setLoopRange(page, 1, 2);

        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        await clickPlay(page);

        // Wait for at least one loop iteration
        // Measures 1-2 at 200% → ~2600ms + lead-in ~2600ms → ~5200ms first loop
        await page.waitForTimeout(9000);

        // Notes in range should have some upcoming/active (reset after loop)
        const notes = await getNoteStatesInRange(page, 0, 8);
        const hasUpcomingOrActive = notes.some(n => n.state === 'upcoming' || n.state === 'active');
        expect(hasUpcomingOrActive).toBe(true);

        console.log('[MadWorld Loop] Note states after loop:',
            notes.map(n => `${n.midi}@${n.startBeat.toFixed(1)}=${n.state}`).join(', '));
    });

    // ── Restart & Cursor Tests ────────────────────────────────────────────

    test('restart with loop active goes to loop start', async ({ page }) => {
        // Set loop to measures 10-15 (beats 36-60)
        await setLoopRange(page, 10, 15);

        // Beat should be at loop start (beat 36)
        let beat = await getCurrentBeat(page);
        expect(beat).toBeCloseTo(36, 0);

        // Start and advance
        await clickPlay(page);
        await page.waitForTimeout(1500);

        // Restart
        await page.locator('.restart-btn').evaluate((el) => (el as HTMLElement).click());
        await page.waitForTimeout(200);

        // Should be back at loop start (beat 36), not beginning (beat 0)
        beat = await getCurrentBeat(page);
        expect(beat).toBeCloseTo(36, 0);
    });

    test('clearing loop and restarting goes to beat 0', async ({ page }) => {
        // Set loop to measures 10-15
        await setLoopRange(page, 10, 15);

        // Beat at loop start
        let beat = await getCurrentBeat(page);
        expect(beat).toBeCloseTo(36, 0);

        // Clear loop
        await page.locator('.loop-clear-btn').click();

        // Restart — should now go to beat 0
        await page.locator('.restart-btn').evaluate((el) => (el as HTMLElement).click());
        await page.waitForTimeout(200);

        beat = await getCurrentBeat(page);
        expect(beat).toBeCloseTo(0, 0);
    });

    // ── CRITICAL: Cursor bug — no stale notes on empty bars after restart ──

    test('flow mode: cursor does not show notes on empty bars after restart from loop', async ({ page }) => {
        test.setTimeout(45000);

        await switchToFlowMode(page);
        await setTempoPercent(page, TEMPO_PERCENT);

        // Set loop to measures 10-15 (beats 36-60) — middle of the song
        await setLoopRange(page, 10, 15);

        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        // Play for a while so currentActiveBeat gets set to something in the loop
        await clickPlay(page);
        await page.waitForTimeout(4000);

        // Verify currentActiveBeat has a value during playback
        const activeBeatDuringPlay = await getCurrentActiveBeat(page);
        console.log(`[MadWorld Loop] Active beat during play: ${activeBeatDuringPlay}`);

        // Stop playback
        await page.locator('.play-btn').evaluate((el) => (el as HTMLElement).click());
        await page.waitForTimeout(300);

        // After stopping, currentActiveBeat should be null (cleared by stop())
        const activeBeatAfterStop = await getCurrentActiveBeat(page);
        expect(activeBeatAfterStop).toBeNull();

        // Clear the loop
        await page.locator('.loop-clear-btn').click();
        await page.waitForTimeout(200);

        // Restart from scratch
        await page.locator('.restart-btn').evaluate((el) => (el as HTMLElement).click());
        await page.waitForTimeout(200);

        // currentActiveBeat should still be null
        const activeBeatAfterRestart = await getCurrentActiveBeat(page);
        expect(activeBeatAfterRestart).toBeNull();

        // hintNotes should be empty
        const hints = await getHintNotes(page);
        expect(hints.length).toBe(0);

        // Now start playing again in flow mode
        await clickPlay(page);

        // During lead-in (first ~2.6s at 200%), no notes should be active
        await page.waitForTimeout(500);
        const activeBeatDuringLeadIn = await getCurrentActiveBeat(page);
        const hintsDuringLeadIn = await getHintNotes(page);

        console.log(`[MadWorld Loop] Active beat during lead-in: ${activeBeatDuringLeadIn}`);
        console.log(`[MadWorld Loop] Hints during lead-in: [${hintsDuringLeadIn}]`);

        // During lead-in, currentActiveBeat should be null (no notes active yet)
        expect(activeBeatDuringLeadIn).toBeNull();
        expect(hintsDuringLeadIn.length).toBe(0);

        // Wait for lead-in to finish and first notes to become active
        await page.waitForTimeout(3000);

        // Now active beat should be near beat 0 (first notes)
        const activeBeatAfterLeadIn = await getCurrentActiveBeat(page);
        console.log(`[MadWorld Loop] Active beat after lead-in: ${activeBeatAfterLeadIn}`);

        if (activeBeatAfterLeadIn !== null) {
            // Should be early in the song, not at the old loop position (36-60)
            expect(activeBeatAfterLeadIn).toBeLessThan(10);
        }
    });

    test('flow mode: restart within loop clears cursor state', async ({ page }) => {
        test.setTimeout(30000);

        await switchToFlowMode(page);
        await setTempoPercent(page, TEMPO_PERCENT);

        // Set loop to measures 5-8 (beats 16-32)
        await setLoopRange(page, 5, 8);

        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        // Play into the loop
        await clickPlay(page);
        await page.waitForTimeout(3000);

        // Restart (stays in loop mode, goes to loop start)
        await page.locator('.restart-btn').evaluate((el) => (el as HTMLElement).click());
        await page.waitForTimeout(300);

        // currentActiveBeat should be null after restart
        const activeBeat = await getCurrentActiveBeat(page);
        expect(activeBeat).toBeNull();

        // Beat should be at loop start
        const beat = await getCurrentBeat(page);
        expect(beat).toBeCloseTo(16, 0);

        // All notes in the loop range should be 'upcoming'
        const notes = await getNoteStatesInRange(page, 16, 32);
        for (const note of notes) {
            expect(note.state).toBe('upcoming');
        }
    });

    // ── Clear loop during playback ────────────────────────────────────────

    test('flow mode: clearing loop mid-playback allows normal completion', async ({ page }) => {
        test.setTimeout(90000);

        await switchToFlowMode(page);
        await setTempoPercent(page, TEMPO_PERCENT);

        // Set loop to measures 1-4
        await setLoopRange(page, 1, 4);

        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        await clickPlay(page);
        await page.waitForTimeout(3000);

        // Clear loop while playing
        await page.locator('.loop-clear-btn').click();

        // Song should eventually complete
        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 75000 });
        await expect(page.getByText('Lesson Complete')).toBeVisible();
    });
});
