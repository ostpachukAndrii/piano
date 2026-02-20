import { expect, test } from '@playwright/test';
import { gotoE2E, waitForApp } from './helpers/midi-simulator';

/**
 * Mad World — Bar Boundary Tests
 *
 * Validates that every note in the Mad World lesson (36 measures, 4/4 time)
 * stays within its bar boundary. No note's ending beat (startBeat + durationBeats)
 * should exceed the bar's ending beat (barNumber * beatsPerMeasure).
 *
 * This is a data-integrity test: it reads the scrollingNotes array from the
 * Angular component and checks each bar without playing the lesson.
 */

interface BarInfo {
    barNumber: number;
    expectedEndBeat: number;
    actualLastNoteEndBeat: number;
    matches: boolean;
    overflowingNotes: Array<{
        hand: string;
        midi: number[];
        startBeat: number;
        durationBeats: number;
        endBeat: number;
    }>;
}

test.describe('Mad World — Bar Boundaries', () => {
    test.beforeEach(async ({ page }) => {
        await gotoE2E(page, '/lesson/mad-world-piano');
        await waitForApp(page);

        await expect(page.locator('app-lesson-player')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Mad World' })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('app-scrolling-player')).toBeVisible({ timeout: 5000 });
    });

    test('every bar\'s notes end at or before the bar boundary', async ({ page }) => {
        const result = await page.evaluate(() => {
            const comp = document.querySelector('app-scrolling-player');
            const ngComp = (window as any).ng.getComponent(comp);

            const scrollingNotes: any[] = ngComp.scrollingNotes;
            const beatsPerMeasure: number = ngComp.beatsPerMeasure;
            const totalBeats: number = ngComp._totalBeats;
            const totalMeasures: number = totalBeats / beatsPerMeasure;

            // Build per-bar analysis
            const bars: Array<{
                barNumber: number;
                expectedEndBeat: number;
                actualLastNoteEndBeat: number;
                matches: boolean;
                overflowingNotes: Array<{
                    hand: string;
                    midi: number[];
                    startBeat: number;
                    durationBeats: number;
                    endBeat: number;
                }>;
            }> = [];

            for (let bar = 1; bar <= totalMeasures; bar++) {
                const barStartBeat = (bar - 1) * beatsPerMeasure;
                const barEndBeat = bar * beatsPerMeasure;

                // Find all notes that START within this bar
                const notesInBar = scrollingNotes.filter((n: any) => {
                    return n.startBeat >= barStartBeat && n.startBeat < barEndBeat;
                });

                // Find the actual last note ending beat in this bar
                let actualLastNoteEndBeat = barStartBeat; // default if no notes
                for (const note of notesInBar) {
                    const noteEnd = note.startBeat + note.durationBeats;
                    if (noteEnd > actualLastNoteEndBeat) {
                        actualLastNoteEndBeat = noteEnd;
                    }
                }

                // Find notes that overflow beyond the bar boundary
                const overflowingNotes = notesInBar
                    .filter((n: any) => {
                        const noteEnd = n.startBeat + n.durationBeats;
                        // Use a small epsilon to avoid floating point false positives
                        return noteEnd > barEndBeat + 0.001;
                    })
                    .map((n: any) => ({
                        hand: n.hand,
                        midi: n.midi,
                        startBeat: n.startBeat,
                        durationBeats: n.durationBeats,
                        endBeat: n.startBeat + n.durationBeats,
                    }));

                const matches = actualLastNoteEndBeat <= barEndBeat + 0.001;

                bars.push({
                    barNumber: bar,
                    expectedEndBeat: barEndBeat,
                    actualLastNoteEndBeat: Math.round(actualLastNoteEndBeat * 1000) / 1000,
                    matches,
                    overflowingNotes,
                });
            }

            return {
                totalMeasures,
                beatsPerMeasure,
                totalBeats,
                noteCount: scrollingNotes.length,
                bars,
            };
        });

        // Log summary
        console.log(`\n[MadWorld Bars] Lesson: ${result.noteCount} notes, ${result.totalMeasures} bars, ${result.beatsPerMeasure} beats/measure, ${result.totalBeats} total beats\n`);

        // Log the comparison table
        console.log('Bar | Expected End | Actual Last End | Match');
        console.log('----|-------------|-----------------|------');
        for (const bar of result.bars) {
            const matchStr = bar.matches ? 'OK' : 'OVERFLOW';
            console.log(
                `${String(bar.barNumber).padStart(3)} | ` +
                `${String(bar.expectedEndBeat).padStart(11)} | ` +
                `${String(bar.actualLastNoteEndBeat).padStart(15)} | ` +
                `${matchStr}`
            );

            // Log overflowing notes for failing bars
            if (!bar.matches) {
                for (const note of bar.overflowingNotes) {
                    console.log(
                        `     ^ OVERFLOW: hand=${note.hand}, midi=[${note.midi.join(',')}], ` +
                        `start=${note.startBeat}, dur=${note.durationBeats}, end=${note.endBeat}`
                    );
                }
            }
        }

        // Count results
        const passingBars = result.bars.filter((b: BarInfo) => b.matches).length;
        const failingBars = result.bars.filter((b: BarInfo) => !b.matches).length;

        console.log(`\n[MadWorld Bars] Result: ${passingBars}/${result.totalMeasures} bars OK, ${failingBars} overflowing\n`);

        // Assert: every bar should have notes ending at or before the bar boundary
        for (const bar of result.bars) {
            expect(
                bar.matches,
                `Bar ${bar.barNumber}: last note ends at beat ${bar.actualLastNoteEndBeat}, ` +
                `but bar boundary is beat ${bar.expectedEndBeat}. ` +
                `Overflowing notes: ${JSON.stringify(bar.overflowingNotes)}`
            ).toBe(true);
        }
    });
});
