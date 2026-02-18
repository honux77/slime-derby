/* =========================================================
   SLIME DERBY - UI Management
   ========================================================= */

// UI state variables
let countRepeatTimer = null;
let countRepeatInterval = null;
let timeRepeatTimer = null;
let timeRepeatInterval = null;

// Screen management
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    
    // Show language button only on title screen
    const langBtn = document.getElementById('lang-btn');
    if (langBtn) {
        langBtn.style.display = id === 'title-screen' ? 'flex' : 'none';
    }
}

function showSetup() {
    state = 'setup';
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    if (cdTimer) { clearTimeout(cdTimer); cdTimer = null; }
    stopAllMusic();
    
    const raceCanvas = document.getElementById('race-canvas');
    if (raceCanvas) {
        raceCanvas.style.transform = '';
        raceCanvas.style.transformOrigin = '';
    }
    
    showScreen('setup-screen');
    buildPlayerInputs();
}

// Draw notice for lottery mode
function updateDrawNotice() {
    const notice = document.getElementById('draw-notice');
    const noticeText = document.getElementById('draw-notice-text');
    if (playerCount > 15) {
        notice.style.display = 'flex';
        if (noticeText) noticeText.textContent = t('drawNotice');
    } else {
        notice.style.display = 'none';
    }
}

// Player count controls
function changeCount(d) {
    playerCount = Math.max(2, Math.min(999, playerCount + d));
    document.getElementById('player-count').value = playerCount;
    updateDrawNotice();
    buildPlayerInputs();
    saveSetup();
    sfxTick();
}

function startCountRepeat(d) {
    changeCount(d);
    countRepeatTimer = setTimeout(() => {
        countRepeatInterval = setInterval(() => changeCount(d), 50);
    }, 500);
}

function stopCountRepeat() {
    if (countRepeatTimer) {
        clearTimeout(countRepeatTimer);
        countRepeatTimer = null;
    }
    if (countRepeatInterval) {
        clearInterval(countRepeatInterval);
        countRepeatInterval = null;
    }
}

function setCountMin() {
    playerCount = 2;
    document.getElementById('player-count').value = playerCount;
    updateDrawNotice();
    buildPlayerInputs();
    saveSetup();
    sfxTick();
}

function setCountMax() {
    playerCount = 999;
    document.getElementById('player-count').value = playerCount;
    updateDrawNotice();
    buildPlayerInputs();
    saveSetup();
    sfxTick();
}

function setCount(val) {
    const n = parseInt(val);
    if (!isNaN(n)) playerCount = Math.max(2, Math.min(999, n));
    updateDrawNotice();
    buildPlayerInputs();
    saveSetup();
}

// Time controls
function changeTime(d) {
    targetTime = Math.max(3, Math.min(60, (parseInt(document.getElementById('time-input').value) || 10) + d));
    document.getElementById('time-input').value = targetTime;
    saveSetup();
    sfxTick();
}

function startTimeRepeat(d) {
    changeTime(d);
    timeRepeatTimer = setTimeout(() => {
        timeRepeatInterval = setInterval(() => changeTime(d), 50);
    }, 500);
}

function stopTimeRepeat() {
    if (timeRepeatTimer) {
        clearTimeout(timeRepeatTimer);
        timeRepeatTimer = null;
    }
    if (timeRepeatInterval) {
        clearInterval(timeRepeatInterval);
        timeRepeatInterval = null;
    }
}

function setTimeMin() {
    targetTime = 3;
    document.getElementById('time-input').value = targetTime;
    saveSetup();
    sfxTick();
}

function setTimeMax() {
    targetTime = 60;
    document.getElementById('time-input').value = targetTime;
    saveSetup();
    sfxTick();
}

function setTime(val) {
    const n = parseInt(val);
    if (!isNaN(n)) targetTime = Math.max(3, Math.min(60, n));
    document.getElementById('time-input').value = targetTime;
    saveSetup();
}

