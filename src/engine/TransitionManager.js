import { ScreenEffects } from './animation/ScreenEffects.js';

/**
 * Wraps ScreenEffects for state transitions.
 * fadeOut(duration, callback) → callback changes state → fadeIn(duration).
 */
export class TransitionManager {
    constructor() {
        this.effects = new ScreenEffects();
        this._callback = null;
        this._phase = 'idle'; // 'idle' | 'fadeOut' | 'fadeIn'
        this._fadeDuration = 0;
    }

    get isTransitioning() {
        return this._phase !== 'idle';
    }

    fadeTransition(duration, callback) {
        this._fadeDuration = duration / 2;
        this._callback = callback;
        this._phase = 'fadeOut';
        this.effects.triggerFade('out', this._fadeDuration, '#000000');
    }

    update(dt) {
        this.effects.update(dt);

        if (this._phase === 'fadeOut' && this.effects.fadeComplete) {
            if (this._callback) {
                this._callback();
                this._callback = null;
            }
            this._phase = 'fadeIn';
            this.effects.triggerFade('in', this._fadeDuration, '#000000');
        }

        if (this._phase === 'fadeIn' && this.effects.fadeComplete) {
            this._phase = 'idle';
        }
    }

    draw(ctx, width, height) {
        this.effects.draw(ctx, width, height);
    }
}
