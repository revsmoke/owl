import { Renderer } from './Renderer.js';
import { Input } from './Input.js';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import { Particle } from '../entities/Particle.js';
import { CutsceneManager } from './CutsceneManager.js';
import { TransitionManager } from './TransitionManager.js';
import { TitleScreen } from '../screens/TitleScreen.js';
import { GameOverScreen } from '../screens/GameOverScreen.js';
import { STORIES } from '../data/cutscenes.js';
import { Owlie } from '../entities/Owlie.js';
import { HUD } from '../ui/HUD.js';
import { DamageNumber } from '../entities/DamageNumber.js';

export const GameState = {
    TITLE: 'title',
    PLAYING: 'playing',
    WAVE_INTRO: 'wave_intro',
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
        this.enemiesKilled = 0;
        this.state = GameState.TITLE;
        this.cutsceneManager = new CutsceneManager(this.renderer);
        this.transitionManager = new TransitionManager();

        // Screens & UI
        this.titleScreen = new TitleScreen();
        this.gameOverScreen = null;
        this.hud = new HUD();
        this.damageNumbers = [];
        this.wave = 1;
        this.combo = 0;

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

    _startGameplay() {
        this.entities = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.score = 0;
        this.enemiesKilled = 0;
        this.spawnTimer = 0;
        this.shootTimer = 0;
        this.shakeAmount = 0;
        this.damageNumbers = [];
        this.wave = 1;
        this.combo = 0;

        const startX = window.innerWidth / 2 - 30;
        const startY = window.innerHeight / 2 - 20;
        this.owlie = new Owlie(startX, startY);
        this.addEntity(this.owlie);
    }

    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // Cap dt
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // Always update stars and transitions
        this.gameTime += dt;
        this.stars.forEach(s => {
            s.y += s.speed * dt * 50;
            if (s.y > this.renderer.rows) {
                s.y = -1;
                s.x = Math.random() * this.renderer.cols;
            }
        });
        this.transitionManager.update(dt);

        switch (this.state) {
            case GameState.TITLE:
                this.titleScreen.update(dt);
                if (this.input.anyKey && !this.transitionManager.isTransitioning) {
                    this.input.clearAnyKey();
                    this.transitionManager.fadeTransition(1.0, () => {
                        this._startGameplay();
                        this.state = GameState.PLAYING;
                    });
                }
                break;

            case GameState.PLAYING:
                this._updatePlaying(dt);
                break;

            case GameState.CUTSCENE:
                this.cutsceneManager.update(dt);
                if (!this.cutsceneManager.isActive) {
                    this.gameOverScreen = new GameOverScreen(this.score, this.enemiesKilled);
                    this.state = GameState.GAMEOVER;
                    this.input.clearAnyKey();
                }
                break;

            case GameState.GAMEOVER:
                this.gameOverScreen.update(dt);
                if (this.input.anyKey && !this.transitionManager.isTransitioning) {
                    this.input.clearAnyKey();
                    this.transitionManager.fadeTransition(1.0, () => {
                        this._startGameplay();
                        this.state = GameState.PLAYING;
                    });
                }
                break;
        }
    }

    _updatePlaying(dt) {
        const axis = this.input.getAxis();

        // Spawn enemies
        this.spawnTimer += dt;
        if (this.spawnTimer > 2.0) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }

        // Shooting logic
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

        this.projectiles = this.projectiles.filter(p => { p.update(dt); return p.life > 0; });
        this.particles = this.particles.filter(p => { p.update(dt); return p.life > 0; });
        this.damageNumbers = this.damageNumbers.filter(d => { d.update(dt); return d.alive; });

        this.hud.update(dt, this.combo);

        this.shakeAmount *= 0.9;
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
        const target = this.enemies[0];
        const dx = target.x - this.owlie.x;
        const dy = target.y - this.owlie.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const proj = new Projectile(this.owlie.x + 30, this.owlie.y + 20, dx / dist, dy / dist);
        this.projectiles.push(proj);
    }

    checkCollisions() {
        // Projectile -> Enemy (iterate backwards to avoid splice issues)
        for (let pi = this.projectiles.length - 1; pi >= 0; pi--) {
            const p = this.projectiles[pi];
            for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
                const e = this.enemies[ei];
                const dist = Math.sqrt(Math.pow(p.x - e.x, 2) + Math.pow(p.y - e.y, 2));
                if (dist < 20) {
                    e.health -= p.damage;
                    this.damageNumbers.push(new DamageNumber(e.x, e.y, p.damage, '#ffff33'));
                    this.projectiles.splice(pi, 1);
                    if (e.health <= 0) {
                        this.createExplosion(e.x, e.y, e.color);
                        this.enemies.splice(ei, 1);
                        this.score += 10;
                        this.enemiesKilled++;
                        this.combo++;
                    }
                    break;
                }
            }
        }

        // Enemy -> Owlie
        this.enemies.forEach(e => {
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

        // Draw starfield (shared across all states)
        this._drawStars();

        switch (this.state) {
            case GameState.TITLE:
                this.titleScreen.draw(this.renderer);
                break;

            case GameState.CUTSCENE:
                this.cutsceneManager.draw();
                break;

            case GameState.PLAYING:
            case GameState.WAVE_INTRO:
                this._drawGameplay();
                break;

            case GameState.GAMEOVER:
                this.gameOverScreen.draw(this.renderer);
                break;
        }

        // Transitions always render last
        this.transitionManager.draw(this.renderer.ctx, window.innerWidth, window.innerHeight);
    }

    _drawStars() {
        this.stars.forEach(s => {
            const brightness = s.baseBright + (1 - s.baseBright) * (0.3 + 0.7 * Math.sin(this.gameTime * s.twinkleSpeed + s.twinkleOffset));
            const v = Math.round(brightness * 136);
            const hex = v.toString(16).padStart(2, '0');
            const color = `#${hex}${hex}${hex}`;
            this.renderer.drawText(s.symbol, s.x % this.renderer.cols, s.y, color);
        });
    }

    _drawGameplay() {
        // Apply screenshake
        if (this.shakeAmount > 0) {
            const dx = (Math.random() - 0.5) * this.shakeAmount;
            const dy = (Math.random() - 0.5) * this.shakeAmount;
            this.renderer.ctx.save();
            this.renderer.ctx.translate(dx, dy);
        }

        this.entities.forEach(e => this.renderer.drawEntity(e));
        this.enemies.forEach(e => this.renderer.drawEntity(e));
        this.projectiles.forEach(p => this.renderer.drawEntity(p));
        this.particles.forEach(p => this.renderer.drawEntity(p));
        this.damageNumbers.forEach(d => d.draw(this.renderer));

        // Draw HUD
        if (this.owlie) {
            this.hud.draw(this.renderer, this.owlie.health, this.score, this.wave, this.combo);
        }

        if (this.shakeAmount > 0) {
            this.renderer.ctx.restore();
        }
    }
}
