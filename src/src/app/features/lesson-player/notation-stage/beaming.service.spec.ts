import { TestBed } from '@angular/core/testing';
import { BeamingService, BeamableNote, BeamGroupResult } from './beaming.service';

describe('BeamingService', () => {
  let service: BeamingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BeamingService]
    });
    service = TestBed.inject(BeamingService);
  });

  describe('buildBeamGroups', () => {
    describe('basic grouping', () => {
      it('should return empty array for empty input', () => {
        const result = service.buildBeamGroups([]);
        expect(result).toEqual([]);
      });

      it('should return empty array for single note', () => {
        const notes: BeamableNote[] = [
          { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' }
        ];
        const result = service.buildBeamGroups(notes);
        expect(result).toEqual([]);
      });

      it('should group two consecutive eighth notes', () => {
        const notes: BeamableNote[] = [
          { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },
          { midi: [62], startPosition: 0.5, durationBeats: 0.5, hand: 'right' }
        ];
        const result = service.buildBeamGroups(notes);

        expect(result.length).toBe(1);
        expect(result[0].notes.length).toBe(2);
        expect(result[0].noteIndices).toEqual([0, 1]);
      });

      it('should group three consecutive eighth notes', () => {
        const notes: BeamableNote[] = [
          { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },
          { midi: [62], startPosition: 0.5, durationBeats: 0.5, hand: 'right' },
          { midi: [64], startPosition: 1.0, durationBeats: 0.5, hand: 'right' }
        ];
        const result = service.buildBeamGroups(notes);

        expect(result.length).toBe(1);
        expect(result[0].notes.length).toBe(3);
      });

      it('should group four consecutive sixteenth notes', () => {
        const notes: BeamableNote[] = [
          { midi: [60], startPosition: 0, durationBeats: 0.25, hand: 'right' },
          { midi: [62], startPosition: 0.25, durationBeats: 0.25, hand: 'right' },
          { midi: [64], startPosition: 0.5, durationBeats: 0.25, hand: 'right' },
          { midi: [65], startPosition: 0.75, durationBeats: 0.25, hand: 'right' }
        ];
        const result = service.buildBeamGroups(notes);

        expect(result.length).toBe(1);
        expect(result[0].notes.length).toBe(4);
      });
    });

    describe('filtering', () => {
      it('should not beam quarter notes (duration >= 1)', () => {
        const notes: BeamableNote[] = [
          { midi: [60], startPosition: 0, durationBeats: 1.0, hand: 'right' },
          { midi: [62], startPosition: 1, durationBeats: 1.0, hand: 'right' }
        ];
        const result = service.buildBeamGroups(notes);
        expect(result).toEqual([]);
      });

      it('should not beam half notes', () => {
        const notes: BeamableNote[] = [
          { midi: [60], startPosition: 0, durationBeats: 2.0, hand: 'right' },
          { midi: [62], startPosition: 2, durationBeats: 2.0, hand: 'right' }
        ];
        const result = service.buildBeamGroups(notes);
        expect(result).toEqual([]);
      });

      it('should not beam rests', () => {
        const notes: BeamableNote[] = [
          { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },
          { midi: [], startPosition: 0.5, durationBeats: 0.5, hand: 'right', isRest: true },
          { midi: [64], startPosition: 1.0, durationBeats: 0.5, hand: 'right' }
        ];
        const result = service.buildBeamGroups(notes);

        // Should not group across rest - no beam groups (only 2 non-consecutive notes)
        expect(result).toEqual([]);
      });

      it('should not beam notes with empty midi array', () => {
        const notes: BeamableNote[] = [
          { midi: [], startPosition: 0, durationBeats: 0.5, hand: 'right' },
          { midi: [], startPosition: 0.5, durationBeats: 0.5, hand: 'right' }
        ];
        const result = service.buildBeamGroups(notes);
        expect(result).toEqual([]);
      });

      it('should not beam notes with zero duration', () => {
        const notes: BeamableNote[] = [
          { midi: [60], startPosition: 0, durationBeats: 0, hand: 'right' },
          { midi: [62], startPosition: 0, durationBeats: 0, hand: 'right' }
        ];
        const result = service.buildBeamGroups(notes);
        expect(result).toEqual([]);
      });
    });

    describe('hand separation', () => {
      it('should not beam notes from different hands', () => {
        const notes: BeamableNote[] = [
          { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },
          { midi: [48], startPosition: 0.5, durationBeats: 0.5, hand: 'left' }
        ];
        const result = service.buildBeamGroups(notes);
        expect(result).toEqual([]);
      });

      it('should create separate beam groups for each hand', () => {
        const notes: BeamableNote[] = [
          { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },
          { midi: [62], startPosition: 0.5, durationBeats: 0.5, hand: 'right' },
          { midi: [48], startPosition: 0, durationBeats: 0.5, hand: 'left' },
          { midi: [50], startPosition: 0.5, durationBeats: 0.5, hand: 'left' }
        ];
        const result = service.buildBeamGroups(notes);

        expect(result.length).toBe(2);

        // One group for right hand
        const rightGroup = result.find(g => g.notes[0].hand === 'right');
        expect(rightGroup).toBeDefined();
        expect(rightGroup!.notes.length).toBe(2);

        // One group for left hand
        const leftGroup = result.find(g => g.notes[0].hand === 'left');
        expect(leftGroup).toBeDefined();
        expect(leftGroup!.notes.length).toBe(2);
      });
    });

    describe('measure separation', () => {
      it('should not beam across measures (4/4 time)', () => {
        const notes: BeamableNote[] = [
          { midi: [60], startPosition: 3.5, durationBeats: 0.5, hand: 'right' }, // End of measure 1
          { midi: [62], startPosition: 4.0, durationBeats: 0.5, hand: 'right' }  // Start of measure 2
        ];
        const result = service.buildBeamGroups(notes, 4);
        expect(result).toEqual([]);
      });

      it('should beam within same measure', () => {
        const notes: BeamableNote[] = [
          { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },
          { midi: [62], startPosition: 0.5, durationBeats: 0.5, hand: 'right' }
        ];
        const result = service.buildBeamGroups(notes, 4);

        expect(result.length).toBe(1);
        expect(result[0].notes.length).toBe(2);
      });

      it('should respect 3/4 time signature', () => {
        const notes: BeamableNote[] = [
          { midi: [60], startPosition: 2.5, durationBeats: 0.5, hand: 'right' }, // End of measure 1
          { midi: [62], startPosition: 3.0, durationBeats: 0.5, hand: 'right' }  // Start of measure 2
        ];
        const result = service.buildBeamGroups(notes, 3);
        expect(result).toEqual([]);
      });
    });

    describe('MAX_NOTES_PER_BEAM limit', () => {
      it('should limit beam groups to MAX_NOTES_PER_BEAM (4)', () => {
        const notes: BeamableNote[] = [
          { midi: [60], startPosition: 0, durationBeats: 0.25, hand: 'right' },
          { midi: [62], startPosition: 0.25, durationBeats: 0.25, hand: 'right' },
          { midi: [64], startPosition: 0.5, durationBeats: 0.25, hand: 'right' },
          { midi: [65], startPosition: 0.75, durationBeats: 0.25, hand: 'right' },
          { midi: [67], startPosition: 1.0, durationBeats: 0.25, hand: 'right' },
          { midi: [69], startPosition: 1.25, durationBeats: 0.25, hand: 'right' }
        ];
        const result = service.buildBeamGroups(notes);

        // Should be split into two groups: [0,1,2,3] and [4,5]
        expect(result.length).toBe(2);
        expect(result[0].notes.length).toBe(4);
        expect(result[1].notes.length).toBe(2);
      });

      it('should have MAX_NOTES_PER_BEAM constant equal to 4', () => {
        expect(service.MAX_NOTES_PER_BEAM).toBe(4);
      });
    });

    describe('non-consecutive notes', () => {
      it('should not beam non-consecutive notes', () => {
        const notes: BeamableNote[] = [
          { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },
          // Gap here - note should be at 0.5 but is at 1.0
          { midi: [62], startPosition: 1.0, durationBeats: 0.5, hand: 'right' }
        ];
        const result = service.buildBeamGroups(notes);
        expect(result).toEqual([]);
      });

      it('should create separate groups for non-consecutive sequences', () => {
        const notes: BeamableNote[] = [
          // First group
          { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },
          { midi: [62], startPosition: 0.5, durationBeats: 0.5, hand: 'right' },
          // Gap
          // Second group
          { midi: [64], startPosition: 2.0, durationBeats: 0.5, hand: 'right' },
          { midi: [65], startPosition: 2.5, durationBeats: 0.5, hand: 'right' }
        ];
        const result = service.buildBeamGroups(notes);

        expect(result.length).toBe(2);
        expect(result[0].notes.length).toBe(2);
        expect(result[1].notes.length).toBe(2);
      });
    });

    describe('chords', () => {
      it('should beam chords (multiple midi notes)', () => {
        const notes: BeamableNote[] = [
          { midi: [60, 64, 67], startPosition: 0, durationBeats: 0.5, hand: 'right' },     // C major chord
          { midi: [62, 65, 69], startPosition: 0.5, durationBeats: 0.5, hand: 'right' }    // D minor chord
        ];
        const result = service.buildBeamGroups(notes);

        expect(result.length).toBe(1);
        expect(result[0].notes.length).toBe(2);
        expect(result[0].notes[0].midi).toEqual([60, 64, 67]);
        expect(result[0].notes[1].midi).toEqual([62, 65, 69]);
      });
    });
  });

  describe('beam count determination', () => {
    it('should set beamCount to 1 for eighth notes (0.5 beats)', () => {
      const notes: BeamableNote[] = [
        { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },
        { midi: [62], startPosition: 0.5, durationBeats: 0.5, hand: 'right' }
      ];
      const result = service.buildBeamGroups(notes);

      expect(result[0].beamCount).toBe(1);
    });

    it('should set beamCount to 2 for sixteenth notes (0.25 beats)', () => {
      const notes: BeamableNote[] = [
        { midi: [60], startPosition: 0, durationBeats: 0.25, hand: 'right' },
        { midi: [62], startPosition: 0.25, durationBeats: 0.25, hand: 'right' }
      ];
      const result = service.buildBeamGroups(notes);

      expect(result[0].beamCount).toBe(2);
    });

    it('should set beamCount to 3 for 32nd notes (0.125 beats)', () => {
      const notes: BeamableNote[] = [
        { midi: [60], startPosition: 0, durationBeats: 0.125, hand: 'right' },
        { midi: [62], startPosition: 0.125, durationBeats: 0.125, hand: 'right' }
      ];
      const result = service.buildBeamGroups(notes);

      expect(result[0].beamCount).toBe(3);
    });

    it('should use shortest duration for mixed note values', () => {
      const notes: BeamableNote[] = [
        { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },      // Eighth
        { midi: [62], startPosition: 0.5, durationBeats: 0.25, hand: 'right' },   // Sixteenth
        { midi: [64], startPosition: 0.75, durationBeats: 0.25, hand: 'right' }   // Sixteenth
      ];
      const result = service.buildBeamGroups(notes);

      // Should use 16th note beaming (2 beams) because of the shorter notes
      expect(result[0].beamCount).toBe(2);
    });
  });

  describe('stem direction', () => {
    it('should set stemUp=true for right hand notes', () => {
      const notes: BeamableNote[] = [
        { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },
        { midi: [62], startPosition: 0.5, durationBeats: 0.5, hand: 'right' }
      ];
      const result = service.buildBeamGroups(notes);

      expect(result[0].stemUp).toBe(true);
    });

    it('should set stemUp=false for left hand notes', () => {
      const notes: BeamableNote[] = [
        { midi: [48], startPosition: 0, durationBeats: 0.5, hand: 'left' },
        { midi: [50], startPosition: 0.5, durationBeats: 0.5, hand: 'left' }
      ];
      const result = service.buildBeamGroups(notes);

      expect(result[0].stemUp).toBe(false);
    });
  });

  describe('isNoteBeamed', () => {
    it('should return true for notes in beam groups', () => {
      const notes: BeamableNote[] = [
        { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },
        { midi: [62], startPosition: 0.5, durationBeats: 0.5, hand: 'right' }
      ];
      const beamGroups = service.buildBeamGroups(notes);

      expect(service.isNoteBeamed(0, beamGroups)).toBe(true);
      expect(service.isNoteBeamed(1, beamGroups)).toBe(true);
    });

    it('should return false for notes not in beam groups', () => {
      const notes: BeamableNote[] = [
        { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },
        { midi: [62], startPosition: 0.5, durationBeats: 0.5, hand: 'right' },
        { midi: [64], startPosition: 1.0, durationBeats: 1.0, hand: 'right' }  // Quarter note - not beamable
      ];
      const beamGroups = service.buildBeamGroups(notes);

      expect(service.isNoteBeamed(2, beamGroups)).toBe(false);
    });

    it('should return false for empty beam groups', () => {
      expect(service.isNoteBeamed(0, [])).toBe(false);
    });

    it('should return false for non-existent indices', () => {
      const notes: BeamableNote[] = [
        { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },
        { midi: [62], startPosition: 0.5, durationBeats: 0.5, hand: 'right' }
      ];
      const beamGroups = service.buildBeamGroups(notes);

      expect(service.isNoteBeamed(99, beamGroups)).toBe(false);
    });
  });

  describe('note indices tracking', () => {
    it('should correctly track original note indices', () => {
      const notes: BeamableNote[] = [
        { midi: [60], startPosition: 0, durationBeats: 1.0, hand: 'right' },   // Index 0 - not beamable
        { midi: [62], startPosition: 1, durationBeats: 0.5, hand: 'right' },   // Index 1 - beamable
        { midi: [64], startPosition: 1.5, durationBeats: 0.5, hand: 'right' }, // Index 2 - beamable
        { midi: [65], startPosition: 2, durationBeats: 1.0, hand: 'right' }    // Index 3 - not beamable
      ];
      const result = service.buildBeamGroups(notes);

      expect(result.length).toBe(1);
      expect(result[0].noteIndices).toEqual([1, 2]);
    });

    it('should preserve order of note indices', () => {
      const notes: BeamableNote[] = [
        { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },
        { midi: [62], startPosition: 0.5, durationBeats: 0.5, hand: 'right' },
        { midi: [64], startPosition: 1.0, durationBeats: 0.5, hand: 'right' },
        { midi: [65], startPosition: 1.5, durationBeats: 0.5, hand: 'right' }
      ];
      const result = service.buildBeamGroups(notes);

      expect(result[0].noteIndices).toEqual([0, 1, 2, 3]);
    });
  });

  describe('edge cases', () => {
    it('should handle floating point precision in consecutive detection', () => {
      // Notes that are consecutive but might have floating point issues
      const notes: BeamableNote[] = [
        { midi: [60], startPosition: 0, durationBeats: 0.333333, hand: 'right' },
        { midi: [62], startPosition: 0.333333, durationBeats: 0.333333, hand: 'right' },
        { midi: [64], startPosition: 0.666666, durationBeats: 0.333333, hand: 'right' }
      ];
      const result = service.buildBeamGroups(notes);

      expect(result.length).toBe(1);
      expect(result[0].notes.length).toBe(3);
    });

    it('should handle unsorted input notes', () => {
      const notes: BeamableNote[] = [
        { midi: [64], startPosition: 1.0, durationBeats: 0.5, hand: 'right' },  // Out of order
        { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },
        { midi: [62], startPosition: 0.5, durationBeats: 0.5, hand: 'right' }
      ];
      const result = service.buildBeamGroups(notes);

      expect(result.length).toBe(1);
      expect(result[0].notes.length).toBe(3);
      // Notes should be sorted by position
      expect(result[0].notes[0].midi).toEqual([60]);
      expect(result[0].notes[1].midi).toEqual([62]);
      expect(result[0].notes[2].midi).toEqual([64]);
    });

    it('should handle notes at same position (treated as overlapping)', () => {
      const notes: BeamableNote[] = [
        { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },
        { midi: [64], startPosition: 0, durationBeats: 0.5, hand: 'right' }  // Same position
      ];
      const result = service.buildBeamGroups(notes);

      // Notes at same position are treated as overlapping and beamed together
      // This is reasonable as they're technically consecutive (gap = 0)
      expect(result.length).toBe(1);
      expect(result[0].notes.length).toBe(2);
    });

    it('should preserve originalNote reference', () => {
      const originalNote1 = { id: 'note1' };
      const originalNote2 = { id: 'note2' };

      const notes: BeamableNote[] = [
        { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right', originalNote: originalNote1 },
        { midi: [62], startPosition: 0.5, durationBeats: 0.5, hand: 'right', originalNote: originalNote2 }
      ];
      const result = service.buildBeamGroups(notes);

      expect(result[0].notes[0].originalNote).toBe(originalNote1);
      expect(result[0].notes[1].originalNote).toBe(originalNote2);
    });
  });

  describe('real-world scenarios', () => {
    it('should beam a typical run of eighth notes in a measure', () => {
      // C major scale as eighth notes
      const notes: BeamableNote[] = [
        { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },
        { midi: [62], startPosition: 0.5, durationBeats: 0.5, hand: 'right' },
        { midi: [64], startPosition: 1.0, durationBeats: 0.5, hand: 'right' },
        { midi: [65], startPosition: 1.5, durationBeats: 0.5, hand: 'right' },
        { midi: [67], startPosition: 2.0, durationBeats: 0.5, hand: 'right' },
        { midi: [69], startPosition: 2.5, durationBeats: 0.5, hand: 'right' },
        { midi: [71], startPosition: 3.0, durationBeats: 0.5, hand: 'right' },
        { midi: [72], startPosition: 3.5, durationBeats: 0.5, hand: 'right' }
      ];
      const result = service.buildBeamGroups(notes);

      // Should be split into 2 groups of 4 (MAX_NOTES_PER_BEAM)
      expect(result.length).toBe(2);
      expect(result[0].notes.length).toBe(4);
      expect(result[1].notes.length).toBe(4);
    });

    it('should handle piano two-hand passage', () => {
      const notes: BeamableNote[] = [
        // Right hand melody
        { midi: [72], startPosition: 0, durationBeats: 0.5, hand: 'right' },
        { midi: [74], startPosition: 0.5, durationBeats: 0.5, hand: 'right' },
        // Left hand accompaniment
        { midi: [48], startPosition: 0, durationBeats: 0.5, hand: 'left' },
        { midi: [52], startPosition: 0.5, durationBeats: 0.5, hand: 'left' }
      ];
      const result = service.buildBeamGroups(notes);

      expect(result.length).toBe(2);

      const rightGroup = result.find(g => g.stemUp === true);
      const leftGroup = result.find(g => g.stemUp === false);

      expect(rightGroup).toBeDefined();
      expect(leftGroup).toBeDefined();
      expect(rightGroup!.notes[0].midi).toEqual([72]);
      expect(leftGroup!.notes[0].midi).toEqual([48]);
    });

    it('should handle mixed rhythm pattern (eighth + sixteenths)', () => {
      const notes: BeamableNote[] = [
        { midi: [60], startPosition: 0, durationBeats: 0.5, hand: 'right' },     // Eighth
        { midi: [62], startPosition: 0.5, durationBeats: 0.25, hand: 'right' },  // Sixteenth
        { midi: [64], startPosition: 0.75, durationBeats: 0.25, hand: 'right' }  // Sixteenth
      ];
      const result = service.buildBeamGroups(notes);

      expect(result.length).toBe(1);
      expect(result[0].notes.length).toBe(3);
      expect(result[0].beamCount).toBe(2); // 16th note beaming
    });
  });
});
