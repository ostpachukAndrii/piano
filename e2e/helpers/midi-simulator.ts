import { Page } from '@playwright/test';

/**
 * Simulate pressing MIDI notes (chord or single note).
 * Calls window.__mockBackend.simulateChord() in the browser.
 */
export async function simulateNotePress(
    page: Page,
    notes: number[],
    hand: 'left' | 'right' | 'both' = 'right'
): Promise<void> {
    await page.evaluate(
        ({ notes, hand }) => {
            (window as any).__mockBackend.simulateChord(notes, hand);
        },
        { notes, hand }
    );
}

/**
 * Simulate releasing a MIDI note.
 * Calls window.__mockBackend.simulateNoteOff() in the browser.
 */
export async function simulateNoteRelease(page: Page, midi: number): Promise<void> {
    await page.evaluate(
        (midi) => {
            (window as any).__mockBackend.simulateNoteOff(midi);
        },
        midi
    );
}

/**
 * Play a single note: press, wait, release.
 */
export async function playNote(
    page: Page,
    midi: number,
    hand: 'left' | 'right' | 'both' = 'right',
    holdMs = 300
): Promise<void> {
    await simulateNotePress(page, [midi], hand);
    await page.waitForTimeout(holdMs);
    await simulateNoteRelease(page, midi);
    await page.waitForTimeout(100);
}

/**
 * Play a sequence of notes with delays between each.
 */
export async function playSequence(
    page: Page,
    midiNotes: number[],
    hand: 'left' | 'right' | 'both' = 'right',
    delayBetweenMs = 200
): Promise<void> {
    for (const midi of midiNotes) {
        await playNote(page, midi, hand);
        await page.waitForTimeout(delayBetweenMs);
    }
}

/**
 * Navigate to a page with the ?e2e flag enabled.
 */
export async function gotoE2E(page: Page, path: string): Promise<void> {
    const separator = path.includes('?') ? '&' : '?';
    await page.goto(`${path}${separator}e2e=true`);
}

/**
 * Wait for the Angular app to be fully bootstrapped in E2E mode.
 */
export async function waitForApp(page: Page): Promise<void> {
    await page.waitForFunction(() => (window as any).__mockBackend !== undefined, null, {
        timeout: 15000,
    });
}

/**
 * Connect to a mock MIDI device so the app shows as connected.
 */
export async function connectMockDevice(page: Page, deviceId = '1'): Promise<void> {
    await page.evaluate(
        (id) => {
            (window as any).__mockBackend.startMidiListening(id);
        },
        deviceId
    );
}
