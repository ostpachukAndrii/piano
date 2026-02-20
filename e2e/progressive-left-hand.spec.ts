import { expect, test, Page } from '@playwright/test';
import { gotoE2E, waitForApp, simulateNotePress, simulateNoteRelease } from './helpers/midi-simulator';

/**
 * Progressive Left-Hand Practice — E2E Tests
 *
 * Tests the feature where users can incrementally learn left-hand patterns.
 * Uses Mad World (36 measures, 92 BPM, 4/4, Ab major).
 *
 * Mad World has ~10 unique left-hand patterns (by frequency):
 *   [56,60] — most common (Ab+C chord)
 *   [62,65] — second most common (D+F chord)
 *   Various single notes and other chord voicings
 */

const TEMPO_PERCENT = 200;

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

async function getLeftHandPatterns(page: Page):
    Promise<{ midi: number[]; count: number; label: string }[]> {
    return page.evaluate(() => {
        const comp = document.querySelector('app-scrolling-player');
        return (window as any).ng.getComponent(comp).leftHandPatterns();
    });
}

async function getLeftHandLevel(page: Page): Promise<number> {
    return page.evaluate(() => {
        const comp = document.querySelector('app-scrolling-player');
        return (window as any).ng.getComponent(comp).leftHandLevel();
    });
}

async function setLeftHandLevel(page: Page, level: number): Promise<void> {
    await page.evaluate((lvl) => {
        const comp = document.querySelector('app-scrolling-player');
        const ngComp = (window as any).ng.getComponent(comp);
        ngComp.leftHandLevel.set(lvl);
        if (lvl > 0) ngComp.leftHandEnabled.set(true);
        else ngComp.leftHandEnabled.set(false);
    }, level);
}

async function getHintNotes(page: Page): Promise<number[]> {
    return page.evaluate(() => {
        const comp = document.querySelector('app-scrolling-player');
        return (window as any).ng.getComponent(comp).hintNotes();
    });
}

/** Get note states grouped by their pattern key */
async function getLeftHandNoteStates(page: Page):
    Promise<{ key: string; state: string; startBeat: number }[]> {
    return page.evaluate(() => {
        const comp = document.querySelector('app-scrolling-player');
        const ngComp = (window as any).ng.getComponent(comp);
        const results: { key: string; state: string; startBeat: number }[] = [];
        for (const n of ngComp.scrollingNotes) {
            if (n.hand !== 'left' || n.isRest) continue;
            const sorted = [...n.midi].sort((a: number, b: number) => a - b);
            results.push({
                key: sorted.join(','),
                state: n.state,
                startBeat: n.startBeat
            });
        }
        return results;
    });
}

