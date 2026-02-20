import { expect, test, Page } from '@playwright/test';
import { gotoE2E, waitForApp } from './helpers/midi-simulator';

/**
 * Sound Duration Tests — All Note Types
 *
 * Verifies that the piano sound actually plays for the correct duration
 * for each note type: whole (4 beats), half (2 beats), quarter (1 beat),
 * and eighth (0.5 beats).
 *
 * Uses the "All Note Types" lesson at 60 BPM (1 beat = 1000ms)
 * so durations are easy to verify.
 */

// All Note Types lesson — [midi, startBeat, durationBeats]
const ALL_NOTE_TYPES_TIMED: [number, number, number][] = [
    [60, 0, 4.0],      // C4 whole note
    [62, 4, 2.0],      // D4 half note
    [64, 6, 2.0],      // E4 half note
    [65, 8, 1.0],      // F4 quarter
    [67, 9, 1.0],      // G4 quarter
    [69, 10, 1.0],     // A4 quarter
    [71, 11, 1.0],     // B4 quarter
    [72, 12, 0.5],     // C5 eighth
    [74, 12.5, 0.5],   // D5 eighth
    [76, 13, 0.5],     // E5 eighth
    [77, 13.5, 0.5],   // F5 eighth
    [79, 14, 0.5],     // G5 eighth
    [77, 14.5, 0.5],   // F5 eighth (repeat)
    [76, 15, 0.5],     // E5 eighth (repeat)
    [74, 15.5, 0.5],   // D5 eighth (repeat)
];

const LEAD_IN_BEATS = 8;
const MS_PER_BEAT = 1000; // 60 BPM

async function clickPlay(page: Page): Promise<void> {
    await page.locator('.play-btn').evaluate((el) => (el as HTMLElement).click());
}

async function switchToFlowMode(page: Page): Promise<void> {
    const flowToggle = page.locator('mat-button-toggle[value="flow"]');
    await flowToggle.evaluate((el) => (el as HTMLElement).querySelector('button')?.click());
    await page.waitForTimeout(200);
}

/**
 * Install a monitor that patches PianoSoundService.playNote and .stopNote
 * to record timestamps for each MIDI note.
 */
async function installSoundMonitor(page: Page): Promise<void> {
    await page.evaluate(() => {
        const w = window as any;
        w.__soundLog = [];

        const comp = document.querySelector('app-scrolling-player');
        const ngComp = (window as any).ng.getComponent(comp);
        const pianoService = ngComp.pianoService;

        const origPlayNote = pianoService.playNote.bind(pianoService);
        const origStopNote = pianoService.stopNote.bind(pianoService);

        pianoService.playNote = function (midi: number, velocity?: number, duration?: number) {
            w.__soundLog.push({ type: 'play', midi, time: performance.now() });
            return origPlayNote(midi, velocity, duration);
        };

        pianoService.stopNote = function (midi: number) {
            w.__soundLog.push({ type: 'stop', midi, time: performance.now() });
            return origStopNote(midi);
        };
    });
}

/**
 * Read the sound log from the browser.
 */
async function getSoundLog(page: Page): Promise<{ type: string; midi: number; time: number }[]> {
    return page.evaluate(() => (window as any).__soundLog);
}