// Build player name inputs
function buildPlayerInputs() {
    const box = document.getElementById('player-list');
    const useNames = document.getElementById('use-names').checked;

    const old = {};
    box.querySelectorAll('input').forEach(inp => {
        if (inp.dataset.idx != null) old[inp.dataset.idx] = inp.value;
    });
    box.innerHTML = '';

    if (!useNames) return;

    const wrap = document.createElement('div');
    if (playerCount > 8) wrap.className = 'name-scroll';
    const count = playerCount;
    for (let i = 0; i < count; i++) {
        const row = document.createElement('div');
        row.className = 'player-row';
        const localNames = getLocalizedDefaultNames();
        const placeholder = i < 8 && playerCount <= 8 ? localNames[i] : `${t('playerPlaceholder')}${i + 1}`;
        const dot = playerCount <= 8
            ? `<div class="color-dot" style="background:${SLIME_COLORS[i].hex}"></div>` : '';
        row.innerHTML = `
            ${dot}
            <span class="player-num">${i+1}.</span>
            <input class="sd-input" type="text" maxlength="8"
                   data-idx="${i}" placeholder="${placeholder}"
                   value="${old[i] !== undefined ? old[i] : ''}"
                   onblur="saveSetup()"
                   onkeydown="if(event.key==='Enter'){event.preventDefault();const next=this.closest('.player-row').nextElementSibling;if(next){next.querySelector('input').focus();}else{document.activeElement.blur();}}">`;
        wrap.appendChild(row);
    }
    box.appendChild(wrap);
}

// Show lottery draw screen
function showDraw(picked) {
    state = 'draw';
    showScreen('select-screen');

    const drawTitle = document.getElementById('draw-title');
    const drawSubtitle = document.getElementById('draw-subtitle');
    const drawStartBtn = document.getElementById('draw-start-btn');

    if (drawTitle) drawTitle.textContent = t('drawTitle');
    if (drawStartBtn) drawStartBtn.textContent = t('startRace');

    if (drawSubtitle) {
        const subtitleText = t('drawSubtitle')
            .replace('{total}', playerCount)
            .replace('{selected}', racePlayerCount);
        drawSubtitle.innerHTML = subtitleText.replace(/(\d+)/g, (match, num) => {
            if (num === String(racePlayerCount)) {
                return `<span style="color:var(--green)">${num}</span>`;
            }
            return num;
        });
    }

    const grid = document.getElementById('draw-grid');
    grid.innerHTML = '';
    for (let i = 0; i < picked.length && i < racePlayerCount; i++) {
        const card = document.createElement('div');
        card.className = 'draw-card';
        const colorIdx = i % SLIME_COLORS.length;
        card.style.borderColor = SLIME_COLORS[colorIdx].hex;
        card.style.animationDelay = (i * 0.12) + 's';
        const label = players[i].name;
        card.innerHTML = `
            <div class="draw-dot" style="background:${SLIME_COLORS[colorIdx].hex}"></div>
            <span>${label}</span>`;
        grid.appendChild(card);
    }
}

// Show results screen
function showResults() {
    state = 'result';
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    
    if (canvas) {
        canvas.style.transform = '';
        canvas.style.transformOrigin = '';
    }
    
    showScreen('result-screen');
    playVictoryMusic();
    updateResultLabels();

    // Update result title
    const resultTitle = document.getElementById('result-title');
    if (resultTitle) resultTitle.textContent = t('resultsTitle');

    const snapshotDiv = document.getElementById('finish-snapshot');
    if (finishSnapshot) {
        snapshotDiv.innerHTML = `<img src="${finishSnapshot}" alt="1st place finish moment">`;
    } else {
        snapshotDiv.innerHTML = '';
    }

    const box = document.getElementById('results-list');
    box.innerHTML = '';
    const ranks = ['1ST','2ND','3RD','4TH','5TH','6TH','7TH','8TH'];
    const rcls = ['g','s','b','','','','',''];

    const displayCount = Math.min(finishOrder.length, 8);
    for (let i = 0; i < displayCount; i++) {
        const p = finishOrder[i];
        const row = document.createElement('div');
        row.className = 'res-row' + (i===0?' w':'');
        
        const stats = [];
        if (p.boostCount > 0) stats.push(`🚀${p.boostCount}`);
        if (p.tripCount > 0) stats.push(`💥${p.tripCount}`);
        if (p.sleepCount > 0) stats.push(`💤${p.sleepCount}`);
        const statsHtml = stats.length > 0 
            ? `<div class="res-stats">${stats.map(s => `<span>${s}</span>`).join('')}</div>` 
            : '';
        
        const timeText = p.dnf ? 'DNF' : `${p.finishTime.toFixed(2)}s`;
        row.innerHTML = `
            <span class="res-rank ${rcls[i]}">${ranks[i]}</span>
            <div class="res-dot" style="background:${p.color.hex}"></div>
            <span class="res-name">${p.name}</span>
            ${statsHtml}
            <span class="res-time">${timeText}</span>`;
        box.appendChild(row);
    }
}

