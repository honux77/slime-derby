/* =========================================================
   SLIME DERBY - Audio System
   ========================================================= */

// Audio context and music tracks
let audioCtx;
let bgMusic = null;
let victoryMusic = null;

// Initialize audio files
function initMusic() {
    if (!bgMusic) {
        bgMusic = new Audio('mp3/bg.mp3');
        bgMusic.loop = true;
        bgMusic.volume = 0.4;
    }
    if (!victoryMusic) {
        victoryMusic = new Audio('mp3/victory.mp3');
        victoryMusic.loop = false;
        victoryMusic.volume = 0.5;
    }
}

// Play background music
function playBgMusic() {
    initMusic();
    stopAllMusic();
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => console.log('Audio play failed:', e));
}

// Play victory music
function playVictoryMusic() {
    initMusic();
    stopAllMusic();
    victoryMusic.currentTime = 0;
    victoryMusic.play().catch(e => console.log('Audio play failed:', e));
}

// Stop all music tracks
function stopAllMusic() {
    if (bgMusic) bgMusic.pause();
    if (victoryMusic) victoryMusic.pause();
}

// Generate tone with Web Audio API
function tone(freq, dur, type='square', vol=0.06) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = type; o.frequency.value = freq;
        g.gain.value = vol;
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(); o.stop(audioCtx.currentTime + dur);
    } catch(e) {}
}

// Sound effects
function sfxTick() { tone(520, 0.12); }
function sfxGo() { tone(1040, 0.25); }
function sfxCross() { tone(780, 0.08); }
function sfxFanfare() {
    tone(523,.12); setTimeout(()=>tone(659,.12),120);
    setTimeout(()=>tone(784,.12),240); setTimeout(()=>tone(1047,.35),380);
}
function sfxBoost() { 
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sawtooth';
        o.frequency.value = 100;
        o.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.4);
        g.gain.value = 0.15;
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(); o.stop(audioCtx.currentTime + 0.5);
    } catch(e) {}
}
function sfxTrip() { tone(300,.08); setTimeout(()=>tone(180,.15,'sawtooth'),80); }
function sfxSleep() { tone(220,.2,'sine',0.04); }
function sfxAwakening() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
        const now = audioCtx.currentTime;

        // Phase 1: Rising swoosh (슈우우욱) - sawtooth sweep 80Hz → 1200Hz
        const swoosh = audioCtx.createOscillator();
        const swooshGain = audioCtx.createGain();
        swoosh.type = 'sawtooth';
        swoosh.frequency.setValueAtTime(80, now);
        swoosh.frequency.exponentialRampToValueAtTime(1200, now + 0.45);
        swooshGain.gain.setValueAtTime(0.18, now);
        swooshGain.gain.linearRampToValueAtTime(0.25, now + 0.3);
        swooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        swoosh.connect(swooshGain);
        swooshGain.connect(audioCtx.destination);
        swoosh.start(now);
        swoosh.stop(now + 0.55);

        // Phase 2: Impact boom (쾅) - low sine thump
        const boom = audioCtx.createOscillator();
        const boomGain = audioCtx.createGain();
        boom.type = 'sine';
        boom.frequency.setValueAtTime(60, now + 0.4);
        boom.frequency.exponentialRampToValueAtTime(30, now + 0.85);
        boomGain.gain.setValueAtTime(0.001, now);
        boomGain.gain.linearRampToValueAtTime(0.35, now + 0.42);
        boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        boom.connect(boomGain);
        boomGain.connect(audioCtx.destination);
        boom.start(now + 0.38);
        boom.stop(now + 0.9);

        // Phase 3: White noise burst for impact texture
        const bufferSize = audioCtx.sampleRate * 0.3;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const noise = audioCtx.createBufferSource();
        const noiseGain = audioCtx.createGain();
        noise.buffer = noiseBuffer;
        noiseGain.gain.setValueAtTime(0.001, now);
        noiseGain.gain.linearRampToValueAtTime(0.15, now + 0.42);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        noise.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noise.start(now + 0.35);
        noise.stop(now + 0.7);

        // Bonus: high shimmer ring for dramatic flair
        const shimmer = audioCtx.createOscillator();
        const shimmerGain = audioCtx.createGain();
        shimmer.type = 'sine';
        shimmer.frequency.setValueAtTime(1800, now + 0.42);
        shimmer.frequency.exponentialRampToValueAtTime(600, now + 0.9);
        shimmerGain.gain.setValueAtTime(0.001, now);
        shimmerGain.gain.linearRampToValueAtTime(0.08, now + 0.44);
        shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        shimmer.connect(shimmerGain);
        shimmerGain.connect(audioCtx.destination);
        shimmer.start(now + 0.42);
        shimmer.stop(now + 0.9);
    } catch(e) {}
}

// Pre-render NES character sprites
function preRenderNESChars() {
    nesCharImages = [];
    const container = document.createElement('div');
    container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
    document.body.appendChild(container);

    for (const ch of getNESChars()) {
        const el = document.createElement('i');
        el.className = ch.cls;
        container.appendChild(el);

        const style = window.getComputedStyle(el, '::before');
        const shadowStr = style.boxShadow;
        const baseColor = style.color;
        const pixelSize = parseInt(style.width) || 6;

        const pixels = [];
        let maxX = 0, maxY = 0;

        if (shadowStr && shadowStr !== 'none') {
            const parts = [];
            let depth = 0, start = 0;
            for (let i = 0; i < shadowStr.length; i++) {
                if (shadowStr[i] === '(') depth++;
                else if (shadowStr[i] === ')') depth--;
                else if (shadowStr[i] === ',' && depth === 0) {
                    parts.push(shadowStr.substring(start, i).trim());
                    start = i + 1;
                }
            }
            parts.push(shadowStr.substring(start).trim());

            for (const part of parts) {
                const colorMatch = part.match(/^(rgba?\([^)]+\))\s+/);
                let color, rest;
                if (colorMatch) {
                    color = colorMatch[1];
                    rest = part.substring(colorMatch[0].length);
                } else {
                    color = baseColor || '#000';
                    rest = part;
                }
                const nums = rest.match(/-?\d+(\.\d+)?/g);
                if (nums && nums.length >= 2) {
                    const px = parseFloat(nums[0]);
                    const py = parseFloat(nums[1]);
                    pixels.push({ x: px, y: py, color });
                    if (px + pixelSize > maxX) maxX = px + pixelSize;
                    if (py + pixelSize > maxY) maxY = py + pixelSize;
                }
            }
        }

        if (maxX === 0) maxX = pixelSize;
        if (maxY === 0) maxY = pixelSize;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = maxX;
        offCanvas.height = maxY;
        const offCtx = offCanvas.getContext('2d');

        if (baseColor && baseColor !== 'rgba(0, 0, 0, 0)') {
            offCtx.fillStyle = baseColor;
            offCtx.fillRect(0, 0, pixelSize, pixelSize);
        }

        for (const p of pixels) {
            offCtx.fillStyle = p.color;
            offCtx.fillRect(p.x, p.y, pixelSize, pixelSize);
        }

        nesCharImages.push(offCanvas);
    }
    document.body.removeChild(container);
}
