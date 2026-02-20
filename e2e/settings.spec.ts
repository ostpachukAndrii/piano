import { expect, test } from '@playwright/test';
import { gotoE2E, waitForApp, simulateNotePress, simulateNoteRelease } from './helpers/midi-simulator';

test.describe('Settings Page', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/settings');
        await waitForApp(page);
    });

    test('settings page loads with heading and MIDI section', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible();
        await expect(page.getByText('MIDI Devices', { exact: true })).toBeVisible();
    });

    test('shows connected status after auto-connect', async ({ page }) => {
        // The app auto-connects to first mock device on init
        await expect(page.locator('.connected-device')).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('Connected and ready')).toBeVisible();
    });

    test('scan button is visible', async ({ page }) => {
        const scanButton = page.getByRole('button', { name: /Scan for Devices/i });
        await expect(scanButton).toBeVisible();
    });

    test('shows device list after scanning', async ({ page }) => {
        const scanButton = page.getByRole('button', { name: /Scan for Devices/i });
        await scanButton.click();

        // Device list should appear
        const deviceList = page.locator('mat-list');
        await expect(deviceList).toBeVisible({ timeout: 3000 });
    });

    test('can disconnect from auto-connected device', async ({ page }) => {
        // Wait for auto-connect
        await expect(page.locator('.connected-device')).toBeVisible({ timeout: 5000 });

        // Disconnect
        await page.getByRole('button', { name: /Disconnect/i }).click();

        // Connected device section should disappear
        await expect(page.locator('.connected-device')).not.toBeVisible({ timeout: 3000 });
        await expect(page.getByText('Not connected')).toBeVisible();
    });

    test('can reconnect after disconnecting', async ({ page }) => {
        // Wait for auto-connect, then disconnect
        await expect(page.locator('.connected-device')).toBeVisible({ timeout: 5000 });
        await page.getByRole('button', { name: /Disconnect/i }).click();
        await expect(page.locator('.connected-device')).not.toBeVisible({ timeout: 3000 });

        // Scan to refresh devices
        await page.getByRole('button', { name: /Scan for Devices/i }).click();
        await page.waitForTimeout(500);

        // Now Connect button should be enabled
        const connectButton = page.getByRole('button', { name: /^Connect$/i }).first();
        await connectButton.click();

        // Should be connected again
        await expect(page.locator('.connected-device')).toBeVisible({ timeout: 3000 });
    });

    test('active notes section is visible', async ({ page }) => {
        await expect(page.getByText('Active Notes')).toBeVisible();
    });

    test('pressing MIDI keys shows active notes', async ({ page }) => {
        // Simulate pressing a note
        await simulateNotePress(page, [60]); // C4

        // Active note names should appear
        const noteBadge = page.locator('.note-badge');
        await expect(noteBadge).toBeVisible({ timeout: 2000 });

        // Release the note
        await simulateNoteRelease(page, 60);
        await page.waitForTimeout(200);

        // Note should disappear
        await expect(page.getByText('Press keys on your MIDI keyboard')).toBeVisible({ timeout: 2000 });
    });

    test('bluetooth setup guide is visible', async ({ page }) => {
        await expect(page.getByText('Bluetooth MIDI Setup')).toBeVisible();
        await expect(page.getByText('Connect your piano wirelessly')).toBeVisible();
    });

    test('about section shows app info', async ({ page }) => {
        await expect(page.getByText('About')).toBeVisible();
        await expect(page.getByText('Version: 0.1.0')).toBeVisible();
    });
});
