import { Injectable } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

/**
 * Tauri IPC wrapper service
 * Handles all communication between Angular frontend and Rust backend
 */
@Injectable({
    providedIn: 'root'
})
export class TauriService {
    private listeners: Map<string, UnlistenFn> = new Map();

    /**
     * Invoke a Tauri command
     * @param cmd Command name (matches #[tauri::command] in Rust)
     * @param args Optional arguments
     */
    async invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
        try {
            return await invoke<T>(cmd, args);
        } catch (error) {
            console.error(`[Tauri] Command "${cmd}" failed:`, error);
            throw error;
        }
    }

    /**
     * Listen to Tauri events from backend
     * @param event Event name
     * @param handler Callback function
     */
    async listen<T>(event: string, handler: (payload: T) => void): Promise<void> {
        // Clean up existing listener if any
        await this.unlisten(event);

        const unlisten = await listen<T>(event, (evt) => {
            handler(evt.payload);
        });

        this.listeners.set(event, unlisten);
    }

    /**
     * Stop listening to an event
     */
    async unlisten(event: string): Promise<void> {
        const unlisten = this.listeners.get(event);
        if (unlisten) {
            unlisten();
            this.listeners.delete(event);
        }
    }

    /**
     * Clean up all listeners (call in ngOnDestroy)
     */
    async cleanup(): Promise<void> {
        for (const unlisten of this.listeners.values()) {
            unlisten();
        }
        this.listeners.clear();
    }

    /**
     * Check if running in Tauri environment
     */
    isTauri(): boolean {
        return !!(window as any).__TAURI_INTERNALS__;
    }
}
