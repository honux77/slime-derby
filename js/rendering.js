/* =========================================================
   SLIME DERBY - Rendering System
   ========================================================= */

// Crowd appearance data
const CROWD_SKINS = ['#ffdbac','#f1c27d','#e0ac69','#c68642','#8d5524'];
const CROWD_HAIRS = ['#1a1a2e','#4a2810','#8b6914','#d4a030','#a02020','#3060a0','#206030','#e8e0d0'];
const CROWD_OUTFITS = ['#cc2222','#2255cc','#22aa44','#ddaa00','#8833cc','#cc5599','#dd7700','#22bbbb','#ddd','#666'];

// Stadium spectators
function generateSpectators() {
    spectators = [];
    const tTop = HEADER_H + CROWD_H, tBot = CH - CROWD_H;
    const rows = [
        { y: HEADER_H + 2 }, { y: HEADER_H + 12 },
        { y: tBot + 4 }, { y: tBot + 14 },
    ];
    for (const r of rows) {
        for (let x = TRACK_L - 8; x < CW - 6; x += 7 + Math.random() * 5) {
            spectators.push({
                x: Math.round(x), y: r.y,
                skin: pick(CROWD_SKINS), hair: pick(CROWD_HAIRS),
                outfit: pick(CROWD_OUTFITS),
                phase: Math.random() * Math.PI * 2,
                spd: 0.035 + Math.random() * 0.025,
            });
        }
    }
}

// Render stadium background
function renderStadium() {
    const w = CW, h = CH;
    const tTop = HEADER_H + CROWD_H, tBot = h - CROWD_H;

    // Sky
    ctx.fillStyle = '#0d1b2a';
    ctx.fillRect(0, 0, w, h);

    // Grass bands
    ctx.fillStyle = '#1a3a12';
    ctx.fillRect(0, HEADER_H, w, CROWD_H);
    ctx.fillRect(0, tBot, w, CROWD_H);
    ctx.fillStyle = '#163010';
    for (let gx = 0; gx < w; gx += 14) {
        ctx.fillRect(gx, HEADER_H, 5, CROWD_H);
        ctx.fillRect(gx + 7, tBot, 5, CROWD_H);
    }

    // Bleacher tiers
    ctx.fillStyle = '#16102a';
    ctx.fillRect(TRACK_L - 12, HEADER_H, w - TRACK_L + 20, 10);
    ctx.fillStyle = '#1c1430';
    ctx.fillRect(TRACK_L - 12, HEADER_H + 10, w - TRACK_L + 20, CROWD_H - 13);
    ctx.fillStyle = '#16102a';
    ctx.fillRect(TRACK_L - 12, tBot + 3, w - TRACK_L + 20, 10);
    ctx.fillStyle = '#1c1430';
    ctx.fillRect(TRACK_L - 12, tBot + 13, w - TRACK_L + 20, CROWD_H - 13);

    // Spectators
    const anim = performance.now() * 0.003;
    for (const s of spectators) {
        const bob = Math.round(Math.sin(s.phase + anim * (1 + s.spd * 12)) * 1.2);
        const x = s.x, y = s.y + bob;
        ctx.fillStyle = s.hair;
        ctx.fillRect(x, y, 4, 2);
        ctx.fillStyle = s.skin;
        ctx.fillRect(x, y + 2, 4, 2);
        ctx.fillStyle = s.outfit;
        ctx.fillRect(x - 1, y + 4, 6, 3);
        // Arms up (cheering)
        if (Math.sin(s.phase * 3 + anim * (1.3 + s.spd * 10)) > 0.6) {
            ctx.fillStyle = s.skin;
            ctx.fillRect(x - 2, y + 3, 2, 2);
            ctx.fillRect(x + 4, y + 3, 2, 2);
        }
    }

    // Fences
    const drawFence = (fy) => {
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(TRACK_L - 8, fy, w - TRACK_L + 16, 2);
        ctx.fillStyle = '#6b5335';
        ctx.fillRect(TRACK_L - 8, fy + 3, w - TRACK_L + 16, 1);
        for (let fx = TRACK_L - 5; fx < w; fx += 26)
            ctx.fillRect(fx, fy - 1, 2, 6);
    };
    drawFence(tTop - 3);
    drawFence(tBot + 1);

    // Track surface
    for (let i = 0; i < players.length; i++) {
        const p = players[i];
        ctx.fillStyle = i % 2 === 0 ? '#2e2015' : '#261a10';
        ctx.fillRect(TRACK_L - 5, p.laneTop, w - TRACK_L + 10, p.laneH);
    }
    // Green edge strips
    ctx.fillStyle = '#1e4215';
    ctx.fillRect(TRACK_L - 5, tTop, w - TRACK_L + 10, 2);
    ctx.fillRect(TRACK_L - 5, tBot - 2, w - TRACK_L + 10, 2);

    // Name panel
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, tTop, TRACK_L - 6, tBot - tTop);
}

