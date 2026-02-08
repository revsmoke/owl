/**
 * Heads-up display: health bar, score, combo, wave indicator.
 */
export class HUD {
    constructor() {
        this.comboDisplay = 0;
        this.comboFadeTimer = 0;
        this.comboMaxFade = 2.0;
    }

    update(dt, combo) {
        if (combo > 1) {
            this.comboDisplay = combo;
            this.comboFadeTimer = this.comboMaxFade;
        }
        if (this.comboFadeTimer > 0) {
            this.comboFadeTimer -= dt;
            if (this.comboFadeTimer <= 0) {
                this.comboDisplay = 0;
            }
        }
    }

    draw(renderer, health, score, wave, combo) {
        this._drawHealthBar(renderer, health);
        this._drawScore(renderer, score);
        this._drawWaveIndicator(renderer, wave);
        this._drawCombo(renderer, combo);
    }

    _drawHealthBar(renderer, health) {
        const barLen = 14;
        const filled = Math.round((health / 100) * barLen);
        const empty = barLen - filled;
        const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(empty);
        const pct = `${Math.max(0, Math.ceil(health))}%`;

        let color;
        if (health > 60) color = '#33ff33';
        else if (health > 30) color = '#ffff33';
        else color = '#ff3333';

        renderer.drawText(`HP ${bar} ${pct}`, 1, 1, color);
    }

    _drawScore(renderer, score) {
        const scoreStr = String(score).padStart(5, '0');
        const label = `SCORE: ${scoreStr}`;
        const boxWidth = label.length + 4;
        const boxX = renderer.cols - boxWidth - 1;

        renderer.drawBox(boxX, 0, boxWidth, 3, '#33ff33', 'rounded');
        renderer.drawText(label, boxX + 2, 1, '#33ff33');
    }

    _drawWaveIndicator(renderer, wave) {
        if (wave <= 0) return;
        const text = `WAVE ${wave}`;
        const x = Math.floor((renderer.cols - text.length) / 2);
        renderer.drawText(text, x, 1, '#888888');
    }

    _drawCombo(renderer, combo) {
        const display = combo > 1 ? combo : this.comboDisplay;
        if (display <= 1) return;

        const opacity = this.comboFadeTimer > 0
            ? Math.min(1, this.comboFadeTimer / 0.5)
            : 1.0;

        const text = `x${display} COMBO!`;
        const boxWidth = text.length + 4;
        const boxX = renderer.cols - boxWidth - 1;
        const boxY = 3;

        if (display >= 5) {
            renderer.drawTextRainbow(text, boxX + 2, boxY + 1, 0, true);
        } else {
            const glow = display >= 3;
            renderer.drawText(text, boxX + 2, boxY + 1, '#ffff33', glow, opacity);
        }
    }
}