test.describe('Sound Duration — All Note Types', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/lesson/all-note-types');
        await waitForApp(page);

        await expect(page.locator('app-lesson-player')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'All Note Types' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('app-scrolling-player')).toBeVisible({ timeout: 5000 });
        await page.locator('app-scrolling-player').scrollIntoViewIfNeeded();
    });

    // ---------------------------------------------------------------
    // Test 1: Whole note sound plays for full 4-beat duration
    // ---------------------------------------------------------------
    test('whole note (C4) sound plays for approximately 4 beats', async ({ page }) => {
        test.setTimeout(60000);

        await switchToFlowMode(page);
        await installSoundMonitor(page);

        // Schedule all notes to be pressed and released at the correct times
        await page.evaluate(({ notes, leadIn, msPerBeat }) => {
            const backend = (window as any).__mockBackend;
            for (const [midi, startBeat, duration] of notes) {
                const pressTime = (startBeat + leadIn) * msPerBeat;
                const releaseTime = pressTime + duration * msPerBeat;
                setTimeout(() => backend.simulateChord([midi], 'right'), pressTime);
                setTimeout(() => backend.simulateNoteOff(midi), releaseTime);
            }
        }, { notes: ALL_NOTE_TYPES_TIMED, leadIn: LEAD_IN_BEATS, msPerBeat: MS_PER_BEAT });

        await clickPlay(page);

        // Wait for completion
        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 45000 });

        // Read sound log
        const soundLog = await getSoundLog(page);

        // Find the first play and the last stop for C4
        const c4Events = soundLog.filter(e => e.midi === 60);
        const c4Play = c4Events.find(e => e.type === 'play');
        const c4StopEvents = c4Events.filter(e => e.type === 'stop');
        const c4LastStop = c4StopEvents.length > 0 ? c4StopEvents[c4StopEvents.length - 1] : null;

        expect(c4Play).toBeTruthy();
        expect(c4LastStop).toBeTruthy();

        const wholeNoteDuration = c4LastStop!.time - c4Play!.time;
        const expectedMs = 4 * MS_PER_BEAT;

        console.log(`[Sound] Whole note (C4): ${wholeNoteDuration.toFixed(0)}ms (expected ~${expectedMs}ms)`);

        // Whole note should play for approximately 4000ms
        // Allow 20% tolerance for scheduling delays
        expect(wholeNoteDuration).toBeGreaterThan(expectedMs * 0.80);
        expect(wholeNoteDuration).toBeLessThan(expectedMs * 1.20);
    });

    // ---------------------------------------------------------------
    // Test 2: All note types have correct relative durations
    // ---------------------------------------------------------------
    test('all note types: whole > half > quarter > eighth durations', async ({ page }) => {
        test.setTimeout(60000);

        await switchToFlowMode(page);
        await installSoundMonitor(page);

        // Schedule all notes
        await page.evaluate(({ notes, leadIn, msPerBeat }) => {
            const backend = (window as any).__mockBackend;
            for (const [midi, startBeat, duration] of notes) {
                const pressTime = (startBeat + leadIn) * msPerBeat;
                const releaseTime = pressTime + duration * msPerBeat;
                setTimeout(() => backend.simulateChord([midi], 'right'), pressTime);
                setTimeout(() => backend.simulateNoteOff(midi), releaseTime);
            }
        }, { notes: ALL_NOTE_TYPES_TIMED, leadIn: LEAD_IN_BEATS, msPerBeat: MS_PER_BEAT });

        await clickPlay(page);

        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 45000 });

        const soundLog = await getSoundLog(page);

        // Helper to compute sound duration for a MIDI note
        function getSoundDuration(midi: number): number | null {
            const play = soundLog.find(e => e.type === 'play' && e.midi === midi);
            const stop = soundLog.find(e => e.type === 'stop' && e.midi === midi);
            if (!play || !stop) return null;
            return stop.time - play.time;
        }

        const wholeDur = getSoundDuration(60);  // C4 — 4 beats
        const halfDur = getSoundDuration(62);   // D4 — 2 beats
        const quarterDur = getSoundDuration(65); // F4 — 1 beat
        const eighthDur = getSoundDuration(72);  // C5 — 0.5 beats

        console.log(`[Sound] Whole  (C4): ${wholeDur?.toFixed(0)}ms (expected ~4000ms)`);
        console.log(`[Sound] Half   (D4): ${halfDur?.toFixed(0)}ms (expected ~2000ms)`);
        console.log(`[Sound] Quarter(F4): ${quarterDur?.toFixed(0)}ms (expected ~1000ms)`);
        console.log(`[Sound] Eighth (C5): ${eighthDur?.toFixed(0)}ms (expected ~500ms)`);

        // All notes should have been played
        expect(wholeDur).not.toBeNull();
        expect(halfDur).not.toBeNull();
        expect(quarterDur).not.toBeNull();
        expect(eighthDur).not.toBeNull();

        // Verify relative ordering: whole > half > quarter > eighth
        expect(wholeDur!).toBeGreaterThan(halfDur!);
        expect(halfDur!).toBeGreaterThan(quarterDur!);
        expect(quarterDur!).toBeGreaterThan(eighthDur!);

        // Verify each duration is approximately correct (20% tolerance)
        expect(wholeDur!).toBeGreaterThan(4 * MS_PER_BEAT * 0.80);
        expect(wholeDur!).toBeLessThan(4 * MS_PER_BEAT * 1.20);

        expect(halfDur!).toBeGreaterThan(2 * MS_PER_BEAT * 0.80);
        expect(halfDur!).toBeLessThan(2 * MS_PER_BEAT * 1.20);

        expect(quarterDur!).toBeGreaterThan(1 * MS_PER_BEAT * 0.80);
        expect(quarterDur!).toBeLessThan(1 * MS_PER_BEAT * 1.20);

        expect(eighthDur!).toBeGreaterThan(0.5 * MS_PER_BEAT * 0.75);
        expect(eighthDur!).toBeLessThan(0.5 * MS_PER_BEAT * 1.25);
    });
});
