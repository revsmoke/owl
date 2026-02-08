import { Renderer } from './Renderer.js';
import { Input } from './Input.js';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import { Particle } from '../entities/Particle.js';
import { CutsceneManager } from './CutsceneManager.js';
import { STORIES } from '../data/cutscenes.js';

export const GameState = {
    PLAYING: 'playing',
    CUTSCENE: 'cutscene',
    GAMEOVER: 'gameover'
};

export class Game {
    constructor(canvas) {
        this.renderer = new Renderer(canvas);
        this.input = new Input();
        this.entities = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.lastTime = 0;
        this.owlie = null;
        this.spawnTimer = 0;
        this.shootTimer = 0;
        this.score = 0;
        this.state = GameState.PLAYING;
        this.cutsceneManager = new CutsceneManager(this.renderer);

        // Enhanced parallax stars — 3 layers with twinkling
        const starSymbols = ['.', '.', '.', '.', '*', '+', '~', ':'];
        const layers = [
            { count: 50, speedMult: 0.1, baseBright: 0.15 },
            { count: 40, speedMult: 0.3, baseBright: 0.3 },
            { count: 30, speedMult: 0.6, baseBright: 0.55 }
        ];
        this.stars = [];
        for (const layer of layers) {
            for (let i = 0; i < layer.count; i++) {
                this.stars.push({
                    x: Math.random() * 200,
                    y: Math.random() * 200,
                    speed: layer.speedMult,
                    baseBright: layer.baseBright,
                    twinkleSpeed: 1 + Math.random() * 3,
                    twinkleOffset: Math.random() * Math.PI * 2,
                    symbol: starSymbols[Math.floor(Math.random() * starSymbols.length)]
                });
            }
        }
        this.gameTime = 0;

        this.shakeAmount = 0;
    }

    start() {
        requestAnimationFrame((t) => this.loop(t));
    }

    addEntity(entity) {
        this.entities.push(entity);
        return entity;
    }

    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        if (this.state === GameState.CUTSCENE) {
            this.cutsceneManager.update(dt);
            if (!this.cutsceneManager.isActive) {
                this.state = GameState.GAMEOVER;
            }
            return;
        }

        if (this.state === GameState.GAMEOVER) {
            if (this.input.anyKey) {
                window.location.reload();
            }
            return;
        }

        const axis = this.input.getAxis();

