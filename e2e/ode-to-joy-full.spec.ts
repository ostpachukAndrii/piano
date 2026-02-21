import { expect, test } from '@playwright/test';
import { gotoE2E, waitForApp, playNote, playSequence } from './helpers/midi-simulator';

/**
 * Full Ode to Joy playthrough — plays all 30 notes across 8 measures
 * and verifies the completion dialog appears.
 *
 * Melody (right hand):
 *   Measure 1: E E F G        (64 64 65 67)
 *   Measure 2: G F E D        (67 65 64 62)
 *   Measure 3: C C D E        (60 60 62 64)
 *   Measure 4: E. D D         (64 62 62)
 *   Measure 5: E E F G        (64 64 65 67)
 *   Measure 6: G F E D        (67 65 64 62)
 *   Measure 7: C C D E        (60 60 62 64)
 *   Measure 8: D. C C         (62 60 60)
 */

const ODE_TO_JOY_NOTES = [
    // Measure 1: E E F G
    64, 64, 65, 67,
    // Measure 2: G F E D
    67, 65, 64, 62,
    // Measure 3: C C D E
    60, 60, 62, 64,
    // Measure 4: E. D D
    64, 62, 62,
    // Measure 5: E E F G
    64, 64, 65, 67,
    // Measure 6: G F E D
    67, 65, 64, 62,
    // Measure 7: C C D E
    60, 60, 62, 64,
    // Measure 8: D. C C
    62, 60, 60,
];

test.describe('Full Ode to Joy Playthrough', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/lesson/ode-to-joy');
        await waitForApp(page);

        await expect(page.locator('app-lesson-player')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Ode to Joy' })).toBeVisible({ timeout: 10000 });

        // Switch to classic view where note-by-note advancement works
        const classicToggle = page.locator('mat-button-toggle[value="classic"]');
        await classicToggle.click();
        await expect(page.locator('.staff-card')).toBeVisible({ timeout: 3000 });

        // Scroll the staff into view so it's visible during headed runs
        await page.locator('.staff-card').scrollIntoViewIfNeeded();
    });

    test('perfect run: 100% accuracy and best streak 30', async ({ page }) => {
        await playSequence(page, ODE_TO_JOY_NOTES, 'right', 300);

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('Lesson Complete')).toBeVisible();

        // --- Stat cards ---
        await expect(dialog.locator('.stat-card').filter({ hasText: 'Accuracy' })
            .locator('.stat-value')).toHaveText('100%');
        await expect(dialog.locator('.stat-card').filter({ hasText: 'Best Streak' })
            .locator('.stat-value')).toHaveText('30');

        // Classic view has no extended stats → no breakdown section
        await expect(dialog.locator('.breakdown-section')).toHaveCount(0);

        // Performance message
        await expect(dialog.locator('.performance-message')).toContainText('Outstanding performance');
    });

    test('completion dialog shows action buttons', async ({ page }) => {
        await playSequence(page, ODE_TO_JOY_NOTES, 'right', 300);

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 15000 });

        // Should have Play Again and Back to Lessons buttons
        await expect(page.getByRole('button', { name: /Play Again/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Back to Lessons/i })).toBeVisible();
    });

    test('Play Again closes dialog and stays on lesson page', async ({ page }) => {
        test.setTimeout(45000);

        await playSequence(page, ODE_TO_JOY_NOTES, 'right', 300);

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 15000 });

        // Click Play Again
        await dialog.getByRole('button', { name: /Play Again/i }).evaluate(
            (el) => (el as HTMLElement).click()
        );

        // Dialog should close
        await expect(dialog).not.toBeVisible({ timeout: 5000 });

        // Should stay on the lesson page (NOT navigate to /lessons)
        await expect(page).toHaveURL(/\/lesson\//);
        await expect(page.locator('app-lesson-player')).toBeVisible();
        await expect(page.locator('.staff-card')).toBeVisible();
    });

    test('Back to Lessons navigates away from lesson page', async ({ page }) => {
        test.setTimeout(45000);

        await playSequence(page, ODE_TO_JOY_NOTES, 'right', 300);

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 15000 });

        // Click Back to Lessons
        await dialog.getByRole('button', { name: /Back to Lessons/i }).evaluate(
            (el) => (el as HTMLElement).click()
        );

        // Dialog should close
        await expect(dialog).not.toBeVisible({ timeout: 5000 });

        // Should navigate to /lessons (lesson selector)
        await expect(page).toHaveURL(/\/lessons$/);
    });

    test('wrong notes mid-lesson do not break the flow', async ({ page }) => {
        // Play first 4 notes correctly (measure 1)
        await playSequence(page, [64, 64, 65, 67], 'right', 300);

        // Play a wrong note
        await playNote(page, 50);
        await page.waitForTimeout(200);

        // Continue with correct notes for measure 2
        await playSequence(page, [67, 65, 64, 62], 'right', 300);

        // Should still show feedback (lesson continues)
        const badge = page.locator('.feedback-badge');
        await expect(badge).toBeVisible({ timeout: 3000 });
    });

    test('imperfect run: wrong notes lower accuracy', async ({ page }) => {
        // Play first 4 notes correctly (measure 1)
        await playSequence(page, [64, 64, 65, 67], 'right', 300);

        // Play 2 wrong notes
        await playNote(page, 50);
        await page.waitForTimeout(200);
        await playNote(page, 51);
        await page.waitForTimeout(200);

        // Continue with remaining correct notes (measures 2-8)
        const remaining = ODE_TO_JOY_NOTES.slice(4);
        await playSequence(page, remaining, 'right', 300);

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 15000 });

        // Accuracy should be less than 100% (wrong notes counted by eval service)
        const accuracyText = await dialog.locator('.stat-card').filter({ hasText: 'Accuracy' })
            .locator('.stat-value').textContent();
        const accuracy = parseInt(accuracyText || '0');
        expect(accuracy).toBeLessThan(100);
        expect(accuracy).toBeGreaterThan(0);
    });
});
