/**
 * Collectible power-up items. Spawns on enemy death (10% chance).
 * Floats down, pulses with glow, despawns after 8s.
 */

const POWERUP_TYPES = {
    heal:   { sprite: '[+]',  color: '#33ff33', name: 'HEAL' },
    rapid:  { sprite: '[>>]', color: '#33ffff', name: 'RAPID FIRE' },
    shield: { sprite: '[O]',  color: '#3399ff', name: 'SHIELD' },
    bomb:   { sprite: '[!]',  color: '#ff3333', name: 'BOMB' }
};

const TYPE_KEYS = Object.keys(POWERUP_TYPES);

export class PowerUp {
    constructor(x, y) {
        const key = TYPE_KEYS[Math.floor(Math.random() * TYPE_KEYS.length)];
        const def = POWERUP_TYPES[key];

        this.x = x;
        this.y = y;
        this.type = key;
        this.sprite = def.sprite;
        this.color = def.color;
        this.name = def.name;
        this.glow = true;
        this.opacity = 1.0;
        this.life = 8.0;
        this.time = 0;
        this.speed = 30; // float down speed
        this.width = def.sprite.length;
        this.height = 1;
    }

    get alive() {
        return this.life > 0;
    }

    update(dt) {
        this.time += dt;
        this.life -= dt;
        this.y += this.speed * dt;

        // Pulse opacity
        this.opacity = 0.6 + 0.4 * Math.sin(this.time * 4);

        // Fade out in last 2 seconds
        if (this.life < 2) {
            this.opacity *= this.life / 2;
        }
    }

    static shouldSpawn() {
        return Math.random() < 0.10;
    }
}