        // Spawn enemies
        this.spawnTimer += dt;
        if (this.spawnTimer > 2.0) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }

        // Shooting logic (automatic hooting at nearest enemy or movement direction)
        this.shootTimer += dt;
        if (this.shootTimer > 0.5 && this.enemies.length > 0) {
            this.fireProjectile();
            this.shootTimer = 0;
        }

        // Update all
        this.entities.forEach(e => {
            if (e.update) e.update(dt, axis);
        });

        this.enemies.forEach(e => {
            e.update(dt, { x: this.owlie.x, y: this.owlie.y });
        });

        this.projectiles.forEach((p, i) => {
            p.update(dt);
            if (p.life <= 0) this.projectiles.splice(i, 1);
        });

        this.particles.forEach((p, i) => {
            p.update(dt);
            if (p.life <= 0) this.particles.splice(i, 1);
        });

        this.gameTime += dt;
        this.stars.forEach(s => {
            s.y += s.speed * dt * 50;
            if (s.y > this.renderer.rows) {
                s.y = -1;
                s.x = Math.random() * this.renderer.cols;
            }
        });

        this.shakeAmount *= 0.9; // Decay shake
        if (this.shakeAmount < 0.1) this.shakeAmount = 0;

        this.checkCollisions();
    }

    spawnEnemy() {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        if (side === 0) { x = Math.random() * window.innerWidth; y = -20; }
        else if (side === 1) { x = window.innerWidth + 20; y = Math.random() * window.innerHeight; }
        else if (side === 2) { x = Math.random() * window.innerWidth; y = window.innerHeight + 20; }
        else { x = -20; y = Math.random() * window.innerHeight; }

        const type = Math.random() > 0.3 ? 'cat' : 'hawk';
        const enemy = new Enemy(x, y, type);
        this.enemies.push(enemy);
    }

    fireProjectile() {
        // Simple: fire towards nearest enemy
        const target = this.enemies[0];
        const dx = target.x - this.owlie.x;
        const dy = target.y - this.owlie.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const proj = new Projectile(this.owlie.x + 30, this.owlie.y + 20, dx / dist, dy / dist);
        this.projectiles.push(proj);
    }

    checkCollisions() {
        // Projectile -> Enemy
        this.projectiles.forEach((p, pi) => {
            this.enemies.forEach((e, ei) => {
                const dist = Math.sqrt(Math.pow(p.x - e.x, 2) + Math.pow(p.y - e.y, 2));
                if (dist < 20) {
                    e.health -= p.damage;
                    this.projectiles.splice(pi, 1);
                    if (e.health <= 0) {
                        this.createExplosion(e.x, e.y, e.color);
                        this.enemies.splice(ei, 1);
                        this.score += 10;
                    }
                }
            });
        });

        // Enemy -> Owlie
        this.enemies.forEach((e, ei) => {
            const dist = Math.sqrt(Math.pow(this.owlie.x - e.x, 2) + Math.pow(this.owlie.y - e.y, 2));
            if (dist < 30) {
                if (this.owlie.takeDamage(5)) {
                    this.shakeAmount = 3;
                    if (this.owlie.health <= 0) {
                        this.triggerDeath();
                    }
                }
            }
        });
    }

    triggerDeath() {
        this.state = GameState.CUTSCENE;
        const randomStory = STORIES[Math.floor(Math.random() * STORIES.length)];
        this.cutsceneManager.play(randomStory(this.score));
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    draw() {
        this.renderer.clear();

        if (this.state === GameState.CUTSCENE) {
            this.cutsceneManager.draw();
            return;
        }

        // Apply screenshake
        if (this.shakeAmount > 0) {
            const dx = (Math.random() - 0.5) * this.shakeAmount;
            const dy = (Math.random() - 0.5) * this.shakeAmount;
            this.renderer.ctx.save();
            this.renderer.ctx.translate(dx, dy);
        }

        // Draw parallax stars with twinkling
        this.stars.forEach(s => {
            const brightness = s.baseBright + (1 - s.baseBright) * (0.3 + 0.7 * Math.sin(this.gameTime * s.twinkleSpeed + s.twinkleOffset));
            const v = Math.round(brightness * 136);
            const hex = v.toString(16).padStart(2, '0');
            const color = `#${hex}${hex}${hex}`;
            this.renderer.drawText(s.symbol, s.x % this.renderer.cols, s.y, color);
        });

        this.entities.forEach(e => this.renderer.drawEntity(e));
        this.enemies.forEach(e => this.renderer.drawEntity(e));
        this.projectiles.forEach(p => this.renderer.drawEntity(p));
        this.particles.forEach(p => this.renderer.drawEntity(p));

        // Draw HUD
        if (this.owlie) {
            this.renderer.drawText(`HP: ${Math.max(0, Math.ceil(this.owlie.health))}%  SCORE: ${this.score}`, 2, 1, '#ff3333');
            this.renderer.drawText(`[ AERO OWLIE ]`, Math.floor(this.renderer.cols / 2) - 7, 1, '#33ff33', true);
        }

        if (this.shakeAmount > 0) {
            this.renderer.ctx.restore();
        }

        if (this.state === GameState.GAMEOVER) {
            this.renderer.drawText(`G A M E   O V E R`, Math.floor(this.renderer.cols / 2) - 8, Math.floor(this.renderer.rows / 2), '#ff0000', true);
            this.renderer.drawText(`FINAL SCORE: ${this.score}`, Math.floor(this.renderer.cols / 2) - 10, Math.floor(this.renderer.rows / 2) + 2, '#ffffff');
            this.renderer.drawText(`PRESS ANY KEY TO RESTART`, Math.floor(this.renderer.cols / 2) - 12, Math.floor(this.renderer.rows / 2) + 4, '#33ff33');
        }
    }
}
