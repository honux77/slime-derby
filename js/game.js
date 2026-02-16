/* =========================================================
   SLIME DERBY - Game Logic
   ========================================================= */

// Utility functions
function pick(a) { return a[Math.floor(Math.random()*a.length)]; }

function pickRandom(total, k) {
    const set = new Set();
    while (set.size < k) set.add(Math.floor(Math.random() * total) + 1);
    return [...set].sort((a, b) => a - b);
}

// Player factory
function makePlayer(name, colorIdx) {
    const accessory = ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)];
    return {
        name, color: SLIME_COLORS[colorIdx % SLIME_COLORS.length],
        pos: 0, speed: 0,
        mult: 0.8 + Math.random() * 0.4,
        talent: 0.92 + Math.random() * 0.16,
        changeTimer: 20 + Math.floor(Math.random() * 40),
        nextChange: 0,
        finished: false, finishTime: 0, rank: -1, dnf: false,
        hopT: Math.random(), hopSpd: 0, wasAir: false,
        fx: null, fxTimer: 0, fxCooldown: 0,
        y: 0, laneTop: 0, laneH: 0,
        accessory: accessory,
        hasAccessory: accessory !== null,
        boostCount: 0, tripCount: 0, sleepCount: 0,
    };
}

// Start race sequence
function startRace() {
    playerCount = Math.max(2, Math.min(1000,
        parseInt(document.getElementById('player-count').value) || 4));
    document.getElementById('player-count').value = playerCount;
    racePlayerCount = Math.max(2, Math.min(15, Math.min(playerCount,
        parseInt(document.getElementById('race-count').value) || 4)));
    document.getElementById('race-count').value = racePlayerCount;
    targetTime = Math.max(3, Math.min(60,
        parseInt(document.getElementById('time-input').value) || 10));
    const useNames = document.getElementById('use-names').checked;
    saveSetup();

    const nameMap = {};
    if (useNames) {
        document.querySelectorAll('#player-list input[data-idx]').forEach(inp => {
            const v = inp.value.trim();
            if (v) nameMap[parseInt(inp.dataset.idx)] = v;
        });
    }

    if (playerCount === racePlayerCount) {
        players = [];
        for (let i = 0; i < playerCount; i++) {
            const name = nameMap[i] || `#${i+1}`;
            players.push(makePlayer(name, i));
        }
        beginRace();
    } else {
        const picked = pickRandom(playerCount, racePlayerCount);
        players = [];
        for (let i = 0; i < racePlayerCount; i++) {
            const num = picked[i];
            const name = nameMap[num - 1] || `#${num}`;
            players.push(makePlayer(name, i));
        }
        showDraw(picked);
    }
}

// Begin race after setup
function beginRace() {
    useNESChars = document.getElementById('use-nes-chars').checked;
    if (useNESChars) preRenderNESChars();
    earlyFinish = document.getElementById('early-finish').checked;
    earlyFinishTime = 0;

    canvas = document.getElementById('race-canvas');
    ctx = canvas.getContext('2d');
    canvas.width = CW; canvas.height = CH;
    ctx.imageSmoothingEnabled = false;
    
    isMobile = window.innerWidth <= 768;
    cameraX = 0;
    
    if (isMobile) {
        const scale = 2.0;
        const ratio = window.innerWidth / CW;
        const startPx = TRACK_L * ratio;
        const targetOffset = (window.innerWidth / 3 / scale) - startPx;
        cameraX = Math.min(0, targetOffset);
        canvas.style.transform = `scale(${scale}) translateX(${cameraX}px)`;
        canvas.style.transformOrigin = 'left center';
    } else {
        canvas.style.transform = '';
        canvas.style.transformOrigin = '';
    }

    const raceCount = players.length;
    const trackTop = HEADER_H + CROWD_H;
    const trackBot = CH - CROWD_H;
    const trackH = trackBot - trackTop;
    const laneH = trackH / raceCount;
    for (let i = 0; i < raceCount; i++) {
        players[i].laneTop = trackTop + laneH * i;
        players[i].laneH = laneH;
        players[i].y = trackTop + laneH * i + laneH / 2;
    }
    generateSpectators();

    finishOrder = []; pace = 1; frame = 0; particles = []; droppedAccessories = []; finishSnapshot = null; surgeTriggered = false;
    showScreen('game-screen');

    state = 'countdown'; cdValue = 3;
    playBgMusic();
    sfxTick();
    const countDown = () => {
        cdValue--;
        if (cdValue > 0) { sfxTick(); cdTimer = setTimeout(countDown, 800); }
        else {
            sfxGo(); cdValue = 0;
            cdTimer = setTimeout(() => {
                state = 'racing';
                raceStart = performance.now();
            }, 400);
        }
    };
    cdTimer = setTimeout(countDown, 800);

    if (animId) cancelAnimationFrame(animId);
    loop();
}

