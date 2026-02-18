/* =========================================================
   SLIME DERBY - Constants and Global Variables
   ========================================================= */

// ── Colors ──
const SLIME_COLORS = [
    { hex: '#58d854', dark: '#2e8a2c', light: '#8aff88' },
    { hex: '#4488ff', dark: '#2255bb', light: '#88bbff' },
    { hex: '#ff4444', dark: '#bb2222', light: '#ff8888' },
    { hex: '#ffdd00', dark: '#bb9900', light: '#ffee88' },
    { hex: '#aa44ff', dark: '#7722bb', light: '#cc88ff' },
    { hex: '#ff88cc', dark: '#bb5588', light: '#ffbbee' },
    { hex: '#ff8800', dark: '#bb5500', light: '#ffbb66' },
    { hex: '#44dddd', dark: '#228888', light: '#88ffee' },
    { hex: '#88ff44', dark: '#55bb22', light: '#aaffaa' },
    { hex: '#ff44aa', dark: '#bb2277', light: '#ff88cc' },
    { hex: '#ffaa44', dark: '#bb7722', light: '#ffcc88' },
    { hex: '#8844ff', dark: '#5522bb', light: '#aa88ff' },
    { hex: '#44ffaa', dark: '#22bb77', light: '#88ffcc' },
    { hex: '#ff4488', dark: '#bb2255', light: '#ff88aa' },
    { hex: '#aaff44', dark: '#77bb22', light: '#ccff88' },
];

const DEFAULT_NAMES = ['초록이','파랑이','빨강이','노랑이','보라','핑크','주황이','하늘이'];

// Function to get localized default names
function getLocalizedDefaultNames() {
    if (typeof getDefaultNames === 'function') {
        return getDefaultNames();
    }
    return DEFAULT_NAMES;
}

const NES_CHARS_CLS = [
    'nes-mario', 'nes-ash', 'nes-kirby', 'nes-bulbasaur',
    'nes-charmander', 'nes-squirtle', 'nes-pokeball', 'nes-octocat',
];

function getNESChars() {
    return NES_CHARS_CLS.map((cls, i) => ({
        cls,
        name: typeof t === 'function' ? t(`nesName${i + 1}`) : cls,
    }));
}

// Accessory types (head accessories only)
const ACCESSORIES = [
    { type: 'ribbon' },
    { type: 'cap' },
    { type: 'tophat' },
    null, null, null, null, null, null, null, // 70% chance of no accessory
];

// ── Canvas constants ──
const CW = 800, CH = 480;
const TRACK_L = 130, TRACK_R = CW - 30;
const TRACK_LEN = TRACK_R - TRACK_L;
const HEADER_H = 46;
const CROWD_H = 24;
const CROWD_Y = CH - CROWD_H;

// ── Global State ──
let playerCount = 45;
let racePlayerCount = 15;
let players = [];
let targetTime = 10;
let state = 'title';

let nesCharImages = [];
let useNESChars = false;
let earlyFinish = false;
let earlyFinishTime = 0;

let canvas, ctx, animId;
let raceStart = 0;
let cdValue = 0;
let cdTimer = null;
let finishOrder = [];
let pace = 1;
let frame = 0;
let particles = [];
let droppedAccessories = [];
let spectators = [];
let allDone = false;
let finishSnapshot = null;
let isMobile = false;
let cameraX = 0;
let surgeTriggered = false;
