import { CommonModule } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';
import { midiToNoteName } from '../../../core/models/note.model';
import { KeyboardRange, KeyState, VisibleKey } from '../models/scrolling-note.model';

/**
 * Virtual Keyboard Component (Zone C)
 * Displays a piano keyboard with visual feedback for hints, active notes, and evaluation results.
 */
@Component({
    selector: 'app-virtual-keyboard',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="piano-keys-wrapper">
            <div class="piano-keys" [style.width.px]="keyboardWidth()">
                @for (key of visibleKeys(); track key.midi) {
                    <div
                        class="piano-key"
                        [class.black]="key.isBlack"
                        [class.white]="!key.isBlack"
                        [class.hint]="key.isHint"
                        [class.active]="key.isActive"
                        [class.correct]="key.isCorrect"
                        [class.wrong]="key.isWrong"
                        [class.tonic]="key.isTonic"
                        [style.left.px]="key.x"
                        [style.width.px]="key.width">
                        <span class="key-label" *ngIf="!key.isBlack">{{ key.label }}</span>
                        <span class="tonic-dot" *ngIf="key.isTonic && !key.isBlack"></span>
                    </div>
                }
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
        }

        .piano-keys-wrapper {
            display: flex;
            justify-content: center;
            width: 100%;
            height: 100%;
            overflow-x: auto;
            overflow-y: hidden;
        }

        .piano-keys {
            position: relative;
            height: 100%;
            flex-shrink: 0;
        }

        .piano-key {
            position: absolute;
            bottom: 0;
            border-radius: 0 0 4px 4px;
            transition: background 0.1s, transform 0.05s;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 8px;

            &.white {
                height: 100%;
                background: linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 100%);
                border: 1px solid #999;
                z-index: 1;
            }

            &.black {
                height: 65%;
                background: linear-gradient(180deg, #333 0%, #111 100%);
                border: 1px solid #000;
                z-index: 2;
            }

            &.hint {
                &.white {
                    background: linear-gradient(180deg, #bbdefb 0%, #90caf9 100%);
                }
                &.black {
                    background: linear-gradient(180deg, #1565c0 0%, #0d47a1 100%);
                }

                &::before {
                    content: '';
                    position: absolute;
                    top: 10px;
                    width: 12px;
                    height: 12px;
                    background: #3B82F6;
                    border-radius: 50%;
                    animation: pulse 0.8s infinite;
                }
            }

            &.active {
                &.white {
                    background: linear-gradient(180deg, #e0e0e0 0%, #bdbdbd 100%);
                    transform: translateY(2px);
                }
                &.black {
                    background: linear-gradient(180deg, #222 0%, #000 100%);
                    transform: translateY(2px);
                }
            }

            &.correct {
                &.white {
                    background: linear-gradient(180deg, #a5d6a7 0%, #66bb6a 100%) !important;
                }
                &.black {
                    background: linear-gradient(180deg, #2e7d32 0%, #1b5e20 100%) !important;
                }
            }

            &.wrong {
                &.white {
                    background: linear-gradient(180deg, #ef9a9a 0%, #ef5350 100%) !important;
                }
                &.black {
                    background: linear-gradient(180deg, #c62828 0%, #b71c1c 100%) !important;
                }
            }

            &.tonic {
                &.white {
                    border: 2px solid #8B5CF6;
                    box-shadow: inset 0 -8px 12px rgba(139, 92, 246, 0.2);
                }
                &.black {
                    border: 2px solid #8B5CF6;
                }
            }

            .key-label {
                font-size: 0.7rem;
                color: #666;
                font-weight: 500;
            }

            .tonic-dot {
                position: absolute;
                top: 12px;
                width: 8px;
                height: 8px;
                background: #8B5CF6;
                border-radius: 50%;
            }
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
        }
    `]
})
export class VirtualKeyboardComponent {
    // Input: keyboard range
    @Input() set keyboardRange(value: KeyboardRange) {
        this._keyboardRange.set(value);
    }

    // Input: notes to show as hints
    @Input() set hintNotes(value: number[]) {
        this._hintNotes.set(value);
    }

    // Input: currently pressed notes
    @Input() set activeNotes(value: number[]) {
        this._activeNotes.set(value);
    }

    // Input: notes that were played correctly (flash green)
    @Input() set correctNotes(value: number[]) {
        this._correctNotes.set(value);
    }

    // Input: notes that were played incorrectly (flash red)
    @Input() set wrongNotes(value: number[]) {
        this._wrongNotes.set(value);
    }

    // Input: tonic/root notes to highlight (note % 12 values)
    @Input() set tonicNotes(value: number[]) {
        this._tonicNotes.set(value);
    }

    // Internal signals
    private _keyboardRange = signal<KeyboardRange>({ min: 48, max: 72 });
    private _hintNotes = signal<number[]>([]);
    private _activeNotes = signal<number[]>([]);
    private _correctNotes = signal<number[]>([]);
    private _wrongNotes = signal<number[]>([]);
    private _tonicNotes = signal<number[]>([]);

    // Constants
    private readonly WHITE_KEY_WIDTH = 40;
    private readonly BLACK_KEY_WIDTH = 24;

    // Computed: keyboard width based on number of white keys
    keyboardWidth = computed(() => {
        const range = this._keyboardRange();
        let whiteKeyCount = 0;
        for (let midi = range.min; midi <= range.max; midi++) {
            const noteInOctave = midi % 12;
            const isBlack = [1, 3, 6, 8, 10].includes(noteInOctave);
            if (!isBlack) whiteKeyCount++;
        }
        return whiteKeyCount * this.WHITE_KEY_WIDTH;
    });

    // Computed: generate visible keys with their states
    visibleKeys = computed<VisibleKey[]>(() => {
        const range = this._keyboardRange();
        const hintNotes = this._hintNotes();
        const activeNotes = this._activeNotes();
        const correctNotes = this._correctNotes();
        const wrongNotes = this._wrongNotes();
        const tonicNotes = this._tonicNotes(); // Note % 12 values for tonic

        const keys: VisibleKey[] = [];
        let whiteKeyIndex = 0;

        for (let midi = range.min; midi <= range.max; midi++) {
            const noteInOctave = midi % 12;
            const isBlack = [1, 3, 6, 8, 10].includes(noteInOctave);
            const isTonic = tonicNotes.includes(noteInOctave);

            const keyState: KeyState = {
                isHint: hintNotes.includes(midi),
                isActive: activeNotes.includes(midi),
                isCorrect: correctNotes.includes(midi),
                isWrong: wrongNotes.includes(midi)
            };

            if (!isBlack) {
                keys.push({
                    midi,
                    isBlack: false,
                    label: midiToNoteName(midi).replace(/[0-9]/g, ''),
                    x: whiteKeyIndex * this.WHITE_KEY_WIDTH,
                    width: this.WHITE_KEY_WIDTH,
                    isTonic,
                    ...keyState
                });
                whiteKeyIndex++;
            } else {
                // Black key positioned between white keys
                keys.push({
                    midi,
                    isBlack: true,
                    label: '',
                    x: (whiteKeyIndex * this.WHITE_KEY_WIDTH) - (this.BLACK_KEY_WIDTH / 2),
                    width: this.BLACK_KEY_WIDTH,
                    isTonic,
                    ...keyState
                });
            }
        }

        return keys;
    });

    /**
     * Check if a MIDI note is a black key
     */
    isBlackKey(midi: number): boolean {
        const noteInOctave = midi % 12;
        return [1, 3, 6, 8, 10].includes(noteInOctave);
    }

    /**
     * Count white keys in a range
     */
    countWhiteKeys(min: number, max: number): number {
        let count = 0;
        for (let midi = min; midi <= max; midi++) {
            if (!this.isBlackKey(midi)) count++;
        }
        return count;
    }
}