// Spawn effect text particle
function spawnFxText(p, text, color) {
    particles.push({
        x: TRACK_L + p.pos, y: p.y - 20,
        vx: 0, vy: -0.6,
        size: 0, life: 50, maxLife: 50,
        color, grav: false, text,
        isEffect: true,
    });
}

// Race update logic
function updateRace() {
    if (state !== 'racing') return;
    frame++;
    const elapsed = (performance.now() - raceStart) / 1000;
    const baseSpd = TRACK_LEN / (targetTime * 60);

    // Awakening event at 50% time
    if (!surgeTriggered && elapsed >= targetTime * 0.5) {
        surgeTriggered = true;
        
        if (Math.random() < 0.25) {
            const sorted = [...players].sort((a, b) => a.pos - b.pos);
            const bottomCount = Math.max(1, Math.floor(players.length * 0.3));
            const underdogs = sorted.slice(0, bottomCount);
            const chosen = underdogs[Math.floor(Math.random() * underdogs.length)];
            chosen.fx = 'awakening';
            chosen.fxTimer = 180;
            chosen.fxCooldown = 9999;
            spawnFxText(chosen, t('awakening'), '#ffd700');
            sfxBoost();
            
            // Crowd goes wild with excitement!
            const crowdCheers = [
                t('awakeningMoment1'), t('awakeningMoment2'), t('awakeningMoment3'), t('awakeningMoment4'),
                t('awakeningMoment5'), t('awakeningMoment6'), t('awakeningMoment7'), t('awakeningMoment8'),
                t('awakeningMoment9'), t('awakeningMoment10'), t('awakeningMoment11'), t('awakeningMoment12'),
                t('awakeningMoment13'), t('awakeningMoment14'), t('awakeningMoment15'), t('awakeningMoment16')
            ];
            
            // Spawn many crowd cheers rapidly
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const text = pick(crowdCheers);
                    const cheerColors = ['#ffd700', '#ffaa00', '#ff8800', '#ffdd00'];
                    particles.push({
                        x: TRACK_L + 40 + Math.random() * (TRACK_LEN - 100),
                        y: CROWD_Y + Math.random() * 30,
                        vx: 0, vy: -1.2,
                        text, size: 12 + Math.random() * 6,
                        life: 80, maxLife: 80,
                        color: pick(cheerColors), grav: false,
                        textSize: true,
                        isSpeechBubble: true
                    });
                }, i * 50); // Rapid succession
            }
        }
    }

    // Pace control
    let minProg = 1;
    for (const p of players) {
        if (!p.finished) minProg = Math.min(minProg, p.pos / TRACK_LEN);
    }
    const expected = Math.min(elapsed / targetTime, 1.0);
    if (minProg > 0.005) {
        const target = expected / minProg;
        pace += (target - pace) * 0.08;
        pace = Math.max(0.15, Math.min(6, pace));
    }

    allDone = true;
    const justFinished = [];

    for (const p of players) {
        if (p.finished) continue;
        allDone = false;

        // Speed variation
        p.nextChange--;
        if (p.nextChange <= 0) {
            p.mult = 0.35 + Math.random() * 1.3;
            p.nextChange = 25 + Math.floor(Math.random() * 80);
        }

        // Special effects
        if (p.fxCooldown > 0) p.fxCooldown--;
        if (p.fxTimer > 0) {
            p.fxTimer--;
            if (p.fxTimer <= 0) p.fx = null;
        }
        
        const prog = p.pos / TRACK_LEN;
        if (!p.fx && p.fxCooldown <= 0 && prog > 0.08 && prog < 0.88) {
            const roll = Math.random();
            if (roll < 0.003) {
                p.fx = 'boost'; p.fxTimer = 55; p.fxCooldown = 120;
                p.boostCount++;
                sfxBoost();
                spawnFxText(p, t('boost'), '#ffdd00');
            } else if (roll < 0.005) {
                p.fx = 'trip'; p.fxTimer = 50; p.fxCooldown = 120;
                p.tripCount++;
                sfxTrip();
                spawnFxText(p, t('trip'), '#ff4444');
                
                if (p.hasAccessory && p.accessory) {
                    const px = TRACK_L + p.pos, py = p.y;
                    particles.push({
                        x: px, y: py - 15,
                        vx: -1 - Math.random() * 2,
                        vy: -3 - Math.random() * 2,
                        size: 0, life: 60, maxLife: 60,
                        color: '#fff', grav: true,
                        accessoryType: p.accessory.type,
                        isAccessory: true
                    });
                    p.hasAccessory = false;
                }
            } else if (roll < 0.007) {
                p.fx = 'sleep'; p.fxTimer = 80; p.fxCooldown = 120;
                p.sleepCount++;
                sfxSleep();
                spawnFxText(p, t('sleep'), '#88aaff');
            }
        }

        // Effect speed modifier
        let fxMult = 1;
        if (p.fx === 'boost') fxMult = 2.0;
        else if (p.fx === 'trip') fxMult = (p.fxTimer > 35) ? 0.0 : (50 - p.fxTimer) / 50;
        else if (p.fx === 'sleep') fxMult = 0.25;
        else if (p.fx === 'awakening') fxMult = 6.3;

        // Effect particles
        const px = TRACK_L + p.pos, py = p.y;
        if (p.fx === 'boost' && frame % 3 === 0) {
            particles.push({ x: px-10, y: py+(Math.random()-0.5)*8,
                vx: -3-Math.random()*3, vy: 0, size: 1.5+Math.random()*2,
                life: 10, maxLife: 10, color: '#ffdd00', grav: false });
        }
        if (p.fx === 'awakening' && frame % 2 === 0) {
            const ang = Math.random() * Math.PI * 2;
            const dist = 10 + Math.random() * 8;
            particles.push({ 
                x: px + Math.cos(ang) * dist, 
                y: py + Math.sin(ang) * dist,
                vx: Math.cos(ang) * 0.5, 
                vy: Math.sin(ang) * 0.5,
                size: 2 + Math.random() * 2, 
                life: 20, 
                maxLife: 20, 
                color: '#ffd700', 
                grav: false 
            });
            particles.push({ 
                x: px - 15, 
                y: py + (Math.random() - 0.5) * 12,
                vx: -4 - Math.random() * 4, 
                vy: 0, 
                size: 2 + Math.random() * 2,
                life: 8, 
                maxLife: 8, 
                color: '#ffaa00', 
                grav: false 
            });
        }
        if (p.fx === 'trip' && p.fxTimer > 30 && frame % 6 === 0) {
            for (let s = 0; s < 2; s++) {
                const ang = Math.random() * Math.PI * 2;
                particles.push({ x: px+Math.cos(ang)*12, y: py-14+Math.sin(ang)*6,
                    vx: Math.cos(ang)*0.3, vy: Math.sin(ang)*0.3,
                    size: 1.5, life: 14, maxLife: 14, color: '#ffff44', grav: false });
            }
        }
        if (p.fx === 'sleep' && frame % 15 === 0) {
            particles.push({ x: px+6, y: py-12,
                vx: 0.3+Math.random()*0.3, vy: -0.6-Math.random()*0.4,
                size: 0, life: 40, maxLife: 40, color: '#88aaff', grav: false, text: 'Z' });
        }

        // Rubber band
        const avg = players.reduce((s,q) => s + q.pos, 0) / players.length / TRACK_LEN;
        const my = p.pos / TRACK_LEN;
        const rubber = 1 + (avg - my) * 0.1;

        const spd = baseSpd * p.mult * p.talent * pace * rubber * fxMult;
        const rawPos = p.pos + spd;
        p.pos = Math.min(rawPos, TRACK_LEN);

        // Hop animation
        if (p.fx === 'boost' || p.fx === 'awakening') {
            p.hopT = 0;
            p.hopSpd = 0;
        } else {
            p.hopSpd = 0.008 + Math.min(0.035, spd * 0.022);
            p.hopT = (p.hopT + p.hopSpd) % 1;
        }
        const isAir = p.hopT >= 0.10 && p.hopT < 0.55;
        const justLanded = p.wasAir && !isAir && p.hopT >= 0.55;
        p.wasAir = isAir;

        // Landing dust
        if (justLanded) {
            for (let d = 0; d < 4; d++) {
                particles.push({
                    x: TRACK_L + p.pos + (Math.random()-0.5)*10,
                    y: p.y + p.laneH * 0.18,
                    vx: (Math.random()-0.5)*2.5, vy: -Math.random()*1.5,
                    size: 2 + Math.random() * 2.5,
                    life: 16, maxLife: 16,
                    color: p.color.light, grav: false,
                });
            }
        }
        if (isAir && frame % 10 === 0) {
            particles.push({
                x: TRACK_L + p.pos - 8,
                y: p.y + p.laneH * 0.15,
                vx: -Math.random() * 1.2, vy: -Math.random() * 0.5,
                size: 1.5 + Math.random() * 1.5,
                life: 14, maxLife: 14,
                color: p.color.light, grav: false,
            });
        }

        // Finish check
        if (p.pos >= TRACK_LEN) {
            p.finished = true;
            p.finishTime = elapsed;
            justFinished.push({ p, over: rawPos - TRACK_LEN });
            if (p.fx !== 'awakening') {
                p.fx = null;
                p.fxTimer = 0;
            }
        }
    }

    // Sort finishers
    justFinished.sort((a, b) => b.over - a.over);
    for (const jf of justFinished) {
        jf.p.rank = finishOrder.length;
        finishOrder.push(jf.p);
        
        if (finishOrder.length === 1 && !finishSnapshot) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    finishSnapshot = canvas.toDataURL('image/png');
                });
            });
            if (earlyFinish) earlyFinishTime = performance.now();
            
            if (jf.p.fx === 'awakening') {
                const awakeningCheers = [
                    t('awakeningCheer1'), t('awakeningCheer2'), t('awakeningCheer3'), 
                    t('awakeningCheer4'), t('awakeningCheer5'), t('awakeningCheer6'),
                    t('awakeningCheer7'), t('awakeningCheer8'), t('awakeningCheer9'),
                    t('awakeningCheer10'), t('awakeningCheer11'), t('awakeningCheer12')
                ];
                for (let i = 0; i < 15; i++) {
                    setTimeout(() => {
                        const text = pick(awakeningCheers);
                        const cheerColors = ['#ffd700','#ffaa00','#ff8800','#ffdd00'];
                        particles.push({
                            x: TRACK_L + 40 + Math.random() * (TRACK_LEN - 100),
                            y: CROWD_Y + Math.random() * 30,
                            vx: 0, vy: -1.2,
                            text, size: 16 + Math.random() * 8,
                            life: 90, maxLife: 90,
                            color: pick(cheerColors), grav: false,
                            textSize: true
                        });
                    }, i * 80);
                }
            }
        }
        
        sfxCross();
        for (let i = 0; i < 20; i++) {
            particles.push({
                x: TRACK_R, y: jf.p.y,
                vx: (Math.random()-0.5)*6, vy: -Math.random()*5-1,
                size: 2+Math.random()*3, life: 50, maxLife: 50,
                color: ['#ffd700','#ff4444','#fff','#58d854',jf.p.color.hex][Math.floor(Math.random()*5)],
                grav: true,
            });
        }
    }

    // Crowd cheering
    if (!allDone) {
        const cheerRate = elapsed / targetTime > 0.7 ? 0.12 : 0.06;
        if (Math.random() < cheerRate) {
            const sortedPlayers = [...players].sort((a, b) => b.pos - a.pos);
            const totalPlayers = players.length;
            
            let rp, cheers;
            const rand = Math.random();
            
            if (finishOrder.length > 0) {
                if (rand < 0.5) {
                    rp = finishOrder[0];
                    cheers = [t('cheerWin1'), t('cheerWin2'), t('cheerWin3'), t('cheerWin4'),
                             t('cheerWin5'), t('cheerWin6'), t('cheerWin7'), t('cheerWin8')];
                } else if (rand < 0.75) {
                    rp = { name: '' };
                    cheers = [t('cheerBet1'), t('cheerBet2'), t('cheerBet3'), t('cheerBet4'), 
                             t('cheerBet5'), t('cheerBet6'), t('cheerBet7'), t('cheerBet8'),
                             t('cheerBet9'), t('cheerBet10'), t('cheerBet11')];
                } else {
                    const remaining = players.filter(p => !p.finished);
                    if (remaining.length > 0) {
                        rp = remaining[Math.floor(Math.random() * remaining.length)];
                        cheers = [t('cheerEnc1'), t('cheerEnc2'), t('cheerEnc3'), t('cheerEnc4'), 
                                 t('cheerEnc5'), t('cheerEnc6')];
                    } else {
                        rp = finishOrder[0];
                        cheers = [t('cheerWin3'), t('cheerWin4')];
                    }
                }
            } else if (elapsed / targetTime < 0.3) {
                rp = players[Math.floor(Math.random() * players.length)];
                cheers = [t('cheerEarly1'), t('cheerEarly2'), t('cheerEarly3'), t('cheerEarly4'), t('cheerEarly5')];
            } else if (elapsed / targetTime > 0.85) {
                rp = sortedPlayers[0];
                cheers = [t('cheerLate1'), t('cheerLate2'), t('cheerLate3'), t('cheerLate4'), 
                         t('cheerLate5'), t('cheerLate6'), t('cheerLate7')];
            } else if (rand < 0.4) {
                const topIndex = Math.floor(Math.random() * Math.ceil(totalPlayers * 0.3));
                rp = sortedPlayers[topIndex];
                cheers = [t('cheerTop1'), t('cheerTop2'), t('cheerTop3'), t('cheerTop4'), 
                         t('cheerTop5'), t('cheerTop6'), t('cheerTop7')];
            } else if (rand < 0.7) {
                const bottomIndex = Math.floor(totalPlayers * 0.7 + Math.random() * Math.ceil(totalPlayers * 0.3));
                rp = sortedPlayers[Math.min(bottomIndex, totalPlayers - 1)];
                cheers = [t('cheerBottom1'), t('cheerBottom2'), t('cheerBottom3'), t('cheerBottom4'), 
                         t('cheerBottom5'), t('cheerBottom6'), t('cheerBottom7'), t('cheerBottom8')];
            } else {
                const midStart = Math.floor(totalPlayers * 0.3);
                const midEnd = Math.floor(totalPlayers * 0.7);
                const midIndex = midStart + Math.floor(Math.random() * (midEnd - midStart + 1));
                rp = sortedPlayers[Math.min(midIndex, totalPlayers - 1)];
                cheers = [t('cheerMid1'), t('cheerMid2'), t('cheerMid3'), t('cheerMid4'), 
                         t('cheerMid5'), t('cheerMid6')];
            }
            
            const cheerColors = ['#c92a2a','#087f5b','#c2255c','#5f3dc4','#1864ab','#0b7285','#2b8a3e','#d9480f'];
            const text = pick(cheers).replace('{n}', rp.name);
            const isTop = Math.random() > 0.5;
            particles.push({
                x: TRACK_L + 40 + Math.random() * (TRACK_LEN - 100),
                y: isTop ? HEADER_H + CROWD_H - 6 : CH - CROWD_H + 6,
                vx: (Math.random() - 0.5) * 0.15,
                vy: isTop ? 0.2 : -0.2,
                size: 0, life: 120, maxLife: 120,
                color: pick(cheerColors), grav: false, text,
                isSpeechBubble: true,
            });
        }
    }

    // Particles update
    for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.life--;
        if (pt.grav) { 
            pt.x += pt.vx; 
            pt.y += pt.vy; 
            pt.vy += 0.12;
            
            if (pt.isAccessory && pt.accessoryType) {
                const groundY = CH - CROWD_H - 10;
                if (pt.y >= groundY) {
                    droppedAccessories.push({
                        x: pt.x,
                        y: groundY,
                        type: pt.accessoryType,
                        rotation: (pt.maxLife - pt.life) * 0.1
                    });
                    particles.splice(i, 1);
                    continue;
                }
            }
        }
        else { pt.x += pt.vx||0; pt.y += pt.vy||0; }
        if (pt.life <= 0) particles.splice(i, 1);
    }

    // Early finish
    if (earlyFinish && earlyFinishTime > 0 && !allDone && state === 'racing') {
        const sinceWin = (performance.now() - earlyFinishTime) / 1000;
        if (sinceWin >= 3) {
            const unfinished = players.filter(p => !p.finished);
            unfinished.sort((a, b) => b.pos - a.pos);
            for (const p of unfinished) {
                p.finished = true;
                p.dnf = true;
                p.finishTime = elapsed;
                p.rank = finishOrder.length;
                finishOrder.push(p);
            }
            allDone = true;
        }
    }

    if (allDone && state === 'racing') {
        state = 'finished';
        sfxFanfare();
        setTimeout(showResults, 2200);
    }
}

