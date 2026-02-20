import { LessonDTO } from '../../models/lesson.model';

export const MAD_WORLD_LESSON: LessonDTO = {
    title: 'Mad World',
    description: 'Roland Orzbal / Michael Andrew — Piano arrangement with both hands',
    mode: 'study_two_hands_no_timing',
    tempo: 92,
    time_signature: '4/4',
    key_signature: 'Ab major',
    total_beats: 144,
    total_seconds: 94,
    measures: [
      {
        number: 1,
        notes: [
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 0 },
          { duration: 1, hand: 'left', start_beat: 0 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 0.5 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 1 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 63, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 62, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 2,
        notes: [
          { duration: 2, hand: 'right', start_beat: 0 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 0 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 1 },
          { duration: 1, hand: 'right', start_beat: 2 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 2 },
          { duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 3,
        notes: [
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 0.5 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 1 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 4,
        notes: [
          { midi: 70, duration: 4, hand: 'right', start_beat: 0 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 0 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 2 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 3 }
        ]
      },
      {
        number: 5,
        notes: [
          { duration: 1, hand: 'right', start_beat: 0 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 1 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 6,
        notes: [
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 56, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 72, duration: 1, hand: 'right', start_beat: 0.5 },
          { midi: [60, 63], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 56, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { duration: 1, hand: 'right', start_beat: 3 },
          { midi: [60, 63], duration: 1, hand: 'left', start_beat: 3 }
        ]
      },
      {
        number: 7,
        notes: [
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 51, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 70, duration: 1, hand: 'right', start_beat: 0.5 },
          { midi: [55, 58], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 51, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { duration: 1, hand: 'right', start_beat: 3 },
          { midi: [55, 58], duration: 1, hand: 'left', start_beat: 3 }
        ]
      },
      {
        number: 8,
        notes: [
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 70, duration: 1, hand: 'right', start_beat: 0.5 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 9,
        notes: [
          { duration: 1, hand: 'right', start_beat: 0 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 1 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 10,
        notes: [
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 56, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 72, duration: 1, hand: 'right', start_beat: 0.5 },
          { midi: [60, 63], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 56, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { duration: 1, hand: 'right', start_beat: 3 },
          { midi: [60, 63], duration: 1, hand: 'left', start_beat: 3 }
        ]
      },
      {
        number: 11,
        notes: [
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 51, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 70, duration: 1, hand: 'right', start_beat: 0.5 },
          { midi: [55, 58], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 51, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { duration: 1, hand: 'right', start_beat: 3 },
          { midi: [55, 58], duration: 1, hand: 'left', start_beat: 3 }
        ]
      },
      {
        number: 12,
        notes: [
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 70, duration: 1, hand: 'right', start_beat: 0.5 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 13,
        notes: [
          { duration: 1, hand: 'right', start_beat: 0 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 0 },
          { duration: 0.5, hand: 'right', start_beat: 1 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 14,
        notes: [
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 56, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 72, duration: 1, hand: 'right', start_beat: 0.5 },
          { midi: [60, 63], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 56, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { duration: 1, hand: 'right', start_beat: 3 },
          { midi: [60, 63], duration: 1, hand: 'left', start_beat: 3 }
        ]
      },
      {
        number: 15,
        notes: [
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 51, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 70, duration: 1, hand: 'right', start_beat: 0.5 },
          { midi: [55, 58], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 51, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { duration: 1, hand: 'right', start_beat: 3 },
          { midi: [55, 58], duration: 1, hand: 'left', start_beat: 3 }
        ]
      },
      {
        number: 16,
        notes: [
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 70, duration: 1, hand: 'right', start_beat: 0.5 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 17,
        notes: [
          { duration: 1, hand: 'right', start_beat: 0 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 1 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 18,
        notes: [
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 56, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 72, duration: 1, hand: 'right', start_beat: 0.5 },
          { midi: [60, 63], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 56, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { duration: 1, hand: 'right', start_beat: 3 },
          { midi: [60, 63], duration: 1, hand: 'left', start_beat: 3 }
        ]
      },
      {
        number: 19,
        notes: [
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 51, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 70, duration: 1, hand: 'right', start_beat: 0.5 },
          { midi: [55, 58], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 51, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { duration: 1, hand: 'right', start_beat: 3 },
          { midi: [55, 58], duration: 1, hand: 'left', start_beat: 3 }
        ]
      },
      {
        number: 20,
        notes: [
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 70, duration: 1, hand: 'right', start_beat: 0.5 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 21,
        notes: [
          { duration: 1, hand: 'right', start_beat: 0 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 1 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 22,
        notes: [
          { midi: 74, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 0.5 },
          { duration: 0.5, hand: 'right', start_beat: 1 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 74, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 74, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 23,
        notes: [
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 0 },
          { duration: 0.5, hand: 'right', start_beat: 0.5 },
          { duration: 0.5, hand: 'right', start_beat: 1 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 24,
        notes: [
          { midi: 74, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 0.5 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 1 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 74, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 74, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 25,
        notes: [
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 0 },
          { duration: 0.5, hand: 'right', start_beat: 0.5 },
          { duration: 0.5, hand: 'right', start_beat: 1 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 26,
        notes: [
          { midi: 74, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 0.5 },
          { duration: 0.5, hand: 'right', start_beat: 1 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 74, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 74, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 27,
        notes: [
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 0 },
          { duration: 0.5, hand: 'right', start_beat: 0.5 },
          { duration: 0.5, hand: 'right', start_beat: 1 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 28,
        notes: [
          { midi: 74, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: [58, 62], duration: 4, hand: 'left', start_beat: 0 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 0.5 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 1 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 74, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 74, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 29,
        notes: [
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 0.5 },
          { midi: 72, duration: 1.5, hand: 'right', start_beat: 0.5 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 1 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 68, duration: 2, hand: 'right', start_beat: 2 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 63, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 62, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 30,
        notes: [
          { midi: 62, duration: 3, hand: 'right', start_beat: 0 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 0 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 1 },
          { duration: 1, hand: 'right', start_beat: 2 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 31,
        notes: [
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 0.5 },
          { midi: 72, duration: 1.5, hand: 'right', start_beat: 0.5 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 1 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 68, duration: 1.5, hand: 'right', start_beat: 2 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 63, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 70, duration: 0.5, hand: 'right', start_beat: 3.5 },
          { midi: 62, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 32,
        notes: [
          { midi: 70, duration: 4, hand: 'right', start_beat: 0 },
          { midi: 62, duration: 4, hand: 'right', start_beat: 0 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 0 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 2 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 3 }
        ]
      },
      {
        number: 33,
        notes: [
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 72, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 0.5 },
          { midi: 72, duration: 1.5, hand: 'right', start_beat: 0.5 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 1 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: 68, duration: 2, hand: 'right', start_beat: 2 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 63, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 62, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 34,
        notes: [
          { midi: 62, duration: 4, hand: 'right', start_beat: 0 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 0 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 1 },
          { duration: 1, hand: 'right', start_beat: 2 },
          { midi: 58, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [62, 65], duration: 1, hand: 'left', start_beat: 3 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 35,
        notes: [
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 0 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 0 },
          { midi: 68, duration: 0.5, hand: 'right', start_beat: 0.5 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 1 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 1 },
          { midi: 67, duration: 0.5, hand: 'right', start_beat: 1.5 },
          { midi: [60, 65, 68], duration: 0.5, hand: 'right', start_beat: 2 },
          { midi: 53, duration: 1, hand: 'left', start_beat: 2 },
          { midi: 65, duration: 0.5, hand: 'right', start_beat: 2.5 },
          { midi: 63, duration: 0.5, hand: 'right', start_beat: 3 },
          { midi: [56, 60], duration: 1, hand: 'left', start_beat: 3 },
          { midi: [62, 65], duration: 0.5, hand: 'right', start_beat: 3.5 }
        ]
      },
      {
        number: 36,
        notes: [
          { midi: [62, 65], duration: 4, hand: 'right', start_beat: 0 },
          { midi: [46, 58], duration: 4, hand: 'left', start_beat: 0 }
        ]
      }
    ],
};
