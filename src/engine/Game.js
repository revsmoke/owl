import { Renderer } from './Renderer.js';
import { Input } from './Input.js';
import { Enemy } from '../entities/Enemy.js';
import { Projectile } from '../entities/Projectile.js';
import { Particle } from '../entities/Particle.js';
import { PowerUp } from '../entities/PowerUp.js';
import { CutsceneManager } from './CutsceneManager.js';
import { TransitionManager } from './TransitionManager.js';
import { WaveManager } from './WaveManager.js';
import { ComboTracker } from './ComboTracker.js';
import { TitleScreen } from '../screens/TitleScreen.js';
import { GameOverScreen } from '../screens/GameOverScreen.js';
import { STORIES } from '../data/cutscenes.js';
import { Owlie } from '../entities/Owlie.js';
import { HUD } from '../ui/HUD.js';
import { DamageNumber } from '../entities/DamageNumber.js';
import { TouchControls } from '../ui/TouchControls.js';

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
        this.powerUps = [];
        this.lastTime = 0;
        this.owlie = null;
        this.shootTimer = 0;
        this.score = 0;
        this.enemiesKilled = 0;
        this.state = GameState.TITLE;
        this.cutsceneManager = new CutsceneManager(this.renderer);
        this.transitionManager = new TransitionManager();
        this.waveManager = new WaveManager();
        this.comboTracker = new ComboTracker();

        // Screens & UI
        this.titleScreen = new TitleScreen();
        this.gameOverScreen = null;
        this.hud = new HUD();
        this.touchControls = new TouchControls();
        this.damageNumbers = [];

        // Wave intro state
        this.waveIntroTimer = 0;
        this.waveIntroDuration = 2.0;
        this.waveAnnounceFade = 0;

        // Between-wave pause
        this.betweenWaveTimer = 0;

        // Power-up effects
        this.rapidFireTimer = 0;
        this.shieldActive = false;

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
        this.powerUps = [];
        this.score = 0;
        this.enemiesKilled = 0;
        this.shootTimer = 0;
        this.shakeAmount = 0;
        this.damageNumbers = [];
        this.rapidFireTimer = 0;
        this.shieldActive = false;
        this.comboTracker.reset();

        const startX = window.innerWidth / 2 - 30;
        const startY = window.innerHeight / 2 - 20;
        this.owlie = new Owlie(startX, startY);
        this.addEntity(this.owlie);

        // Start wave 1 intro
        this.waveManager = new WaveManager();
        this._startWaveIntro(1);
    }

    _startWaveIntro(waveNum) {
        this.state = GameState.WAVE_INTRO;
        this.waveIntroTimer = 0;
        this.waveAnnounceFade = 0;
        this.waveManager.startWave(waveNum);
    }

    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
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
                    });
                }
                break;

            case GameState.WAVE_INTRO:
                this._updateWaveIntro(dt);
                break;

            case GameState.PLAYING:
                this._updatePlaying(dt);
                break;

            case GameState.CUTSCENE:
                this.cutsceneManager.update(dt);
                if (this.input.anyKey) {
                    this.input.clearAnyKey();
                    this.cutsceneManager.skipToEnd();
                }
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
                    });
                }
                break;
        }
    }

    _updateWaveIntro(dt) {
        this.waveIntroTimer += dt;

        // Allow player to move during intro
        const axis = this.input.getAxis();
        this.entities.forEach(e => { if (e.update) e.update(dt, axis); });

        // Fade in/out animation
        if (this.waveIntroTimer < 0.5) {
            this.waveAnnounceFade = this.waveIntroTimer / 0.5;
        } else if (this.waveIntroTimer > this.waveIntroDuration - 0.5) {
            this.waveAnnounceFade = Math.max(0, (this.waveIntroDuration - this.waveIntroTimer) / 0.5);
        } else {
            this.waveAnnounceFade = 1.0;
        }

        if (this.waveIntroTimer >= this.waveIntroDuration) {
            this.state = GameState.PLAYING;
        }
    }

    _updatePlaying(dt) {
        const axis = this.input.getAxis();

        // Wave-based enemy spawning
        const spawnType = this.waveManager.update(dt);
        if (spawnType) {
            this.spawnEnemy(spawnType);
        }

        // Check wave completion
        if (this.waveManager.waveComplete) {
            this.betweenWaveTimer += dt;
            if (this.betweenWaveTimer >= 3.0) {
                this.betweenWaveTimer = 0;
                this._startWaveIntro(this.waveManager.wave + 1);
                return;
            }
        }

        // Shooting logic
        const fireRate = this.rapidFireTimer > 0 ? 0.25 : 0.5;
        this.shootTimer += dt;
        if (this.shootTimer > fireRate && this.enemies.length > 0) {
            this.fireProjectile();
            this.shootTimer = 0;
        }

        // Power-up effect timers
        if (this.rapidFireTimer > 0) this.rapidFireTimer -= dt;

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
        this.powerUps = this.powerUps.filter(p => { p.update(dt); return p.alive; });

        this.comboTracker.update(dt);
        this.hud.update(dt, this.comboTracker.count);

        this.shakeAmount *= 0.9;
        if (this.shakeAmount < 0.1) this.shakeAmount = 0;

        this.checkCollisions();
    }

    spawnEnemy(type = null) {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        if (side === 0) { x = Math.random() * window.innerWidth; y = -20; }
        else if (side === 1) { x = window.innerWidth + 20; y = Math.random() * window.innerHeight; }
        else if (side === 2) { x = Math.random() * window.innerWidth; y = window.innerHeight + 20; }
        else { x = -20; y = Math.random() * window.innerHeight; }

        if (!type) {
            type = Math.random() > 0.3 ? 'cat' : 'hawk';
        }
        const enemy = new Enemy(x, y, type);
        this.enemies.push(enemy);
    }

    fireProjectile() {
        if (this.enemies.length === 0) return;

        // Fire towards nearest enemy
        let nearest = this.enemies[0];
        let nearDist = Infinity;
        for (const e of this.enemies) {
            const d = Math.pow(e.x - this.owlie.x, 2) + Math.pow(e.y - this.owlie.y, 2);
            if (d < nearDist) { nearDist = d; nearest = e; }
        }

        const dx = nearest.x - this.owlie.x;
        const dy = nearest.y - this.owlie.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) return; // Prevent division by zero

        const proj = new Projectile(this.owlie.x + 30, this.owlie.y + 20, dx / dist, dy / dist);
        this.projectiles.push(proj);
    }

    checkCollisions() {
        // Projectile -> Enemy
        for (let pi = this.projectiles.length - 1; pi >= 0; pi--) {
            const p = this.projectiles[pi];
            for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
                const e = this.enemies[ei];
                const hitDist = e.isBoss ? 35 : 20;
                const dist = Math.sqrt(Math.pow(p.x - e.x, 2) + Math.pow(p.y - e.y, 2));
                if (dist < hitDist) {
                    e.health -= p.damage;
                    this.damageNumbers.push(new DamageNumber(e.x, e.y, p.damage, '#ffff33'));
                    this.projectiles.splice(pi, 1);
                    if (e.health <= 0) {
                        this._onEnemyKilled(e, ei);
                    }
                    break;
                }
            }
        }

        // Enemy -> Owlie (break after first hit per frame)
        for (const e of this.enemies) {
            const dist = Math.sqrt(Math.pow(this.owlie.x - e.x, 2) + Math.pow(this.owlie.y - e.y, 2));
            if (dist < 30) {
                if (this.shieldActive) {
                    this.shieldActive = false;
                    this.createExplosion(e.x, e.y, '#3399ff');
                    break;
                }
                if (this.owlie.takeDamage(e.isBoss ? 15 : 5)) {
                    this.shakeAmount = 3;
                    if (this.owlie.health <= 0) {
                        this.triggerDeath();
                    }
                }
                break;
            }
        }

        // PowerUp -> Owlie
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const pu = this.powerUps[i];
            const dist = Math.sqrt(Math.pow(this.owlie.x - pu.x, 2) + Math.pow(this.owlie.y - pu.y, 2));
            if (dist < 30) {
                this._applyPowerUp(pu);
                this.powerUps.splice(i, 1);
            }
        }
    }

    _onEnemyKilled(enemy, index) {
        this.createExplosion(enemy.x, enemy.y, enemy.color, enemy);
        this.enemies.splice(index, 1);
        this.waveManager.onEnemyKilled();
        this.enemiesKilled++;

        const result = this.comboTracker.onKill();
        const points = Math.round(10 * result.multiplier);
        this.score += points;

        if (result.multiplier > 1) {
            this.damageNumbers.push(new DamageNumber(
                enemy.x, enemy.y - 15,
                `${points} x${result.multiplier.toFixed(1)}`,
                '#33ffff'
            ));
        }

        // Milestone flash
        if (result.milestone > 0) {
            this.shakeAmount = 2;
        }

        // Power-up drop
        if (PowerUp.shouldSpawn()) {
            this.powerUps.push(new PowerUp(enemy.x, enemy.y));
        }
    }

    _applyPowerUp(powerUp) {
        this.shakeAmount = 1;

        switch (powerUp.type) {
            case 'heal':
                this.owlie.health = Math.min(100, this.owlie.health + 20);
                break;
            case 'rapid':
                this.rapidFireTimer = 5.0;
                break;
            case 'shield':
                this.shieldActive = true;
                break;
            case 'bomb':
                // Kill all on-screen enemies
                for (let i = this.enemies.length - 1; i >= 0; i--) {
                    const e = this.enemies[i];
                    this.createExplosion(e.x, e.y, e.color);
                    this.enemies.splice(i, 1);
                    this.waveManager.onEnemyKilled();
                    this.enemiesKilled++;
                    this.score += 10;
                }
                this.shakeAmount = 5;
                break;
        }

        // Brief name flash
        this.damageNumbers.push(new DamageNumber(
            this.owlie.x, this.owlie.y - 20,
            powerUp.name,
            powerUp.color
        ));
    }

    triggerDeath() {
        this.state = GameState.CUTSCENE;
        const randomStory = STORIES[Math.floor(Math.random() * STORIES.length)];
        this.cutsceneManager.play(randomStory(this.score));
    }

    createExplosion(x, y, color, entity = null) {
        if (entity) {
            const dissolveParticles = Particle.createDissolve(entity);
            this.particles.push(...dissolveParticles);
        }
        for (let i = 0; i < 6; i++) {
            this.particles.push(new Particle(x, y, color, 'spark'));
        }
        for (let i = 0; i < 4; i++) {
            this.particles.push(new Particle(x, y, color));
        }

        // Cap particles at 200 (in-place trim to avoid allocation churn)
        if (this.particles.length > 200) {
            this.particles.splice(0, this.particles.length - 200);
        }
    }

    draw() {
        this.renderer.clear();
        this._drawStars();

        switch (this.state) {
            case GameState.TITLE:
                this.titleScreen.draw(this.renderer);
                break;

            case GameState.CUTSCENE:
                this.cutsceneManager.draw();
                break;

            case GameState.WAVE_INTRO:
                this._drawGameplay();
                this._drawWaveAnnounce();
                break;

            case GameState.PLAYING:
                this._drawGameplay();
                break;

            case GameState.GAMEOVER:
                this.gameOverScreen.draw(this.renderer);
                break;
        }

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

    _drawWaveAnnounce() {
        const waveNum = this.waveManager.wave;
        const text = `W A V E  ${waveNum}`;
        const boxWidth = text.length + 6;
        const boxHeight = 3;
        const boxX = Math.floor((this.renderer.cols - boxWidth) / 2);
        const boxY = Math.floor(this.renderer.rows / 2) - 2;

        const opacity = this.waveAnnounceFade;
        this.renderer.drawBox(boxX, boxY, boxWidth, boxHeight, '#33ff33', 'double');
        this.renderer.drawTextCentered(text, boxY + 1, '#33ff33', true, opacity);

        if (this.waveManager.isBossWave) {
            this.renderer.drawTextCentered('BOSS WAVE!', boxY + boxHeight, '#ff3333', true, opacity);
        }
    }

    _drawGameplay() {
        if (this.shakeAmount > 0) {
            const dx = (Math.random() - 0.5) * this.shakeAmount;
            const dy = (Math.random() - 0.5) * this.shakeAmount;
            this.renderer.ctx.save();
            this.renderer.ctx.translate(dx, dy);
        }

        this.entities.forEach(e => this.renderer.drawEntity(e));
        this.enemies.forEach(e => {
            this.renderer.drawEntity(e);
            e.drawHealthBar(this.renderer);
        });
        this.projectiles.forEach(p => {
            p.drawTrail(this.renderer);
            this.renderer.drawEntity(p);
        });
        this.particles.forEach(p => this.renderer.drawEntity(p));
        this.powerUps.forEach(p => this.renderer.drawEntity(p));
        this.damageNumbers.forEach(d => d.draw(this.renderer));

        // Shield indicator
        if (this.shieldActive && this.owlie) {
            const charX = Math.round(this.owlie.x / this.renderer.charWidth) - 1;
            const charY = Math.round(this.owlie.y / this.renderer.charHeight) - 1;
            this.renderer.drawText('(O)', charX, charY, '#3399ff', true, 0.5 + 0.5 * Math.sin(this.gameTime * 4));
        }

        // HUD
        if (this.owlie) {
            this.hud.draw(this.renderer, this.owlie.health, this.score, this.waveManager.wave, this.comboTracker.count);
        }

        // Touch controls overlay
        this.touchControls.draw(this.renderer, this.input.getAxis());

        if (this.shakeAmount > 0) {
            this.renderer.ctx.restore();
        }
    }
}