// Mobile camera
function updateMobileCamera() {
    if (!isMobile || (state !== 'racing' && state !== 'countdown' && state !== 'finished') || !canvas) return;
    
    let leader = null;
    let maxPos = -1;
    for (const p of players) {
        if (p.pos > maxPos) {
            maxPos = p.pos;
            leader = p;
        }
    }
    
    if (!leader) return;
    
    const scale = 2.0;
    const ratio = window.innerWidth / CW;
    const leaderPx = (TRACK_L + leader.pos) * ratio;
    const targetOffset = (window.innerWidth / 3 / scale) - leaderPx;
    const maxOffset = 0;
    const minOffset = (window.innerWidth / scale) - (TRACK_R * ratio) - 10;
    let clamped = Math.max(minOffset, Math.min(maxOffset, targetOffset));
    
    if (Math.abs(cameraX - clamped) > 1) {
        cameraX += (clamped - cameraX) * 0.15;
    } else {
        cameraX = clamped;
    }
    
    canvas.style.transform = `scale(${scale}) translateX(${cameraX}px)`;
    canvas.style.transformOrigin = 'left center';
}

// Mobile UI context
function getMobileUiContext() {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / CW;
    const scaleY = rect.height / CH;
    const map = (screenX, screenY) => ({
        x: (screenX - rect.left) / scaleX,
        y: (screenY - rect.top) / scaleY,
    });
    return { rect, map };
}

