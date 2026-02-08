/**
 * Floating damage number that rises and fades out.
 */
export class DamageNumber {
    constructor(x, y, amount, color = '#ffffff') {
        this.x = x;
        this.y = y;
        this.text = typeof amount === 'string' ? amount : `-${amount}`;
        this.color = color;
        this.life = 0.8;
        this.maxLife = 0.8;
        this.speed = 40; // px/s upward
    }

    update(dt) {
        this.y -= this.speed * dt;
        this.life -= dt;
    }

    get opacity() {
        return Math.max(0, this.life / this.maxLife);
    }

    get alive() {
        return this.life > 0;
    }

    draw(renderer) {
        const charX = Math.round(this.x / renderer.charWidth);
        const charY = Math.round(this.y / renderer.charHeight);
        renderer.drawText(this.text, charX, charY, this.color, false, this.opacity);
    }
}
