import { expect, test } from '@playwright/test';
import { gotoE2E, waitForApp } from './helpers/midi-simulator';

test.describe('Lesson Modes & Views', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/lesson/ode-to-joy');
        await waitForApp(page);
        await expect(page.locator('app-lesson-player')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Ode to Joy' })).toBeVisible({ timeout: 10000 });
    });

    test('mode selector is visible', async ({ page }) => {
        const modeSelector = page.locator('app-mode-selector');
        await expect(modeSelector).toBeVisible();
    });

    test('mode selector has study and play options', async ({ page }) => {
        // Open the mat-select dropdown
        const select = page.locator('app-mode-selector mat-select');
        await select.click();

        // Check study modes
        await expect(page.getByRole('option', { name: /Study Right Hand/i })).toBeVisible();
        await expect(page.getByRole('option', { name: /Study Left Hand/i })).toBeVisible();
        await expect(page.getByRole('option', { name: /Study Both Hands/i })).toBeVisible();

        // Check play modes
        await expect(page.getByRole('option', { name: /Play Right Hand/i })).toBeVisible();
        await expect(page.getByRole('option', { name: /Play Left Hand/i })).toBeVisible();
        await expect(page.getByRole('option', { name: /Full Performance/i })).toBeVisible();

        // Close dropdown
        await page.keyboard.press('Escape');
    });

    test('changing mode resets progress', async ({ page }) => {
        // Open mode selector and switch mode
        const select = page.locator('app-mode-selector mat-select');
        await select.click();
        await page.getByRole('option', { name: /Study Left Hand/i }).click();

        // After mode change, the lesson should reset (no feedback visible)
        await page.waitForTimeout(300);
        const badge = page.locator('.feedback-badge');
        await expect(badge).not.toBeVisible();
    });

    test('default view is scrolling', async ({ page }) => {
        // Scrolling view should be the default
        const scrollingPlayer = page.locator('app-scrolling-player');
        await expect(scrollingPlayer).toBeVisible();
    });

    test('can toggle to classic view', async ({ page }) => {
        // Find and click the classic view toggle button
        const classicToggle = page.locator('app-mode-selector').getByRole('button', { name: /classic/i });
        if (await classicToggle.isVisible()) {
            await classicToggle.click();
            await page.waitForTimeout(300);

            // Classic view should show grand staff
            const grandStaff = page.locator('app-grand-staff');
            await expect(grandStaff).toBeVisible();
        }
    });

    test('can toggle back to scrolling view', async ({ page }) => {
        // Switch to classic first
        const classicToggle = page.locator('app-mode-selector').getByRole('button', { name: /classic/i });
        if (await classicToggle.isVisible()) {
            await classicToggle.click();
            await page.waitForTimeout(300);

            // Switch back to scrolling
            const scrollingToggle = page.locator('app-mode-selector').getByRole('button', { name: /scrolling/i });
            await scrollingToggle.click();
            await page.waitForTimeout(300);

            const scrollingPlayer = page.locator('app-scrolling-player');
            await expect(scrollingPlayer).toBeVisible();
        }
    });

    test('classic view shows music staff card', async ({ page }) => {
        const classicToggle = page.locator('app-mode-selector').getByRole('button', { name: /classic/i });
        if (await classicToggle.isVisible()) {
            await classicToggle.click();
            await page.waitForTimeout(300);

            await expect(page.locator('.staff-card')).toBeVisible();
            await expect(page.getByText('Music Staff')).toBeVisible();
        }
    });

    test('classic view shows playback controls', async ({ page }) => {
        const classicToggle = page.locator('app-mode-selector').getByRole('button', { name: /classic/i });
        if (await classicToggle.isVisible()) {
            await classicToggle.click();
            await page.waitForTimeout(300);

            const playbackBar = page.locator('app-playback-bar');
            await expect(playbackBar).toBeVisible();
        }
    });

    test('classic view uses full available width', async ({ page }) => {
        // Switch to classic view
        const classicToggle = page.locator('mat-button-toggle[value="classic"]');
        await classicToggle.click();
        await expect(page.locator('.staff-card')).toBeVisible({ timeout: 3000 });
        await page.waitForTimeout(500); // Wait for ResizeObserver to fire

        // Get the staff card content area width
        const cardContent = page.locator('.staff-card mat-card-content');
        const cardBox = await cardContent.boundingBox();

        // Get the grand-staff width
        const grandStaff = page.locator('app-grand-staff');
        const staffBox = await grandStaff.boundingBox();

        // Get the canvas width (the actual rendered staff)
        const canvas = page.locator('app-grand-staff canvas').first();
        const canvasBox = await canvas.boundingBox();

        expect(cardBox).toBeTruthy();
        expect(staffBox).toBeTruthy();
        expect(canvasBox).toBeTruthy();

        // The grand-staff should use at least 90% of the card content width
        const widthRatio = staffBox!.width / cardBox!.width;
        expect(widthRatio).toBeGreaterThan(0.9);

        // The canvas should be wider than the old hardcoded 900px on wide viewports
        // Default Playwright viewport is 1280px, so staff should be wider than 900
        expect(canvasBox!.width).toBeGreaterThan(900);
    });
});
