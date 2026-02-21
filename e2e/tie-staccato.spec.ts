import { expect, test, Page } from '@playwright/test';
import { gotoE2E, waitForApp, simulateNotePress, simulateNoteRelease } from './helpers/midi-simulator';

/**
 * E2E tests for tie and staccato rendering.
 *
 * Uses the 'tie-staccato-test' mock lesson (240 BPM = 250ms/beat) which has:
 *   Measure 1: C4 (tie_start, beat 0) -> C4 (tie_stop, beat 1) -> E4 staccato (beat 2) -> F4 staccato (beat 3)
 *   Measure 2: G4 (beat 4)
 *
 * The tied second note (C4 tie_stop) is auto-completed, so only
 * 4 notes require user input: C4, E4, F4, G4.
 */

async function clickPlay(page: Page): Promise<void> {
    await page.locator('.play-btn').evaluate((el) => (el as HTMLElement).click());
}

// At 240 BPM, 1 beat = 250ms
const MS_PER_BEAT = 250;

async function playScrollingNote(page: Page, midi: number, holdMs = 400): Promise<void> {
    await simulateNotePress(page, [midi]);
    await page.waitForTimeout(holdMs);
    await simulateNoteRelease(page, midi);
}

test.describe('Tie & Staccato', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/lesson/tie-staccato-test');
        await waitForApp(page);
        await expect(page.locator('app-lesson-player')).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('heading', { name: 'Tie & Staccato Test' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('app-scrolling-player')).toBeVisible({ timeout: 5000 });
    });

    test('lesson loads and renders notation stage', async ({ page }) => {
        const canvas = page.locator('app-notation-stage canvas');
        await expect(canvas).toBeVisible();
    });

    test('tied note does not require separate key press to complete lesson', async ({ page }) => {
        test.setTimeout(60000);

        // Start playback (wait mode — playhead pauses at each note)
        await clickPlay(page);
        // Wait for playhead to reach first note (beat 0)
        await page.waitForTimeout(1000);

        // C4 at beat 0 (tie_start). After hit, playhead scrolls toward E4 at beat 2.
        // tie_stop C4 at beat 1 is auto-completed as playhead passes it.
        await playScrollingNote(page, 60);
        // Wait for playhead to scroll 2 beats (500ms) + margin
        await page.waitForTimeout(MS_PER_BEAT * 3);

        // E4 at beat 2 (staccato). After hit, playhead scrolls to F4 at beat 3.
        await playScrollingNote(page, 64);
        await page.waitForTimeout(MS_PER_BEAT * 2);

        // F4 at beat 3 (staccato). After hit, playhead scrolls to G4 at beat 4.
        await playScrollingNote(page, 65);
        await page.waitForTimeout(MS_PER_BEAT * 2);

        // G4 at beat 4. After hit, playhead scrolls to completion.
        await playScrollingNote(page, 67);

        // Completion dialog should appear after buffer scroll (2 beats ≈ 500ms + processing)
        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 15000 });
        await expect(dialog.locator('text=Lesson Complete')).toBeVisible();
    });

    test('canvas has rendered content', async ({ page }) => {
        const canvasHasContent = await page.evaluate(() => {
            const canvas = document.querySelector('app-notation-stage canvas') as HTMLCanvasElement;
            if (!canvas) return false;
            const ctx = canvas.getContext('2d');
            if (!ctx) return false;
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] > 20 || data[i + 1] > 20 || data[i + 2] > 40) {
                    return true;
                }
            }
            return false;
        });

        expect(canvasHasContent).toBe(true);
    });
});
