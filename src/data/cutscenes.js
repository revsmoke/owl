export const ANGEL_OWLIE = `  *  (\\__/)  *
 ( \\ (^ㅅ^) / )
  \\ \\/ \u3000 \u3065/ /`;

const OWLIE_SPRITE = `(\\__/)
(\u2022\u3145\u2022)
/ \u3000 \u3065`;

const DEFEATED_OWLIE = `(\\__/)
(x_x)
/ \u3000 \u3065`;

const DIZZY_OWLIE = `(\\__/)
(@_@)
/ \u3000 \u3065`;

const SLEEPING_OWLIE = `(\\__/)
(-_-)zzz
/ \u3000 \u3065`;

// Helper for centered x
const cx = () => window.innerWidth / 2 - 30;
const cy = () => window.innerHeight / 2;

// 1. Dramatic — shake, flash, flicker, slow typewriter, easeOut ascent
const dramaticDeath = (score) => [
    { type: 'spawn', id: 'owlie', x: cx(), y: cy(), sprite: OWLIE_SPRITE, color: '#ffffff' },
    { type: 'vignette', intensity: 0.6 },
    { type: 'parallel', actions: [
        { type: 'shake', intensity: 8, duration: 1.0 },
        { type: 'flash', color: '#ff0000', duration: 0.5 },
        { type: 'typeText', content: 'The battlefield falls silent...', y: 5, color: '#ff3333', speed: 12, centered: true, duration: 2.0 }
    ], duration: 2.0 },
    { type: 'setSprite', id: 'owlie', sprite: DEFEATED_OWLIE },
    { type: 'wait', duration: 1.0 },
    { type: 'parallel', actions: [
        { type: 'typeText', content: 'A warm light breaks through the darkness.', y: 5, color: '#ffff33', speed: 15, centered: true, duration: 2.5 },
        { type: 'flash', color: '#ffffff', duration: 0.3 }
    ], duration: 2.5 },
    { type: 'setSprite', id: 'owlie', sprite: ANGEL_OWLIE },
    { type: 'parallel', actions: [
        { type: 'move', id: 'owlie', targetX: cx(), targetY: -100, duration: 4.0, easing: 'easeOutCubic' },
        { type: 'typeText', content: 'Owlie ascends to the eternal sky...', y: 8, color: '#33ffff', speed: 10, centered: true, glow: true, duration: 3.0 }
    ], duration: 4.0 },
    { type: 'clearText' },
    { type: 'vignette', intensity: 0 },
    { type: 'typeText', content: `SCORE: ${score}`, y: 12, color: '#33ff33', speed: 20, centered: true, duration: 999 },
    { type: 'end' }
];

// 2. Comedy — fast typewriter, comedic timing, bouncing Owlie
const comedyDeath = (score) => [
    { type: 'spawn', id: 'owlie', x: cx(), y: cy(), sprite: DIZZY_OWLIE, color: '#ffffff' },
    { type: 'typeText', content: 'Owlie: "I should have stayed in bed today."', y: 5, color: '#ffffff', speed: 30, centered: true, duration: 2.0 },
    { type: 'move', id: 'owlie', targetX: 20, targetY: cy(), duration: 0.5, easing: 'easeOutBounce' },
    { type: 'typeText', content: '*BONK*', y: 7, color: '#ff3333', speed: 50, centered: true, duration: 0.8 },
    { type: 'shake', intensity: 3, duration: 0.3 },
    { type: 'move', id: 'owlie', targetX: window.innerWidth - 60, targetY: cy(), duration: 0.5, easing: 'easeOutBounce' },
    { type: 'typeText', content: '*BONK AGAIN*', y: 7, color: '#ff3333', speed: 50, centered: true, duration: 0.8 },
    { type: 'shake', intensity: 3, duration: 0.3 },
    { type: 'move', id: 'owlie', targetX: cx(), targetY: cy(), duration: 0.4, easing: 'easeOutElastic' },
    { type: 'clearText' },
    { type: 'typeText', content: 'Owlie: "Ow. Okay. Fine. I quit."', y: 5, color: '#ffffff', speed: 25, centered: true, duration: 2.0 },
    { type: 'typeText', content: 'Owl Heaven: FREE MICE BUFFET', y: 8, color: '#33ff33', speed: 20, centered: true, glow: true, duration: 2.0 },
    { type: 'setSprite', id: 'owlie', sprite: ANGEL_OWLIE },
    { type: 'move', id: 'owlie', targetX: cx(), targetY: -100, duration: 2.5, easing: 'easeInQuad' },
    { type: 'clearText' },
    { type: 'typeText', content: `RETIRED WITH ${score} POINTS`, y: 12, color: '#33ff33', speed: 20, centered: true, duration: 999 },
    { type: 'end' }
];