// Hop animation curve
function getHopAnim(t, jumpH) {
    let yOff = 0, sx = 1, sy = 1;
    if (t < 0.10) {
        const p = t / 0.10;
        const ease = p * p;
        sx = 1 + 0.16 * ease;
        sy = 1 - 0.16 * ease;
        yOff = 2 * ease;
    } else if (t < 0.55) {
        const p = (t - 0.10) / 0.45;
        const arc = Math.sin(p * Math.PI);
        yOff = -jumpH * arc + 2 * (1 - p);
        const stretchP = Math.sin(p * Math.PI);
        sx = 1 - 0.14 * stretchP;
        sy = 1 + 0.18 * stretchP;
    } else {
        const p = (t - 0.55) / 0.45;
        const wobble = Math.sin(p * Math.PI * 3.5) * Math.exp(-p * 3.8);
        sx = 1 + wobble * 0.22;
        sy = 1 - wobble * 0.22;
        yOff = Math.abs(wobble) * 1.5;
    }
    return { yOff, sx, sy };
}

// Main render function
function render() {
    const w = CW, h = CH;
    ctx.clearRect(0, 0, w, h);
    const uiCtx = isMobile ? getMobileUiContext() : null;
    
    renderStadium();

    // Header bar
    ctx.fillStyle = '#080818';
    ctx.fillRect(0, 0, w, HEADER_H);
    ctx.fillStyle = '#1a1a3a';
    ctx.fillRect(0, HEADER_H - 1, w, 1);

    // Title
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = '12px "Press Start 2P"';
    ctx.fillStyle = '#58d854';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('SLIME DERBY', 12, 16);
    ctx.restore();

    // Timer
    if (state === 'racing' || state === 'finished') {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        const el = (performance.now() - raceStart) / 1000;
        ctx.font = '11px "Press Start 2P"';
        ctx.fillStyle = '#ffdd00';
        ctx.textAlign = 'right';
        let timeX = CW - 12;
        let timeY = 16;
        if (uiCtx) {
            const pos = uiCtx.map(uiCtx.rect.right - 12, uiCtx.rect.top + 16);
            timeX = pos.x;
            timeY = pos.y;
        }
        ctx.fillText('TIME ' + el.toFixed(1) + 's', timeX, timeY);

        // Ranking bar
        const sorted = [...players].sort((a,b) => b.pos - a.pos);
        ctx.font = '7px "Press Start 2P"';
        ctx.textAlign = 'left';
        let rx = 12;
        for (let i = 0; i < Math.min(sorted.length, 6); i++) {
            ctx.fillStyle = sorted[i].color.hex;
            ctx.fillText(`${i+1}.${sorted[i].name}`, rx, 36);
            rx += ctx.measureText(`${i+1}.${sorted[i].name}`).width + 14;
            if (rx > CW - 60) break;
        }
        
        ctx.restore();
    }

    drawTrack();

    // Particles (behind slimes)
    for (const pt of particles) {
        if (!pt.text) {
            const a = pt.life / pt.maxLife;
            ctx.globalAlpha = a * 0.8;
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI*2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;

    // Dropped accessories
    for (const acc of droppedAccessories) {
        ctx.save();
        ctx.translate(acc.x, acc.y);
        ctx.rotate(acc.rotation);
        drawAccessoryIcon(acc.type, 15);
        ctx.restore();
    }

    // Slimes
    for (let i = 0; i < players.length; i++) {
        const p = players[i];
        const sx = TRACK_L + p.pos;
        const sy = p.y;
        const sz = Math.min(18, p.laneH * 0.32);
        const jumpH = sz * 1.8;
        let bY, sqX, sqY;
        if (p.finished) {
            const idle = Math.sin(performance.now() * 0.004 + i * 2);
            bY = 0;
            sqX = 1 + idle * 0.03;
            sqY = 1 - idle * 0.03;
        } else if (p.fx === 'trip' && p.fxTimer > 30) {
            bY = sz * 0.3;
            sqX = 1.5;
            sqY = 0.4;
        } else {
            const hop = getHopAnim(p.hopT, jumpH);
            bY = hop.yOff;
            sqX = hop.sx;
            sqY = hop.sy;
        }
        
        let drawColor = p.color;
        if (p.fx === 'boost') {
            const flash = Math.sin(frame * 0.5) > 0;
            drawColor = flash ? { hex: '#ffffaa', dark: '#cccc66', light: '#ffffdd' } : p.color;
        } else if (p.fx === 'sleep') {
            drawColor = { hex: p.color.hex + '99', dark: p.color.dark, light: p.color.light };
        } else if (p.fx === 'awakening') {
            drawColor = { hex: '#ffd700', dark: '#ffaa00', light: '#ffee88' };
        }
        const isWinner = finishOrder.length > 0 && finishOrder[0] === p;
        
        // Awakening aura
        if (p.fx === 'awakening') {
            ctx.save();
            const pulseScale = 1 + Math.sin(frame * 0.3) * 0.15;
            const baseSize = sz * 1.5;
            const spikeCount = 12;
            const angleStep = (Math.PI * 2) / spikeCount;
            
            ctx.fillStyle = 'rgba(255, 170, 0, 0.3)';
            ctx.beginPath();
            for (let i = 0; i < spikeCount; i++) {
                const angle = angleStep * i + frame * 0.05;
                const spikeLen = baseSize * (1.5 + Math.sin(angle * 3 + frame * 0.1) * 0.3) * pulseScale;
                const baseLen = baseSize * 0.8;
                
                if (i === 0) {
                    ctx.moveTo(sx + Math.cos(angle - angleStep / 2) * baseLen, 
                              sy + Math.sin(angle - angleStep / 2) * baseLen);
                }
                ctx.lineTo(sx + Math.cos(angle) * spikeLen, 
                          sy + Math.sin(angle) * spikeLen);
                ctx.lineTo(sx + Math.cos(angle + angleStep / 2) * baseLen, 
                          sy + Math.sin(angle + angleStep / 2) * baseLen);
            }
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
            ctx.beginPath();
            for (let i = 0; i < spikeCount; i++) {
                const angle = angleStep * i + angleStep / 2 + frame * 0.05;
                const spikeLen = baseSize * (1.2 + Math.sin(angle * 2 + frame * 0.15) * 0.3) * pulseScale;
                const baseLen = baseSize * 0.6;
                
                if (i === 0) {
                    ctx.moveTo(sx + Math.cos(angle - angleStep / 2) * baseLen, 
                              sy + Math.sin(angle - angleStep / 2) * baseLen);
                }
                ctx.lineTo(sx + Math.cos(angle) * spikeLen, 
                          sy + Math.sin(angle) * spikeLen);
                ctx.lineTo(sx + Math.cos(angle + angleStep / 2) * baseLen, 
                          sy + Math.sin(angle + angleStep / 2) * baseLen);
            }
            ctx.closePath();
            ctx.fill();
            
            const coreGradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, sz * 1.0);
            coreGradient.addColorStop(0, 'rgba(255, 255, 200, 0.4)');
            coreGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
            coreGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(sx, sy, sz * 1.0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        // Manga effects
        if (p.fx === 'boost') {
            ctx.save();
            ctx.strokeStyle = 'rgba(255,221,0,0.5)';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            for (let l = 0; l < 5; l++) {
                const len = 20 + Math.random() * 15;
                const yOff = (Math.random() - 0.5) * sz * 1.5;
                ctx.beginPath();
                ctx.moveTo(sx - sz * 0.6, sy + bY + yOff);
                ctx.lineTo(sx - sz * 0.6 - len, sy + bY + yOff);
                ctx.stroke();
            }
            ctx.restore();
        } else if (p.fx === 'awakening' && !p.finished) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255,215,0,0.7)';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            for (let l = 0; l < 8; l++) {
                const len = 40 + Math.random() * 30;
                const yOff = (Math.random() - 0.5) * sz * 2;
                ctx.beginPath();
                ctx.moveTo(sx - sz * 0.6, sy + bY + yOff);
                ctx.lineTo(sx - sz * 0.6 - len, sy + bY + yOff);
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(255,170,0,0.5)';
            ctx.lineWidth = 2;
            for (let l = 0; l < 5; l++) {
                const len = 30 + Math.random() * 25;
                const yOff = (Math.random() - 0.5) * sz * 2.5;
                ctx.beginPath();
                ctx.moveTo(sx - sz * 0.8, sy + bY + yOff);
                ctx.lineTo(sx - sz * 0.8 - len, sy + bY + yOff);
                ctx.stroke();
            }
            ctx.restore();
        } else if (p.fx === 'trip' && p.fxTimer > 30) {
            ctx.save();
            ctx.fillStyle = '#ffdd00';
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 1.5;
            const angles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
            for (const ang of angles) {
                const dist = sz * 1.2;
                const xx = sx + Math.cos(ang) * dist;
                const yy = sy + bY + Math.sin(ang) * dist * 0.7;
                drawStar(xx, yy, 4, sz * 0.15, sz * 0.06);
            }
            ctx.restore();
        }
        
        if (p.fx === 'sleep') ctx.globalAlpha = 0.55;
        if (useNESChars && i < 8) {
            drawNESChar(sx, sy + bY, sz, sqX, sqY, i, isWinner, p.fx);
        } else {
            drawSlime(sx, sy + bY, sz, sqX, sqY, drawColor, isWinner, p.fx, p.accessory, p.hasAccessory);
        }
        if (p.fx === 'sleep') ctx.globalAlpha = 1;
    }

    // Countdown overlay
    if (state === 'countdown') {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, CW, CH);
        ctx.font = '64px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let cx = CW / 2;
        let cy = CH / 2;
        if (uiCtx) {
            const pos = uiCtx.map(
                uiCtx.rect.left + uiCtx.rect.width / 2 - 40,
                uiCtx.rect.top + uiCtx.rect.height / 2
            );
            cx = pos.x;
            cy = pos.y;
        }
        if (cdValue > 0) {
            ctx.fillStyle = '#ffdd00';
            ctx.fillText(cdValue, cx, cy);
        } else {
            ctx.fillStyle = '#58d854';
            ctx.fillText('GO!', cx, cy);
        }
        
        ctx.restore();
    }

    // Finish overlay
    if (state === 'finished') {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        const pulse = 0.8 + Math.sin(performance.now()/200) * 0.2;
        ctx.globalAlpha = pulse;
        ctx.font = '28px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 16;
        
        // Always use actual canvas center (not mobile camera position)
        const fx = CW / 2;
        const fy = CH / 2;
        
        ctx.fillText('FINISH!', fx, fy);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        
        ctx.restore();
    }

    // Text particles (crowd cheers)
    for (const pt of particles) {
        if (pt.isAccessory && pt.accessoryType) {
            const a = pt.life / pt.maxLife;
            ctx.save();
            ctx.globalAlpha = a * 0.8;
            ctx.translate(pt.x, pt.y);
            ctx.rotate((pt.maxLife - pt.life) * 0.1);
            const accSize = 15;
            drawAccessoryIcon(pt.accessoryType, accSize);
            ctx.restore();
        } else if (pt.text) {
            const a = pt.life / pt.maxLife;
            ctx.globalAlpha = a * 0.9;
            
            let fs;
            if (pt.text === 'Z') {
                fs = 16;
                ctx.font = `bold ${fs}px "Press Start 2P"`;
            } else {
                fs = pt.text.length > 5 ? 9 : pt.text.length > 2 ? 11 : 13;
                ctx.font = `bold ${fs}px "Press Start 2P"`;
            }
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            
            if (pt.isSpeechBubble) {
                const metrics = ctx.measureText(pt.text);
                const textW = metrics.width;
                const textH = fs;
                const padding = 4;
                const bubbleW = textW + padding * 2;
                const bubbleH = textH + padding * 2;
                
                ctx.fillStyle = '#fff';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(pt.x - bubbleW/2, pt.y - bubbleH/2, bubbleW, bubbleH, 3);
                ctx.fill();
                ctx.stroke();
            }
            
            ctx.fillStyle = pt.color;
            ctx.fillText(pt.text, pt.x, pt.y);
        }
    }
    ctx.globalAlpha = 1;

    ctx.textBaseline = 'alphabetic';
}

