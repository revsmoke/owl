import { ANGEL_OWLIE } from '../data/cutscenes.js';

/**
 * Structured game over display with stats and angel Owlie.
 */
export class GameOverScreen {
    constructor(score, enemiesKilled) {
        this.score = score;
        this.enemiesKilled = enemiesKilled || 0;
        this.highScore = parseInt(localStorage.getItem('aeroOwlieHighScore') || '0', 10);
        this.isNewHighScore = score > this.highScore;
        this.time = 0;

        if (this.isNewHighScore && score > 0) {
            localStorage.setItem('aeroOwlieHighScore', String(score));
            this.highScore = score;
        }
    }

    update(dt) {
        this.time += dt;
    }

    draw(renderer) {
        const centerY = Math.floor(renderer.rows / 2);
        const boxWidth = 28;
        const boxHeight = 10;
        const boxX = Math.floor((renderer.cols - boxWidth) / 2);
        const boxY = centerY - Math.floor(boxHeight / 2);

        // Angel Owlie bobbing above the box
        const angelY = boxY - 5 + Math.sin(this.time * 1.5) * 1;
        renderer.drawTextCentered(ANGEL_OWLIE.trim(), angelY, '#aaddff', true);

        // Double-bordered box
        renderer.drawBox(boxX, boxY, boxWidth, boxHeight, '#ff3333', 'double');

        // "GAME OVER" with red glow
        renderer.drawTextCentered('G A M E   O V E R', boxY + 1, '#ff3333', true);

        // Stats
        const scoreStr = `SCORE: ${String(this.score).padStart(5, '0')}`;
        renderer.drawTextCentered(scoreStr, boxY + 3, '#ffffff');

        const highStr = `HIGH:  ${String(this.highScore).padStart(5, '0')}`;
        renderer.drawTextCentered(highStr, boxY + 4, this.isNewHighScore ? '#ffff33' : '#888888');

        if (this.isNewHighScore) {
            const flashOpacity = 0.5 + 0.5 * Math.sin(this.time * 6);
            renderer.drawTextCentered('NEW HIGH SCORE!', boxY + 5, '#ffff33', true, flashOpacity);
        }

        renderer.drawTextCentered(`ENEMIES: ${this.enemiesKilled}`, boxY + 6, '#aaaaaa');

        // Pulsing restart
        const pulseOpacity = 0.4 + 0.6 * Math.abs(Math.sin(this.time * 3));
        renderer.drawTextCentered('TAP TO RESTART', boxY + boxHeight + 1, '#33ff33', false, pulseOpacity);
    }
}
