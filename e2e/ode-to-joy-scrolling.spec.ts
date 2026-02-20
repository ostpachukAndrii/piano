import { expect, test, Page } from '@playwright/test';
import { gotoE2E, waitForApp, playNote, simulateNotePress, simulateNoteRelease } from './helpers/midi-simulator';

/**
 * Full Ode to Joy playthrough in SCROLLING (Guitar Hero) view.
 *
 * The scrolling player defaults to "wait" mode — it scrolls to each note,
 * pauses at the playhead, and waits for the player to press the correct key.
 * After all 30 notes are hit, it scrolls a 2-beat buffer then triggers completion.
 *
 * Melody (right hand) — 30 notes across 8 measures:
 *   Measure 1: E E F G        (64 64 65 67)
 *   Measure 2: G F E D        (67 65 64 62)
 *   Measure 3: C C D E        (60 60 62 64)
 *   Measure 4: E. D D         (64 62 62)
 *   Measure 5: E E F G        (64 64 65 67)
 *   Measure 6: G F E D        (67 65 64 62)
 *   Measure 7: C C D E        (60 60 62 64)
 *   Measure 8: D. C C         (62 60 60)
 */

// Each note: [midi, durationBeats] — tempo 100 BPM → 1 beat = 600ms
const ODE_TO_JOY_NOTES: [number, number][] = [
    // Measure 1: E E F G (quarter notes)
    [64, 1.0], [64, 1.0], [65, 1.0], [67, 1.0],
    // Measure 2: G F E D (quarter notes)
    [67, 1.0], [65, 1.0], [64, 1.0], [62, 1.0],
    // Measure 3: C C D E (quarter notes)
    [60, 1.0], [60, 1.0], [62, 1.0], [64, 1.0],
    // Measure 4: E. D D (dotted quarter, eighth, half)
    [64, 1.5], [62, 0.5], [62, 2.0],
    // Measure 5: E E F G (quarter notes)
    [64, 1.0], [64, 1.0], [65, 1.0], [67, 1.0],
    // Measure 6: G F E D (quarter notes)
    [67, 1.0], [65, 1.0], [64, 1.0], [62, 1.0],
    // Measure 7: C C D E (quarter notes)
    [60, 1.0], [60, 1.0], [62, 1.0], [64, 1.0],
    // Measure 8: D. C C (dotted quarter, eighth, half)
    [62, 1.5], [60, 0.5], [60, 2.0],
];

/**
 * Click the play button via JS to bypass any overlay.
 */
async function clickPlay(page: Page): Promise<void> {
    await page.locator('.play-btn').evaluate((el) => (el as HTMLElement).click());
}

const MS_PER_BEAT = 600; // tempo 100 BPM → 1 beat = 600ms

/**
 * Play a single note in scrolling wait mode:
 * press, hold for the note's full duration, then release.
 */
async function playScrollingNote(page: Page, midi: number, durationBeats = 1.0): Promise<void> {
    const holdMs = Math.max(400, durationBeats * MS_PER_BEAT);
    await simulateNotePress(page, [midi]);
    await page.waitForTimeout(holdMs);
    await simulateNoteRelease(page, midi);
    await page.waitForTimeout(400);
}

