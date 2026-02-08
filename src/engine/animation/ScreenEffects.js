/**
 * Full-screen overlay effects: flash, fade, vignette.
 * Call draw(ctx, width, height) after all game content.
 */
export class ScreenEffects {
    constructor() {
        this.flashColor = '#ffffff';
        this.flashAlpha = 0;
        this.flashDuration = 0;
        this.flashTimer = 0;

        this.fadeColor = '#000000';
        this.fadeAlpha = 0;
        this.fadeTarget = 0;
        this.fadeDuration = 0;
        this.fadeTimer = 0;
        this.fadeFrom = 0;

        this.vignetteIntensity = 0;
    }

    triggerFlash(color = '#ffffff', duration = 0.2) {
        this.flashColor = color;
        this.flashAlpha = 1;
        this.flashDuration = duration;
        this.flashTimer = 0;
    }

    triggerFade(direction, duration = 1.0, color = '#000000') {
        this.fadeColor = color;
        this.fadeDuration = duration;
        this.fadeTimer = 0;
        if (direction === 'in') {
            this.fadeFrom = 1;
            this.fadeTarget = 0;
            this.fadeAlpha = 1;
        } else {
            this.fadeFrom = 0;
            this.fadeTarget = 1;
            this.fadeAlpha = 0;
        }
    }

    setVignette(intensity) {
        this.vignetteIntensity = intensity;
    }

    update(dt) {
        // Flash decay
        if (this.flashAlpha > 0) {
            this.flashTimer += dt;
            this.flashAlpha = Math.max(0, 1 - this.flashTimer / this.flashDuration);
        }

        // Fade
        if (this.fadeDuration > 0 && this.fadeTimer < this.fadeDuration) {
            this.fadeTimer += dt;
            const t = Math.min(1, this.fadeTimer / this.fadeDuration);
            this.fadeAlpha = this.fadeFrom + (this.fadeTarget - this.fadeFrom) * t;
        }
    }

    get isFading() {
        return this.fadeDuration > 0 && this.fadeTimer < this.fadeDuration;
    }

    get fadeComplete() {
        return this.fadeDuration > 0 && this.fadeTimer >= this.fadeDuration;
    }

    draw(ctx, width, height) {
        // Vignette
        if (this.vignetteIntensity > 0) {
            const gradient = ctx.createRadialGradient(
                width / 2, height / 2, width * 0.3,
                width / 2, height / 2, width * 0.7
            );
            gradient.addColorStop(0, 'transparent');
            gradient.addColorStop(1, `rgba(0, 0, 0, ${this.vignetteIntensity})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }

        // Flash overlay
        if (this.flashAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.flashAlpha;
            ctx.fillStyle = this.flashColor;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }

        // Fade overlay
        if (this.fadeAlpha > 0.001) {
            ctx.save();
            ctx.globalAlpha = this.fadeAlpha;
            ctx.fillStyle = this.fadeColor;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }
    }
}
