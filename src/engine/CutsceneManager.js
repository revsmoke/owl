import { Easing } from './animation/Easing.js';
import { Tween } from './animation/Tween.js';
import { Camera } from './animation/Camera.js';
import { ScreenEffects } from './animation/ScreenEffects.js';
import { SpriteAnimation } from './animation/SpriteAnimation.js';
import { TextOverlay } from './animation/TextOverlay.js';

/**
 * CutsceneManager — supports parallel actions, easing, typewriter text,
 * screen effects, camera, and sprite animations.
 * Backward-compatible with existing action types.
 */
export class CutsceneManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.isActive = false;
        this.currentScript = null;
        this.stepIndex = 0;
        this.stepTimer = 0;

        this.actors = {};
        this.textLines = [];

        // New subsystems
        this.activeTweens = [];
        this.activeAnimations = new Map();
        this.textOverlay = new TextOverlay();
        this.screenEffects = new ScreenEffects();
        this.camera = new Camera();

        // Parallel execution support
        this.waitingForConditions = null;
        this._textIdCounter = 0;
    }

    play(script) {
        this.isActive = true;
        this.currentScript = script;
        this.stepIndex = 0;
        this.stepTimer = 0;
        this.actors = {};
        this.textLines = [];
        this.activeTweens = [];
        this.activeAnimations.clear();
        this.textOverlay.clear();
        this.waitingForConditions = null;
        this._textIdCounter = 0;
        this.camera = new Camera();
        this.screenEffects = new ScreenEffects();
        this.nextStep();
    }

    update(dt) {
        if (!this.isActive) return;

        this.stepTimer -= dt;

        // Update all subsystems
        this.activeTweens = this.activeTweens.filter(t => { t.update(dt); return !t.done; });
        this.textOverlay.update(dt);
        this.screenEffects.update(dt);
        this.camera.update(dt);

        for (const [id, anim] of this.activeAnimations) {
            anim.update(dt);
            if (this.actors[id]) {
                this.actors[id].sprite = anim.getCurrentFrame();
            }
            if (anim.done) this.activeAnimations.delete(id);
        }

        // Update actor movement (with easing support)
        for (const id in this.actors) {
            const actor = this.actors[id];
            if (actor.isMoving) {
                actor.moveTimer += dt;
                const t = Math.min(1, actor.moveTimer / actor.moveDuration);
                const eased = actor.easingFn ? actor.easingFn(t) : t;
                actor.x = actor.startX + (actor.targetX - actor.startX) * eased;
                actor.y = actor.startY + (actor.targetY - actor.startY) * eased;
                if (t >= 1) actor.isMoving = false;
            }
        }

        // Check parallel wait conditions
        if (this.waitingForConditions) {
            const allDone = this.waitingForConditions.every(fn => fn());
            if (allDone) {
                this.waitingForConditions = null;
                this.nextStep();
            }
            return;
        }

        if (this.stepTimer <= 0 && this.stepIndex < this.currentScript.length) {
            this.nextStep();
        }
    }

    nextStep() {
        if (this.stepIndex >= this.currentScript.length) return;

        const step = this.currentScript[this.stepIndex];
        this.stepIndex++;
        this.stepTimer = step.duration || 0;

        this._executeAction(step);

        // Auto-advance for instant actions (no duration, no waiting)
        if (this.stepTimer <= 0 && !this.waitingForConditions && this.isActive) {
            this.nextStep();
        }
    }

    _executeAction(step) {
        switch (step.type) {
            // ---- Original actions (backward-compatible) ----
            case 'spawn':
                this.actors[step.id] = {
                    x: step.x,
                    y: step.y,
                    sprite: step.sprite,
                    color: step.color || '#fff',
                    glow: step.glow || false,
                    opacity: step.opacity ?? 1.0,
                    isMoving: false
                };
                break;

            case 'text':
                this.textLines = [{
                    content: step.content,
                    x: step.x || 10,
                    y: step.y || 10,
                    color: step.color || '#fff',
                    glow: step.glow || false
                }];
                break;

            case 'clearText':
                this.textLines = [];
                this.textOverlay.clear();
                break;

            case 'move': {
                const actor = this.actors[step.id];
                if (actor) {
                    actor.isMoving = true;
                    actor.startX = actor.x;
                    actor.startY = actor.y;
                    actor.targetX = step.targetX;
                    actor.targetY = step.targetY;
                    actor.moveDuration = step.duration;
                    actor.moveTimer = 0;
                    actor.easingFn = step.easing ? (Easing[step.easing] || null) : null;
                }
                break;
            }

            case 'setSprite':
                if (this.actors[step.id]) {
                    this.actors[step.id].sprite = step.sprite;
                }
                break;

            case 'end':
                this.isActive = false;
                if (step.onEnd) step.onEnd();
                break;

            // ---- New action types ----
            case 'parallel': {
                const conditions = [];
                for (const subAction of step.actions) {
                    const condition = this._executeParallelAction(subAction);
                    if (condition) conditions.push(condition);
                }
                if (conditions.length > 0) {
                    this.waitingForConditions = conditions;
                }
                break;
            }

            case 'typeText': {
                const tid = `typeText_${this._textIdCounter++}`;
                this.textOverlay.add(tid, {
                    content: step.content,
                    x: step.x,
                    y: step.y,
                    color: step.color,
                    glow: step.glow || false,
                    centered: step.centered || false,
                    typewriter: { speed: step.speed || 20, cursor: step.cursor ?? true },
                    duration: step.duration || Infinity
                });
                break;
            }

            case 'flash':
                this.screenEffects.triggerFlash(step.color || '#ffffff', step.duration || 0.2);
                break;

            case 'fade':
                this.screenEffects.triggerFade(step.direction || 'out', step.duration || 1.0, step.color || '#000000');
                break;

            case 'shake':
                this.camera.shake(step.intensity || 5, step.duration || 0.5);
                break;

            case 'animate': {
                const anim = new SpriteAnimation(step.frames, step.fps || 8, step.loop ?? true);
                this.activeAnimations.set(step.id, anim);
                break;
            }

            case 'setCamera':
                if (step.duration) {
                    this.activeTweens.push(new Tween(this.camera, 'targetX', this.camera.targetX, step.x || 0, step.duration, step.easing));
                    this.activeTweens.push(new Tween(this.camera, 'targetY', this.camera.targetY, step.y || 0, step.duration, step.easing));
                } else {
                    this.camera.targetX = step.x || 0;
                    this.camera.targetY = step.y || 0;
                    this.camera.x = step.x || 0;
                    this.camera.y = step.y || 0;
                }
                break;

            case 'fadeActor': {
                const a = this.actors[step.id];
                if (a) {
                    const from = a.opacity ?? 1.0;
                    this.activeTweens.push(new Tween(a, 'opacity', from, step.targetOpacity ?? 0, step.duration || 1.0, step.easing));
                }
                break;
            }

            case 'vignette':
                this.screenEffects.setVignette(step.intensity ?? 0);
                break;

            case 'wait':
                break;
        }
    }

    /**
     * Skip to the 'end' action, terminating the cutscene immediately.
     */
    skipToEnd() {
        if (!this.isActive) return;
        this.waitingForConditions = null;
        for (let i = this.stepIndex; i < this.currentScript.length; i++) {
            if (this.currentScript[i].type === 'end') {
                this.stepIndex = i;
                this.stepTimer = 0;
                this.nextStep();
                return;
            }
        }
        // No end step found — force stop
        this.isActive = false;
    }

    /**
     * Execute an action within a parallel block.
     * Returns a completion check function, or null if instant.
     */
    _executeParallelAction(action) {
        this._executeAction(action);

        const duration = action.duration || 0;
        if (duration <= 0) return null;

        const startTime = performance.now();
        return () => (performance.now() - startTime) / 1000 >= duration;
    }

    draw() {
        if (!this.isActive) return;

        const ctx = this.renderer.ctx;
        ctx.save();

        // Apply camera offset
        ctx.translate(this.camera.getOffsetX(), this.camera.getOffsetY());

        // Draw actors
        for (const id in this.actors) {
            const actor = this.actors[id];
            if ((actor.opacity ?? 1) <= 0) continue;
            const charX = Math.round(actor.x / this.renderer.charWidth);
            const charY = Math.round(actor.y / this.renderer.charHeight);
            this.renderer.drawText(actor.sprite, charX, charY, actor.color, actor.glow, actor.opacity ?? 1.0);
        }

        ctx.restore();

        // Draw legacy text lines
        this.textLines.forEach(line => {
            this.renderer.drawText(line.content, line.x, line.y, line.color, line.glow);
        });

        // Draw text overlays
        this.textOverlay.draw(this.renderer);

        // Draw skip indicator if active for > 0.5s
        if (this.isActive && this.stepIndex < this.currentScript.length - 1) {
            // We use a simple modulo for a flicker effect
            const skipVisible = Math.floor(performance.now() / 500) % 2 === 0;
            if (skipVisible) {
                this.renderer.drawTextCentered('PRESS ANY KEY TO SKIP', this.renderer.rows - 2, '#333333', false, 0.4);
            }
        }

        // Draw screen effects (always last)
        this.screenEffects.draw(ctx, window.innerWidth, window.innerHeight);
    }
}
