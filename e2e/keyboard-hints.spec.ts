import { expect, test, Page } from '@playwright/test';
import { gotoE2E, waitForApp, simulateNotePress, simulateNoteRelease } from './helpers/midi-simulator';

/**
 * Keyboard hint (cursor) tests for the scrolling player.
 *
 * The keyboard shows highlighted keys to guide the user.
 * These tests verify:
 *   1. Only the current note OR the next note is shown — never both
 *   2. Empty bars (lead-in) show no hints at all
 */

async function clickPlay(page: Page): Promise<void> {
    await page.locator('.play-btn').evaluate((el) => (el as HTMLElement).click());
}

async function switchToFlowMode(page: Page): Promise<void> {
    const flowToggle = page.locator('mat-button-toggle[value="flow"]');
    await flowToggle.evaluate((el) => (el as HTMLElement).querySelector('button')?.click());
    await page.waitForTimeout(200);
}

/**
 * Read the current hintNotes from the scrolling player component.
 */
async function getHintNotes(page: Page): Promise<number[]> {
    return page.evaluate(() => {
        const comp = document.querySelector('app-scrolling-player');
        const ngComp = (window as any).ng.getComponent(comp);
        return [...ngComp.hintNotes()];
    });
}

/**
 * Read the current beat position.
 */
async function getCurrentBeat(page: Page): Promise<number> {
    return page.evaluate(() => {
        const comp = document.querySelector('app-scrolling-player');
        const ngComp = (window as any).ng.getComponent(comp);
        return ngComp.currentBeat();
    });
}

/**
 * Get the MIDI values of the note the hint system should be showing.
 *
 * Wait mode: the current active note (what needs to be played now).
 * Flow mode: the LATEST active note group (highest startBeat among active notes).
 *   This matches the component's currentActiveBeat logic — it shows the note
 *   the user should play NOW, not a look-ahead.
 */
async function getExpectedHintNote(page: Page, mode: 'wait' | 'flow' = 'wait'): Promise<{ midi: number[]; state: string; startBeat: number } | null> {
    return page.evaluate((m) => {
        const comp = document.querySelector('app-scrolling-player');
        const ngComp = (window as any).ng.getComponent(comp);
        const notes = ngComp.scrollingNotes;

        if (m === 'wait') {
            // Wait mode: return the active note
            for (const n of notes) {
                if (n.isRest) continue;
                if (n.state === 'active') {
                    return { midi: [...n.midi], state: n.state, startBeat: n.startBeat };
                }
            }
            // No active — return first upcoming
            for (const n of notes) {
                if (n.isRest) continue;
                if (n.state === 'upcoming') {
                    return { midi: [...n.midi], state: n.state, startBeat: n.startBeat };
                }
            }
        } else {
            // Flow mode: return the LATEST active note group (highest startBeat).
            // This mirrors the component's currentActiveBeat logic.
            let latestActiveBeat: number | null = null;
            for (const n of notes) {
                if (n.isRest) continue;
                if (n.state === 'active') {
                    if (latestActiveBeat === null || n.startBeat > latestActiveBeat) {
                        latestActiveBeat = n.startBeat;
                    }
                }
            }
            if (latestActiveBeat !== null) {
                // Collect all MIDI values for notes at the latest active beat
                const allMidi: number[] = [];
                for (const n of notes) {
                    if (n.isRest) continue;
                    if (n.state === 'active' && Math.abs(n.startBeat - latestActiveBeat) < 0.01) {
                        allMidi.push(...n.midi);
                    }
                }
                return { midi: allMidi, state: 'active', startBeat: latestActiveBeat };
            }
            // No active: return the first upcoming note
            for (const n of notes) {
                if (n.isRest) continue;
                if (n.state === 'upcoming') {
                    return { midi: [...n.midi], state: n.state, startBeat: n.startBeat };
                }
            }
        }
        return null;
    }, mode);
}

