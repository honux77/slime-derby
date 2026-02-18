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
