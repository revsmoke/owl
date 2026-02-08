const TITLE_ART = `
  _   ___ ___ ___    _____      ___    ___ ___
 /_\\ | __| _ \\/ _ \\  / _ \\ \\    / / |  |_ _| __|
/ _ \\| _||   / (_) || (_) \\ \\/\\/ /| |__ | || _|
/_/ \\_\\___|_|_\\\\___/  \\___/ \\_/\\_/ |____|___|___|
`.trimStart();

const OWLIE_SPRITE = `(\\__/)
(^ㅅ^)
/ \u3000 \u3065`;

/**
 * Animated title screen with bobbing Owlie and pulsing "TAP TO START".
 */
export class TitleScreen {
    constructor() {
        this.time = 0;
        this.highScore = parseInt(localStorage.getItem('aeroOwlieHighScore') || '0', 10);
    }

    update(dt) {
        this.time += dt;
    }

    draw(renderer) {
        // Title art centered in upper third
        const titleLines = TITLE_ART.split('\n');
        const titleY = Math.floor(renderer.rows * 0.12);
        titleLines.forEach((line, i) => {
            const x = Math.floor((renderer.cols - line.length) / 2);
            renderer.drawText(line, x, titleY + i, '#33ff33', true);
        });

        // Bobbing Owlie sprite
        const owlieY = Math.floor(renderer.rows * 0.4) + Math.sin(this.time * 2) * 2;
        renderer.drawTextCentered(OWLIE_SPRITE, Math.floor(owlieY), '#ffffff', true);

        // Pulsing "TAP TO START"
        const pulseOpacity = 0.4 + 0.6 * Math.abs(Math.sin(this.time * 3));
        renderer.drawTextCentered('TAP TO START', Math.floor(renderer.rows * 0.65), '#33ff33', false, pulseOpacity);

        // High score
        if (this.highScore > 0) {
            renderer.drawTextCentered(`HIGH SCORE: ${this.highScore}`, Math.floor(renderer.rows * 0.72), '#ffff33');
        }

        // Credits at bottom
        renderer.drawTextCentered('ASCII ACTION', Math.floor(renderer.rows * 0.85), '#555555');
    }
}