test.describe('Keyboard Hints — Scrolling Player', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/lesson/ode-to-joy');
        await waitForApp(page);

        await expect(page.locator('app-lesson-player')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Ode to Joy' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('app-scrolling-player')).toBeVisible({ timeout: 5000 });
        await page.locator('app-scrolling-player').scrollIntoViewIfNeeded();
    });

    // ---------------------------------------------------------------
    // Test 1: Wait mode — hints match the current active note exactly
    // ---------------------------------------------------------------
    test('wait mode: hints show only the current note to play, not the next one', async ({ page }) => {
        await clickPlay(page);
        await page.waitForTimeout(1000);

        const expectedMidis = [64, 64, 65, 67, 67, 65, 64, 62]; // First 8 notes

        for (let i = 0; i < expectedMidis.length; i++) {
            const midi = expectedMidis[i];

            // Before pressing: hints should match the current active note
            const hints = await getHintNotes(page);
            const expectedNote = await getExpectedHintNote(page);

            if (expectedNote) {
                // Hints should be exactly the active note's MIDI values
                expect(hints.sort()).toEqual(expectedNote.midi.sort());
            }

            // Play the note and advance
            await simulateNotePress(page, [midi]);
            await page.waitForTimeout(500);
            await simulateNoteRelease(page, midi);
            await page.waitForTimeout(400);
        }
    });

    // ---------------------------------------------------------------
    // Test 2: Flow mode — no hints during lead-in (empty bars)
    // ---------------------------------------------------------------
    test('flow mode: no hints shown during lead-in empty bars', async ({ page }) => {
        test.setTimeout(60000);

        await switchToFlowMode(page);
        await clickPlay(page);

        // Lead-in is 2 bars = 8 beats at 100 BPM = 4800ms
        // Sample hints at multiple points during lead-in
        const leadInSamples: { beat: number; hints: number[] }[] = [];

        for (let i = 0; i < 6; i++) {
            await page.waitForTimeout(600);
            const beat = await getCurrentBeat(page);
            const hints = await getHintNotes(page);
            leadInSamples.push({ beat, hints });
        }

        console.log('[Hints] Lead-in samples:', leadInSamples.map(
            s => `beat=${s.beat.toFixed(1)}, hints=[${s.hints.join(',')}]`
        ).join(' | '));

        // During lead-in (negative beats), hints should be empty
        const leadInResults = leadInSamples.filter(s => s.beat < 0);
        expect(leadInResults.length).toBeGreaterThan(0);

        for (const sample of leadInResults) {
            expect(sample.hints.length).toBe(0);
        }
    });

    // ---------------------------------------------------------------
    // Test 3: Flow mode — hints match exactly one note position
    // ---------------------------------------------------------------
    test('flow mode: hints show only one note at a time during playback', async ({ page }) => {
        test.setTimeout(60000);

        await switchToFlowMode(page);

        // Schedule all notes
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

        await page.evaluate(({ notes, leadIn, msPerBeat }) => {
            const backend = (window as any).__mockBackend;
            for (const [midi, startBeat, duration] of notes) {
                const pressTime = (startBeat + leadIn) * msPerBeat;
                const releaseTime = pressTime + duration * msPerBeat;
                setTimeout(() => backend.simulateChord([midi], 'right'), pressTime);
                setTimeout(() => backend.simulateNoteOff(midi), releaseTime);
            }
        }, { notes: ODE_TO_JOY_TIMED, leadIn: 8, msPerBeat: 600 });

        await clickPlay(page);

        // Wait past lead-in
        await page.waitForTimeout(5500);

        // Sample hints during music playback
        let multiNoteHints = 0;

        for (let i = 0; i < 15; i++) {
            await page.waitForTimeout(600);
            const beat = await getCurrentBeat(page);
            const hints = await getHintNotes(page);
            const expected = await getExpectedHintNote(page, 'flow');

            if (hints.length > 0 && expected) {
                // Hints should match the expected note's MIDI values
                const hintsMatch = hints.every(h => expected.midi.includes(h));
                if (!hintsMatch) {
                    console.log(`[Hints] MISMATCH at beat ${beat.toFixed(1)}: hints=[${hints}], expected=[${expected.midi}] at beat ${expected.startBeat}`);
                    multiNoteHints++;
                }
            }
        }

        console.log(`[Hints] Sampled 15 positions, ${multiNoteHints} mismatches`);
        expect(multiNoteHints).toBe(0);

        // Wait for completion
        const dialog = page.locator('mat-dialog-container');
        await expect(dialog).toBeVisible({ timeout: 30000 });
    });
});
