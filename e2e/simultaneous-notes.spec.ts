import { expect, test, Page } from '@playwright/test';
import { gotoE2E, waitForApp, simulateNotePress, simulateNoteRelease } from './helpers/midi-simulator';

/**
 * E2E tests for simultaneous note requirements.
 *
 * Uses Mad World (beat 1 has RH:67 + LH:[56,60]) to verify:
 * All notes at the same beat must be pressed SIMULTANEOUSLY.
 * Pressing partial notes in separate key presses should NOT complete them.
 */

async function clickPlay(page: Page): Promise<void> {
    await page.locator('.play-btn').evaluate((el) => (el as HTMLElement).click());
}

/**
 * Read the current beat from the progress bar percentage and total beats.
 * Progress = (beat / totalBeats) * 100
 */
async function getCurrentBeat(page: Page): Promise<number> {
    return page.evaluate(() => {
        // Access the progress percentage displayed in the UI
        const progressEl = document.querySelector('.progress-fill') as HTMLElement;
        if (!progressEl) return -1;
        const width = parseFloat(progressEl.style.width || '0');
        // For Mad World: totalBeats = 144. For tie-staccato: totalBeats = 5
        // We just need relative comparison, so return the width percentage
        return width;
    });
}

test.describe('Simultaneous Notes — Mad World', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/lesson/mad-world-piano');
        await waitForApp(page);
        await expect(page.locator('app-lesson-player')).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('heading', { name: 'Mad World' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('app-scrolling-player')).toBeVisible({ timeout: 5000 });
    });

    test('wait mode: partial press does NOT advance past simultaneous notes', async ({ page }) => {
        test.setTimeout(30000);

        await clickPlay(page);
        await page.waitForTimeout(1000);

        // Mad World beat 0: RH=68 (eighth note) with LH=rest at beat 0
        // Beat 0 only has RH:68 so single press works
        await simulateNotePress(page, [68]);
        await page.waitForTimeout(600);
        await simulateNoteRelease(page, 68);
        await page.waitForTimeout(400);

        // Beat 0.5: RH=72 (eighth note, no LH)
        await simulateNotePress(page, [72]);
        await page.waitForTimeout(600);
        await simulateNoteRelease(page, 72);
        await page.waitForTimeout(400);

        // Now at beat 1: RH:67 + LH:[56,60] must be simultaneous
        // Record progress BEFORE any attempt
        const progressBefore = await getCurrentBeat(page);
        console.log(`[SimNotes] Progress before partial press: ${progressBefore}%`);

        // Press ONLY the RH note (67) — partial press
        await simulateNotePress(page, [67]);
        await page.waitForTimeout(500);
        await simulateNoteRelease(page, 67);
        await page.waitForTimeout(300);

        // Progress should NOT have advanced (playhead still stuck at beat 1)
        const progressAfterPartial = await getCurrentBeat(page);
        console.log(`[SimNotes] Progress after partial press: ${progressAfterPartial}%`);
        // Should be the same or very close (within floating point tolerance)
        expect(progressAfterPartial).toBeLessThanOrEqual(progressBefore + 0.5);

        // Now press only chord notes without RH — still partial
        await simulateNotePress(page, [56, 60]);
        await page.waitForTimeout(500);
        await simulateNoteRelease(page, 56);
        await simulateNoteRelease(page, 60);
        await page.waitForTimeout(300);

        const progressAfterChordOnly = await getCurrentBeat(page);
        console.log(`[SimNotes] Progress after chord-only press: ${progressAfterChordOnly}%`);
        expect(progressAfterChordOnly).toBeLessThanOrEqual(progressBefore + 0.5);

        // Now press ALL THREE simultaneously — should advance
        await simulateNotePress(page, [67, 56, 60]);
        await page.waitForTimeout(800);

        const progressAfterFull = await getCurrentBeat(page);
        console.log(`[SimNotes] Progress after full simultaneous press: ${progressAfterFull}%`);
        expect(progressAfterFull).toBeGreaterThan(progressBefore + 0.1);

        await simulateNoteRelease(page, 67);
        await simulateNoteRelease(page, 56);
        await simulateNoteRelease(page, 60);
    });

    test('wait mode: chord [56,60] alone is not enough without RH note', async ({ page }) => {
        test.setTimeout(30000);

        await clickPlay(page);
        await page.waitForTimeout(1000);

        // Advance through beat 0 notes
        await simulateNotePress(page, [68]);
        await page.waitForTimeout(600);
        await simulateNoteRelease(page, 68);
        await page.waitForTimeout(400);

        await simulateNotePress(page, [72]);
        await page.waitForTimeout(600);
        await simulateNoteRelease(page, 72);
        await page.waitForTimeout(400);

        // At beat 1: RH:67 + LH:[56,60]
        const progressAtBeat1 = await getCurrentBeat(page);

        // Press just the LH chord (56+60) without the RH note
        await simulateNotePress(page, [56, 60]);
        await page.waitForTimeout(600);
        const progressAfterChord = await getCurrentBeat(page);

        // Should NOT have advanced
        expect(progressAfterChord).toBeLessThanOrEqual(progressAtBeat1 + 0.5);
        console.log(`[SimNotes] Chord-only attempt: before=${progressAtBeat1}%, after=${progressAfterChord}%`);

        await simulateNoteRelease(page, 56);
        await simulateNoteRelease(page, 60);
    });
});

