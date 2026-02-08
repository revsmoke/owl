/**
 * State of the Art ASCII Renderer
 * Renders characters to a Canvas using fixed-width font.
 * Supports layers, colors, and smooth sub-pixel movement (snapped to characters).
 */
export class Renderer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.fontFamily = options.fontFamily || "'Fira Code', monospace";

        // Adaptive font sizing — target ~60 columns
        this.fontSize = this._calcFontSize();

        // Measure character dimensions
        this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        const metrics = this.ctx.measureText('M');
        this.charWidth = metrics.width;
        this.charHeight = this.fontSize * 1.2;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    _calcFontSize() {
        const target = Math.floor(window.innerWidth / 60);
        return Math.max(10, Math.min(20, target));
    }

    resize() {
        this.fontSize = this._calcFontSize();
        this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        const metrics = this.ctx.measureText('M');
        this.charWidth = metrics.width;
        this.charHeight = this.fontSize * 1.2;

        this.canvas.width = window.innerWidth * window.devicePixelRatio;
        this.canvas.height = window.innerHeight * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        this.cols = Math.floor(window.innerWidth / this.charWidth);
        this.rows = Math.floor(window.innerHeight / this.charHeight);
    }

    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    }

    /**
     * Draw a string at character coordinates
     */
    drawText(text, x, y, color = '#33ff33', glow = false, opacity = 1.0) {
        this.ctx.save();
        this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = opacity;

        if (glow) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = color;
        }

        const lines = text.split('\n');
        lines.forEach((line, i) => {
            this.ctx.fillText(line, x * this.charWidth, (y + i + 1) * this.charHeight);
        });

        this.ctx.restore();
    }

    /**
     * Draw text centered horizontally. Multi-line: each line centered independently.
     */
    drawTextCentered(text, y, color = '#33ff33', glow = false, opacity = 1.0) {
        const lines = text.split('\n');
        lines.forEach((line, i) => {
            const x = Math.floor((this.cols - line.length) / 2);
            this.drawText(line, x, y + i, color, glow, opacity);
        });
    }

    /**
     * Draw an ASCII box using Unicode box-drawing characters.
     * Styles: 'single', 'double', 'heavy', 'rounded', 'ascii'
     */
    drawBox(x, y, width, height, color = '#33ff33', style = 'single') {
        const chars = {
            single:  { tl: '\u250C', tr: '\u2510', bl: '\u2514', br: '\u2518', h: '\u2500', v: '\u2502' },
            double:  { tl: '\u2554', tr: '\u2557', bl: '\u255A', br: '\u255D', h: '\u2550', v: '\u2551' },
            heavy:   { tl: '\u250F', tr: '\u2513', bl: '\u2517', br: '\u251B', h: '\u2501', v: '\u2503' },
            rounded: { tl: '\u256D', tr: '\u256E', bl: '\u2570', br: '\u256F', h: '\u2500', v: '\u2502' },
            ascii:   { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' }
        };
        const c = chars[style] || chars.single;

        // Top border
        const top = c.tl + c.h.repeat(width - 2) + c.tr;
        this.drawText(top, x, y, color);

        // Side borders
        for (let row = 1; row < height - 1; row++) {
            this.drawText(c.v, x, y + row, color);
            this.drawText(c.v, x + width - 1, y + row, color);
        }

        // Bottom border
        const bottom = c.bl + c.h.repeat(width - 2) + c.br;
        this.drawText(bottom, x, y + height - 1, color);
    }

    /**
     * Draw a box with a centered title in the top border.
     */
    drawBoxWithTitle(x, y, width, height, title, color = '#33ff33', style = 'single') {
        const chars = {
            single:  { tl: '\u250C', tr: '\u2510', bl: '\u2514', br: '\u2518', h: '\u2500', v: '\u2502' },
            double:  { tl: '\u2554', tr: '\u2557', bl: '\u255A', br: '\u255D', h: '\u2550', v: '\u2551' },
            heavy:   { tl: '\u250F', tr: '\u2513', bl: '\u2517', br: '\u251B', h: '\u2501', v: '\u2503' },
            rounded: { tl: '\u256D', tr: '\u256E', bl: '\u2570', br: '\u256F', h: '\u2500', v: '\u2502' },
            ascii:   { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' }
        };
        const c = chars[style] || chars.single;

        // Top border with title
        const titleStr = `[ ${title} ]`;
        const innerWidth = width - 2;
        const titleStart = Math.floor((innerWidth - titleStr.length) / 2);
        const leftPad = c.h.repeat(Math.max(0, titleStart));
        const rightPad = c.h.repeat(Math.max(0, innerWidth - titleStart - titleStr.length));
        const top = c.tl + leftPad + titleStr + rightPad + c.tr;
        this.drawText(top, x, y, color);

        // Side borders
        for (let row = 1; row < height - 1; row++) {
            this.drawText(c.v, x, y + row, color);
            this.drawText(c.v, x + width - 1, y + row, color);
        }

        // Bottom border
        const bottom = c.bl + c.h.repeat(width - 2) + c.br;
        this.drawText(bottom, x, y + height - 1, color);
    }

    /**
     * Draw text where each character cycles through HSL hues.
     */
    drawTextRainbow(text, x, y, hueStart = 0, glow = false) {
        const chars = text.split('');
        chars.forEach((ch, i) => {
            if (ch === ' ') return;
            const hue = (hueStart + i * 25) % 360;
            const color = `hsl(${hue}, 100%, 60%)`;
            this.drawText(ch, x + i, y, color, glow);
        });
    }

    /**
     * Draw text with a shadow offset for pseudo-3D effect.
     */
    drawTextWithShadow(text, x, y, color = '#33ff33', shadowColor = '#003300') {
        this.drawText(text, x + 1, y + 1, shadowColor);
        this.drawText(text, x, y, color);
    }

    /**
     * Render per-character colored text.
     * charArray: [{char, color, opacity}]
     */
    drawColoredChars(charArray, x, y) {
        charArray.forEach((item, i) => {
            if (item.char === ' ') return;
            this.drawText(item.char, x + i, y, item.color, false, item.opacity ?? 1.0);
        });
    }

    /**
     * Draw an entity at pixel coordinates (snapped to nearest character)
     */
    drawEntity(entity) {
        const charX = Math.round(entity.x / this.charWidth);
        const charY = Math.round(entity.y / this.charHeight);
        this.drawText(entity.sprite, charX, charY, entity.color, entity.glow, entity.opacity || 1.0);
    }
}
