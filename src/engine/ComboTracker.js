/**
 * Kill streak tracking with score multiplier.
 * 3s window between kills, multiplier: 1 + (combo-1)*0.5
 */
export class ComboTracker {
    constructor() {
        this.count = 0;
        this.timer = 0;
        this.timeout = 3.0;
        this.milestoneHit = 0; // last milestone triggered
    }

    get multiplier() {
        if (this.count <= 1) return 1;
        return 1 + (this.count - 1) * 0.5;
    }

    get active() {
        return this.count > 1;
    }

    onKill() {
        this.count++;
        this.timer = this.timeout;

        // Check milestones
        const milestones = [5, 10, 20];
        for (const m of milestones) {
            if (this.count === m && this.milestoneHit < m) {
                this.milestoneHit = m;
                return { milestone: m, multiplier: this.multiplier };
            }
        }

        return { milestone: 0, multiplier: this.multiplier };
    }

    update(dt) {
        if (this.count > 0) {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.reset();
            }
        }
    }

    reset() {
        this.count = 0;
        this.timer = 0;
        this.milestoneHit = 0;
    }
}