// Download results as image
function downloadResults() {
    const downloadCanvas = document.createElement('canvas');
    const dctx = downloadCanvas.getContext('2d');
    const W = 800, H = 1000;
    downloadCanvas.width = W;
    downloadCanvas.height = H;
    
    dctx.fillStyle = '#0a0a1a';
    dctx.fillRect(0, 0, W, H);
    
    let yPos = 40;
    
    dctx.font = 'bold 32px "Press Start 2P", "DungGeunMo", monospace';
    dctx.textAlign = 'center';
    dctx.fillStyle = '#ffd700';
    dctx.fillText('SLIME DERBY', W/2, yPos);
    dctx.fillStyle = '#58d854';
    dctx.font = 'bold 24px "Press Start 2P", "DungGeunMo", monospace';
    dctx.fillText('FINISH!', W/2, yPos + 45);
    
    yPos += 90;
    
    if (finishSnapshot) {
        const img = new Image();
        img.src = finishSnapshot;
        const snapW = 700, snapH = 420;
        const snapX = (W - snapW) / 2;
        dctx.drawImage(img, snapX, yPos, snapW, snapH);
        
        dctx.strokeStyle = '#ffd700';
        dctx.lineWidth = 4;
        dctx.strokeRect(snapX, yPos, snapW, snapH);
        
        yPos += snapH + 40;
    }
    
    dctx.font = 'bold 20px "Press Start 2P", "DungGeunMo", monospace';
    dctx.fillStyle = '#fff';
    dctx.textAlign = 'left';
    dctx.fillText('RESULTS', 50, yPos);
    yPos += 35;
    
    const ranks = ['1ST','2ND','3RD','4TH','5TH','6TH','7TH','8TH'];
    const rankColors = ['#ffd700','#c0c0c0','#cd7f32','#fff','#fff','#fff','#fff','#fff'];
    
    const displayCount = Math.min(finishOrder.length, 8);
    for (let i = 0; i < displayCount; i++) {
        const p = finishOrder[i];
        const rowH = 50;
        const x = 50;
        
        if (i === 0) {
            dctx.fillStyle = 'rgba(255,215,0,0.1)';
            dctx.fillRect(x, yPos, W - 100, rowH);
            dctx.strokeStyle = '#ffd700';
            dctx.lineWidth = 2;
            dctx.strokeRect(x, yPos, W - 100, rowH);
        } else {
            dctx.fillStyle = '#1a1a3a';
            dctx.fillRect(x, yPos, W - 100, rowH);
            dctx.strokeStyle = '#2a2a4a';
            dctx.lineWidth = 1;
            dctx.strokeRect(x, yPos, W - 100, rowH);
        }
        
        dctx.font = 'bold 16px "Press Start 2P", "DungGeunMo", monospace';
        dctx.fillStyle = rankColors[i];
        dctx.textAlign = 'left';
        dctx.fillText(ranks[i], x + 15, yPos + 30);
        
        dctx.fillStyle = p.color.hex;
        dctx.beginPath();
        dctx.arc(x + 110, yPos + 25, 10, 0, Math.PI * 2);
        dctx.fill();
        
        dctx.font = 'bold 14px "Press Start 2P", "DungGeunMo", monospace';
        dctx.fillStyle = '#fff';
        dctx.fillText(p.name, x + 135, yPos + 30);
        
        const stats = [];
        if (p.boostCount > 0) stats.push(`🚀${p.boostCount}`);
        if (p.tripCount > 0) stats.push(`💥${p.tripCount}`);
        if (p.sleepCount > 0) stats.push(`💤${p.sleepCount}`);
        if (stats.length > 0) {
            dctx.font = '12px "Press Start 2P", "DungGeunMo", monospace';
            dctx.fillStyle = '#888';
            dctx.fillText(stats.join(' '), x + 320, yPos + 30);
        }
        
        dctx.font = 'bold 14px "Press Start 2P", "DungGeunMo", monospace';
        dctx.fillStyle = p.dnf ? '#ff6666' : '#aaa';
        dctx.textAlign = 'right';
        dctx.fillText(p.dnf ? 'DNF' : p.finishTime.toFixed(2) + 's', W - 65, yPos + 30);
        
        yPos += rowH + 10;
    }
    
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0,19).replace(/:/g,'-');
    link.download = `slime-derby-${timestamp}.png`;
    link.href = downloadCanvas.toDataURL('image/png');
    link.click();
}