// Draw track elements (start/finish lines, lane info)
function drawTrack() {
    const tTop = HEADER_H + CROWD_H, tBot = CH - CROWD_H;
    
    // Lane details (dividers, color bars, names)
    for (let i = 0; i < players.length; i++) {
        const p = players[i];
        ctx.fillStyle = '#4a3820';
        ctx.fillRect(TRACK_L, p.laneTop + p.laneH - 1, CW - TRACK_L, 1);
        ctx.fillStyle = p.color.hex;
        ctx.fillRect(3, p.laneTop + 3, 4, p.laneH - 6);
        const fontSize = Math.min(9, p.laneH * 0.22);
        ctx.font = fontSize + 'px "Press Start 2P"';
        ctx.fillStyle = '#ddd';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${i+1}.${p.name}`, 12, p.y);
    }

    // Start line
    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(TRACK_L, tTop);
    ctx.lineTo(TRACK_L, tBot);
    ctx.stroke();
    ctx.setLineDash([]);

    // Finish line (checkered)
    const csz = Math.max(6, Math.floor(players[0]?.laneH / 5) || 8);
    const flW = csz * 2;
    for (let y = tTop; y < tBot; y += csz) {
        for (let x = 0; x < flW; x += csz) {
            const dark = ((x/csz)+(Math.floor((y-tTop)/csz))) % 2 === 0;
            ctx.fillStyle = dark ? '#222' : '#ddd';
            ctx.fillRect(TRACK_R - flW/2 + x, y,
                Math.min(csz, flW - x), Math.min(csz, tBot - y));
        }
    }
}

// Draw star shape
function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// Draw accessory icon (for dropped items)
function drawAccessoryIcon(type, size) {
    switch(type) {
        case 'ribbon':
            ctx.fillStyle = '#ff69b4';
            ctx.strokeStyle = '#ff1493';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(-size * 0.3, 0, size * 0.3, size * 0.2, -Math.PI / 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(size * 0.3, 0, size * 0.3, size * 0.2, Math.PI / 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
        case 'sunglasses':
            ctx.fillStyle = '#111';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(-size * 0.5, -size * 0.2, size * 0.4, size * 0.4, size * 0.1);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.roundRect(size * 0.1, -size * 0.2, size * 0.4, size * 0.4, size * 0.1);
            ctx.fill();
            ctx.stroke();
            break;
        case 'glasses':
            ctx.strokeStyle = '#333';
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(-size * 0.25, 0, size * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(size * 0.25, 0, size * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 0);
            ctx.stroke();
            break;
        case 'cap':
            ctx.fillStyle = '#e74c3c';
            ctx.strokeStyle = '#c0392b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, -size * 0.2, size * 0.4, Math.PI, 0);
            ctx.lineTo(size * 0.4, 0);
            ctx.lineTo(-size * 0.4, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(0, 0, size * 0.5, size * 0.15, 0, 0, Math.PI);
            ctx.fill();
            ctx.stroke();
            break;
        case 'tophat':
            ctx.fillStyle = '#2c3e50';
            ctx.strokeStyle = '#1a252f';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.rect(-size * 0.25, -size * 0.5, size * 0.5, size * 0.5);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(0, 0, size * 0.4, size * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
    }
}

// Draw accessory on slime
function drawAccessory(accessory, size, rh) {
    if (!accessory) return;
    
    ctx.save();
    
    switch(accessory.type) {
        case 'ribbon':
            ctx.fillStyle = '#ff69b4';
            ctx.strokeStyle = '#ff1493';
            ctx.lineWidth = 1.5;
            const ribbonY = -rh * 1.1;
            const ribbonW = size * 0.35;
            ctx.beginPath();
            ctx.ellipse(-ribbonW * 0.6, ribbonY, ribbonW * 0.5, ribbonW * 0.35, -Math.PI / 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(ribbonW * 0.6, ribbonY, ribbonW * 0.5, ribbonW * 0.35, Math.PI / 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, ribbonY, ribbonW * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
            
        case 'sunglasses':
            ctx.fillStyle = '#111';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            const glassY = -rh * 0.12;
            const glassW = size * 0.18;
            const glassH = size * 0.12;
            const glassOff = size * 0.32;
            ctx.beginPath();
            ctx.roundRect(-glassOff - glassW, glassY - glassH, glassW * 2, glassH * 2, glassH * 0.5);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.roundRect(glassOff - glassW, glassY - glassH, glassW * 2, glassH * 2, glassH * 0.5);
            ctx.fill();
            ctx.stroke();
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-glassOff + glassW, glassY);
            ctx.lineTo(glassOff - glassW, glassY);
            ctx.stroke();
            break;
            
        case 'glasses':
            ctx.strokeStyle = '#333';
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 2;
            const eyeY = -rh * 0.1;
            const eyeOff = size * 0.32;
            const lensR = size * 0.15;
            ctx.beginPath();
            ctx.arc(-eyeOff, eyeY, lensR, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(eyeOff, eyeY, lensR, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-eyeOff + lensR, eyeY);
            ctx.lineTo(eyeOff - lensR, eyeY);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.beginPath();
            ctx.arc(-eyeOff - lensR * 0.3, eyeY - lensR * 0.3, lensR * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeOff - lensR * 0.3, eyeY - lensR * 0.3, lensR * 0.3, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'cap':
            ctx.fillStyle = '#e74c3c';
            ctx.strokeStyle = '#c0392b';
            ctx.lineWidth = 1.5;
            const capY = -rh * 1.05;
            const capW = size * 0.55;
            const capH = size * 0.25;
            ctx.beginPath();
            ctx.arc(0, capY, capW * 0.5, Math.PI, 0);
            ctx.lineTo(capW * 0.5, capY + capH * 0.2);
            ctx.lineTo(-capW * 0.5, capY + capH * 0.2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(0, capY + capH * 0.2, capW * 0.6, capH * 0.4, 0, 0, Math.PI);
            ctx.fill();
            ctx.stroke();
            break;
            
        case 'tophat':
            ctx.fillStyle = '#2c3e50';
            ctx.strokeStyle = '#1a252f';
            ctx.lineWidth = 1.5;
            const hatY = -rh * 1.2;
            const hatW = size * 0.3;
            const hatH = size * 0.35;
            const brimW = size * 0.5;
            ctx.beginPath();
            ctx.ellipse(0, hatY + hatH, brimW * 0.5, brimW * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#34495e';
            ctx.beginPath();
            ctx.rect(-hatW * 0.5, hatY, hatW, hatH);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(0, hatY, hatW * 0.5, hatW * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(-hatW * 0.5, hatY + hatH * 0.7, hatW, hatH * 0.15);
            break;
    }
    
    ctx.restore();
}

// Draw slime character
function drawSlime(x, y, size, sx, sy, color, crown, fx, accessory, hasAccessory) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);

    const rw = size, rh = size * 0.82;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, rh * 0.55, rw * 0.75, rh * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = color.hex;
    ctx.beginPath();
    ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outline
    ctx.strokeStyle = color.dark;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.ellipse(-rw*0.28, -rh*0.32, rw*0.35, rh*0.28, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (effect-dependent)
    const eyeOff = rw * 0.32;
    const eyeY = -rh * 0.08;
    const eww = size * 0.2, ewh = size * 0.26;

    if (fx === 'trip') {
        // X eyes
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        const xs = eww * 0.7;
        ctx.beginPath();
        ctx.moveTo(-eyeOff - xs, eyeY - xs);
        ctx.lineTo(-eyeOff + xs, eyeY + xs);
        ctx.moveTo(-eyeOff - xs, eyeY + xs);
        ctx.lineTo(-eyeOff + xs, eyeY - xs);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(eyeOff - xs, eyeY - xs);
        ctx.lineTo(eyeOff + xs, eyeY + xs);
        ctx.moveTo(eyeOff - xs, eyeY + xs);
        ctx.lineTo(eyeOff + xs, eyeY - xs);
        ctx.stroke();
    } else if (fx === 'sleep') {
        // Closed eyes
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-eyeOff - eww*0.7, eyeY);
        ctx.lineTo(-eyeOff + eww*0.7, eyeY);
        ctx.moveTo(eyeOff - eww*0.7, eyeY);
        ctx.lineTo(eyeOff + eww*0.7, eyeY);
        ctx.stroke();
    } else if (fx === 'boost') {
        // > < eyes (focused expression)
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const ew = eww * 0.8;
        const eh = ewh * 0.6;
        ctx.beginPath();
        ctx.moveTo(-eyeOff - ew, eyeY - eh);
        ctx.lineTo(-eyeOff + ew*0.3, eyeY);
        ctx.lineTo(-eyeOff - ew, eyeY + eh);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(eyeOff + ew, eyeY - eh);
        ctx.lineTo(eyeOff - ew*0.3, eyeY);
        ctx.lineTo(eyeOff + ew, eyeY + eh);
        ctx.stroke();
    } else if (fx === 'awakening') {
        // Glowing golden eyes
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.ellipse(-eyeOff, eyeY, eww * 1.1, ewh * 0.8, -0.2, 0, Math.PI*2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(eyeOff, eyeY, eww * 1.1, ewh * 0.8, 0.2, 0, Math.PI*2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    } else {
        // Normal eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(-eyeOff, eyeY, eww, ewh, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeOff, eyeY, eww, ewh, 0, 0, Math.PI*2);
        ctx.fill();

        // Pupils
        const pp = eww * 0.22;
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(-eyeOff+pp, eyeY, eww*0.52, ewh*0.62, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeOff+pp, eyeY, eww*0.52, ewh*0.62, 0, 0, Math.PI*2);
        ctx.fill();

        // Eye shine
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-eyeOff+pp-eww*0.15, eyeY-ewh*0.25, eww*0.22, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeOff+pp-eww*0.15, eyeY-ewh*0.25, eww*0.22, 0, Math.PI*2);
        ctx.fill();
    }

    // Mouth
    ctx.strokeStyle = color.dark;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, rh*0.2, size*0.15, 0.15, Math.PI-0.15);
    ctx.stroke();

    // Cheeks
    ctx.fillStyle = 'rgba(255,120,120,0.25)';
    ctx.beginPath();
    ctx.ellipse(-eyeOff-eww*0.4, eyeY+ewh*0.7, size*0.12, size*0.07, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(eyeOff+eww*0.4, eyeY+ewh*0.7, size*0.12, size*0.07, 0, 0, Math.PI*2);
    ctx.fill();

    // Crown for winner
    if (crown) {
        const cw = rw * 0.5, cy = -rh - cw * 0.5;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(-cw, cy+cw*0.5);
        ctx.lineTo(-cw, cy);
        ctx.lineTo(-cw*0.4, cy+cw*0.3);
        ctx.lineTo(0, cy-cw*0.15);
        ctx.lineTo(cw*0.4, cy+cw*0.3);
        ctx.lineTo(cw, cy);
        ctx.lineTo(cw, cy+cw*0.5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.arc(0, cy+cw*0.18, cw*0.12, 0, Math.PI*2);
        ctx.fill();
        
        // Victory hands (blinking)
        const blink = Math.floor(performance.now() / 400) % 2 === 0;
        if (blink) {
            ctx.save();
            ctx.fillStyle = '#ffe4b5';
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            const handSize = size * 0.4;
            
            // Left victory hand
            ctx.save();
            ctx.translate(-rw * 1.5, -rh * 0.3);
            ctx.rotate(-Math.PI / 8);
            
            ctx.fillStyle = '#ffe4b5';
            ctx.beginPath();
            ctx.ellipse(0, handSize * 0.3, handSize * 0.3, handSize * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#ffe4b5';
            ctx.beginPath();
            ctx.moveTo(-handSize * 0.15, handSize * 0.1);
            ctx.lineTo(-handSize * 0.25, -handSize * 0.5);
            ctx.lineTo(-handSize * 0.05, -handSize * 0.45);
            ctx.lineTo(0, handSize * 0.15);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0.05 * handSize, handSize * 0.1);
            ctx.lineTo(0.15 * handSize, -handSize * 0.55);
            ctx.lineTo(0.30 * handSize, -handSize * 0.5);
            ctx.lineTo(0.15 * handSize, handSize * 0.15);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.restore();
            
            // Right victory hand (mirrored)
            ctx.save();
            ctx.translate(rw * 1.5, -rh * 0.3);
            ctx.rotate(Math.PI / 8);
            ctx.scale(-1, 1);
            
            ctx.fillStyle = '#ffe4b5';
            ctx.beginPath();
            ctx.ellipse(0, handSize * 0.3, handSize * 0.3, handSize * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#ffe4b5';
            ctx.beginPath();
            ctx.moveTo(-handSize * 0.15, handSize * 0.1);
            ctx.lineTo(-handSize * 0.25, -handSize * 0.5);
            ctx.lineTo(-handSize * 0.05, -handSize * 0.45);
            ctx.lineTo(0, handSize * 0.15);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0.05 * handSize, handSize * 0.1);
            ctx.lineTo(0.15 * handSize, -handSize * 0.55);
            ctx.lineTo(0.30 * handSize, -handSize * 0.5);
            ctx.lineTo(0.15 * handSize, handSize * 0.15);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.restore();
            
            ctx.restore();
        }
    }
    
    // Draw accessory
    if (hasAccessory && accessory) {
        drawAccessory(accessory, size, rh);
    }

    ctx.restore();
}

// Draw NES character
function drawNESChar(x, y, size, sx, sy, charIdx, crown, fx) {
    const img = nesCharImages[charIdx % nesCharImages.length];
    if (!img || img.width === 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.55, size * 0.75, size * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Character image
    const scale = (size * 2) / Math.max(img.width, img.height);
    const w = img.width * scale, h = img.height * scale;
    ctx.drawImage(img, -w / 2, -h + size * 0.3, w, h);

    // Effect overlay on character
    if (crown) {
        // Winner star eyes
        const eyeY = -h * 0.65 + size * 0.3;
        const eyeOff = size * 0.25;
        
        ctx.fillStyle = '#ffdd00';
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        const starSize = size * 0.35;
        
        ctx.save();
        ctx.translate(-eyeOff, eyeY);
        drawStar(0, 0, 5, starSize, starSize * 0.4);
        ctx.restore();
        
        ctx.save();
        ctx.translate(eyeOff, eyeY);
        drawStar(0, 0, 5, starSize, starSize * 0.4);
        ctx.restore();
        
        // Sparkles
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        const sparkles = [
            {x: -eyeOff - starSize*1.2, y: eyeY - starSize*0.8, size: 3},
            {x: -eyeOff + starSize*1.2, y: eyeY - starSize*0.5, size: 2.5},
            {x: eyeOff - starSize*1.2, y: eyeY - starSize*0.8, size: 3},
            {x: eyeOff + starSize*1.2, y: eyeY - starSize*0.5, size: 2.5},
        ];
        for (const sp of sparkles) {
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
    } else if (fx === 'trip') {
        // X eyes overlay
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        const xs = size * 0.15;
        const eyeY = -h * 0.65 + size * 0.3;
        const eyeOff = size * 0.25;
        ctx.beginPath();
        ctx.moveTo(-eyeOff - xs, eyeY - xs);
        ctx.lineTo(-eyeOff + xs, eyeY + xs);
        ctx.moveTo(-eyeOff - xs, eyeY + xs);
        ctx.lineTo(-eyeOff + xs, eyeY - xs);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(eyeOff - xs, eyeY - xs);
        ctx.lineTo(eyeOff + xs, eyeY + xs);
        ctx.moveTo(eyeOff - xs, eyeY + xs);
        ctx.lineTo(eyeOff + xs, eyeY - xs);
        ctx.stroke();
    } else if (fx === 'sleep') {
        // Closed eyes overlay
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        const eyeY = -h * 0.65 + size * 0.3;
        const eyeOff = size * 0.25;
        const eyeW = size * 0.15;
        ctx.beginPath();
        ctx.moveTo(-eyeOff - eyeW, eyeY);
        ctx.lineTo(-eyeOff + eyeW, eyeY);
        ctx.moveTo(eyeOff - eyeW, eyeY);
        ctx.lineTo(eyeOff + eyeW, eyeY);
        ctx.stroke();
    } else if (fx === 'boost') {
        // > < eyes overlay
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const eyeY = -h * 0.65 + size * 0.3;
        const eyeOff = size * 0.25;
        const ew = size * 0.15;
        const eh = size * 0.12;
        ctx.beginPath();
        ctx.moveTo(-eyeOff - ew, eyeY - eh);
        ctx.lineTo(-eyeOff + ew*0.3, eyeY);
        ctx.lineTo(-eyeOff - ew, eyeY + eh);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(eyeOff + ew, eyeY - eh);
        ctx.lineTo(eyeOff - ew*0.3, eyeY);
        ctx.lineTo(eyeOff + ew, eyeY + eh);
        ctx.stroke();
    }

    // Crown
    if (crown) {
        const rw = size, rh = size * 0.82;
        const cw = rw * 0.5, cy = -rh - cw * 0.5 - size * 0.3;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(-cw, cy + cw * 0.5);
        ctx.lineTo(-cw, cy);
        ctx.lineTo(-cw * 0.4, cy + cw * 0.3);
        ctx.lineTo(0, cy - cw * 0.15);
        ctx.lineTo(cw * 0.4, cy + cw * 0.3);
        ctx.lineTo(cw, cy);
        ctx.lineTo(cw, cy + cw * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.arc(0, cy + cw * 0.18, cw * 0.12, 0, Math.PI * 2);
        ctx.fill();
        
        // Victory hands (same as slime)
        const blink = Math.floor(performance.now() / 400) % 2 === 0;
        if (blink) {
            ctx.save();
            ctx.fillStyle = '#ffe4b5';
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            const handSize = size * 0.4;
            
            ctx.save();
            ctx.translate(-rw * 1.5, -rh * 0.3 - size * 0.3);
            ctx.rotate(-Math.PI / 8);
            
            ctx.fillStyle = '#ffe4b5';
            ctx.beginPath();
            ctx.ellipse(0, handSize * 0.3, handSize * 0.3, handSize * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#ffe4b5';
            ctx.beginPath();
            ctx.moveTo(-handSize * 0.15, handSize * 0.1);
            ctx.lineTo(-handSize * 0.25, -handSize * 0.5);
            ctx.lineTo(-handSize * 0.05, -handSize * 0.45);
            ctx.lineTo(0, handSize * 0.15);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0.05 * handSize, handSize * 0.1);
            ctx.lineTo(0.15 * handSize, -handSize * 0.55);
            ctx.lineTo(0.30 * handSize, -handSize * 0.5);
            ctx.lineTo(0.15 * handSize, handSize * 0.15);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.restore();
            
            ctx.save();
            ctx.translate(rw * 1.5, -rh * 0.3 - size * 0.3);
            ctx.rotate(Math.PI / 8);
            ctx.scale(-1, 1);
            
            ctx.fillStyle = '#ffe4b5';
            ctx.beginPath();
            ctx.ellipse(0, handSize * 0.3, handSize * 0.3, handSize * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            ctx.fillStyle = '#ffe4b5';
            ctx.beginPath();
            ctx.moveTo(-handSize * 0.15, handSize * 0.1);
            ctx.lineTo(-handSize * 0.25, -handSize * 0.5);
            ctx.lineTo(-handSize * 0.05, -handSize * 0.45);
            ctx.lineTo(0, handSize * 0.15);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0.05 * handSize, handSize * 0.1);
            ctx.lineTo(0.15 * handSize, -handSize * 0.55);
            ctx.lineTo(0.30 * handSize, -handSize * 0.5);
            ctx.lineTo(0.15 * handSize, handSize * 0.15);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.restore();
            
            ctx.restore();
        }
    }

    ctx.restore();
}
