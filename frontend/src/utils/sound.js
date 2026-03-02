

let ctx = null;

function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

function playTone({ freq = 440, type = 'sine', duration = 0.12, gain = 0.18, attack = 0.01, decay = 0.08, pitchEnd = null }) {
    try {
        const ac = getCtx();
        const osc = ac.createOscillator();
        const gainNode = ac.createGain();

        osc.connect(gainNode);
        gainNode.connect(ac.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ac.currentTime);
        if (pitchEnd) osc.frequency.linearRampToValueAtTime(pitchEnd, ac.currentTime + duration);

        gainNode.gain.setValueAtTime(0, ac.currentTime);
        gainNode.gain.linearRampToValueAtTime(gain, ac.currentTime + attack);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + duration + 0.02);
    } catch { }
}

export const sounds = {

    tick: () => playTone({ freq: 1200, type: 'sine', duration: 0.04, gain: 0.06 }),

    click: () => {
        playTone({ freq: 880, type: 'square', duration: 0.05, gain: 0.12, attack: 0.005 });
        setTimeout(() => playTone({ freq: 1200, type: 'sine', duration: 0.07, gain: 0.08 }), 30);
    },

    startup: () => {
        [440, 550, 660, 880].forEach((f, i) =>
            setTimeout(() => playTone({ freq: f, type: 'sine', duration: 0.18, gain: 0.14 }), i * 80)
        );
    },

    type: () => playTone({ freq: 900, type: 'sine', duration: 0.03, gain: 0.04 }),

    error: () => {
        playTone({ freq: 300, type: 'square', duration: 0.15, gain: 0.2, pitchEnd: 180 });
        setTimeout(() => playTone({ freq: 200, type: 'square', duration: 0.2, gain: 0.18, pitchEnd: 120 }), 140);
    },

    success: () => {
        [523, 659, 784, 1046].forEach((f, i) =>
            setTimeout(() => playTone({ freq: f, type: 'sine', duration: 0.22, gain: 0.15 }), i * 70)
        );
    },

    launch: () => {
        playTone({ freq: 440, type: 'sawtooth', duration: 0.08, gain: 0.15, pitchEnd: 880 });
        setTimeout(() => playTone({ freq: 880, type: 'sine', duration: 0.3, gain: 0.18, pitchEnd: 1320 }), 70);
        setTimeout(() => playTone({ freq: 1320, type: 'sine', duration: 0.25, gain: 0.12 }), 200);
    },

    notify: () => {
        playTone({ freq: 740, type: 'sine', duration: 0.1, gain: 0.12 });
        setTimeout(() => playTone({ freq: 988, type: 'sine', duration: 0.15, gain: 0.1 }), 90);
    },

    scan: () => {
        for (let i = 0; i < 6; i++) {
            setTimeout(() => playTone({ freq: 600 + i * 80, type: 'square', duration: 0.06, gain: 0.06 }), i * 100);
        }
    },

    whoosh: () => playTone({ freq: 200, type: 'sine', duration: 0.25, gain: 0.1, pitchEnd: 800 }),

    arcOnline: () => {
        [200, 300, 500, 700, 1000].forEach((f, i) =>
            setTimeout(() => playTone({ freq: f, type: 'sine', duration: 0.15, gain: 0.1 + i * 0.01 }), i * 50)
        );
    },
};

export default sounds;