test.describe('Full Ode to Joy — Scrolling View', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/lesson/ode-to-joy');
        await waitForApp(page);

        await expect(page.locator('app-lesson-player')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Ode to Joy' })).toBeVisible({ timeout: 10000 });

        // Default view is scrolling — verify it
        await expect(page.locator('app-scrolling-player')).toBeVisible({ timeout: 5000 });

        // Scroll the player into view so it's visible during headed runs
        await page.locator('app-scrolling-player').scrollIntoViewIfNeeded();
    });

    test('scrolling player is visible with playback controls', async ({ page }) => {
        await expect(page.locator('app-scrolling-player')).toBeVisible();
        await expect(page.locator('app-playback-controls')).toBeVisible();
    });

    test('starts in wait mode by default', async ({ page }) => {
        const waitToggle = page.locator('mat-button-toggle[value="wait"]');
        await expect(waitToggle).toBeVisible();
    });

    test('clicking play starts the scrolling player', async ({ page }) => {
        await clickPlay(page);
        await page.waitForTimeout(500);
        await expect(page.locator('app-scrolling-player')).toBeVisible();
    });

    test('perfect run: 100% accuracy, 30 perfect, no errors', async ({ page }) => {
        test.setTimeout(120000);

        await clickPlay(page);
        await page.waitForTimeout(2000);

        for (const [midi, dur] of ODE_TO_JOY_NOTES) {
            await playScrollingNote(page, midi, dur);
        }

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 30000 });
        await expect(page.getByText('Lesson Complete')).toBeVisible();

        // --- Stat cards ---
        await expect(dialog.locator('.stat-card').filter({ hasText: 'Accuracy' })
            .locator('.stat-value')).toHaveText('100%');
        await expect(dialog.locator('.stat-card').filter({ hasText: 'Accuracy' })
            .locator('.stat-detail')).toHaveText('30 of 30 notes');

        // Best Streak comes from evaluation service (both parent + scrolling call checkPitch)
        const streakValue = await dialog.locator('.stat-card').filter({ hasText: 'Best Streak' })
            .locator('.stat-value').textContent();
        expect(Number(streakValue)).toBeGreaterThanOrEqual(30);

        // --- Performance breakdown: only Perfect should appear ---
        const breakdown = dialog.locator('.breakdown-grid');
        await expect(breakdown.locator('.breakdown-item.success .count')).toHaveText('30');
        await expect(breakdown.locator('.breakdown-item.success .label')).toHaveText('Perfect');

        // No early, late, missed, short, or wrong
        await expect(breakdown.locator('.breakdown-item.warning')).toHaveCount(0);
        await expect(breakdown.locator('.breakdown-item.error')).toHaveCount(0);

        // --- Performance message ---
        await expect(dialog.locator('.performance-message')).toContainText('Outstanding performance');
    });

    test('imperfect run: wrong notes tracked in breakdown', async ({ page }) => {
        test.setTimeout(120000);

        // Suppress unhandled promise rejections from wrong-note evaluation
        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (e) => e.preventDefault());
        });

        await clickPlay(page);
        await page.waitForTimeout(2000);

        // Play wrong notes before the first 2 correct notes
        await simulateNotePress(page, [50]);
        await page.waitForTimeout(400);
        await simulateNoteRelease(page, 50);
        await page.waitForTimeout(500);

        await simulateNotePress(page, [51]);
        await page.waitForTimeout(400);
        await simulateNoteRelease(page, 51);
        await page.waitForTimeout(500);

        // Play all 30 correct notes normally
        for (const [midi, dur] of ODE_TO_JOY_NOTES) {
            await playScrollingNote(page, midi, dur);
        }

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 30000 });

        // All 30 notes should be hit → 100% accuracy
        await expect(dialog.locator('.stat-card').filter({ hasText: 'Accuracy' })
            .locator('.stat-value')).toHaveText('100%');
        await expect(dialog.locator('.stat-card').filter({ hasText: 'Accuracy' })
            .locator('.stat-detail')).toContainText('of 30 notes');

        // Breakdown should show Perfect notes AND Wrong notes
        const breakdown = dialog.locator('.breakdown-grid');
        const perfectCount = parseInt(await breakdown.locator('.breakdown-item.success .count').textContent() || '0');
        expect(perfectCount).toBe(30);

        // 2 wrong notes should be tracked
        const wrongItem = breakdown.locator('.breakdown-item.error').filter({ hasText: 'Wrong' });
        await expect(wrongItem).toBeVisible();
        await expect(wrongItem.locator('.count')).toHaveText('2');
    });

});
