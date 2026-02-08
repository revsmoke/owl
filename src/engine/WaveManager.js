/**
 * Wave-based enemy spawning with escalating difficulty.
 * Wave N: 3 + N*2 enemies, faster spawn intervals, increasing hawk ratio.
 * Every 5th wave = boss wave.
 */
export class WaveManager {
    constructor() {
        this.wave = 1;
        this.enemiesRemaining = 0;
        this.enemiesSpawned = 0;
        this.spawnTimer = 0;
        this.betweenWaveTimer = 0;
        this.waveActive = false;
        this.waveAnnounceDone = false;
    }

    get totalForWave() {
        return 3 + this.wave * 2;
    }

    get spawnInterval() {
        return Math.max(0.5, 2.0 - this.wave * 0.15);
    }

    get hawkRatio() {
        return Math.min(0.7, 0.2 + this.wave * 0.05);
    }

    get isBossWave() {
        return this.wave % 5 === 0;
    }

    get waveComplete() {
        return this.waveActive && this.enemiesSpawned >= this.totalForWave && this.enemiesRemaining <= 0;
    }

    startWave(waveNumber) {
        this.wave = waveNumber;
        this.enemiesSpawned = 0;
        this.enemiesRemaining = this.totalForWave;
        this.spawnTimer = 0;
        this.waveActive = true;
        this.waveAnnounceDone = false;
        this.betweenWaveTimer = 0;
    }

    /**
     * Returns enemy type to spawn, or null if not time yet.
     */
    update(dt) {
        if (!this.waveActive) return null;
        if (this.enemiesSpawned >= this.totalForWave) return null;

        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.enemiesSpawned++;

            // Boss spawns at the end of boss waves
            if (this.isBossWave && this.enemiesSpawned === this.totalForWave) {
                return 'boss';
            }

            return Math.random() < this.hawkRatio ? 'hawk' : 'cat';
        }

        return null;
    }

    onEnemyKilled() {
        this.enemiesRemaining--;
    }

    nextWave() {
        this.wave++;
        this.startWave(this.wave);
    }
}
