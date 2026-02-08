import { TypewriterText } from './TypewriterText.js';

/**
 * Manages multiple simultaneous styled text displays.
 */
export class TextOverlay {
    constructor() {
        this.overlays = new Map();
    }

    add(id, config) {
        const overlay = {
            content: config.content || '',
            x: config.x ?? 10,
            y: config.y ?? 10,
            color: config.color || '#ffffff',
            glow: config.glow || false,
            opacity: 1.0,
            bordered: config.bordered || false,
            centered: config.centered || false,
            duration: config.duration ?? Infinity,
            fadeIn: config.fadeIn ?? 0,
            fadeOut: config.fadeOut ?? 0,
            elapsed: 0,
            typewriter: config.typewriter
                ? new TypewriterText(config.content, config.typewriter.speed || 20, config.typewriter.cursor ?? true)
                : null
        };
        this.overlays.set(id, overlay);
    }

    remove(id) {
        this.overlays.delete(id);
    }

    clear() {
        this.overlays.clear();
    }

    update(dt) {
        for (const [id, o] of this.overlays) {
            o.elapsed += dt;

            // Typewriter
            if (o.typewriter) {
                o.typewriter.update(dt);
            }

            // Fade in
            if (o.fadeIn > 0 && o.elapsed < o.fadeIn) {
                o.opacity = o.elapsed / o.fadeIn;
            } else if (o.duration !== Infinity && o.fadeOut > 0) {
                const timeLeft = o.duration - o.elapsed;
                if (timeLeft < o.fadeOut) {
                    o.opacity = Math.max(0, timeLeft / o.fadeOut);
                } else {
                    o.opacity = 1.0;
                }
            } else {
                o.opacity = 1.0;
            }

            // Remove expired
            if (o.duration !== Infinity && o.elapsed >= o.duration) {
                this.overlays.delete(id);
            }
        }
    }

    draw(renderer) {
        for (const [, o] of this.overlays) {
            const text = o.typewriter ? o.typewriter.getVisibleText() : o.content;

            if (o.bordered) {
                const lines = text.split('\n');
                const maxLen = Math.max(...lines.map(l => l.length));
                const boxWidth = maxLen + 4;
                const boxHeight = lines.length + 2;
                const bx = o.centered ? Math.floor((renderer.cols - boxWidth) / 2) : o.x;

                renderer.drawBox(bx, o.y, boxWidth, boxHeight, o.color, 'rounded');
                lines.forEach((line, i) => {
                    renderer.drawText(line, bx + 2, o.y + 1 + i, o.color, o.glow, o.opacity);
                });
            } else if (o.centered) {
                renderer.drawTextCentered(text, o.y, o.color, o.glow, o.opacity);
            } else {
                renderer.drawText(text, o.x, o.y, o.color, o.glow, o.opacity);
            }
        }
    }

    static makeBorderedBox(text) {
        const lines = text.split('\n');
        const maxLen = Math.max(...lines.map(l => l.length));
        const top = '\u256D' + '\u2500'.repeat(maxLen + 2) + '\u256E';
        const bottom = '\u2570' + '\u2500'.repeat(maxLen + 2) + '\u256F';
        const middle = lines.map(l => '\u2502 ' + l.padEnd(maxLen) + ' \u2502');
        return [top, ...middle, bottom].join('\n');
    }
}