// LocalStorage management
const LS_KEY = 'slime-derby-setup';

function saveSetup() {
    const names = {};
    document.querySelectorAll('#player-list input[data-idx]').forEach(inp => {
        const v = inp.value.trim();
        if (v) names[inp.dataset.idx] = v;
    });
    const data = {
        count: playerCount,
        useNames: document.getElementById('use-names').checked,
        useNESChars: document.getElementById('use-nes-chars').checked,
        earlyFinish: document.getElementById('early-finish').checked,
        names,
        time: parseInt(document.getElementById('time-input').value) || 10,
    };
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch(e) {}
}

function loadSetup() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) { buildPlayerInputs(); return; }
        const d = JSON.parse(raw);
        if (d.count != null) {
            playerCount = Math.max(2, Math.min(999, d.count));
            document.getElementById('player-count').value = playerCount;
        }
        if (d.useNames) {
            document.getElementById('use-names').checked = true;
        }
        if (d.useNESChars) {
            document.getElementById('use-nes-chars').checked = true;
        }
        if (d.earlyFinish !== undefined) {
            document.getElementById('early-finish').checked = d.earlyFinish;
        }
        if (d.time != null) {
            document.getElementById('time-input').value = Math.max(3, Math.min(60, d.time));
        }
        buildPlayerInputs();
        if (d.names) {
            Object.entries(d.names).forEach(([idx, name]) => {
                const inp = document.querySelector(`#player-list input[data-idx="${idx}"]`);
                if (inp) inp.value = name;
            });
        }
        updateDrawNotice();
    } catch(e) {}
}

function resetSetup() {
    try { localStorage.removeItem(LS_KEY); } catch(e) {}
    playerCount = 45;
    document.getElementById('player-count').value = 45;
    document.getElementById('use-names').checked = false;
    document.getElementById('use-nes-chars').checked = false;
    document.getElementById('early-finish').checked = true;
    document.getElementById('time-input').value = 10;
    updateDrawNotice();
    buildPlayerInputs();
    sfxTick();
}

// Fullscreen management
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

document.addEventListener('fullscreenchange', () => {
    const btn = document.getElementById('fullscreen-btn');
    if (document.fullscreenElement) {
        btn.textContent = '⛶';
        btn.title = t('fullscreenExit');
        adjustCanvasForFullscreen(true);
    } else {
        btn.textContent = '⛶';
        btn.title = t('fullscreenToggle');
        adjustCanvasForFullscreen(false);
    }
});

function adjustCanvasForFullscreen(isFullscreen) {
    const raceCanvas = document.getElementById('race-canvas');
    if (!raceCanvas) return;
    
    if (isFullscreen) {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const canvasAspect = CW / CH;
        const screenAspect = screenW / screenH;
        
        let scale;
        if (screenAspect > canvasAspect) {
            scale = screenH / CH;
        } else {
            scale = screenW / CW;
        }
        
        raceCanvas.style.width = `${CW * scale}px`;
        raceCanvas.style.height = `${CH * scale}px`;
        
        if (isMobile) {
            raceCanvas.style.transform = '';
            raceCanvas.style.transformOrigin = '';
        }
    } else {
        raceCanvas.style.width = '';
        raceCanvas.style.height = '';
        
        if (isMobile && (state === 'racing' || state === 'countdown' || state === 'finished')) {
            const scale = 2.0;
            raceCanvas.style.transform = `scale(${scale}) translateX(${cameraX}px)`;
            raceCanvas.style.transformOrigin = 'left center';
        }
    }
}

