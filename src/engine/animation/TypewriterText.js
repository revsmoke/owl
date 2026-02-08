/**
 * Character-by-character text reveal.
 */
export class TypewriterText {
    constructor(fullText, charsPerSecond = 20, showCursor = true, onChar = null) {
        this.fullText = fullText;
        this.speed = charsPerSecond;
        this.showCursor = showCursor;
        this.onChar = onChar;
        this.charIndex = 0;
        this.elapsed = 0;
        this.done = false;
        this.cursorVisible = true;
        this.cursorTimer = 0;
    }

    update(dt) {
        if (this.done) return;

        this.elapsed += dt;
        const targetIndex = Math.floor(this.elapsed * this.speed);
        if (targetIndex > this.charIndex && this.charIndex < this.fullText.length) {
            this.charIndex = Math.min(targetIndex, this.fullText.length);
            if (this.onChar) this.onChar(this.fullText[this.charIndex - 1]);
        }

        if (this.charIndex >= this.fullText.length) {
            this.done = true;
        }

        // Blink cursor
        this.cursorTimer += dt;
        if (this.cursorTimer > 0.5) {
            this.cursorVisible = !this.cursorVisible;
            this.cursorTimer = 0;
        }
    }

    getVisibleText() {
        let text = this.fullText.substring(0, this.charIndex);
        if (this.showCursor && !this.done) {
            text += this.cursorVisible ? '_' : ' ';
        }
        return text;
    }

    skip() {
        this.charIndex = this.fullText.length;
        this.done = true;
    }
}
