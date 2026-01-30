import { expect, test } from '@playwright/test';

test.describe('ScrollingPlayer Component', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to Storybook
        await page.goto('http://localhost:6006/?path=/story/components-scrollingplayer--default');

        // Wait for story to load
        await page.waitForSelector('app-scrolling-player');
    });

    test('should render the component', async ({ page }) => {
        const component = await page.locator('app-scrolling-player');
        await expect(component).toBeVisible();
    });

    test('should have all three zones', async ({ page }) => {
        // Zone A: Control bar
        const controlBar = await page.locator('.zone-a');
        await expect(controlBar).toBeVisible();

        // Zone B: Stage with canvas
        const stage = await page.locator('.zone-b');
        await expect(stage).toBeVisible();

        const canvas = await page.locator('canvas.stage-canvas');
        await expect(canvas).toBeVisible();

        // Zone C: Keyboard
        const keyboard = await page.locator('.zone-c');
        await expect(keyboard).toBeVisible();
    });

    test('should start playback when play button is clicked', async ({ page }) => {
        const playButton = await page.locator('.pause-btn');

        // Initially should show play icon
        const playIcon = await playButton.locator('mat-icon');
        await expect(playIcon).toHaveText('play_arrow');

        // Click to start
        await playButton.click();

        // Should change to pause icon
        await expect(playIcon).toHaveText('pause');
    });

    test('should toggle between play and pause', async ({ page }) => {
        const playButton = await page.locator('.pause-btn');
        const icon = await playButton.locator('mat-icon');

        // Start playing
        await playButton.click();
        await expect(icon).toHaveText('pause');

        // Pause
        await playButton.click();
        await expect(icon).toHaveText('play_arrow');
    });

    test('should display progress bar', async ({ page }) => {
        const progressBar = await page.locator('mat-progress-bar');
        await expect(progressBar).toBeVisible();
    });

    test('should have tempo control', async ({ page }) => {
        const tempoSlider = await page.locator('mat-slider');
        await expect(tempoSlider).toBeVisible();

        const tempoText = await page.locator('.tempo-text');
        await expect(tempoText).toContainText('100%');
    });

    test('should have play mode toggle buttons', async ({ page }) => {
        const toggleGroup = await page.locator('mat-button-toggle-group');
        await expect(toggleGroup).toBeVisible();

        const flowButton = await page.locator('mat-button-toggle[value="flow"]');
        const waitButton = await page.locator('mat-button-toggle[value="wait"]');

        await expect(flowButton).toBeVisible();
        await expect(waitButton).toBeVisible();
    });

    test('should switch between flow and wait modes', async ({ page }) => {
        const flowButton = await page.locator('mat-button-toggle[value="flow"]');
        const waitButton = await page.locator('mat-button-toggle[value="wait"]');

        // Wait mode is default
        await expect(waitButton).toHaveClass(/mat-button-toggle-checked/);

        // Switch to flow
        await flowButton.click();
        await expect(flowButton).toHaveClass(/mat-button-toggle-checked/);

        // Switch back to wait
        await waitButton.click();
        await expect(waitButton).toHaveClass(/mat-button-toggle-checked/);
    });

    test('should render virtual keyboard', async ({ page }) => {
        const keyboard = await page.locator('.piano-keys');
        await expect(keyboard).toBeVisible();

        // Should have piano keys
        const keys = await page.locator('.piano-key').count();
        expect(keys).toBeGreaterThan(0);
    });

    test('should have both white and black keys', async ({ page }) => {
        const whiteKeys = await page.locator('.piano-key.white').count();
        const blackKeys = await page.locator('.piano-key.black').count();

        expect(whiteKeys).toBeGreaterThan(0);
        expect(blackKeys).toBeGreaterThan(0);
    });

    test('should show playhead line', async ({ page }) => {
        const playhead = await page.locator('.playhead');
        await expect(playhead).toBeVisible();
    });

    test('should render canvas with correct dimensions', async ({ page }) => {
        const canvas = await page.locator('canvas.stage-canvas');

        const width = await canvas.getAttribute('width');
        const height = await canvas.getAttribute('height');

        expect(width).toBe('1200');
        expect(height).toBe('400');
    });

    test('should update progress when playing', async ({ page }) => {
        const playButton = await page.locator('.pause-btn');
        const progressText = await page.locator('.progress-text');

        // Start at 0%
        await expect(progressText).toContainText('0%');

        // Start playing
        await playButton.click();

        // Wait a moment for progress
        await page.waitForTimeout(1000);

        // Progress should have increased
        const progressValue = await progressText.textContent();
        const progressNum = parseInt(progressValue?.replace('%', '') || '0');
        expect(progressNum).toBeGreaterThan(0);
    });
});

test.describe('ScrollingPlayer - Different Lessons', () => {
    test('should load two-hand lesson', async ({ page }) => {
        await page.goto('http://localhost:6006/?path=/story/components-scrollingplayer--two-hands');
        await page.waitForSelector('app-scrolling-player');

        const component = await page.locator('app-scrolling-player');
        await expect(component).toBeVisible();
    });

    test('should load chord lesson', async ({ page }) => {
        await page.goto('http://localhost:6006/?path=/story/components-scrollingplayer--with-chords');
        await page.waitForSelector('app-scrolling-player');

        const component = await page.locator('app-scrolling-player');
        await expect(component).toBeVisible();
    });

    test('should handle no lesson gracefully', async ({ page }) => {
        await page.goto('http://localhost:6006/?path=/story/components-scrollingplayer--no-lesson');
        await page.waitForSelector('app-scrolling-player');

        const component = await page.locator('app-scrolling-player');
        await expect(component).toBeVisible();
    });
});