test.describe('Tied Note Hold — Tie & Staccato', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/lesson/tie-staccato-test');
        await waitForApp(page);
        await expect(page.locator('app-lesson-player')).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('heading', { name: 'Tie & Staccato Test' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('app-scrolling-player')).toBeVisible({ timeout: 5000 });
    });

    test('tied note extends duration for early release tracking', async ({ page }) => {
        test.setTimeout(60000);

        // Enable debug panel to read early release stats
        await page.evaluate(() => {
            // Toggle debug panel via keyboard shortcut or directly
            const comp = document.querySelector('app-scrolling-player');
            if (comp) {
                // Find the component instance and enable debug
                const event = new KeyboardEvent('keydown', { key: 'd', ctrlKey: true });
                document.dispatchEvent(event);
            }
        });

        await clickPlay(page);
        await page.waitForTimeout(500);

        // C4 at beat 0 (tie_start, dur 1 + tie_stop dur 1 = 2 beats total)
        // At 240 BPM: 2 beats = 500ms
        // Press and release after only 100ms (way too early)
        await simulateNotePress(page, [60]);
        await page.waitForTimeout(100);
        await simulateNoteRelease(page, 60);

        // Wait for the game loop to process the early release
        await page.waitForTimeout(1000);

        // Check via page.evaluate that the note has releasedEarly=true
        const noteStates = await page.evaluate(() => {
            // Access Angular component's scrollingNotes array
            // The scrolling player stores notes in a class property
            const el = document.querySelector('app-scrolling-player');
            if (!el) return [];
            // Try to access via Angular's debug tools
            const ngEl = (el as any).__ngContext__;
            if (!ngEl) return [];
            // Walk the component tree to find scrollingNotes
            // Alternative: check the hint display which reflects note state
            return [];
        });

        // The early release detection works internally even without debug panel.
        // Let's verify by playing through the whole lesson and checking the completion stats.
        // Play remaining notes to complete the lesson.
        await page.waitForTimeout(500);

        // E4 staccato at beat 2
        await simulateNotePress(page, [64]);
        await page.waitForTimeout(500);
        await simulateNoteRelease(page, 64);
        await page.waitForTimeout(500);

        // F4 staccato at beat 3
        await simulateNotePress(page, [65]);
        await page.waitForTimeout(500);
        await simulateNoteRelease(page, 65);
        await page.waitForTimeout(500);

        // G4 at beat 4
        await simulateNotePress(page, [67]);
        await page.waitForTimeout(500);
        await simulateNoteRelease(page, 67);

        // Wait for completion dialog
        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 15000 });

        // The completion dialog shows performance breakdown.
        // The early release should show up as "Short" in the breakdown.
        const breakdownText = await dialog.textContent();
        console.log(`[TieHold] Completion dialog text: ${breakdownText}`);

        // Check that "Short" appears in the breakdown (indicating early release was tracked)
        const hasShort = breakdownText?.includes('Short') || false;
        console.log(`[TieHold] Has 'Short' in breakdown: ${hasShort}`);
        // Note: Short only appears if count > 0, which it should since we released C4 early
        expect(hasShort).toBe(true);
    });
});
