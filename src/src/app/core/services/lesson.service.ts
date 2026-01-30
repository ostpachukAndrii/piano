import { computed, Injectable, signal } from '@angular/core';
import { LessonDTO, LessonMetadataDTO } from '../models/lesson.model';
import { TauriService } from './tauri.service';

/**
 * Lesson management service
 * Calls existing Rust backend commands for lesson loading
 */
@Injectable({
    providedIn: 'root'
})
export class LessonService {
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

    constructor(private tauri: TauriService) { }

    /**
     * Load a specific lesson by ID
     * Calls: src-tauri/src/commands/lesson.rs::load_lesson
     */
    async loadLesson(lessonId: string): Promise<LessonDTO> {
        this._loading.set(true);
        this._error.set(null);

        try {
            const lesson = await this.tauri.invoke<LessonDTO>('load_lesson', { lessonId });
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
     * Calls: src-tauri/src/commands/lesson.rs::list_lessons
     */
    async listLessons(): Promise<LessonMetadataDTO[]> {
        this._loading.set(true);
        this._error.set(null);

        try {
            const lessons = await this.tauri.invoke<LessonMetadataDTO[]>('list_lessons');
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
}
