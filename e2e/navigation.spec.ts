import { expect, test } from '@playwright/test';
import { gotoE2E, waitForApp } from './helpers/midi-simulator';

test.describe('App Navigation', () => {
    test('home page loads with hero banner and action cards', async ({ page }) => {
        await gotoE2E(page, '/');
        await waitForApp(page);

        await expect(page.locator('h1')).toContainText('Piano Learning App');
        await expect(page.locator('.action-card')).toHaveCount(2);
        await expect(page.getByText('Start Learning')).toBeVisible();
        await expect(page.getByText('MIDI Setup')).toBeVisible();
    });

    test('home page shows lesson count after loading', async ({ page }) => {
        await gotoE2E(page, '/');
        await waitForApp(page);

        // MockTauriService has 6 lessons
        await expect(page.getByText('6 lessons available')).toBeVisible({ timeout: 5000 });
    });

    test('clicking Start Learning navigates to lessons page', async ({ page }) => {
        await gotoE2E(page, '/');
        await waitForApp(page);

        await page.locator('.action-card').first().click();
        await expect(page).toHaveURL(/\/lessons/);
        await expect(page.getByText('Select a Lesson')).toBeVisible();
    });

    test('clicking MIDI Setup navigates to settings', async ({ page }) => {
        await gotoE2E(page, '/');
        await waitForApp(page);

        await page.locator('.action-card').nth(1).click();
        await expect(page).toHaveURL(/\/settings/);
        await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible();
    });

    test('lessons page shows lesson cards', async ({ page }) => {
        await gotoE2E(page, '/lessons');
        await waitForApp(page);

        // Wait for lessons to load from MockTauriService
        await expect(page.locator('.lesson-card').first()).toBeVisible({ timeout: 5000 });
        await expect(page.locator('.lesson-card')).toHaveCount(6);
        await expect(page.getByText('Ode to Joy')).toBeVisible();
        await expect(page.getByText('C Major Scale')).toBeVisible();
        await expect(page.getByText('All Note Types')).toBeVisible();
        await expect(page.getByText('Mad World')).toBeVisible();
        await expect(page.getByText('Tie & Staccato Test')).toBeVisible();
        await expect(page.getByText('Viva la Vida')).toBeVisible();
    });

    test('clicking a lesson card navigates to the player', async ({ page }) => {
        await gotoE2E(page, '/lessons');
        await waitForApp(page);

        // Wait for lessons to load
        await expect(page.locator('.lesson-card').first()).toBeVisible({ timeout: 5000 });

        // Click the first lesson card's Start button
        await page.locator('.lesson-card').first().locator('button').click();
        await expect(page).toHaveURL(/\/lesson\//);
    });

    test('lesson player loads and shows lesson content', async ({ page }) => {
        await gotoE2E(page, '/lesson/ode-to-joy');
        await waitForApp(page);

        // Wait for lesson to load
        await expect(page.locator('app-lesson-player')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Ode to Joy' })).toBeVisible({ timeout: 10000 });
    });

    test('full navigation flow: home → lessons → player → back', async ({ page }) => {
        // Start at home
        await gotoE2E(page, '/');
        await waitForApp(page);

        // Go to lessons
        await page.locator('.action-card').first().click();
        await expect(page).toHaveURL(/\/lessons/);

        // Wait for lessons to load
        await expect(page.locator('.lesson-card').first()).toBeVisible({ timeout: 5000 });

        // Select a lesson
        await page.locator('.lesson-card').first().locator('button').click();
        await expect(page).toHaveURL(/\/lesson\//);

        // Wait for lesson to load
        await expect(page.getByRole('heading', { name: 'Ode to Joy' })).toBeVisible({ timeout: 10000 });

        // Go back to lessons via the back button
        const backButton = page.locator('button').filter({ hasText: /arrow_back|back/i }).first();
        await backButton.click();
        await expect(page).toHaveURL(/\/lessons/);
    });
});
