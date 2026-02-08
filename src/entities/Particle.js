export class Particle {
    /**
     * @param {number} x
     * @param {number} y
     * @param {string} color
     * @param {'explosion'|'trail'|'spark'|'dissolve'} type
     */
    constructor(x, y, color, type = 'explosion') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.opacity = 1.0;
        this.glow = false;
        this.type = type;

        switch (type) {
            case 'trail':
                this.vx = 0;
                this.vy = 0;
                this.sprite = Math.random() > 0.5 ? '.' : '~';
                this.life = 0.2;
                this.maxLife = 0.2;
                break;

            case 'spark': {
                const speed = 100 + Math.random() * 200;
                const angle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                this.sprite = Math.random() > 0.5 ? '*' : '|';
                this.life = 0.15 + Math.random() * 0.15;
                this.maxLife = this.life;
                this.glow = true;
                break;
            }

            case 'dissolve': {
                const speed = 30 + Math.random() * 80;
                const angle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                this.sprite = '.';
                this.life = 0.5 + Math.random() * 0.5;
                this.maxLife = this.life;
                break;
            }

            default: { // explosion
                const speed = 50 + Math.random() * 150;
                const angle = Math.random() * Math.PI * 2;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                const symbols = ['*', '+', '.', 'x', 'o'];
                this.sprite = symbols[Math.floor(Math.random() * symbols.length)];
                this.life = 0.5 + Math.random() * 0.5;
                this.maxLife = this.life;
                this.glow = Math.random() > 0.5;
                break;
            }
        }
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        this.opacity = Math.max(0, this.life / this.maxLife);
    }

    /**
     * Create dissolve particles from an entity's sprite.
     * Each character becomes its own particle flying outward.
     */
    static createDissolve(entity) {
        const particles = [];
        const lines = entity.sprite.split('\n');
        const charW = 8; // approximate char width in pixels
        const charH = 14; // approximate char height

        lines.forEach((line, row) => {
            line.split('').forEach((ch, col) => {
                if (ch === ' ') return;
                const p = new Particle(
                    entity.x + col * charW,
                    entity.y + row * charH,
                    entity.color,
                    'dissolve'
                );
                p.sprite = ch;
                particles.push(p);
            });
        });

        return particles;
    }
}