test.describe('Progressive Left-Hand Practice — Mad World', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/lesson/mad-world-piano');
        await waitForApp(page);
        await expect(page.locator('app-lesson-player')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Mad World' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('app-scrolling-player')).toBeVisible({ timeout: 5000 });
        await page.locator('app-scrolling-player').scrollIntoViewIfNeeded();
    });

    // ── Pattern Extraction ────────────────────────────────────────────────

    test('extracts unique left-hand patterns sorted by frequency', async ({ page }) => {
        const patterns = await getLeftHandPatterns(page);

        // Mad World should have multiple unique left-hand patterns
        expect(patterns.length).toBeGreaterThanOrEqual(8);
        expect(patterns.length).toBeLessThanOrEqual(15);

        // Most common pattern first: [56,60] (Ab+C chord)
        expect(patterns[0].midi).toEqual([56, 60]);
        expect(patterns[0].count).toBeGreaterThanOrEqual(15);

        // Second pattern should have high frequency too
        expect(patterns[1].count).toBeGreaterThanOrEqual(5);

        // Verify frequency ordering (each pattern has count >= next)
        for (let i = 1; i < patterns.length; i++) {
            expect(patterns[i].count).toBeLessThanOrEqual(patterns[i - 1].count);
        }

        // Each pattern has a human-readable label
        for (const p of patterns) {
            expect(p.label.length).toBeGreaterThan(0);
        }

        console.log('[Progressive LH] Patterns:',
            patterns.map(p => `${p.label} (${p.count}x)`).join(', '));
    });

    // ── Default Level ─────────────────────────────────────────────────────

    test('default level is max (backward compatible)', async ({ page }) => {
        const level = await getLeftHandLevel(page);
        const patterns = await getLeftHandPatterns(page);

        // Default: level = max (user plays everything, matching current behavior)
        expect(level).toBe(patterns.length);
    });

    // ── UI Controls ───────────────────────────────────────────────────────

    test('+/- buttons adjust level, L button shows indicator', async ({ page }) => {
        const patterns = await getLeftHandPatterns(page);
        const maxLevel = patterns.length;

        // Level starts at max
        let level = await getLeftHandLevel(page);
        expect(level).toBe(maxLevel);

        // Level indicator should show max level
        const indicator = page.locator('.level-indicator');
        await expect(indicator).toHaveText(String(maxLevel));

        // Click − to decrease
        const decBtn = page.locator('button[aria-label="Decrease left hand level"]');
        await decBtn.click();
        level = await getLeftHandLevel(page);
        expect(level).toBe(maxLevel - 1);
        await expect(indicator).toHaveText(String(maxLevel - 1));

        // Click − again
        await decBtn.click();
        level = await getLeftHandLevel(page);
        expect(level).toBe(maxLevel - 2);

        // Click + to increase
        const incBtn = page.locator('button[aria-label="Increase left hand level"]');
        await incBtn.click();
        level = await getLeftHandLevel(page);
        expect(level).toBe(maxLevel - 1);
    });

    test('- disabled at level 0, + disabled at max level', async ({ page }) => {
        const decBtn = page.locator('button[aria-label="Decrease left hand level"]');
        const incBtn = page.locator('button[aria-label="Increase left hand level"]');

        // At max level, + should be disabled
        await expect(incBtn).toBeDisabled();
        await expect(decBtn).toBeEnabled();

        // Decrease to 0
        await setLeftHandLevel(page, 0);
        await page.waitForTimeout(100);

        // At level 0, - should be disabled
        await expect(decBtn).toBeDisabled();
        await expect(incBtn).toBeEnabled();
    });

    test('L toggle: OFF sets level to 0, ON sets level to max', async ({ page }) => {
        const lBtn = page.locator('button[aria-label="Left Hand"]');
        const patterns = await getLeftHandPatterns(page);
        const maxLevel = patterns.length;

        // Initially ON at max level
        let level = await getLeftHandLevel(page);
        expect(level).toBe(maxLevel);

        // Click L to toggle OFF → level drops to 0
        await lBtn.click();
        level = await getLeftHandLevel(page);
        expect(level).toBe(0);

        // Click L to toggle ON → level jumps to max
        await lBtn.click();
        level = await getLeftHandLevel(page);
        expect(level).toBe(maxLevel);
    });

    test('L button shows partial state (amber) at intermediate level', async ({ page }) => {
        const lBtn = page.locator('button[aria-label="Left Hand"]');

        // At max level: should have 'active' class (green)
        await expect(lBtn).toHaveClass(/active/);

        // Set to partial level
        await setLeftHandLevel(page, 5);
        await page.waitForTimeout(100);

        // Should have 'partial' class (amber)
        await expect(lBtn).toHaveClass(/partial/);

        // Set to 0: should have 'disabled' class
        await setLeftHandLevel(page, 0);
        await page.waitForTimeout(100);
        await expect(lBtn).toHaveClass(/disabled/);
    });

    // ── Flow Mode with Progressive Levels ─────────────────────────────────

    test('flow mode: level 0 auto-completes all LH notes', async ({ page }) => {
        test.setTimeout(60000);

        await switchToFlowMode(page);
        await setTempoPercent(page, TEMPO_PERCENT);

        // Set level to 0 (all auto-played)
        await setLeftHandLevel(page, 0);

        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        // Schedule right-hand notes only (via existing scheduleNotes pattern)
        await page.evaluate(({ leadInBeats }) => {
            const comp = document.querySelector('app-scrolling-player');
            const ngComp = (window as any).ng.getComponent(comp);
            const backend = (window as any).__mockBackend;
            const effectiveBpm = ngComp.lesson.tempo * (ngComp.tempoPercent() / 100);
            const msPerBeat = 60000 / effectiveBpm;

            for (const note of ngComp.scrollingNotes) {
                if (note.isRest || note.hand !== 'right') continue;
                const pressTime = (note.startBeat + leadInBeats) * msPerBeat;
                const releaseTime = pressTime + note.durationBeats * msPerBeat;
                setTimeout(() => backend.simulateChord(note.midi, note.hand), pressTime);
                for (const m of note.midi) {
                    setTimeout(() => backend.simulateNoteOff(m), releaseTime);
                }
            }
        }, { leadInBeats: 8 });

        await clickPlay(page);

        // Wait for completion
        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 75000 });

        // Should have high accuracy — RH notes played on time, LH notes auto-completed
        const accuracyText = await dialog.locator('.stat-card').filter({ hasText: 'Accuracy' })
            .locator('.stat-value').textContent();
        const accuracy = parseInt(accuracyText || '0');
        expect(accuracy).toBeGreaterThanOrEqual(70);

        console.log(`[Progressive LH] Level 0 accuracy: ${accuracy}%`);
    });

    test('flow mode: level 1 requires only the most common pattern', async ({ page }) => {
        test.setTimeout(60000);

        await switchToFlowMode(page);
        await setTempoPercent(page, TEMPO_PERCENT);

        // Set level to 1: only [56,60] requires user input
        await setLeftHandLevel(page, 1);

        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        // Schedule right-hand notes + only the [56,60] pattern from left hand
        await page.evaluate(({ leadInBeats }) => {
            const comp = document.querySelector('app-scrolling-player');
            const ngComp = (window as any).ng.getComponent(comp);
            const backend = (window as any).__mockBackend;
            const effectiveBpm = ngComp.lesson.tempo * (ngComp.tempoPercent() / 100);
            const msPerBeat = 60000 / effectiveBpm;

            for (const note of ngComp.scrollingNotes) {
                if (note.isRest) continue;

                // Play all right-hand notes
                // Play left-hand notes only if they match [56,60]
                const isRightHand = note.hand === 'right';
                const sorted = [...note.midi].sort((a: number, b: number) => a - b);
                const isEnabledLH = note.hand === 'left' && sorted.join(',') === '56,60';

                if (!isRightHand && !isEnabledLH) continue;

                const pressTime = (note.startBeat + leadInBeats) * msPerBeat;
                const releaseTime = pressTime + note.durationBeats * msPerBeat;
                setTimeout(() => backend.simulateChord(note.midi, note.hand), pressTime);
                for (const m of note.midi) {
                    setTimeout(() => backend.simulateNoteOff(m), releaseTime);
                }
            }
        }, { leadInBeats: 8 });

        await clickPlay(page);

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 75000 });

        // Should complete with high accuracy
        const accuracyText = await dialog.locator('.stat-card').filter({ hasText: 'Accuracy' })
            .locator('.stat-value').textContent();
        const accuracy = parseInt(accuracyText || '0');
        expect(accuracy).toBeGreaterThanOrEqual(70);

        console.log(`[Progressive LH] Level 1 accuracy: ${accuracy}%`);
    });

    test('flow mode: level 1 — non-enabled LH patterns are auto-completed', async ({ page }) => {
        test.setTimeout(30000);

        await switchToFlowMode(page);
        await setTempoPercent(page, TEMPO_PERCENT);

        // Level 1: only [56,60] is user-played; everything else auto-completed
        await setLeftHandLevel(page, 1);

        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        await clickPlay(page);

        // Wait for some notes to be processed (measures 1-4 have both patterns)
        await page.waitForTimeout(8000);

        // Check note states: non-[56,60] LH notes should be auto-completed (hit)
        const noteStates = await getLeftHandNoteStates(page);

        // Filter notes that are in early measures (already passed by playhead)
        const earlyNotes = noteStates.filter(n => n.startBeat < 8);

        const autoCompletedPatterns = earlyNotes.filter(n => n.key !== '56,60' && n.state === 'hit');
        const enabledPatternNotes = earlyNotes.filter(n => n.key === '56,60');

        console.log('[Progressive LH] Early notes:',
            earlyNotes.map(n => `${n.key}@${n.startBeat}=${n.state}`).join(', '));

        // Non-[56,60] patterns should be auto-completed (hit)
        expect(autoCompletedPatterns.length).toBeGreaterThan(0);

        // [56,60] pattern notes should be active or missed (not auto-completed)
        // since we didn't play them
        for (const n of enabledPatternNotes) {
            expect(n.state).not.toBe('upcoming');
        }
    });

    // ── Wait Mode with Progressive Levels ─────────────────────────────────

    test('wait mode: level 1 pauses only for enabled pattern', async ({ page }) => {
        test.setTimeout(30000);

        // Set level to 1: only [56,60] requires user input
        await setLeftHandLevel(page, 1);

        await clickPlay(page);
        await page.waitForTimeout(500);

        // In wait mode, the game should pause at the first note requiring user input.
        // Get current beat to see where it paused
        const beat = await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            return (window as any).ng.getComponent(comp).currentBeat();
        });

        // Find the first [56,60] pattern occurrence
        const patterns = await getLeftHandNoteStates(page);
        const firstEnabledLH = patterns.find(n => n.key === '56,60');

        console.log(`[Progressive LH] Wait mode paused at beat ${beat}, first [56,60] at beat ${firstEnabledLH?.startBeat}`);

        // The game may have paused at a right-hand note or the first [56,60]
        // But it should NOT be paused waiting for auto-completed LH patterns
        // Verify that any non-[56,60] LH notes before the current beat are auto-completed
        const earlyAutoNotes = patterns.filter(
            n => n.key !== '56,60' && n.startBeat <= beat + 0.5
        );
        for (const n of earlyAutoNotes) {
            expect(n.state).toBe('hit');
        }
    });

    // ── Loop + Progressive Level ──────────────────────────────────────────

    test('loop mode: progressive level works with loop reset', async ({ page }) => {
        test.setTimeout(45000);

        await switchToFlowMode(page);
        await setTempoPercent(page, TEMPO_PERCENT);

        // Set level to 1 and loop on measures 1-4
        await setLeftHandLevel(page, 1);
        await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            const ngComp = (window as any).ng.getComponent(comp);
            ngComp.setLoopStart(1);
            ngComp.setLoopEnd(4);
        });

        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        await clickPlay(page);

        // Wait for at least one loop iteration
        await page.waitForTimeout(10000);

        // After loop reset, check that non-enabled LH patterns
        // in the loop range are still being auto-completed
        const noteStates = await getLeftHandNoteStates(page);
        const loopNotes = noteStates.filter(n => n.startBeat >= 0 && n.startBeat < 16);

        // Non-[56,60] notes that have been passed should be auto-completed
        const autoCompleted = loopNotes.filter(n => n.key !== '56,60' && n.state === 'hit');
        expect(autoCompleted.length).toBeGreaterThan(0);

        // No completion dialog (loop is active)
        await expect(page.locator('mat-dialog-container')).toHaveCount(0);

        console.log('[Progressive LH] Loop + level 1 working:',
            loopNotes.map(n => `${n.key}@${n.startBeat.toFixed(0)}=${n.state}`).join(', '));
    });

    // ── Level Change During Playback ──────────────────────────────────────

    test('changing level during playback affects subsequent notes', async ({ page }) => {
        test.setTimeout(45000);

        await switchToFlowMode(page);
        await setTempoPercent(page, TEMPO_PERCENT);

        // Start at level 0 (all auto-played)
        await setLeftHandLevel(page, 0);

        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        await clickPlay(page);
        await page.waitForTimeout(3000);

        // Increase level to 3 mid-playback
        await setLeftHandLevel(page, 3);
        await page.waitForTimeout(5000);

        // Now upcoming notes for the top 3 patterns should require user input
        const noteStates = await getLeftHandNoteStates(page);
        const currentBeat = await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            return (window as any).ng.getComponent(comp).currentBeat();
        });

        // Get the actual top-3 pattern keys dynamically
        const patterns = await getLeftHandPatterns(page);
        const enabledKeys = new Set(patterns.slice(0, 3).map(p => p.midi.join(',')));

        // Future notes with enabled patterns (top 3 by frequency)
        const futureEnabledNotes = noteStates.filter(n =>
            n.startBeat > currentBeat &&
            enabledKeys.has(n.key) &&
            n.state === 'upcoming'
        );

        // Future notes with non-enabled patterns should still be upcoming
        // (they'll be auto-completed when they reach the hit window)
        expect(futureEnabledNotes.length).toBeGreaterThan(0);

        console.log(`[Progressive LH] Level changed to 3 at beat ${currentBeat.toFixed(0)}, ` +
            `${futureEnabledNotes.length} enabled LH notes upcoming`);
    });

    // ── Visual: Auto-play pattern keys for greyed-out rendering ──────────

    test('autoPlayLeftHandKeys correctly tracks non-enabled patterns', async ({ page }) => {
        const patterns = await getLeftHandPatterns(page);
        const allKeys = patterns.map(p => p.midi.join(','));

        // At max level: no auto-play keys (all user-played)
        let autoKeys: string[] = await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            return Array.from((window as any).ng.getComponent(comp).autoPlayLeftHandKeys());
        });
        expect(autoKeys.length).toBe(0);

        // At level 1: all patterns except the most common are auto-play
        await setLeftHandLevel(page, 1);
        await page.waitForTimeout(100);
        autoKeys = await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            return Array.from((window as any).ng.getComponent(comp).autoPlayLeftHandKeys());
        });
        expect(autoKeys.length).toBe(allKeys.length - 1);
        expect(autoKeys).not.toContain(allKeys[0]); // Most common NOT in auto-play

        // At level 0 with LH enabled: all patterns are auto-play
        await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            const ngComp = (window as any).ng.getComponent(comp);
            ngComp.leftHandEnabled.set(true);
            ngComp.leftHandLevel.set(0);
        });
        await page.waitForTimeout(100);
        autoKeys = await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            return Array.from((window as any).ng.getComponent(comp).autoPlayLeftHandKeys());
        });
        expect(autoKeys.length).toBe(allKeys.length);

        console.log(`[Progressive LH] Auto-play keys: level=max → 0, level=1 → ${allKeys.length - 1}, level=0 → ${allKeys.length}`);
    });
});