// 3. Epic — camera pan, dramatic pause, flash white, rainbow glow, sweeping text
const epicDeath = (score) => [
    { type: 'spawn', id: 'owlie', x: cx(), y: cy(), sprite: OWLIE_SPRITE, color: '#ffffff' },
    { type: 'vignette', intensity: 0.8 },
    { type: 'parallel', actions: [
        { type: 'shake', intensity: 12, duration: 1.5 },
        { type: 'typeText', content: 'THE END DRAWS NEAR...', y: 3, color: '#ff3333', speed: 8, centered: true, glow: true, duration: 2.0 }
    ], duration: 2.0 },
    { type: 'setSprite', id: 'owlie', sprite: DEFEATED_OWLIE },
    { type: 'wait', duration: 1.5 },
    { type: 'parallel', actions: [
        { type: 'flash', color: '#ffffff', duration: 1.0 },
        { type: 'typeText', content: 'BUT LEGENDS NEVER TRULY DIE.', y: 5, color: '#ffff33', speed: 10, centered: true, glow: true, duration: 2.5 }
    ], duration: 2.5 },
    { type: 'setSprite', id: 'owlie', sprite: ANGEL_OWLIE },
    { type: 'parallel', actions: [
        { type: 'move', id: 'owlie', targetX: cx(), targetY: -100, duration: 5.0, easing: 'easeOutCubic' },
        { type: 'typeText', content: 'Owlie joins the stars above...', y: 8, color: '#aaddff', speed: 8, centered: true, glow: true, duration: 4.0 },
        { type: 'fadeActor', id: 'owlie', targetOpacity: 0.3, duration: 5.0 }
    ], duration: 5.0 },
    { type: 'clearText' },
    { type: 'vignette', intensity: 0 },
    { type: 'typeText', content: `LEGENDARY SCORE: ${score}`, y: 12, color: '#ffff33', speed: 15, centered: true, glow: true, duration: 999 },
    { type: 'end' }
];

// 4. Quiet — slow fade, minimal effects, contemplative, gentle float
const quietDeath = (score) => [
    { type: 'spawn', id: 'owlie', x: cx(), y: cy(), sprite: SLEEPING_OWLIE, color: '#ffffff', opacity: 1.0 },
    { type: 'fade', direction: 'out', duration: 1.0, color: '#000022' },
    { type: 'wait', duration: 1.0 },
    { type: 'fade', direction: 'in', duration: 1.0, color: '#000022' },
    { type: 'typeText', content: 'Owlie is tired.', y: 5, color: '#8888aa', speed: 8, centered: true, duration: 3.0 },
    { type: 'typeText', content: 'The night is long and peaceful.', y: 7, color: '#8888aa', speed: 8, centered: true, duration: 3.0 },
    { type: 'setSprite', id: 'owlie', sprite: ANGEL_OWLIE },
    { type: 'parallel', actions: [
        { type: 'move', id: 'owlie', targetX: cx(), targetY: -80, duration: 6.0, easing: 'easeOutQuad' },
        { type: 'fadeActor', id: 'owlie', targetOpacity: 0, duration: 6.0, easing: 'easeInCubic' }
    ], duration: 6.0 },
    { type: 'clearText' },
    { type: 'typeText', content: 'Goodnight, Owlie.', y: 10, color: '#aaaacc', speed: 6, centered: true, duration: 3.0 },
    { type: 'typeText', content: `Score: ${score}`, y: 13, color: '#666688', speed: 15, centered: true, duration: 999 },
    { type: 'end' }
];

// 5. Classic (rewrite of original story 1) — with new actions
const classicDeath = (score) => [
    { type: 'spawn', id: 'owlie', x: cx(), y: cy(), sprite: OWLIE_SPRITE, color: '#ffffff' },
    { type: 'typeText', content: 'Owlie: "Tell my wife... I love... worms."', y: 5, color: '#ffffff', speed: 20, centered: true, duration: 2.5 },
    { type: 'parallel', actions: [
        { type: 'shake', intensity: 2, duration: 0.5 },
        { type: 'typeText', content: 'Wait, owls eat mice, not worms!', y: 7, color: '#ff3333', speed: 25, centered: true, duration: 2.0 }
    ], duration: 2.0 },
    { type: 'setSprite', id: 'owlie', sprite: DIZZY_OWLIE },
    { type: 'typeText', content: 'Embarrassed, Owlie leaves for the sky.', y: 5, color: '#aaaaaa', speed: 18, centered: true, duration: 2.5 },
    { type: 'setSprite', id: 'owlie', sprite: ANGEL_OWLIE },
    { type: 'flash', color: '#ffffff', duration: 0.2 },
    { type: 'move', id: 'owlie', targetX: cx(), targetY: -100, duration: 3.0, easing: 'easeOutCubic' },
    { type: 'clearText' },
    { type: 'typeText', content: `SCORE: ${score}`, y: 12, color: '#33ff33', speed: 20, centered: true, duration: 999 },
    { type: 'end' }
];

// 6. Bedtime (rewrite of original story 2) — with new actions
const bedtimeDeath = (score) => [
    { type: 'spawn', id: 'owlie', x: cx(), y: cy(), sprite: OWLIE_SPRITE, color: '#ffffff' },
    { type: 'typeText', content: 'Owlie: "I should have stayed in bed today."', y: 5, color: '#ffffff', speed: 20, centered: true, duration: 2.5 },
    { type: 'typeText', content: 'Owl Heaven has free mice!', y: 7, color: '#33ff33', speed: 22, centered: true, glow: true, duration: 2.0 },
    { type: 'setSprite', id: 'owlie', sprite: ANGEL_OWLIE },
    { type: 'flash', color: '#33ffff', duration: 0.3 },
    { type: 'parallel', actions: [
        { type: 'move', id: 'owlie', targetX: cx(), targetY: -100, duration: 4.0, easing: 'easeOutQuad' },
        { type: 'typeText', content: 'Off to paradise...', y: 9, color: '#33ffff', speed: 10, centered: true, glow: true, duration: 3.0 }
    ], duration: 4.0 },
    { type: 'clearText' },
    { type: 'typeText', content: `RETIRED WITH ${score} POINTS`, y: 12, color: '#33ff33', speed: 20, centered: true, duration: 999 },
    { type: 'end' }
];

export const STORIES = [
    dramaticDeath,
    comedyDeath,
    epicDeath,
    quietDeath,
    classicDeath,
    bedtimeDeath
];
