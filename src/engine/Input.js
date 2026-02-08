export class Input {
    constructor() {
        this.touches = {};
        this.joystick = { x: 0, y: 0, active: false };
        this.keys = {};
        this.anyKey = false;

        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            this.anyKey = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            // anyKey stays true until cleared manually if we want "hit any key" behavior
        });

        window.addEventListener('touchstart', (e) => this.handleTouch(e), { passive: false });
        window.addEventListener('touchmove', (e) => this.handleTouch(e), { passive: false });
        window.addEventListener('touchend', (e) => this.handleTouch(e));
    }

    handleTouch(e) {
        this.anyKey = true; // Any touch triggers "any key" behavior
        if (e.type === 'touchstart' || e.type === 'touchmove') {
            const touch = e.touches[0];
            this.joystick.active = true;

            // Simple virtual joystick logic: center of screen is neutral
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            this.joystick.x = (touch.clientX - centerX) / (window.innerWidth / 4);
            this.joystick.y = (touch.clientY - centerY) / (window.innerHeight / 4);

            // Clamp
            this.joystick.x = Math.max(-1, Math.min(1, this.joystick.x));
            this.joystick.y = Math.max(-1, Math.min(1, this.joystick.y));

            e.preventDefault();
        } else {
            this.joystick.active = false;
            this.joystick.x = 0;
            this.joystick.y = 0;
        }
    }

    clearAnyKey() {
        this.anyKey = false;
    }

    getAxis() {
        let x = 0;
        let y = 0;

        if (this.keys['ArrowLeft'] || this.keys['a']) x -= 1;
        if (this.keys['ArrowRight'] || this.keys['d']) x += 1;
        if (this.keys['ArrowUp'] || this.keys['w']) y -= 1;
        if (this.keys['ArrowDown'] || this.keys['s']) y += 1;

        if (this.joystick.active) {
            x = this.joystick.x;
            y = this.joystick.y;
        }

        return { x, y };
    }
}
