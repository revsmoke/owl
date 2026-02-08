import { Easing } from './Easing.js';

/**
 * Generic property tweener. Mutates target[property] each update.
 */
export class Tween {
    constructor(target, property, from, to, duration, easing = 'linear', onComplete = null) {
        this.target = target;
        this.property = property;
        this.from = from;
        this.to = to;
        this.duration = duration;
        this.easingFn = Easing[easing] || Easing.linear;
        this.onComplete = onComplete;
        this.elapsed = 0;
        this.done = false;
    }

    update(dt) {
        if (this.done) return;

        this.elapsed += dt;
        const t = Math.min(1, this.elapsed / this.duration);
        const eased = this.easingFn(t);
        this.target[this.property] = this.from + (this.to - this.from) * eased;

        if (t >= 1) {
            this.done = true;
            if (this.onComplete) this.onComplete();
        }
    }
}
