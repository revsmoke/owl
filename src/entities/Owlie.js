export class Owlie {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.sprite = `(\\__/)
(•ㅅ•)
/ 　 づ`;
        this.color = '#ffffff';
        this.baseColor = '#ffffff';
        this.hitColor = '#ff3333';
        this.glow = true;
        this.speed = 200;
        this.health = 100;
        this.width = 6;
        this.height = 3;
        this.hitTimer = 0;
        this.iFrameDuration = 0.5; // seconds
    }

    takeDamage(amount) {
        if (this.hitTimer > 0) return false; // Still invincible

        this.health -= amount;
        this.hitTimer = this.iFrameDuration;
        this.color = this.hitColor;
        return true;
    }

    update(dt, inputAxis) {
        this.x += inputAxis.x * this.speed * dt;
        this.y += inputAxis.y * this.speed * dt;

        if (this.hitTimer > 0) {
            this.hitTimer -= dt;
            // Flicker effect or just solid color
            if (this.hitTimer <= 0) {
                this.color = this.baseColor;
            } else {
                // Subtle flicker (switch between hitColor and white based on time)
                this.color = Math.floor(this.hitTimer * 10) % 2 === 0 ? this.hitColor : this.baseColor;
            }
        }

        // Keep in bounds
        this.x = Math.max(0, Math.min(window.innerWidth - 60, this.x));
        this.y = Math.max(0, Math.min(window.innerHeight - 40, this.y));
    }
}
