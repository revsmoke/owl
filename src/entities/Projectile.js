export class Projectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = '#ffffff';
        this.glow = true;
        this.speed = 400;
        this.life = 2.0;
        this.damage = 10;
        this.width = 1;
        this.height = 1;

        // Directional sprite based on velocity
        this.sprite = this._pickSprite(vx, vy);

        // Trail positions (last 4)
        this.trail = [];
        this.trailTimer = 0;
    }

    _pickSprite(vx, vy) {
        const ax = Math.abs(vx);
        const ay = Math.abs(vy);
        if (ax > ay * 2) return '\u2014'; // horizontal dash
        if (ay > ax * 2) return '|'; // vertical
        if ((vx > 0 && vy < 0) || (vx < 0 && vy > 0)) return '/';
        return '\\';
    }

    update(dt) {
        // Store trail position
        this.trailTimer += dt;
        if (this.trailTimer > 0.03) {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > 4) this.trail.shift();
            this.trailTimer = 0;
        }

        this.x += this.vx * this.speed * dt;
        this.y += this.vy * this.speed * dt;
        this.life -= dt;
    }

    drawTrail(renderer) {
        const opacities = [0.15, 0.25, 0.35, 0.5];
        this.trail.forEach((pos, i) => {
            const charX = Math.round(pos.x / renderer.charWidth);
            const charY = Math.round(pos.y / renderer.charHeight);
            renderer.drawText('.', charX, charY, this.color, false, opacities[i] || 0.15);
        });
    }
}
