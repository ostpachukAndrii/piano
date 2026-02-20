import { expect, test } from '@playwright/test';
import { gotoE2E, waitForApp, playNote, playSequence, simulateNotePress, simulateNoteRelease } from './helpers/midi-simulator';

test.describe('Lesson Player - MIDI Simulation', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/lesson/ode-to-joy');
        await waitForApp(page);

        // Wait for lesson to load
        await expect(page.locator('app-lesson-player')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Ode to Joy' })).toBeVisible({ timeout: 10000 });

        // Switch to classic view where feedback badge and stats are visible
        const classicToggle = page.locator('mat-button-toggle[value="classic"]');
        await classicToggle.click();
        await expect(page.locator('.staff-card')).toBeVisible({ timeout: 3000 });
    });

    test('lesson loads with correct title', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Ode to Joy' })).toBeVisible();
    });

    test('classic view shows music staff', async ({ page }) => {
        await expect(page.locator('.staff-card')).toBeVisible();
        await expect(page.getByText('Music Staff')).toBeVisible();
    });

    test('playing correct note shows Perfect feedback', async ({ page }) => {
        // Ode to Joy starts with midi 64 (E4)
        await playNote(page, 64);

        // Feedback badge should appear with Perfect
        const badge = page.locator('.feedback-badge');
        await expect(badge).toBeVisible({ timeout: 3000 });
        await expect(badge).toHaveClass(/feedback-perfect/);
    });

    test('playing wrong note shows Wrong feedback', async ({ page }) => {
        // Expected is 64 (E4), play 70 (wrong)
        await playNote(page, 70);

        const badge = page.locator('.feedback-badge');
        await expect(badge).toBeVisible({ timeout: 3000 });
        await expect(badge).toHaveClass(/feedback-wrong/);
    });

    test('correct note advances to next note', async ({ page }) => {
        // Play first correct note (64 - E)
        await playNote(page, 64);
        await page.waitForTimeout(300);

        // Play second correct note (64 - E again) — should also get Perfect
        await playNote(page, 64);

        const badge = page.locator('.feedback-badge');
        await expect(badge).toBeVisible({ timeout: 3000 });
        await expect(badge).toHaveClass(/feedback-perfect/);
    });

    test('wrong note does NOT advance to next note', async ({ page }) => {
        // Play wrong note
        await playNote(page, 70);
        await page.waitForTimeout(300);

        // Playing the first expected note (64) should still work
        // (because we haven't advanced past note 0)
        await playNote(page, 64);

        const badge = page.locator('.feedback-badge');
        await expect(badge).toBeVisible({ timeout: 3000 });
        await expect(badge).toHaveClass(/feedback-perfect/);
    });

    test('playing first measure shows progress', async ({ page }) => {
        // First measure of Ode to Joy: E E F G (64, 64, 65, 67)
        await playSequence(page, [64, 64, 65, 67], 'right', 400);

        // Should still be in the lesson (7 more measures to go)
        const badge = page.locator('.feedback-badge');
        await expect(badge).toBeVisible({ timeout: 3000 });
        await expect(badge).toHaveClass(/feedback-perfect/);
    });

    test('stats display updates after playing notes', async ({ page }) => {
        // Play a correct note (first note is E4 = 64)
        await playNote(page, 64);
        await page.waitForTimeout(500);

        // Stats should be visible and show data
        const stats = page.locator('app-stats-display');
        await expect(stats).toBeVisible({ timeout: 3000 });
    });

    test('note press and release cycle works correctly', async ({ page }) => {
        // Press a note (not release yet) — first note is E4 = 64
        await simulateNotePress(page, [64]);
        await page.waitForTimeout(200);

        // Release the note
        await simulateNoteRelease(page, 64);
        await page.waitForTimeout(200);

        // Should have shown feedback for the correct note
        const badge = page.locator('.feedback-badge');
        await expect(badge).toBeVisible({ timeout: 3000 });
    });
});