// ── Language Toggle ──
function toggleLanguage() {
    const newLang = currentLang === 'ko' ? 'en' : 'ko';
    setLanguage(newLang);
    
    // Update language button text (opposite of current language)
    const langText = document.getElementById('lang-text');
    if (langText) {
        langText.textContent = newLang === 'ko' ? 'EN' : 'KO';
    }

    // Update subtitle
    const subtitle = document.getElementById('subtitle-text');
    if (subtitle) {
        subtitle.textContent = t('subtitle');
    }

    // Update start button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.textContent = t('start');
    }

    // Update setup screen labels
    updateSetupLabels();

    // Update fullscreen button tooltip
    const fsBtn = document.getElementById('fullscreen-btn');
    if (fsBtn) {
        fsBtn.title = document.fullscreenElement ? t('fullscreenExit') : t('fullscreenToggle');
    }

    // Update language button tooltip
    const langBtn = document.getElementById('lang-btn');
    if (langBtn) {
        langBtn.title = t('langChange');
    }

    // Update draw notice
    updateDrawNotice();

    // Update result screen text
    updateResultLabels();

    // Rebuild player inputs to update placeholders
    buildPlayerInputs();
}

function updateSetupLabels() {
    const elements = {
        'setup-title': 'setupTitle',
        'label-total-players': 'totalPlayers',
        'label-race-time': 'raceTime',
        'label-use-names': 'useNames',
        'label-early-finish': 'earlyFinishMode',
        'btn-min-1': 'min',
        'btn-max-1': 'max',
        'btn-min-3': 'min',
        'btn-max-3': 'max',
        'btn-reset': 'reset',
        'btn-start-race': 'startGame',
    };
    
    for (const [id, key] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.textContent = t(key);
    }
}

function updateResultLabels() {
    const enjoyText = document.getElementById('result-enjoy-text');
    if (enjoyText) enjoyText.textContent = t('enjoyedGame');
    const coffeeLink = document.getElementById('result-coffee-link');
    if (coffeeLink) coffeeLink.textContent = t('buyCoffee');
    const downloadBtn = document.getElementById('result-download-btn');
    if (downloadBtn) {
        downloadBtn.querySelector('.btn-full').textContent = '📥 ' + t('downloadImage');
        downloadBtn.querySelector('.btn-mobile').textContent = '📥';
    }
    const setupBtn = document.getElementById('result-setup-btn');
    if (setupBtn) setupBtn.textContent = t('backToSetup');
    const rematchBtn = document.getElementById('result-rematch-btn');
    if (rematchBtn) rematchBtn.textContent = t('newRace');
}

// Initialize language on load
window.addEventListener('DOMContentLoaded', () => {
    loadLanguage();
    
    // Initialize language button text based on current language
    const langText = document.getElementById('lang-text');
    const langBtn = document.getElementById('lang-btn');
    if (langText) {
        langText.textContent = currentLang === 'ko' ? 'EN' : 'KO';
    }

    // Update all text on page to match current language
    updateAllText();
    updateSetupLabels();
    updateResultLabels();

    // Update subtitle on title screen
    const subtitle = document.getElementById('subtitle-text');
    if (subtitle) {
        subtitle.textContent = t('subtitle');
    }

    // Update start button
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.textContent = t('start');
    }

    // Update fullscreen button tooltip
    const fsBtn = document.getElementById('fullscreen-btn');
    if (fsBtn) {
        fsBtn.title = t('fullscreenToggle');
    }

    // Update language button tooltip
    if (langBtn) {
        langBtn.title = t('langChange');
        langBtn.style.display = 'flex';
    }
});
