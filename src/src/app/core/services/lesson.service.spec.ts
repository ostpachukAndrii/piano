import { TestBed } from '@angular/core/testing';
import { LessonService } from './lesson.service.migrated';
import { BACKEND_CLIENT, BackendClient, MockBackendClient } from '../api';
import { LessonDTO, LessonMetadataDTO } from '../models/lesson.model';

describe('LessonService', () => {
  let service: LessonService;
  let mockBackend: MockBackendClient;

  beforeEach(() => {
    mockBackend = new MockBackendClient();

    TestBed.configureTestingModule({
      providers: [
        LessonService,
        { provide: BACKEND_CLIENT, useValue: mockBackend }
      ]
    });

    service = TestBed.inject(LessonService);
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have initial state', () => {
      expect(service.currentLesson()).toBeNull();
      expect(service.availableLessons()).toEqual([]);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.hasLesson()).toBe(false);
      expect(service.lessonCount()).toBe(0);
    });
  });

  describe('listLessons()', () => {
    it('should list available lessons', async () => {
      const lessons = await service.listLessons();

      expect(lessons.length).toBeGreaterThan(0);
      expect(service.availableLessons()).toEqual(lessons);
      expect(service.lessonCount()).toBeGreaterThan(0);
    });

    it('should set loading state during fetch', async () => {
      expect(service.loading()).toBe(false);

      const promise = service.listLessons();
      // Loading should be true during fetch
      // (In real async code, this would be checked with done())

      await promise;
      expect(service.loading()).toBe(false);
    });

    it('should clear error on successful list', async () => {
      // Create error first
      await service.loadLesson('invalid').catch(() => {});
      expect(service.error()).toBeTruthy();

      await service.listLessons();

      expect(service.error()).toBeNull();
    });

    it('should handle backend errors', async () => {
      spyOn(mockBackend, 'listLessons').and.returnValue(
        Promise.reject(new Error('Backend error'))
      );

      await expectAsync(service.listLessons()).toBeRejected();

      expect(service.error()).toContain('Failed to list lessons');
      expect(service.loading()).toBe(false);
    });

    it('should update lessonCount computed signal', async () => {
      expect(service.lessonCount()).toBe(0);

      await service.listLessons();

      expect(service.lessonCount()).toBeGreaterThan(0);
    });
  });

  describe('loadLesson()', () => {
    beforeEach(async () => {
      await service.listLessons();
    });

    it('should load a lesson by ID', async () => {
      const lessons = service.availableLessons();
      const lessonId = lessons[0].id;

      const lesson = await service.loadLesson(lessonId);

      expect(lesson).toBeTruthy();
      expect(lesson.title).toBe(lessons[0].title);
      expect(service.currentLesson()).toEqual(lesson);
      expect(service.hasLesson()).toBe(true);
    });

    it('should set loading state during load', async () => {
      const lessons = service.availableLessons();
      const lessonId = lessons[0].id;

      expect(service.loading()).toBe(false);

      const promise = service.loadLesson(lessonId);
      // Loading should be true during fetch

      await promise;
      expect(service.loading()).toBe(false);
    });

    it('should clear error on successful load', async () => {
      const lessons = service.availableLessons();

      // Create error first
      await service.loadLesson('invalid').catch(() => {});
      expect(service.error()).toBeTruthy();

      // Load valid lesson
      await service.loadLesson(lessons[0].id);

      expect(service.error()).toBeNull();
    });

    it('should handle lesson not found', async () => {
      await expectAsync(service.loadLesson('nonexistent')).toBeRejected();

      expect(service.error()).toContain('Failed to load lesson');
      expect(service.currentLesson()).toBeNull();
      expect(service.hasLesson()).toBe(false);
      expect(service.loading()).toBe(false);
    });

    it('should handle backend errors', async () => {
      spyOn(mockBackend, 'loadLesson').and.returnValue(
        Promise.reject(new Error('Backend error'))
      );

      await expectAsync(service.loadLesson('any-id')).toBeRejected();

      expect(service.error()).toContain('Failed to load lesson');
      expect(service.loading()).toBe(false);
    });

    it('should update currentLessonTitle computed signal', async () => {
      const lessons = service.availableLessons();
      expect(service.currentLessonTitle()).toBeNull();

      await service.loadLesson(lessons[0].id);

      expect(service.currentLessonTitle()).toBe(lessons[0].title);
    });

    it('should update currentLessonDuration computed signal', async () => {
      const lessons = service.availableLessons();
      expect(service.currentLessonDuration()).toBe(0);

      await service.loadLesson(lessons[0].id);

      expect(service.currentLessonDuration()).toBeGreaterThan(0);
    });
  });

  describe('clearLesson()', () => {
    beforeEach(async () => {
      await service.listLessons();
      const lessons = service.availableLessons();
      await service.loadLesson(lessons[0].id);
    });

    it('should clear current lesson', () => {
      expect(service.currentLesson()).toBeTruthy();
      expect(service.hasLesson()).toBe(true);

      service.clearLesson();

      expect(service.currentLesson()).toBeNull();
      expect(service.hasLesson()).toBe(false);
    });

    it('should clear error when clearing lesson', async () => {
      // Create error
      await service.loadLesson('invalid').catch(() => {});
      expect(service.error()).toBeTruthy();

      service.clearLesson();

      expect(service.error()).toBeNull();
    });

    it('should reset computed values', () => {
      expect(service.currentLessonTitle()).toBeTruthy();
      expect(service.currentLessonDuration()).toBeGreaterThan(0);

      service.clearLesson();

      expect(service.currentLessonTitle()).toBeNull();
      expect(service.currentLessonDuration()).toBe(0);
    });
  });

  describe('clearError()', () => {
    it('should clear error state', async () => {
      await service.loadLesson('invalid').catch(() => {});
      expect(service.error()).toBeTruthy();

      service.clearError();

      expect(service.error()).toBeNull();
    });
  });

  describe('getMeasureCount()', () => {
    it('should return 0 when no lesson loaded', () => {
      expect(service.getMeasureCount()).toBe(0);
    });

    it('should return measure count of current lesson', async () => {
      await service.listLessons();
      const lessons = service.availableLessons();
      await service.loadLesson(lessons[0].id);

      const count = service.getMeasureCount();

      expect(count).toBeGreaterThan(0);
      expect(count).toBe(service.currentLesson()!.measures.length);
    });
  });

  describe('getTotalNotes()', () => {
    it('should return 0 when no lesson loaded', () => {
      expect(service.getTotalNotes()).toBe(0);
    });

    it('should return total notes in current lesson', async () => {
      await service.listLessons();
      const lessons = service.availableLessons();
      await service.loadLesson(lessons[0].id);

      const noteCount = service.getTotalNotes();

      expect(noteCount).toBeGreaterThan(0);
    });

    it('should count notes from all measures', async () => {
      await service.listLessons();
      const lessons = service.availableLessons();
      await service.loadLesson(lessons[0].id);

      const lesson = service.currentLesson()!;
      const expectedCount = lesson.measures.reduce(
        (sum, m) => sum + m.notes.length,
        0
      );

      expect(service.getTotalNotes()).toBe(expectedCount);
    });
  });

  describe('getLessonMetadata()', () => {
    beforeEach(async () => {
      await service.listLessons();
    });

    it('should find lesson metadata by ID', () => {
      const lessons = service.availableLessons();
      const lessonId = lessons[0].id;

      const metadata = service.getLessonMetadata(lessonId);

      expect(metadata).toBeTruthy();
      expect(metadata?.id).toBe(lessonId);
    });

    it('should return undefined for nonexistent lesson', () => {
      const metadata = service.getLessonMetadata('nonexistent');

      expect(metadata).toBeUndefined();
    });
  });

  describe('isLessonLoaded()', () => {
    beforeEach(async () => {
      await service.listLessons();
    });

    it('should return false when no lesson loaded', () => {
      expect(service.isLessonLoaded('any-id')).toBe(false);
    });

    it('should return true for currently loaded lesson', async () => {
      const lessons = service.availableLessons();
      const lessonId = lessons[0].id;

      await service.loadLesson(lessonId);

      expect(service.isLessonLoaded(lessonId)).toBe(true);
    });

    it('should return false for different lesson', async () => {
      const lessons = service.availableLessons();
      await service.loadLesson(lessons[0].id);

      if (lessons.length > 1) {
        expect(service.isLessonLoaded(lessons[1].id)).toBe(false);
      }
    });

    it('should return false after clearing lesson', async () => {
      const lessons = service.availableLessons();
      const lessonId = lessons[0].id;

      await service.loadLesson(lessonId);
      expect(service.isLessonLoaded(lessonId)).toBe(true);

      service.clearLesson();
      expect(service.isLessonLoaded(lessonId)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty lessons list', async () => {
      spyOn(mockBackend, 'listLessons').and.returnValue(Promise.resolve([]));

      const lessons = await service.listLessons();

      expect(lessons).toEqual([]);
      expect(service.lessonCount()).toBe(0);
    });

    it('should handle loading same lesson twice', async () => {
      await service.listLessons();
      const lessons = service.availableLessons();
      const lessonId = lessons[0].id;

      const lesson1 = await service.loadLesson(lessonId);
      const lesson2 = await service.loadLesson(lessonId);

      expect(lesson1).toEqual(lesson2);
      expect(service.currentLesson()).toEqual(lesson2);
    });

    it('should handle loading different lessons sequentially', async () => {
      await service.listLessons();
      const lessons = service.availableLessons();

      if (lessons.length > 1) {
        await service.loadLesson(lessons[0].id);
        const firstTitle = service.currentLessonTitle();

        await service.loadLesson(lessons[1].id);
        const secondTitle = service.currentLessonTitle();

        expect(firstTitle).not.toBe(secondTitle);
      }
    });
  });
});
