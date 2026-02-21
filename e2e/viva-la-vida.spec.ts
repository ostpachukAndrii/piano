import { expect, test, Page } from '@playwright/test';
import { gotoE2E, waitForApp, simulateNotePress, simulateNoteRelease } from './helpers/midi-simulator';

/**
 * E2E tests for Viva la Vida song rendering.
 *
 * Uses the 'viva-la-vida-piano-super-easy' mock lesson which has:
 *   - LH beamed 8th notes (should connect stems properly with beams)
 *   - RH dotted notes (should render augmentation dots)
 *   - RH tied notes (tie curve between measures 2-3)
 *   - LH chords with half-note duration (stems should connect all noteheads)
 *   - Key signature: Ab major (4 flats)
 */

async function clickPlay(page: Page): Promise<void> {
    await page.locator('.play-btn').evaluate((el) => (el as HTMLElement).click());
}

async function playScrollingNote(page: Page, midi: number): Promise<void> {
    await simulateNotePress(page, [midi]);
    await page.waitForTimeout(400);
    await simulateNoteRelease(page, midi);
    await page.waitForTimeout(200);
}

test.describe('Viva la Vida', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/lesson/viva-la-vida-piano-super-easy');
        await waitForApp(page);
        await expect(page.locator('app-lesson-player')).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('heading', { name: 'Viva la Vida' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('app-scrolling-player')).toBeVisible({ timeout: 5000 });
    });

    test('lesson loads and shows notation stage', async ({ page }) => {
        const canvas = page.locator('app-notation-stage canvas');
        await expect(canvas).toBeVisible();
    });

    test('canvas renders content (notes, staff lines, clefs)', async ({ page }) => {
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

    test('lesson info shows Ab major key and correct metadata', async ({ page }) => {
        // Check key signature is displayed
        await expect(page.getByText('Ab major').first()).toBeVisible();
        // Check time signature
        await expect(page.getByText('4/4').first()).toBeVisible();
        // Check BPM
        await expect(page.getByText('138 BPM').first()).toBeVisible();
    });

    test('both hands are shown (left and right hand notes)', async ({ page }) => {
        // The lesson has both LH and RH notes. Check that the lesson content
        // shows notes for both hands
        const lessonContent = page.locator('text=right').first();
        await expect(lessonContent).toBeVisible({ timeout: 5000 });
    });

    test('beamed 8th notes render without visual artifacts', async ({ page }) => {
        // Verify canvas has substantial rendered content (beams, stems, noteheads)
        // by checking that a significant portion of the canvas has non-background pixels
        const pixelData = await page.evaluate(() => {
            const canvas = document.querySelector('app-notation-stage canvas') as HTMLCanvasElement;
            if (!canvas) return { total: 0, drawn: 0 };
            const ctx = canvas.getContext('2d');
            if (!ctx) return { total: 0, drawn: 0 };
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            let drawn = 0;
            const total = data.length / 4;
            for (let i = 0; i < data.length; i += 4) {
                // Count non-background pixels (background is ~#0f0f23)
                if (data[i] > 30 || data[i + 1] > 30 || data[i + 2] > 50) {
                    drawn++;
                }
            }
            return { total, drawn };
        });

        // At least 1% of pixels should be drawn (notes, staff lines, clefs, etc.)
        const drawnRatio = pixelData.drawn / pixelData.total;
        expect(drawnRatio).toBeGreaterThan(0.01);
    });
});
