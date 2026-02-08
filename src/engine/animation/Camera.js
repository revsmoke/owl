/**
 * Virtual camera with offset and shake.
 * Apply offset via ctx.translate() before drawing.
 */
export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.followSpeed = 5;

        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;
    }

    follow(target) {
        this.targetX = target.x;
        this.targetY = target.y;
    }

    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTimer = 0;
    }

    update(dt) {
        // Smooth follow
        this.x += (this.targetX - this.x) * this.followSpeed * dt;
        this.y += (this.targetY - this.y) * this.followSpeed * dt;

        // Shake
        if (this.shakeTimer < this.shakeDuration) {
            this.shakeTimer += dt;
            const progress = this.shakeTimer / this.shakeDuration;
            const decay = 1 - progress;
            this.shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity * decay;
            this.shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity * decay;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }
    }

    getOffsetX() {
        return -this.x + this.shakeX;
    }

    getOffsetY() {
        return -this.y + this.shakeY;
    }
}
