/**
 * Visual joystick guide for mobile. Shows directional arrows
 * in the bottom area with the active direction highlighted.
 * Visual-only — actual input stays in Input.js.
 */
export class TouchControls {
    constructor() {
        this.isMobile = 'ontouchstart' in window;
    }

    draw(renderer, axis) {
        if (!this.isMobile) return;

        const centerX = Math.floor(renderer.cols / 2);
        const baseY = renderer.rows - 5;

        // Arrow characters with highlight based on input
        const upColor = axis.y < -0.3 ? '#33ff33' : '#333333';
        const downColor = axis.y > 0.3 ? '#33ff33' : '#333333';
        const leftColor = axis.x < -0.3 ? '#33ff33' : '#333333';
        const rightColor = axis.x > 0.3 ? '#33ff33' : '#333333';
        const centerColor = '#444444';

        renderer.drawText('^', centerX, baseY, upColor, axis.y < -0.3);
        renderer.drawText('<', centerX - 2, baseY + 1, leftColor, axis.x < -0.3);
        renderer.drawText('o', centerX, baseY + 1, centerColor);
        renderer.drawText('>', centerX + 2, baseY + 1, rightColor, axis.x > 0.3);
        renderer.drawText('v', centerX, baseY + 2, downColor, axis.y > 0.3);
    }
}
