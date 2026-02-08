const BOSS_CAT = ` /\\_/\\
( o.o )
 > ^ <
 /| |\\`;

const BOSS_HAWK = `  __V__
 /     \\
|  V V  |
 \\_____/`;

export class Enemy {
    constructor(x, y, type = 'cat') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.maxHealth = 20;
        this.isBoss = false;

        switch (type) {
            case 'cat':
                this.sprite = '^._.^';
                this.color = '#ff9933';
                this.speed = 80;
                this.maxHealth = 20;
                break;
            case 'hawk':
                this.sprite = '>V<';
                this.color = '#ff3333';
                this.speed = 120;
                this.maxHealth = 20;
                break;
            case 'boss':
                this.isBoss = true;
                if (Math.random() > 0.5) {
                    this.sprite = BOSS_CAT;
                    this.color = '#ff6600';
                    this.speed = 50;
                } else {
                    this.sprite = BOSS_HAWK;
                    this.color = '#ff0000';
                    this.speed = 60;
                }
                this.maxHealth = 120;
                this.glow = true;
                break;
        }

        this.health = this.maxHealth;
        this.glow = this.glow || false;
        this.opacity = 1.0;

        const lines = this.sprite.split('\n');
        this.width = Math.max(...lines.map(l => l.length));
        this.height = lines.length;
    }

    get healthPercent() {
        return this.health / this.maxHealth;
    }

    update(dt, owliePos) {
        if (!owliePos) return;

        const dx = owliePos.x - this.x;
        const dy = owliePos.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }

    drawHealthBar(renderer) {
        if (!this.isBoss) return;
        const charX = Math.round(this.x / renderer.charWidth);
        const charY = Math.round(this.y / renderer.charHeight) - 1;
        const barLen = 8;
        const filled = Math.round(this.healthPercent * barLen);
        const empty = barLen - filled;
        const bar = '[' + '\u2588'.repeat(filled) + '\u2591'.repeat(empty) + ']';
        renderer.drawText(bar, charX, charY, this.color);
    }
}
