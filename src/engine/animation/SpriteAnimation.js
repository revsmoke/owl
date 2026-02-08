/**
 * Frame-by-frame ASCII animation player.
 */
export class SpriteAnimation {
    constructor(frames, fps = 8, loop = true, onEnd = null) {
        this.frames = frames;
        this.fps = fps;
        this.loop = loop;
        this.onEnd = onEnd;
        this.frameIndex = 0;
        this.elapsed = 0;
        this.done = false;
    }

    update(dt) {
        if (this.done) return;

        this.elapsed += dt;
        const frameDuration = 1 / this.fps;

        if (this.elapsed >= frameDuration) {
            this.elapsed -= frameDuration;
            this.frameIndex++;

            if (this.frameIndex >= this.frames.length) {
                if (this.loop) {
                    this.frameIndex = 0;
                } else {
                    this.frameIndex = this.frames.length - 1;
                    this.done = true;
                    if (this.onEnd) this.onEnd();
                }
            }
        }
    }

    getCurrentFrame() {
        return this.frames[this.frameIndex];
    }
}
