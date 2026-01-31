import { computed, inject, Injectable, signal } from '@angular/core';
import { LessonDTO, LessonMetadataDTO } from '../models/lesson.model';
import { BACKEND_CLIENT, BackendClient } from '../api';

/**
 * Lesson management service
 * Uses BackendClient abstraction for testability
 *
 * IMPROVEMENTS:
 * - Uses BackendClient instead of TauriService (testable!)
 * - Better error handling with typed errors
 * - Fully unit testable with MockBackendClient
 */
@Injectable({
    providedIn: 'root'
})
export class LessonService {
    private backend = inject(BACKEND_CLIENT);

    // Reactive state using Angular signals
    private readonly _currentLesson = signal<LessonDTO | null>(null);
    private readonly _availableLessons = signal<LessonMetadataDTO[]>([]);
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);

    // Public readonly signals
    readonly currentLesson = this._currentLesson.asReadonly();
    readonly availableLessons = this._availableLessons.asReadonly();
    readonly loading = this._loading.asReadonly();
    readonly error = this._error.asReadonly();

    // Computed values
    readonly hasLesson = computed(() => this._currentLesson() !== null);
    readonly lessonCount = computed(() => this._availableLessons().length);
    readonly currentLessonTitle = computed(() => this._currentLesson()?.title ?? null);
    readonly currentLessonDuration = computed(() => this._currentLesson()?.total_seconds ?? 0);

    /**
     * Load a specific lesson by ID
     */
    async loadLesson(lessonId: string): Promise<LessonDTO> {
        this._loading.set(true);
        this._error.set(null);

        try {
            const lesson = await this.backend.loadLesson(lessonId);
            this._currentLesson.set(lesson);
            console.log(`[LessonService] Loaded lesson: ${lesson.title} (${lesson.measures.length} measures)`);
            return lesson;
        } catch (err) {
            const message = `Failed to load lesson "${lessonId}": ${err}`;
            this._error.set(message);
            console.error(`[LessonService] ${message}`);
            throw err;
        } finally {
            this._loading.set(false);
        }
    }

    /**
     * Get list of all available lessons
     */
    async listLessons(): Promise<LessonMetadataDTO[]> {
        this._loading.set(true);
        this._error.set(null);

        try {
            const lessons = await this.backend.listLessons();
            this._availableLessons.set(lessons);
            console.log(`[LessonService] Found ${lessons.length} lessons`);
            return lessons;
        } catch (err) {
            const message = `Failed to list lessons: ${err}`;
            this._error.set(message);
            console.error(`[LessonService] ${message}`);
            throw err;
        } finally {
            this._loading.set(false);
        }
    }

    /**
     * Clear current lesson
     */
    clearLesson(): void {
        this._currentLesson.set(null);
        this._error.set(null);
    }

    /**
     * Clear error state
     */
    clearError(): void {
        this._error.set(null);
    }

    /**
     * Get current measure count
     */
    getMeasureCount(): number {
        const lesson = this._currentLesson();
        return lesson ? lesson.measures.length : 0;
    }

    /**
     * Get total notes in current lesson
     */
    getTotalNotes(): number {
        const lesson = this._currentLesson();
        if (!lesson) return 0;
        return lesson.measures.reduce((sum, m) => sum + m.notes.length, 0);
    }

    /**
     * Get lesson by ID from available lessons
     */
    getLessonMetadata(lessonId: string): LessonMetadataDTO | undefined {
        return this._availableLessons().find(l => l.id === lessonId);
    }

    /**
     * Check if a lesson is currently loaded
     */
    isLessonLoaded(lessonId: string): boolean {
        const current = this._currentLesson();
        if (!current) return false;

        // Compare by finding matching metadata
        const metadata = this.getLessonMetadata(lessonId);
        return metadata?.title === current.title;
    }
}
