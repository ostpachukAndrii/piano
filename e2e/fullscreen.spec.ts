import { expect, test, Page } from '@playwright/test';
import { gotoE2E, waitForApp } from './helpers/midi-simulator';

/**
 * Fullscreen Mode Tests
 *
 * Verifies that the completion popup (dialog) appears correctly
 * when playing through a full song in fullscreen mode.
 *
 * In fullscreen, the dialog uses special z-index values
 * (.completion-dialog-fullscreen) to render above the fullscreen content.
 */

// Ode to Joy note data — [midi, startBeat, durationBeats]
const ODE_TO_JOY_TIMED: [number, number, number][] = [
    [64, 0, 1.0], [64, 1, 1.0], [65, 2, 1.0], [67, 3, 1.0],
    [67, 4, 1.0], [65, 5, 1.0], [64, 6, 1.0], [62, 7, 1.0],
    [60, 8, 1.0], [60, 9, 1.0], [62, 10, 1.0], [64, 11, 1.0],
    [64, 12, 1.5], [62, 13.5, 0.5], [62, 14, 2.0],
    [64, 16, 1.0], [64, 17, 1.0], [65, 18, 1.0], [67, 19, 1.0],
    [67, 20, 1.0], [65, 21, 1.0], [64, 22, 1.0], [62, 23, 1.0],
    [60, 24, 1.0], [60, 25, 1.0], [62, 26, 1.0], [64, 27, 1.0],
    [62, 28, 1.5], [60, 29.5, 0.5], [60, 30, 2.0],
];

const LEAD_IN_BEATS = 8;
const MS_PER_BEAT = 600; // 100 BPM

async function clickPlay(page: Page): Promise<void> {
    await page.locator('.play-btn').evaluate((el) => (el as HTMLElement).click());
}

async function switchToFlowMode(page: Page): Promise<void> {
    const flowToggle = page.locator('mat-button-toggle[value="flow"]');
    await flowToggle.evaluate((el) => (el as HTMLElement).querySelector('button')?.click());
    await page.waitForTimeout(200);
}

async function scheduleAllNotes(page: Page): Promise<void> {
    await page.evaluate(({ notes, leadIn, msPerBeat }) => {
        const backend = (window as any).__mockBackend;
        for (const [midi, startBeat, duration] of notes) {
            const pressTime = (startBeat + leadIn) * msPerBeat;
            const releaseTime = pressTime + duration * msPerBeat;
            setTimeout(() => backend.simulateChord([midi], 'right'), pressTime);
            setTimeout(() => backend.simulateNoteOff(midi), releaseTime);
        }
    }, { notes: ODE_TO_JOY_TIMED, leadIn: LEAD_IN_BEATS, msPerBeat: MS_PER_BEAT });
}

test.describe('Fullscreen Mode — Completion', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/lesson/ode-to-joy');
        await waitForApp(page);

        await expect(page.locator('app-lesson-player')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Ode to Joy' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('app-scrolling-player')).toBeVisible({ timeout: 5000 });
        await page.locator('app-scrolling-player').scrollIntoViewIfNeeded();
    });

    // ---------------------------------------------------------------
    // Test: Fullscreen flow mode — completion popup appears
    // ---------------------------------------------------------------
    test('fullscreen mode: completion popup appears after playing whole song', async ({ page }) => {
        test.setTimeout(60000);

        await switchToFlowMode(page);

        // Enter fullscreen — use real click for user gesture requirement
        const fullscreenBtn = page.locator('.fullscreen-btn');
        await fullscreenBtn.click();
        await page.waitForTimeout(500);

        // Verify fullscreen was entered (or set it manually for headless)
        const isFullscreen = await page.evaluate(() => !!document.fullscreenElement);
        if (!isFullscreen) {
            // Headless mode: manually set fullscreen state so CSS classes apply
            await page.evaluate(() => {
                const comp = document.querySelector('app-scrolling-player');
                const ngComp = (window as any).ng.getComponent(comp);
                ngComp.isFullscreen.set(true);
            });
        }
        console.log(`[Fullscreen] Entered fullscreen: ${isFullscreen ? 'native' : 'simulated'}`);

        // Schedule all notes and play
        await scheduleAllNotes(page);
        await clickPlay(page);

        // Wait for completion dialog
        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 45000 });

        // Verify dialog content is accessible in fullscreen
        await expect(dialog.getByText(/Accuracy/i)).toBeVisible();
        await expect(dialog.getByRole('button', { name: /Play Again/i })).toBeVisible();

        // Verify the dialog has the fullscreen-safe panel class
        const hasPanelClass = await page.evaluate(() => {
            const panel = document.querySelector('.completion-dialog-fullscreen');
            return !!panel;
        });
        expect(hasPanelClass).toBe(true);

        // Verify the dialog fits within the viewport (not overflowing)
        const dialogBox = await dialog.boundingBox();
        const viewport = page.viewportSize()!;
        if (dialogBox) {
            expect(dialogBox.y).toBeGreaterThanOrEqual(0);
            expect(dialogBox.y + dialogBox.height).toBeLessThanOrEqual(viewport.height + 5);
            console.log(`[Fullscreen] Dialog size: ${dialogBox.width.toFixed(0)}x${dialogBox.height.toFixed(0)}, viewport: ${viewport.width}x${viewport.height}`);
        }

        console.log('[Fullscreen] Completion dialog appeared successfully in fullscreen mode');
    });

    // ---------------------------------------------------------------
    // Test: Fullscreen Play Again button works
    // ---------------------------------------------------------------
    test('fullscreen mode: Play Again button closes dialog and resets', async ({ page }) => {
        test.setTimeout(60000);

        await switchToFlowMode(page);

        // Enter fullscreen
        const fullscreenBtn = page.locator('.fullscreen-btn');
        await fullscreenBtn.click();
        await page.waitForTimeout(500);

        const isFullscreen = await page.evaluate(() => !!document.fullscreenElement);
        if (!isFullscreen) {
            await page.evaluate(() => {
                const comp = document.querySelector('app-scrolling-player');
                const ngComp = (window as any).ng.getComponent(comp);
                ngComp.isFullscreen.set(true);
            });
        }

        await scheduleAllNotes(page);
        await clickPlay(page);

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 45000 });

        // Click Play Again
        await dialog.getByRole('button', { name: /Play Again/i }).evaluate(
            (el) => (el as HTMLElement).click()
        );

        // Dialog should close
        await expect(dialog).not.toBeVisible({ timeout: 5000 });

        // Scrolling player should still be visible and ready
        await expect(page.locator('app-scrolling-player')).toBeVisible();
    });
});
