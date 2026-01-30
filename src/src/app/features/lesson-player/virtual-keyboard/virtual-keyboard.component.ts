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
            padding: 8px 0;
        }

        .piano-keys {
            position: relative;
            height: 100%;
            flex-shrink: 0;
        }

        .piano-key {
            position: absolute;
            top: 0;
            border-radius: 4px 4px 0 0;
            transition: background 0.1s, transform 0.05s, box-shadow 0.2s;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding-top: 10px;
            pointer-events: none;
            user-select: none;

            &.white {
                height: 100%;
                background: linear-gradient(to bottom, #ffffff 0%, #f0f0f0 85%, #d0d0d0 100%);
                border: 1px solid #999;
                border-bottom: 3px solid #777;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2),
                           inset 0 -2px 4px rgba(0, 0, 0, 0.1);
                z-index: 1;
            }

            &.black {
                height: 65%;
                background: linear-gradient(to bottom, #3a3a3a 0%, #1a1a1a 85%, #000000 100%);
                border: 1px solid #000;
                border-bottom: 2px solid #000;
                box-shadow: 0 3px 6px rgba(0, 0, 0, 0.5),
                           inset 0 -1px 2px rgba(0, 0, 0, 0.3);
                z-index: 2;
            }

            &.hint {
                &.white {
                    background: linear-gradient(to bottom, #e3f2fd 0%, #90caf9 85%, #64b5f6 100%);
                    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.5),
                               inset 0 -2px 4px rgba(33, 150, 243, 0.3),
                               0 0 20px rgba(33, 150, 243, 0.4);
                }
                &.black {
                    background: linear-gradient(to bottom, #1976d2 0%, #0d47a1 85%, #01579b 100%);
                    box-shadow: 0 3px 10px rgba(33, 150, 243, 0.7),
                               inset 0 -1px 2px rgba(33, 150, 243, 0.5),
                               0 0 20px rgba(33, 150, 243, 0.5);
                }

                &::before {
                    content: '';
                    position: absolute;
                    top: 15px;
                    width: 14px;
                    height: 14px;
                    background: radial-gradient(circle, #2196F3 0%, #1976D2 100%);
                    border: 2px solid #fff;
                    border-radius: 50%;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3),
                               0 0 15px rgba(33, 150, 243, 0.8);
                    animation: pulse 1s ease-in-out infinite;
                    z-index: 10;
                }
            }

            &.active {
                &.white {
                    background: linear-gradient(to bottom, #e0e0e0 0%, #bdbdbd 85%, #9e9e9e 100%);
                    transform: translateY(3px);
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2),
                               inset 0 1px 3px rgba(0, 0, 0, 0.2);
                }
                &.black {
                    background: linear-gradient(to bottom, #2a2a2a 0%, #0a0a0a 85%, #000000 100%);
                    transform: translateY(2px);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5),
                               inset 0 1px 2px rgba(0, 0, 0, 0.4);
                }
            }

            &.correct {
                &.white {
                    background: linear-gradient(to bottom, #c8e6c9 0%, #66bb6a 85%, #43a047 100%) !important;
                    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.6),
                               0 0 20px rgba(76, 175, 80, 0.5) !important;
                    animation: correctFlash 0.5s ease-out;
                }
                &.black {
                    background: linear-gradient(to bottom, #388e3c 0%, #1b5e20 85%, #0d3d13 100%) !important;
                    box-shadow: 0 3px 10px rgba(76, 175, 80, 0.7),
                               0 0 20px rgba(76, 175, 80, 0.6) !important;
                    animation: correctFlash 0.5s ease-out;
                }
            }

            &.wrong {
                &.white {
                    background: linear-gradient(to bottom, #ffcdd2 0%, #ef5350 85%, #e53935 100%) !important;
                    box-shadow: 0 2px 8px rgba(244, 67, 54, 0.6),
                               0 0 20px rgba(244, 67, 54, 0.5) !important;
                    animation: shake 0.3s ease-in-out;
                }
                &.black {
                    background: linear-gradient(to bottom, #d32f2f 0%, #b71c1c 85%, #8b0000 100%) !important;
                    box-shadow: 0 3px 10px rgba(244, 67, 54, 0.7),
                               0 0 20px rgba(244, 67, 54, 0.6) !important;
                    animation: shake 0.3s ease-in-out;
                }
            }

            &.tonic {
                &.white {
                    border-top: 3px solid #8B5CF6;
                    box-shadow: inset 0 3px 12px rgba(139, 92, 246, 0.2),
                               0 2px 4px rgba(0, 0, 0, 0.2);
                }
                &.black {
                    border-top: 3px solid #8B5CF6;
                    box-shadow: inset 0 2px 8px rgba(139, 92, 246, 0.3),
                               0 3px 6px rgba(0, 0, 0, 0.5);
                }
            }

            .key-label {
                font-size: 0.7rem;
                color: #666;
                font-weight: 600;
                text-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);
                pointer-events: none;
            }

            .tonic-dot {
                position: absolute;
                top: 18px;
                width: 6px;
                height: 6px;
                background: #8B5CF6;
                border-radius: 50%;
                box-shadow: 0 1px 3px rgba(139, 92, 246, 0.5);
                pointer-events: none;
            }
        }

        @keyframes pulse {
            0%, 100% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.7;
                transform: scale(1.3);
            }
        }

        @keyframes correctFlash {
            0% {
                transform: scale(1);
                filter: brightness(1);
            }
            50% {
                transform: scale(1.05);
                filter: brightness(1.3);
            }
            100% {
                transform: scale(1);
                filter: brightness(1);
            }
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
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