// ── Easter Egg: Click Slime for Boost ──
function getClickedSlime(clientX, clientY) {
    if (state !== 'racing') return null;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = CW / rect.width;
    const scaleY = CH / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    
    // Check each player
    for (const p of players) {
        if (p.finished || p.dnf) continue;
        
        const slimeX = TRACK_L + p.pos;
        const slimeY = p.y;
        const slimeSize = Math.min(p.laneH * 0.6, 40);
        
        // Check if click is within slime bounds (generous hitbox)
        const dx = x - slimeX;
        const dy = y - slimeY;
        if (Math.abs(dx) < slimeSize * 1.5 && Math.abs(dy) < slimeSize) {
            return p;
        }
    }
    return null;
}

canvas.addEventListener('click', (e) => {
    const clickedSlime = getClickedSlime(e.clientX, e.clientY);
    if (!clickedSlime) return;
    
    // Trigger boost effect!
    if (clickedSlime.fxCooldown <= 0) {
        clickedSlime.fx = 'boost';
        clickedSlime.fxTimer = 120;
        clickedSlime.fxCooldown = 300;
        clickedSlime.boostCount++;
        spawnFxText(clickedSlime, t('boost'), '#00ff00');
        sfxBoost();
    }
});

// Game loop
function loop() {
    updateRace();
    updateMobileCamera();
    render();
    animId = requestAnimationFrame(loop);
}

// Initialize
loadSetup();

// Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
}
