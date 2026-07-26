// ═══════════════════════════════════════════════════════════
//  CONFIGURATION
// ═══════════════════════════════════════════════════════════
const MAP_CONFIG = {
  imagePath: './main-map.png',
  imageWidth: 4608,
  imageHeight: 6644,
  gameMinX: -2350,
  gameMaxX: 1600,
  gameMinY: -6600,  // south (bottom of map)
  gameMaxY: -200,   // north (top of map)
};

const DEFENSE_LEVEL_STATS = [
  { health: 300000,  defense: 10.0, damageMin: 1000, damageMax: 1500, attackSpeed: 0.5 },
  { health: 450000,  defense: 40.0, damageMin: 1400, damageMax: 2100, attackSpeed: 0.75 },
  { health: 600000,  defense: 55.0, damageMin: 1800, damageMax: 2700, attackSpeed: 1.0 },
  { health: 750000,  defense: 62.5, damageMin: 2200, damageMax: 3300, attackSpeed: 1.25 },
  { health: 960000,  defense: 70.0, damageMin: 2600, damageMax: 3900, attackSpeed: 1.6 },
  { health: 1200000, defense: 75.0, damageMin: 3000, damageMax: 4500, attackSpeed: 2.0 },
  { health: 1500000, defense: 79.0, damageMin: 3400, damageMax: 5100, attackSpeed: 2.5 },
  { health: 1860000, defense: 82.0, damageMin: 3800, damageMax: 5700, attackSpeed: 3.0 },
  { health: 2220000, defense: 84.0, damageMin: 4200, damageMax: 6300, attackSpeed: 3.6 },
  { health: 2580000, defense: 86.0, damageMin: 4600, damageMax: 6900, attackSpeed: 3.8 },
  { health: 2940000, defense: 88.0, damageMin: 5000, damageMax: 7500, attackSpeed: 4.2 },
  { health: 3300000, defense: 90.0, damageMin: 5400, damageMax: 8100, attackSpeed: 4.7 }
];

const DEFENSE_COST_TABLE = [0, 100, 300, 600, 1200, 2400, 4800, 8400, 12000, 15600, 19200, 22800];

const DEFENSE_TYPES = [
  { id: "damage", name: "Damage", resource: "ore" },
  { id: "attack", name: "Attack Speed", resource: "crops" },
  { id: "health", name: "Health", resource: "wood" },
  { id: "defense", name: "Defense", resource: "fish" }
];

const BONUS_CONFIG = [
  { name: "Stronger Minions",        resource: "wood",     maxLevel: 4, costs: [0, 200, 400, 800, 1600], desc: "Minion Damage",
    levels: ["+0%", "+150%", "+200%", "+250%", "+300%"] },
  { name: "Tower Multi-Attacks",     resource: "fish",     maxLevel: 1, costs: [0, 4800], desc: "Max Targets",
    levels: ["1 Target", "2 Targets"] },
  { name: "Tower Aura",              resource: "crops",    maxLevel: 3, costs: [0, 800, 1600, 3200], desc: "Frequency",
    levels: ["Disabled", "24s", "18s", "12s"] },
  { name: "Tower Volley",            resource: "ore",      maxLevel: 3, costs: [0, 200, 400, 800], desc: "Frequency",
    levels: ["Disabled", "20s", "15s", "10s"] },
  { name: "Gathering Experience",    resource: "wood",     maxLevel: 8, costs: [0, 600, 1300, 2000, 2700, 3400, 5500, 10000, 20000], desc: "Gathering XP",
    levels: ["+0%", "+10%", "+20%", "+30%", "+40%", "+50%", "+60%", "+80%", "+100%"] },
  { name: "Mob Experience",          resource: "fish",     maxLevel: 8, costs: [0, 600, 1200, 1800, 2400, 3000, 5000, 10000, 20000], desc: "XP Bonus",
    levels: ["+0%", "+10%", "+20%", "+30%", "+40%", "+50%", "+60%", "+80%", "+100%"] },
  { name: "Mob Damage",              resource: "crops",    maxLevel: 8, costs: [0, 600, 1200, 1800, 2400, 3000, 5000, 10000, 20000], desc: "Damage Bonus",
    levels: ["+0%", "+10%", "+20%", "+40%", "+60%", "+80%", "+120%", "+160%", "+200%"] },
  { name: "PvP Damage",              resource: "ore",      maxLevel: 8, costs: [0, 600, 1200, 1800, 2400, 3000, 5000, 10000, 20000], desc: "Damage Bonus",
    levels: ["+0%", "+5%", "+10%", "+15%", "+20%", "+25%", "+40%", "+65%", "+80%"] },
  { name: "XP Seeking",              resource: "emeralds", maxLevel: 9, costs: [0, 100, 200, 400, 800, 1600, 3200, 6400, 9600, 12800], desc: "Guild XP",
    levels: ["+0/h", "+36K/h", "+66K/h", "+120K/h", "+228K/h", "+456K/h", "+900K/h", "+1.74M/h", "+2.58M/h", "+3.36M/h"] },
  { name: "Tome Seeking",            resource: "fish",     maxLevel: 3, costs: [0, 400, 3200, 6400], desc: "Drop Chance",
    levels: ["0%/h", "0.15%/h", "1.2%/h", "2.4%/h"] },
  { name: "Emerald Seeking",         resource: "wood",     maxLevel: 5, costs: [0, 200, 800, 1600, 3200, 6400], desc: "Drop Chance",
    levels: ["0%/h", "0.3%/h", "3%/h", "6%/h", "12%/h", "24%/h"] },
  { name: "Larger Resource Storage", resource: "emeralds", maxLevel: 6, costs: [0, 400, 800, 2000, 5000, 16000, 48000], desc: "Storage Bonus",
    levels: ["+0%", "+100%", "+300%", "+700%", "+1400%", "+3300%", "+7900%"] },
  { name: "Larger Emerald Storage",  resource: "wood",     maxLevel: 6, costs: [0, 200, 400, 1000, 2500, 8000, 24000], desc: "Storage Bonus",
    levels: ["+0%", "+100%", "+300%", "+700%", "+1400%", "+3300%", "+7900%"] },
  { name: "Efficient Resources",     resource: "emeralds", maxLevel: 6, costs: [0, 6000, 12000, 24000, 48000, 96000, 192000], desc: "Gathering Bonus",
    levels: ["+0%", "+50%", "+100%", "+150%", "+200%", "+250%", "+300%"] },
  { name: "Efficient Emeralds",      resource: "ore",      maxLevel: 3, costs: [0, 2000, 8000, 32000], desc: "Emerald Bonus",
    levels: ["+0%", "+35%", "+100%", "+300%"] },
  { name: "Resource Rate",           resource: "emeralds", maxLevel: 3, costs: [0, 6000, 18000, 32000], desc: "Gather Rate",
    levels: ["4s", "3s", "2s", "1s"] },
  { name: "Emerald Rate",            resource: "crops",    maxLevel: 3, costs: [0, 2000, 8000, 32000], desc: "Gather Rate",
    levels: ["4s", "3s", "2s", "1s"] }
];

const RESOURCES = ['emeralds', 'ore', 'crops', 'fish', 'wood'];
const RESOURCE_ICONS  = {
  emeralds: '<img src="./assets/icons/resources/emerald.png" class="res-icon-img" alt="emeralds">',
  ore: '<img src="./assets/icons/resources/ore.png" class="res-icon-img" alt="ore">',
  crops: '<img src="./assets/icons/resources/crop.png" class="res-icon-img" alt="crops">',
  fish: '<img src="./assets/icons/resources/fish.png" class="res-icon-img" alt="fish">',
  wood: '<img src="./assets/icons/resources/wood.png" class="res-icon-img" alt="wood">'
};
const RESOURCE_COLORS = { emeralds: '#4ade80', ore: '#94a3b8', crops: '#facc15', fish: '#38bdf8', wood: '#a16207' };

// ═══════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════
let territories = {};
let addedTerritories = {};  // name -> { defense, bonuses, hq, treasury }
let TERRITORY_IDS = [];      // index -> name（territory-ids.json）
let TERRITORY_ID_MAP = {};   // name -> index
let currentModalTerritory = null;
let mapImage = null;

// アイコン画像の読み込み
const resImages = {
  emeralds: new Image(),
  ore: new Image(),
  crops: new Image(),
  fish: new Image(),
  wood: new Image()
};
const hqImage = new Image();
resImages.emeralds.src = './assets/icons/resources/emerald.png';
resImages.ore.src = './assets/icons/resources/ore.png';
resImages.crops.src = './assets/icons/resources/crop.png';
resImages.fish.src = './assets/icons/resources/fish.png';
resImages.wood.src = './assets/icons/resources/wood.png';
hqImage.src = './assets/icons/others/guild_headquarter.png';
const allImages = [...Object.values(resImages), hqImage];
allImages.forEach(img => { img.onload = () => draw(); });

// Pan/Zoom
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let panX = 0, panY = 0, scale = 1;
let isDragging = false, dragStart = { x: 0, y: 0 };
let lastMousePos = { x: 0, y: 0 };
let hoveredTerritory = null;
let selectedTerritories = new Set();    // map selection (unregistered)
let listSelectedTerritories = new Set(); // manager list selection (registered)
let _hqPathCache = null;
let _traversingCache = null;
let tributeValues = { emeralds: 0, ore: 0, crops: 0, fish: 0, wood: 0 };
let currentModalMode = 'single'; // 'single' | 'bulk'
let currentBulkTerritories = [];
let customConnections = [];  // [{ a: string, b: string }, ...]（a, bはlocaleCompare('en')昇順で正規化）

// タッチ操作
let touchDragStart = { x: 0, y: 0 };
let touchStartPos = { x: 0, y: 0 };
let touchStartTime = 0;
let touchMoved = false;
let pinchStartDist = 0;
let pinchStartScale = 1;
let longPressTimer = null;
let longPressTriggered = false;
let lastTouchEndTime = 0;

// ═══════════════════════════════════════════════════════════
//  COORDINATE TRANSFORMS
// ═══════════════════════════════════════════════════════════
function gameToImage(gx, gy) {
  // Offset transform verified against Python map_renderer.py: pixel = game + offset
  return { x: gx + 2560, y: gy + 6632 };
}

function imageToCanvas(ix, iy) {
  return { x: ix * scale + panX, y: iy * scale + panY };
}

function gameToCanvas(gx, gy) {
  const img = gameToImage(gx, gy);
  return imageToCanvas(img.x, img.y);
}

function canvasToGame(cx, cy) {
  const ix = (cx - panX) / scale;
  const iy = (cy - panY) / scale;
  return { x: ix - 2560, y: iy - 6632 };
}

// ═══════════════════════════════════════════════════════════
//  PAN / ZOOM
// ═══════════════════════════════════════════════════════════
function clampPan() {
  const mapW = MAP_CONFIG.imageWidth * scale;
  const mapH = MAP_CONFIG.imageHeight * scale;
  const W = window.innerWidth, H = window.innerHeight;
  const marginX = Math.min(W * 0.5, 200);
  const marginY = Math.min(H * 0.5, 200);
  if (mapW <= W) {
    panX = Math.max(-marginX, Math.min(panX, W - mapW + marginX));
  } else {
    panX = Math.min(marginX, Math.max(panX, W - mapW - marginX));
  }
  if (mapH <= H) {
    panY = Math.max(-marginY, Math.min(panY, H - mapH + marginY));
  } else {
    panY = Math.min(marginY, Math.max(panY, H - mapH - marginY));
  }
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  clampPan();
  draw();
}

// ─── Mouse Events ───
canvas.addEventListener('mousedown', e => {
  if (e.target !== canvas) return;
  isDragging = true;
  dragStart = { x: e.clientX - panX, y: e.clientY - panY };
  canvas.classList.add('dragging');
});

canvas.addEventListener('mousemove', e => {
  lastMousePos = { x: e.clientX, y: e.clientY };
  if (isDragging) {
    panX = e.clientX - dragStart.x;
    panY = e.clientY - dragStart.y;
    clampPan();
    draw();
    return;
  }
  const hit = hitTestAll(e.clientX, e.clientY);
  if (hit !== hoveredTerritory) {
    hoveredTerritory = hit;
    draw();
  }
  if (hit && addedTerritories[hit]) {
    showTooltip(e.clientX, e.clientY, hit);
  } else {
    hideTooltip();
  }
});

canvas.addEventListener('mouseup', e => {
  if (!isDragging) return;
  const dx = Math.abs(e.clientX - (dragStart.x + panX));
  const dy = Math.abs(e.clientY - (dragStart.y + panY));
  isDragging = false;
  canvas.classList.remove('dragging');
  if (dx < 4 && dy < 4) {
    handleClick(e.clientX, e.clientY);
  }
});

canvas.addEventListener('mouseleave', () => {
  isDragging = false;
  canvas.classList.remove('dragging');
  hoveredTerritory = null;
  hideTooltip();
  draw();
});

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
  const newScale = Math.max(0.03, Math.min(8, scale * factor));
  const ratio = newScale / scale;
  panX = e.clientX - ratio * (e.clientX - panX);
  panY = e.clientY - ratio * (e.clientY - panY);
  scale = newScale;
  clampPan();
  draw();
}, { passive: false });

// ─── Touch Events ───
function clearLongPressTimer() {
  if (longPressTimer !== null) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function resetTouchState() {
  clearLongPressTimer();
  longPressTriggered = false;
  touchMoved = false;
  hideTooltip();
}

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  clearLongPressTimer();
  longPressTriggered = false;

  if (e.touches.length === 1) {
    const t = e.touches[0];
    touchStartPos = { x: t.clientX, y: t.clientY };
    touchStartTime = Date.now();
    touchMoved = false;
    touchDragStart = { x: t.clientX - panX, y: t.clientY - panY };

    longPressTimer = setTimeout(() => {
      longPressTimer = null;
      if (touchMoved) return;
      const hit = hitTestAll(touchStartPos.x, touchStartPos.y);
      if (hit && addedTerritories[hit]) {
        longPressTriggered = true;
        showTooltip(touchStartPos.x, touchStartPos.y, hit, true);
      }
    }, 500);
  } else if (e.touches.length === 2) {
    touchMoved = true;
    const [t1, t2] = e.touches;
    pinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    pinchStartScale = scale;
  }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();

  if (e.touches.length === 1) {
    const t = e.touches[0];
    const dx = t.clientX - touchStartPos.x;
    const dy = t.clientY - touchStartPos.y;
    if (!touchMoved && Math.hypot(dx, dy) > 10) {
      touchMoved = true;
      clearLongPressTimer();
      hideTooltip();
    }
    panX = t.clientX - touchDragStart.x;
    panY = t.clientY - touchDragStart.y;
    clampPan();
    draw();
  } else if (e.touches.length === 2) {
    touchMoved = true;
    clearLongPressTimer();
    hideTooltip();
    const [t1, t2] = e.touches;
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    const newScale = Math.max(0.03, Math.min(8, pinchStartScale * (dist / (pinchStartDist || dist))));
    const ratio = newScale / scale;
    const midX = (t1.clientX + t2.clientX) / 2;
    const midY = (t1.clientY + t2.clientY) / 2;
    panX = midX - ratio * (midX - panX);
    panY = midY - ratio * (midY - panY);
    scale = newScale;
    clampPan();
    draw();
  }
}, { passive: false });

canvas.addEventListener('touchend', e => {
  const now = Date.now();
  if (now - lastTouchEndTime < 300) e.preventDefault();
  lastTouchEndTime = now;
  e.preventDefault();

  if (e.touches.length === 1) {
    // 2本指→1本指: パンの基準点をリセットして飛びを防止
    const t = e.touches[0];
    touchDragStart = { x: t.clientX - panX, y: t.clientY - panY };
    touchStartPos = { x: t.clientX, y: t.clientY };
    touchStartTime = now;
    touchMoved = true;
    clearLongPressTimer();
    return;
  }

  if (e.touches.length === 0) {
    clearLongPressTimer();
    const wasTap = !touchMoved && !longPressTriggered && (now - touchStartTime) < 500;
    if (longPressTriggered) {
      hideTooltip();
    } else if (wasTap) {
      handleClick(touchStartPos.x, touchStartPos.y);
    }
    longPressTriggered = false;
    touchMoved = false;
  }
}, { passive: false });

canvas.addEventListener('touchcancel', () => {
  resetTouchState();
}, { passive: false });

['gesturestart', 'gesturechange', 'gestureend'].forEach(evt => {
  canvas.addEventListener(evt, e => e.preventDefault());
});

// ═══════════════════════════════════════════════════════════
//  HIT DETECTION
// ═══════════════════════════════════════════════════════════
function hitTest(cx, cy) {
  for (const name of Object.keys(addedTerritories)) {
    const t = territories[name];
    if (!t || !t.Location) continue;
    const loc = t.Location;
    const p1 = gameToCanvas(loc.start[0], loc.start[1]);
    const p2 = gameToCanvas(loc.end[0], loc.end[1]);
    if (cx >= Math.min(p1.x, p2.x) && cx <= Math.max(p1.x, p2.x) &&
        cy >= Math.min(p1.y, p2.y) && cy <= Math.max(p1.y, p2.y)) return name;
  }
  return null;
}

function hitTestAll(cx, cy) {
  const added = hitTest(cx, cy);
  if (added) return added;
  if (scale < 0.05) return null;
  for (const name of Object.keys(territories)) {
    if (addedTerritories[name]) continue;
    const t = territories[name];
    if (!t || !t.Location) continue;
    const loc = t.Location;
    const p1 = gameToCanvas(loc.start[0], loc.start[1]);
    const p2 = gameToCanvas(loc.end[0], loc.end[1]);
    if (cx >= Math.min(p1.x, p2.x) && cx <= Math.max(p1.x, p2.x) &&
        cy >= Math.min(p1.y, p2.y) && cy <= Math.max(p1.y, p2.y)) return name;
  }
  return null;
}

function handleClick(cx, cy) {
  const hit = hitTestAll(cx, cy);
  if (!hit) return;
  if (addedTerritories[hit]) {
    openModal(hit);
  } else {
    if (selectedTerritories.has(hit)) {
      selectedTerritories.delete(hit);
    } else {
      selectedTerritories.add(hit);
    }
    updateSelectedCount();
    draw();
  }
}

// ═══════════════════════════════════════════════════════════
//  DRAWING
// ═══════════════════════════════════════════════════════════
function draw() {
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.save();

  if (mapImage && mapImage.complete && mapImage.naturalWidth > 0) {
    ctx.drawImage(mapImage, panX, panY, MAP_CONFIG.imageWidth * scale, MAP_CONFIG.imageHeight * scale);
  } else {
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#334155';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Place main-map.png in the project directory to show the map.', canvas.width / 2, canvas.height / 2);
  }

  drawConnections();
  drawTerritories();

  ctx.restore();
}

function drawConnections() {
  const drawn = new Set();
  ctx.save();
  ctx.lineWidth = Math.max(1.5, scale * 4);

  // 1. 基本ルート
  ctx.strokeStyle = 'rgba(0,0,0,0.97)';
  for (const [name, t] of Object.entries(territories)) {
    if (!t['Trading Routes']) continue;
    for (const neighbor of t['Trading Routes']) {
      const key = [name, neighbor].sort().join('|');
      if (drawn.has(key)) continue;
      drawn.add(key);

      if (!territories[neighbor]) continue;

      const c1 = territoryCenter(name);
      const c2 = territoryCenter(neighbor);

      ctx.beginPath();
      ctx.moveTo(c1.x, c1.y);
      ctx.lineTo(c2.x, c2.y);
      ctx.stroke();
    }
  }

  // 2. 無効な追加線
  ctx.strokeStyle = 'rgba(234,179,8,0.35)';
  for (const conn of customConnections) {
    if (addedTerritories[conn.a] && addedTerritories[conn.b]) continue;
    if (!territories[conn.a] || !territories[conn.b]) continue;
    const c1 = territoryCenter(conn.a);
    const c2 = territoryCenter(conn.b);
    ctx.beginPath();
    ctx.moveTo(c1.x, c1.y);
    ctx.lineTo(c2.x, c2.y);
    ctx.stroke();
  }

  // 3. 有効な追加線
  ctx.strokeStyle = 'rgba(184,134,11,0.97)';
  for (const conn of customConnections) {
    if (!addedTerritories[conn.a] || !addedTerritories[conn.b]) continue;
    if (!territories[conn.a] || !territories[conn.b]) continue;
    const c1 = territoryCenter(conn.a);
    const c2 = territoryCenter(conn.b);
    ctx.beginPath();
    ctx.moveTo(c1.x, c1.y);
    ctx.lineTo(c2.x, c2.y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawIcon(img, x, y, size) {
  if (img && img.complete && img.naturalWidth > 0) {
    const aspect = img.naturalWidth / img.naturalHeight;
    let w = size, h = size;
    if (aspect > 1) {
      h = size / aspect;
    } else {
      w = size * aspect;
    }
    const dx = x + (size - w) / 2;
    const dy = y + (size - h) / 2;
    ctx.drawImage(img, dx, dy, w, h);
  }
}

function drawTerritories() {
  ctx.save();
  const hasHQForDraw = Object.keys(addedTerritories).some(n => addedTerritories[n].hq);
  for (const [name, t] of Object.entries(territories)) {
    if (!t.Location) continue;
    const loc = t.Location;
    const p1 = gameToCanvas(loc.start[0], loc.start[1]);
    const p2 = gameToCanvas(loc.end[0], loc.end[1]);
    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const w = Math.abs(p2.x - p1.x);
    const h = Math.abs(p2.y - p1.y);

    const isAdded = !!addedTerritories[name];
    const isHQ = isAdded && addedTerritories[name].hq;
    const isHovered = name === hoveredTerritory;
    const isSelected = selectedTerritories.has(name);
    const isListSelected = listSelectedTerritories.has(name);
    const isDisconnected = isAdded && hasHQForDraw && !isConnectedToHQ(name);

    if (!isAdded && !isSelected && scale < 0.05) continue;

    // Fill
    if (isAdded) {
      if (isListSelected) {
        ctx.fillStyle = isHovered ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.25)';
      } else {
        ctx.fillStyle = isHQ
          ? 'rgba(251,191,36,0.25)'
          : isHovered ? 'rgba(74,222,128,0.28)' : 'rgba(74,222,128,0.14)';
      }
      ctx.fillRect(x, y, w, h);
    } else if (isSelected) {
      ctx.fillStyle = isHovered ? 'rgba(96,165,250,0.28)' : 'rgba(96,165,250,0.16)';
      ctx.fillRect(x, y, w, h);
    } else if (isHovered) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x, y, w, h);
    }

    // Outline
    if (isAdded && isListSelected) {
      ctx.setLineDash([Math.max(4, scale * 8), Math.max(4, scale * 8)]);
      ctx.lineWidth = Math.max(2.0, scale * 2.5);
      ctx.strokeStyle = '#3b82f6';
    } else {
      ctx.setLineDash([]);
      if (isDisconnected) {
        ctx.lineWidth = Math.max(2.0, scale * 2.2);
        ctx.strokeStyle = '#f87171';
      } else if (isHQ) {
        ctx.lineWidth = Math.max(2.0, scale * 2.2);
        ctx.strokeStyle = '#fbbf24';
      } else if (isAdded) {
        ctx.lineWidth = Math.max(2.0, scale * 2.2);
        ctx.strokeStyle = '#15803d';
      } else if (isSelected) {
        ctx.lineWidth = Math.max(1.8, scale * 2.0);
        ctx.strokeStyle = '#3b82f6';
      } else if (isHovered) {
        ctx.lineWidth = Math.max(1.5, scale * 1.8);
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      } else {
        ctx.lineWidth = Math.max(1.0, scale * 1.4);
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      }
    }
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;

    if (scale > 0.25) {
      const iconSize = Math.max(18, Math.min(36, scale * 18));
      const gap = 2;
      let textY = cy;

      if (isHQ) {
        const sy = cy - iconSize * 0.8;
        drawIcon(hqImage, cx - iconSize / 2, sy, iconSize);
        textY = sy + iconSize + gap + 2;
      } else {
      const res = t.resources;
      const em = parseFloat(res.emeralds || 0);
      const ore = parseFloat(res.ore || 0);
      const crops = parseFloat(res.crops || 0);
      const fish = parseFloat(res.fish || 0);
      const wood = parseFloat(res.wood || 0);

      const isCity = em >= 18000;
      const isRainbow = ore > 0 && crops > 0 && fish > 0 && wood > 0;
      
      if (isRainbow) {
        // 虹資源地 (2x2 Grid)
        const totalW = iconSize * 2 + gap;
        const totalH = iconSize * 2 + gap;
        const sx = cx - totalW / 2;
        const sy = cy - totalH / 2 - iconSize * 0.4;

        drawIcon(resImages.ore, sx, sy, iconSize);
        drawIcon(resImages.crops, sx + iconSize + gap, sy, iconSize);
        drawIcon(resImages.fish, sx, sy + iconSize + gap, iconSize);
        drawIcon(resImages.wood, sx + iconSize + gap, sy + iconSize + gap, iconSize);
        
        textY = sy + totalH + gap + 2;
      } else {
        // 街または通常資源地 (横並び)
        const iconsToDraw = [];
        if (isCity) iconsToDraw.push(resImages.emeralds);
        
        const checkRes = [
          { img: resImages.ore, amount: ore },
          { img: resImages.crops, amount: crops },
          { img: resImages.fish, amount: fish },
          { img: resImages.wood, amount: wood }
        ];
        for (const r of checkRes) {
          if (r.amount > 0) {
            iconsToDraw.push(r.img);
            if (r.amount >= 7200) iconsToDraw.push(r.img);
          }
        }

        if (iconsToDraw.length > 0) {
          const totalW = iconsToDraw.length * iconSize + (iconsToDraw.length - 1) * gap;
          let sx = cx - totalW / 2;
          const sy = cy - iconSize * 0.8;
          
          for (const img of iconsToDraw) {
            drawIcon(img, sx, sy, iconSize);
            sx += iconSize + gap;
          }
          textY = sy + iconSize + gap + 2;
        } else {
          textY = cy; // 資源がない場合
        }
      }
      }

      const fontSize = Math.min(18, Math.max(9, scale * 13));
      ctx.font = `${fontSize}px 'Minecraftia', sans-serif`;
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.lineWidth = Math.max(2, fontSize * 0.15);
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.fillStyle = isAdded ? '#ffffff' : isSelected ? '#93c5fd' : 'rgba(255,255,255,0.82)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const displayText = name;

      ctx.strokeText(displayText, cx, textY);
      ctx.fillText(displayText, cx, textY);

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    } else if (isAdded && scale > 0.06) {
      // 引いた時の簡易表示
      if (isHQ) {
        ctx.fillStyle = '#fbbf24';
        const size = Math.max(8, scale * 50);
        ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
      }
    }
  }
  ctx.restore();
}

function territoryCenter(name) {
  const t = territories[name];
  if (!t || !t.Location) return { x: 0, y: 0 };
  const loc = t.Location;
  return gameToCanvas((loc.start[0] + loc.end[0]) / 2, (loc.start[1] + loc.end[1]) / 2);
}

// ═══════════════════════════════════════════════════════════
//  CONNECTIONS（基本ルート＋ユーザー追加の接続線）
// ═══════════════════════════════════════════════════════════
function getNeighbors(name) {
  const result = new Set((territories[name] && territories[name]['Trading Routes']) || []);
  for (const conn of customConnections) {
    if (!addedTerritories[conn.a] || !addedTerritories[conn.b]) continue;
    if (conn.a === name) result.add(conn.b);
    else if (conn.b === name) result.add(conn.a);
  }
  return [...result];
}

// ═══════════════════════════════════════════════════════════
//  TOOLTIP
// ═══════════════════════════════════════════════════════════
const tooltip = document.getElementById('tooltip');

function showTooltip(mx, my, name, above = false) {
  const prod = calcTerritoryProduction(name);
  const cons = calcTerritoryConsumption(name);
  const st = addedTerritories[name];
  const stats = calcTerritoryDefenseStats(name);

  let titleText = name + (st.hq ? ' (HQ)' : '');
  let html = `<div style="color:#ffffff; font-weight:bold; font-size:14px; margin-bottom:8px;">${titleText}</div>`;

  const resStorageLv = (st.bonuses || {})['Larger Resource Storage'] || 0;
  const emStorageLv = (st.bonuses || {})['Larger Emerald Storage'] || 0;

  const maxEm = st.hq 
    ? [5000, 10000, 20000, 40000, 75000, 170000, 400000][emStorageLv]
    : [3000, 6000, 12000, 24000, 45000, 102000, 240000][emStorageLv];
    
  const maxRes = st.hq
    ? [1500, 3000, 6000, 12000, 22500, 51000, 120000][resStorageLv]
    : [300, 600, 1200, 2400, 4500, 10200, 24000][resStorageLv];

  // Emeralds
  const emTotal = prod.emeralds + cons.emeralds;
  if (emTotal > 0) {
    if (prod.emeralds > 0) html += `<div style="color:#55FF55;">+${fmtNum(prod.emeralds)} Emeralds per Hour</div>`;
    const stored = Math.round(emTotal / 60);
    const color = stored >= maxEm ? '#FF5555' : '#55FF55';
    html += `<div style="color:#55FF55;"><span style="color:${color};">${fmtNum(stored)}</span>/${fmtNum(maxEm)} stored</div>`;
  }

  // Ore
  const oreTotal = prod.ore + cons.ore;
  if (oreTotal > 0) {
    if (prod.ore > 0) html += `<div style="color:#FFFFFF;">${RESOURCE_ICONS.ore} +${fmtNum(prod.ore)} Ore per Hour</div>`;
    const stored = Math.round(oreTotal / 60);
    const color = stored >= maxRes ? '#FF5555' : '#FFFFFF';
    html += `<div style="color:#FFFFFF;">${RESOURCE_ICONS.ore} <span style="color:${color};">${fmtNum(stored)}</span>/${fmtNum(maxRes)} stored</div>`;
  }

  // Wood
  const woodTotal = prod.wood + cons.wood;
  if (woodTotal > 0) {
    if (prod.wood > 0) html += `<div style="color:#FFAA00;">${RESOURCE_ICONS.wood} +${fmtNum(prod.wood)} Wood per Hour</div>`;
    const stored = Math.round(woodTotal / 60);
    const color = stored >= maxRes ? '#FF5555' : '#FFAA00';
    html += `<div style="color:#FFAA00;">${RESOURCE_ICONS.wood} <span style="color:${color};">${fmtNum(stored)}</span>/${fmtNum(maxRes)} stored</div>`;
  }

  // Fish
  const fishTotal = prod.fish + cons.fish;
  if (fishTotal > 0) {
    if (prod.fish > 0) html += `<div style="color:#55FFFF;">${RESOURCE_ICONS.fish} +${fmtNum(prod.fish)} Fish per Hour</div>`;
    const stored = Math.round(fishTotal / 60);
    const color = stored >= maxRes ? '#FF5555' : '#55FFFF';
    html += `<div style="color:#55FFFF;">${RESOURCE_ICONS.fish} <span style="color:${color};">${fmtNum(stored)}</span>/${fmtNum(maxRes)} stored</div>`;
  }

  // Crops
  const cropsTotal = prod.crops + cons.crops;
  if (cropsTotal > 0) {
    if (prod.crops > 0) html += `<div style="color:#FFFF55;">${RESOURCE_ICONS.crops} +${fmtNum(prod.crops)} Crops per Hour</div>`;
    const stored = Math.round(cropsTotal / 60);
    const color = stored >= maxRes ? '#FF5555' : '#FFFF55';
    html += `<div style="color:#FFFF55;">${RESOURCE_ICONS.crops} <span style="color:${color};">${fmtNum(stored)}</span>/${fmtNum(maxRes)} stored</div>`;
  }

  // Treasury Bonus
  const buffPct = calcTreasuryBuff(name, getHQPaths().dist);
  if (buffPct > 0) {
    html += `<div style="margin-top:8px;"><span style="color:#FF55FF;">♦ Treasury Bonus: </span><span style="color:#FFFFFF;">${(buffPct * 100).toFixed(1)}%</span></div>`;
  }

  // Upgrades
  html += `<div style="color:#FF55FF; margin-top:8px;">Upgrades:</div>`;
  let hasUpgrades = false;
  for (const dt of DEFENSE_TYPES) {
    const lv = (st.defense || {})[dt.id] || 0;
    if (lv > 0) {
      html += `<div><span style="color:#FF55FF;">- </span><span style="color:#AAAAAA;">${dt.name} </span><span style="color:#555555;">[Lv.${lv}]</span></div>`;
      hasUpgrades = true;
    }
  }
  for (const bcfg of BONUS_CONFIG) {
    const lv = (st.bonuses || {})[bcfg.name] || 0;
    if (lv > 0) {
      html += `<div><span style="color:#FF55FF;">- </span><span style="color:#AAAAAA;">${bcfg.name} </span><span style="color:#555555;">[Lv.${lv}]</span></div>`;
      hasUpgrades = true;
    }
  }
  if (!hasUpgrades) {
    html += `<div style="color:#AAAAAA;">No upgrades active</div>`;
  }

  // Total Stats
  if (stats) {
    let ratingColor = '#55FF55';
    switch(stats.rating) {
      case "Very Low": ratingColor = '#00AA00'; break;
      case "Low": ratingColor = '#55FF55'; break;
      case "Medium": ratingColor = '#FFFF55'; break;
      case "High": ratingColor = '#FF5555'; break;
      case "Very High": ratingColor = '#AA0000'; break;
    }
    html += `<div style="margin-top:8px;"><span style="color:#FF55FF;">Total Stats (</span><span style="color:${ratingColor};">${stats.rating}</span><span style="color:#FF55FF;">):</span></div>`;
    html += `<div><span style="color:#FF55FF;">- </span><span style="color:#AAAAAA;">Damage: ${fmtNum(stats.finalDmgMin)} - ${fmtNum(stats.finalDmgMax)}</span></div>`;
    html += `<div><span style="color:#FF55FF;">- </span><span style="color:#AAAAAA;">Attacks per Second: ${stats.atkSpd}</span></div>`;
    html += `<div><span style="color:#FF55FF;">- </span><span style="color:#AAAAAA;">Health: ${fmtNum(stats.boostedHp)}</span></div>`;
    html += `<div><span style="color:#FF55FF;">- </span><span style="color:#AAAAAA;">Defense: ${stats.defPct}%</span></div>`;
    html += `<div><span style="color:#FF55FF;">- </span><span style="color:#AAAAAA;">EHP: ${fmt(stats.finalHp)} / DPS: ${fmt(stats.dps)}</span></div>`;
  }

  tooltip.innerHTML = html;
  tooltip.style.display = 'block';

  const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;

  if (above) {
    // 長押し時: 指の上側に表示（指で隠れないように）。画面上端をはみ出す場合は下側へ回り込む
    let tx = mx - tw / 2;
    tx = Math.max(10, Math.min(tx, window.innerWidth - tw - 10));
    let ty = my - th - 24;
    if (ty < 10) ty = my + 24;
    tooltip.style.left = tx + 'px';
    tooltip.style.top  = ty + 'px';
    return;
  }

  let tx = mx + 14, ty = my - 10;
  if (tx + tw > window.innerWidth - 10) tx = mx - tw - 14;
  if (ty + th > window.innerHeight - 10) ty = window.innerHeight - th - 10;
  tooltip.style.left = tx + 'px';
  tooltip.style.top  = ty + 'px';
}

function hideTooltip() {
  tooltip.style.display = 'none';
}

// ═══════════════════════════════════════════════════════════
//  RESOURCE CALCULATIONS
// ═══════════════════════════════════════════════════════════
function zeroCosts() {
  return { emeralds: 0, ore: 0, crops: 0, fish: 0, wood: 0 };
}

function calcBonusCostForLevel(bonusCfg, level) {
  if (level === 0 || !bonusCfg.costs || level >= bonusCfg.costs.length) return zeroCosts();
  const result = zeroCosts();
  result[bonusCfg.resource] = bonusCfg.costs[level];
  return result;
}

function calcTerritoryDefenseStats(name) {
  const st = addedTerritories[name];
  if (!st || !st.defense) return null;
  const t = territories[name];
  if (!t) return null;

  let connections = 0;
  let externals = 0;
  let mult = 1.0;

  if (st.hq) {
    const connSet = new Set();
    const extSet = new Set();
    const visited = new Set();
    const queue = [{ curr: name, dist: 0 }];

    while (queue.length > 0) {
      const { curr, dist } = queue.shift();
      if (visited.has(curr) || dist > 3) continue;
      visited.add(curr);

      if (dist === 1 && addedTerritories[curr]) connSet.add(curr);
      if (dist > 0 && addedTerritories[curr] && curr !== name) extSet.add(curr);

      for (const conn of getNeighbors(curr)) {
        if (addedTerritories[conn] && !visited.has(conn)) queue.push({ curr: conn, dist: dist + 1 });
      }
    }
    connections = connSet.size;
    externals = extSet.size;
    mult = (1.5 + (0.25 * externals)) * (1.0 + (0.30 * connections));
  } else {
    for (const route of getNeighbors(name)) {
      if (addedTerritories[route]) connections++;
    }
    mult = 1.0 + (0.3 * connections);
  }
  
  const hLevel = st.defense.health || 0;
  const dLevel = st.defense.damage || 0;
  const aLevel = st.defense.attack || 0;
  const defLevel = st.defense.defense || 0;

  const baseHp = DEFENSE_LEVEL_STATS[hLevel].health;
  const defPct = DEFENSE_LEVEL_STATS[defLevel].defense;
  const dmgMin = DEFENSE_LEVEL_STATS[dLevel].damageMin;
  const dmgMax = DEFENSE_LEVEL_STATS[dLevel].damageMax;
  const atkSpd = DEFENSE_LEVEL_STATS[aLevel].attackSpeed;

  const boostedHp = Math.round(baseHp * mult);
  const finalHp = Math.round(boostedHp / (1 - defPct / 100));
  const finalDmgMin = Math.round(dmgMin * mult);
  const finalDmgMax = Math.round(dmgMax * mult);
  const avgDmg = (dmgMin + dmgMax) / 2;
  const finalAvgDmg = avgDmg * mult;
  const dps = Math.round(finalAvgDmg * atkSpd);

  const auraLevel = (st.bonuses || {})["Tower Aura"] || 0;
  const volleyLevel = (st.bonuses || {})["Tower Volley"] || 0;
  let difficulty = hLevel + dLevel + aLevel + defLevel;
  difficulty += auraLevel > 0 ? auraLevel + 5 : 0;
  difficulty += volleyLevel > 0 ? volleyLevel + 3 : 0;

  let rating = "Very Low";
  if (difficulty >= 49) rating = "Very High";
  else if (difficulty >= 31) rating = "High";
  else if (difficulty >= 19) rating = "Medium";
  else if (difficulty >= 6) rating = "Low";

  if (st.hq) {
    const RATING_ORDER = ["Very Low", "Low", "Medium", "High", "Very High"];
    const idx = RATING_ORDER.indexOf(rating);
    rating = RATING_ORDER[Math.min(idx + 1, RATING_ORDER.length - 1)];
  }

  return { finalHp, dps, defPct, rating, mult, connections, boostedHp, atkSpd, finalDmgMin, finalDmgMax };
}

function calcTerritoryProduction(name) {
  const t = territories[name];
  if (!t) return zeroCosts();
  const base = zeroCosts();
  for (const r of RESOURCES) base[r] = parseFloat(t.resources[r] || 0);

  const st = addedTerritories[name];
  if (!st || !st.bonuses) return base;

  const effEmLevel = st.bonuses["Efficient Emeralds"] || 0;
  const rateEmLevel = st.bonuses["Emerald Rate"] || 0;
  const effResLevel = st.bonuses["Efficient Resources"] || 0;
  const rateResLevel = st.bonuses["Resource Rate"] || 0;

  const effEmMult = 1 + [0, 0.35, 1.0, 3.0][effEmLevel];
  const rateEmSec = [4, 3, 2, 1][rateEmLevel];
  const rateEmMult = 4 / rateEmSec;

  const effResMult = 1 + [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0][effResLevel];
  const rateResSec = [4, 3, 2, 1][rateResLevel];
  const rateResMult = 4 / rateResSec;
  
  const treasBuff = 1 + calcTreasuryBuff(name, getHQPaths().dist);

  const result = { ...base };
  result.emeralds = Math.round(base.emeralds * effEmMult * rateEmMult * treasBuff);
  for (const r of ['ore', 'crops', 'wood', 'fish']) {
    result[r] = Math.round(base[r] * effResMult * rateResMult * treasBuff);
  }

  return result;
}

function calcTerritoryConsumption(name) {
  const st = addedTerritories[name];
  if (!st) return zeroCosts();

  const result = zeroCosts();

  if (st.defense) {
    for (const dt of DEFENSE_TYPES) {
      const level = st.defense[dt.id] || 0;
      result[dt.resource] += DEFENSE_COST_TABLE[level] || 0;
    }
  }

  for (const bcfg of BONUS_CONFIG) {
    const level = (st.bonuses || {})[bcfg.name] || 0;
    const c = calcBonusCostForLevel(bcfg, level);
    for (const r of RESOURCES) result[r] += c[r] || 0;
  }

  return result;
}

function calcOverallBalance() {
  const production = zeroCosts();
  const consumption = zeroCosts();
  for (const name of Object.keys(addedTerritories)) {
    if (!isConnectedToHQ(name)) continue;
    const prod = calcTerritoryProduction(name);
    const cons = calcTerritoryConsumption(name);
    for (const r of RESOURCES) {
      production[r] += prod[r];
      consumption[r] += cons[r];
    }
  }
  return { production, consumption };
}

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.round(n).toString();
}

function fmtNum(n) {
  return Math.round(n).toLocaleString('en-US');
}

// ═══════════════════════════════════════════════════════════
//  TREASURY
// ═══════════════════════════════════════════════════════════
// dist 0-2: 10%, dist 3: 8.5%, dist 4: 7%, dist 5: 5.5%, dist 6+: 4%
const TREASURY_BASE_PCTS = [0.10, 0.10, 0.10, 0.085, 0.07, 0.055, 0.04];
const TREASURY_LEVEL_MULT = { 'Very Low': 0, 'Low': 1, 'Medium': 2, 'High': 2.5, 'Very High': 3 };

function calculateTreasuryFromAcquired(acquiredStr) {
  if (!acquiredStr) return 'Very Low';
  const acquiredDate = new Date(acquiredStr).getTime();
  const now = Date.now();
  if (isNaN(acquiredDate)) return 'Very Low';
  const diffHours = (now - acquiredDate) / (1000 * 60 * 60);

  if (diffHours >= 288) return 'Very High'; // 12 days
  if (diffHours >= 120) return 'High';      // 5 days
  if (diffHours >= 24) return 'Medium';     // 1 day
  if (diffHours >= 1) return 'Low';         // 1 hour
  return 'Very Low';
}

function comparePaths(a, b) {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const c = a[i].localeCompare(b[i], 'en');
    if (c !== 0) return c;
  }
  return a.length - b.length;
}

function getHQPaths() {
  if (_hqPathCache !== null) return _hqPathCache;
  const hqName = Object.keys(addedTerritories).find(n => addedTerritories[n].hq);
  if (!hqName) return (_hqPathCache = { dist: {}, path: {} });

  // 1. BFS（登録済み領地のみ経由）で距離を確定
  const dist = { [hqName]: 0 };
  const queue = [hqName];
  let qi = 0;
  while (qi < queue.length) {
    const curr = queue[qi++];
    for (const nb of getNeighbors(curr)) {
      if (!addedTerritories[nb]) continue;
      if (dist[nb] === undefined) { dist[nb] = dist[curr] + 1; queue.push(nb); }
    }
  }

  // 2. 距離昇順で経路を決定（同距離の親候補は path が辞書順最小のものを採用）
  const path = { [hqName]: [hqName] };
  const byDist = Object.keys(dist).sort((a, b) => dist[a] - dist[b]);
  for (const v of byDist) {
    if (v === hqName) continue;
    const d = dist[v];
    const neighbors = getNeighbors(v);
    let bestParent = null;
    for (const u of neighbors) {
      if (dist[u] !== d - 1) continue;
      if (bestParent === null || comparePaths(path[u], path[bestParent]) < 0) bestParent = u;
    }
    path[v] = [...path[bestParent], v];
  }

  return (_hqPathCache = { dist, path });
}

function isConnectedToHQ(name) {
  if (!addedTerritories[name]) return false;
  const hasHQ = Object.keys(addedTerritories).some(n => addedTerritories[n].hq);
  if (!hasHQ) return true;
  return getHQPaths().dist[name] !== undefined;
}

function calcTreasuryBuff(name, hqDist) {
  const level = (addedTerritories[name] && addedTerritories[name].treasury) || 'Very Low';
  const mult = TREASURY_LEVEL_MULT[level];
  if (!mult || !hqDist) return 0;
  const dist = hqDist[name];
  if (dist === undefined) return 0;
  return TREASURY_BASE_PCTS[Math.min(dist, 6)] * mult;
}

// ═══════════════════════════════════════════════════════════
//  OVERVIEW PANEL
// ═══════════════════════════════════════════════════════════
function updateOverview() {
  const body = document.getElementById('overview-body');
  const count = Object.keys(addedTerritories).length;

  if (count === 0) {
    body.innerHTML = '<div style="color:#64748b;font-size:12px;">Add territories to see balance.</div>';
    return;
  }

  const { production, consumption } = calcOverallBalance();
  
  let html = `<div style="color:#AAAAAA; font-size:11px; margin-bottom:12px;">Total resource output and overall costs</div>`;

  const resOrder = [
    { id: 'emeralds', name: 'Emeralds', color: '#55FF55' },
    { id: 'ore', name: 'Ore', color: '#FFFFFF' },
    { id: 'wood', name: 'Wood', color: '#FFAA00' },
    { id: 'fish', name: 'Fish', color: '#55FFFF' },
    { id: 'crops', name: 'Crops', color: '#FFFF55' }
  ];

  // Production
  for (const r of resOrder) {
    const prod = production[r.id];
    html += `<div style="color:${r.color}; font-size:12px; margin-bottom:4px; display:flex; align-items:center; gap:6px;">`;
    html += `<span>${RESOURCE_ICONS[r.id]}</span> <span>+${fmtNum(prod)} ${r.name} per Hour</span>`;
    html += `</div>`;
  }

  html += `<div style="color:#55FF55; font-size:12px; margin-top:16px; margin-bottom:6px;">Overall Cost (per Hour):</div>`;

  // Costs
  for (const r of resOrder) {
    const cons = consumption[r.id];
    const prod = production[r.id];
    const trib = tributeValues[r.id] || 0;
    
    const net = prod - cons + trib;
    const totalIn = prod + Math.max(0, trib);
    
    const iconHtml = RESOURCE_ICONS[r.id].replace('class="res-icon-img"', 'class="res-icon-img gray-icon"');
    
    html += `<div style="font-size:12px; margin-bottom:4px; display:flex; align-items:center; gap:6px;">`;
    html += `<span style="color:#55FF55;">- </span>`;
    html += `<span>${iconHtml}</span>`;
    
    const absNet = Math.abs(net);
    const netStr = net >= 0 ? `(+${fmt(absNet)})` : `(-${fmt(absNet)})`;
    const netColor = net >= 0 ? '#5555FF' : '#FF5555';
    
    let textHtml = `<span style="color:#AAAAAA;">${fmtNum(cons)} ${r.name} </span>` +
                   `<span style="color:${netColor};">${netStr} </span>`;
                   
    if (totalIn === 0) {
      textHtml += `<span style="color:#AA0000;">(No Output)</span>`;
    } else {
      const pct = Math.round((cons / totalIn) * 100);
      const pctColor = pct <= 100 ? '#555555' : '#FF5555';
      textHtml += `<span style="color:${pctColor};">(${pct}%)</span>`;
    }
    
    html += `<span>${textHtml}</span>`;
    html += `</div>`;
  }
  body.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
//  TERRITORY LIST
// ═══════════════════════════════════════════════════════════
function getTerritoryListIconHTML(name) {
  const st = addedTerritories[name];
  const t = territories[name];
  if (!st || !t) return '';

  if (st.hq) {
    return `<img src="./assets/icons/others/guild_headquarter.png" class="hq-list-icon" alt="HQ">`;
  }

  const res = t.resources;
  const em = parseFloat(res.emeralds || 0);
  const ore = parseFloat(res.ore || 0);
  const crops = parseFloat(res.crops || 0);
  const fish = parseFloat(res.fish || 0);
  const wood = parseFloat(res.wood || 0);

  const isCity = em >= 18000;
  const isRainbow = ore > 0 && crops > 0 && fish > 0 && wood > 0;

  let iconsHTML = '';

  if (isRainbow) {
    iconsHTML += RESOURCE_ICONS.ore + RESOURCE_ICONS.crops + RESOURCE_ICONS.fish + RESOURCE_ICONS.wood;
  } else {
    if (isCity) iconsHTML += RESOURCE_ICONS.emeralds;
    
    const checkRes = [
      { icon: RESOURCE_ICONS.ore, amount: ore },
      { icon: RESOURCE_ICONS.crops, amount: crops },
      { icon: RESOURCE_ICONS.fish, amount: fish },
      { icon: RESOURCE_ICONS.wood, amount: wood }
    ];
    for (const r of checkRes) {
      if (r.amount > 0) {
        iconsHTML += r.icon;
        if (r.amount >= 7200) iconsHTML += r.icon;
      }
    }
  }

  if (iconsHTML === '') return '';

  return `<div class="list-icon-group">${iconsHTML.replace(/class="res-icon-img"/g, 'class="list-icon"')}</div>`;
}

function updateTerritoryList() {
  const list = document.getElementById('territory-list');
  const count = Object.keys(addedTerritories).length;
  document.getElementById('added-count').textContent = count;

  if (count === 0) {
    list.innerHTML = '<div style="color:#64748b;font-size:12px;padding:4px;">No territories added.</div>';
    return;
  }

  const getSortScore = (name) => {
    const st = addedTerritories[name];
    if (!st) return 4; // Should not happen

    const t = territories[name];
    const isCity = t && t.resources && parseInt(t.resources.emeralds || 0) >= 18000;
    const hasDefense = st.defense && Object.values(st.defense).some(v => v > 0);
    const hasBonuses = st.bonuses && Object.values(st.bonuses).some(v => v > 0);

    // Priority 1: HQ
    if (st.hq) return 0;

    // Priority 2: Is a city territory
    if (isCity) return 1;

    // Priority 3: Has any upgrades
    if (hasDefense || hasBonuses) return 2;

    // Priority 4: Others
    return 3;
  };

  const getRatingScore = (name) => {
    const st = addedTerritories[name];
    if (!st) return 0;
    
    const hasDefense = st.defense && Object.values(st.defense).some(v => v > 0);
    const hasBonuses = st.bonuses && Object.values(st.bonuses).some(v => v > 0);
    if (!hasDefense && !hasBonuses && !st.hq) return 0;

    const stats = calcTerritoryDefenseStats(name);
    if (!stats) return 0;

    switch (stats.rating) {
      case "Very High": return 5;
      case "High":      return 4;
      case "Medium":    return 3;
      case "Low":       return 2;
      case "Very Low":  return 1;
      default:          return 0;
    }
  };

  const sortedNames = Object.keys(addedTerritories).sort((a, b) => {
    const scoreA = getSortScore(a);
    const scoreB = getSortScore(b);
    if (scoreA !== scoreB) {
      return scoreA - scoreB;
    }
    
    const ratingA = getRatingScore(a);
    const ratingB = getRatingScore(b);
    if (ratingA !== ratingB) {
      return ratingB - ratingA; // 降順 (Very High -> Very Low)
    }

    // If scores are equal, sort alphabetically
    return a.localeCompare(b);
  });

  const hasHQ = Object.keys(addedTerritories).some(n => addedTerritories[n].hq);

  list.innerHTML = sortedNames.map(name => {
    const isSel = listSelectedTerritories.has(name);
    const isDisconnected = hasHQ && !isConnectedToHQ(name);
    const safeNameArg = escapeHtml(JSON.stringify(name));
    const iconHTML = getTerritoryListIconHTML(name);
    const cls = 'territory-item' + (isSel ? ' list-selected' : '') + (isDisconnected ? ' disconnected' : '');
    return `<div class="${cls}" onclick="toggleListSelection(${safeNameArg})">
      <div class="territory-item-left">
        ${isDisconnected ? '<span class="disconnected-mark">❌</span>' : ''}
        ${iconHTML}
        <span>${escapeHtml(name)}</span>
      </div>
      <button class="rm-btn" onclick="event.stopPropagation();removeTerritory(${safeNameArg})">✕</button>
    </div>`;
  }).join('');
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ═══════════════════════════════════════════════════════════
//  ADD / REMOVE TERRITORIES
// ═══════════════════════════════════════════════════════════
function autoAssignHQ() {
  const names = Object.keys(addedTerritories);
  if (names.length === 0) return;

  let bestName = null;
  let bestEHP = -1;

  for (const name of names) {
    const connSet = new Set();
    const extSet = new Set();
    const visited = new Set([name]);
    const queue = [{ curr: name, dist: 0 }];
    let qi = 0;
    while (qi < queue.length) {
      const { curr, dist } = queue[qi++];
      if (dist > 3) continue;
      if (dist === 1) connSet.add(curr);
      if (dist > 0 && curr !== name) extSet.add(curr);

      for (const nb of getNeighbors(curr)) {
        if (addedTerritories[nb] && !visited.has(nb)) {
          visited.add(nb);
          queue.push({ curr: nb, dist: dist + 1 });
        }
      }
    }
    const connections = connSet.size;
    const externals = extSet.size;
    const mult = (1.5 + 0.25 * externals) * (1 + 0.3 * connections);

    const st = addedTerritories[name];
    const healthLv = (st.defense && st.defense.health) || 0;
    const defenseLv = (st.defense && st.defense.defense) || 0;
    const boostedHp = Math.round(DEFENSE_LEVEL_STATS[healthLv].health * mult);
    const ehp = Math.round(boostedHp / (1 - DEFENSE_LEVEL_STATS[defenseLv].defense / 100));

    if (bestName === null || ehp > bestEHP || (ehp === bestEHP && name.localeCompare(bestName, 'en') < 0)) {
      bestEHP = ehp;
      bestName = name;
    }
  }

  for (const name of names) addedTerritories[name].hq = (name === bestName);
}

function addTerritory(name) {
  if (!territories[name]) return;
  const wasEmpty = Object.keys(addedTerritories).length === 0;
  if (!addedTerritories[name]) {
    let initialTreasury = 'Very Low';
    if (territories[name].Guild && territories[name].Guild.acquired) {
      initialTreasury = calculateTreasuryFromAcquired(territories[name].Guild.acquired);
    }
    addedTerritories[name] = { defense: { damage: 0, attack: 0, health: 0, defense: 0 }, bonuses: {}, hq: false, treasury: initialTreasury };
  }
  selectedTerritories.delete(name);
  if (wasEmpty && Object.keys(addedTerritories).length > 0) autoAssignHQ();
  updateSelectedCount();
  refreshUI();
}

function addSelectedTerritories() {
  const wasEmpty = Object.keys(addedTerritories).length === 0;
  for (const name of selectedTerritories) {
    if (territories[name] && !addedTerritories[name]) {
      let initialTreasury = 'Very Low';
      if (territories[name].Guild && territories[name].Guild.acquired) {
        initialTreasury = calculateTreasuryFromAcquired(territories[name].Guild.acquired);
      }
      addedTerritories[name] = { defense: { damage: 0, attack: 0, health: 0, defense: 0 }, bonuses: {}, hq: false, treasury: initialTreasury };
    }
  }
  selectedTerritories.clear();
  if (wasEmpty && Object.keys(addedTerritories).length > 0) autoAssignHQ();
  updateSelectedCount();
  refreshUI();
}

function updateSelectedCount() {
  document.getElementById('selected-count').textContent = selectedTerritories.size;
}

function removeTerritory(name) {
  delete addedTerritories[name];
  listSelectedTerritories.delete(name);
  refreshUI();
}

function clearAllTerritories() {
  if (!confirm('Remove all territories?')) return;
  addedTerritories = {};
  listSelectedTerritories.clear();
  refreshUI();
}

function resetSelected() {
  const names = [...listSelectedTerritories].filter(n => addedTerritories[n]);
  if (names.length === 0 && selectedTerritories.size === 0) return;
  for (const n of names) {
    addedTerritories[n].defense = { damage: 0, attack: 0, health: 0, defense: 0 };
    addedTerritories[n].bonuses = {};
  }
  selectedTerritories.clear();
  updateSelectedCount();
  refreshUI();
}

function toggleListSelection(name) {
  if (listSelectedTerritories.has(name)) listSelectedTerritories.delete(name);
  else listSelectedTerritories.add(name);
  updateTerritoryList();
  draw();
}

function selectAll() {
  listSelectedTerritories = new Set(Object.keys(addedTerritories));
  updateTerritoryList();
  draw();
}

function selectNone() {
  listSelectedTerritories.clear();
  updateTerritoryList();
  draw();
}

function editSelected() {
  const names = [...listSelectedTerritories].filter(n => addedTerritories[n]);
  if (names.length === 0) return;
  openModal(names[0], names.length > 1 ? names : null);
}

function addSelectedTerritory() {
  const sel = document.getElementById('territory-select');
  if (!sel.value) return;
  addTerritory(sel.value);
  sel.value = '';
}

function addGuildTerritories() {
  const sel = document.getElementById('guild-select');
  if (!sel.value) return;
  const guildName = guildDisplayToName[sel.value] || sel.value;
  const wasEmpty = Object.keys(addedTerritories).length === 0;

  const namesToAdd = new Set();
  for (const [name, t] of Object.entries(territories)) {
    if (t.Guild && t.Guild.name === guildName) namesToAdd.add(name);
  }
  if (window.guildTerritoryMap && window.guildTerritoryMap[guildName]) {
    for (const name of window.guildTerritoryMap[guildName]) namesToAdd.add(name);
  }

  for (const name of namesToAdd) {
    if (!territories[name] || addedTerritories[name]) continue;
    let initialTreasury = 'Very Low';
    if (territories[name].Guild && territories[name].Guild.acquired) {
      initialTreasury = calculateTreasuryFromAcquired(territories[name].Guild.acquired);
    }
    addedTerritories[name] = { defense: { damage: 0, attack: 0, health: 0, defense: 0 }, bonuses: {}, hq: false, treasury: initialTreasury };
    selectedTerritories.delete(name);
  }

  sel.value = '';
  if (wasEmpty && Object.keys(addedTerritories).length > 0) autoAssignHQ();
  updateSelectedCount();
  refreshUI();
}

function toggleMobileSheet(panelId) {
  const panel = document.getElementById(panelId);
  const wasOpen = panel.classList.contains('sheet-open');
  document.getElementById('overview').classList.remove('sheet-open');
  document.getElementById('controls').classList.remove('sheet-open');
  document.querySelectorAll('.mobile-tab-btn').forEach(b => b.classList.remove('active'));
  if (!wasOpen) {
    panel.classList.add('sheet-open');
    const btn = document.querySelector(`.mobile-tab-btn[data-panel="${panelId}"]`);
    if (btn) btn.classList.add('active');
  }
}

function refreshUI() {
  _hqPathCache = null;
  _traversingCache = null;
  updateOverview();
  updateTerritoryList();
  draw();
}

// ═══════════════════════════════════════════════════════════
//  MODAL
// ═══════════════════════════════════════════════════════════
function getDefConfig(id) { return DEFENSE_TYPES.find(d => d.id === id); }
function getBonusConfig(name) { return BONUS_CONFIG.find(b => b.name === name); }

const UPGRADE_LAYOUT = [
  [
    { type: 'def', id: 'damage', name: 'Damage' },
    { type: 'def', id: 'attack', name: 'Attack Speed' },
    { type: 'def', id: 'health', name: 'Health' },
    { type: 'def', id: 'defense', name: 'Defense' }
  ],
  [
    { type: 'bonus', name: 'Stronger Minions' },
    { type: 'bonus', name: 'Tower Multi-Attacks' },
    { type: 'bonus', name: 'Tower Aura' },
    { type: 'bonus', name: 'Tower Volley' }
  ],
  [
    { type: 'bonus', name: 'Gathering Experience' },
    { type: 'bonus', name: 'Mob Experience' },
    { type: 'bonus', name: 'Mob Damage' },
    { type: 'bonus', name: 'PvP Damage' },
    { type: 'bonus', name: 'XP Seeking' },
    { type: 'bonus', name: 'Tome Seeking' },
    { type: 'bonus', name: 'Emerald Seeking' }
  ],
  [
    { type: 'bonus', name: 'Larger Resource Storage' },
    { type: 'bonus', name: 'Larger Emerald Storage' },
    { type: 'bonus', name: 'Efficient Resources' },
    { type: 'bonus', name: 'Efficient Emeralds' },
    { type: 'bonus', name: 'Resource Rate' },
    { type: 'bonus', name: 'Emerald Rate' }
  ]
];

function openModal(name, bulkNames = null) {
  const isBulk = bulkNames !== null;
  currentModalMode = isBulk ? 'bulk' : 'single';
  currentBulkTerritories = isBulk ? bulkNames : [];
  currentModalTerritory = isBulk ? null : name;

  const st = addedTerritories[name] || { defense: {}, bonuses: {}, hq: false, treasury: 'Very Low' };
  document.getElementById('modal-title').textContent = isBulk
    ? `Editing ${bulkNames.length} territories`
    : name;

  const count = isBulk ? bulkNames.length : 1;
  document.getElementById('upgrade-header').textContent = `Upgrades and Bonuses for selected territory (${count})`;
  document.getElementById('modal-hq').checked = isBulk ? false : !!st.hq;
  document.getElementById('hq-section').style.display = isBulk ? 'none' : '';

  const hasHQNow = Object.keys(addedTerritories).some(n => addedTerritories[n].hq);
  document.getElementById('modal-tabs').style.display = (!isBulk && hasHQNow) ? '' : 'none';
  switchModalTab('settings');
  
  const treasurySel = document.getElementById('modal-treasury');
  let noChangeOpt = treasurySel.querySelector('option[value=""]');
  if (isBulk) {
    if (!noChangeOpt) {
      noChangeOpt = document.createElement('option');
      noChangeOpt.value = "";
      noChangeOpt.textContent = "- No Change -";
      treasurySel.insertBefore(noChangeOpt, treasurySel.firstChild);
    }
    treasurySel.value = "";
  } else {
    if (noChangeOpt) treasurySel.removeChild(noChangeOpt);
    treasurySel.value = st.treasury || 'Very Low';
  }

  const upgradeInner = document.getElementById('upgrade-inner');
  upgradeInner.innerHTML = '';
  
  for (const row of UPGRADE_LAYOUT) {
    const rowEl = document.createElement('div');
    rowEl.className = 'upgrade-row';
    
    for (const item of row) {
      const itemEl = document.createElement('div');
      itemEl.className = 'upgrade-item';
      
      let currentLevel = 0;
      let maxLevel = 11;
      let isBonus = item.type === 'bonus';
      let cfg = null;
      let displayName = item.name;
      
      if (isBonus) {
        cfg = getBonusConfig(item.name);
        currentLevel = (st.bonuses || {})[item.name] || 0;
        maxLevel = cfg.maxLevel || 11;
      } else {
        cfg = getDefConfig(item.id);
        currentLevel = (st.defense || {})[item.id] || 0;
        displayName = cfg.name;
      }
      
      itemEl.title = `${displayName}\nClick to change level`;
      
      const iconName = displayName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const iconPath = `./assets/icons/upgrades/${iconName}.png`;
      
      itemEl.innerHTML = `
        <img src="${iconPath}" alt="${displayName}" onerror="this.src='./assets/icons/resources/emerald.png'">
        <div class="upgrade-level">${isBulk ? '-' : currentLevel}</div>
      `;
      
      const sel = document.createElement('select');
      sel.className = isBonus ? 'bonus-sel' : 'defense-sel';
      if (isBonus) sel.dataset.bonus = item.name;
      else sel.dataset.defId = item.id;
      sel.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; opacity:0; cursor:pointer; appearance:none; -webkit-appearance:none;';
      
      if (isBulk) {
        const opt = document.createElement('option');
        opt.value = "";
        opt.textContent = "- No Change -";
        sel.appendChild(opt);
      }
      
      for (let lv = 0; lv <= maxLevel; lv++) {
        const opt = document.createElement('option');
        opt.value = lv;
        
        if (isBonus) {
          const effText = cfg.levels ? cfg.levels[lv] : `Lv ${lv}`;
          if (lv === 0) {
            opt.textContent = `Lv 0: ${effText} (Free)`;
          } else {
            const cost = cfg.costs[lv];
            opt.textContent = `Lv ${lv}: ${effText} (-${fmt(cost)} ${cfg.resource}/hr)`;
          }
        } else {
          const cost = DEFENSE_COST_TABLE[lv];
          opt.textContent = lv === 0 ? 'Lv 0 (Free)' : `Lv ${lv} (-${fmt(cost)} ${cfg.resource}/hr)`;
        }
        
        if (!isBulk && lv === currentLevel) opt.selected = true;
        sel.appendChild(opt);
      }
      
      sel.addEventListener('change', (e) => {
        const val = e.target.value;
        itemEl.querySelector('.upgrade-level').textContent = val === "" ? "-" : val;
        updateModalStats();
      });
      
      itemEl.appendChild(sel);
      rowEl.appendChild(itemEl);
    }
    upgradeInner.appendChild(rowEl);
  }

  updateModalStats();
  document.getElementById('modal-overlay').classList.add('open');
}

function updateModalStats() {
  if (currentModalMode === 'bulk') {
    document.getElementById('modal-stats').innerHTML =
      `<div style="color:#64748b;font-size:12px;">Editing ${currentBulkTerritories.length} territories — settings will be applied to all.</div>`;
    return;
  }
  const name = currentModalTerritory;
  if (!name) return;

  const defense = {};
  document.querySelectorAll('.defense-sel').forEach(sel => {
    defense[sel.dataset.defId] = parseInt(sel.value) || 0;
  });
  const isHQ = document.getElementById('modal-hq').checked;
  const bonuses = {};
  document.querySelectorAll('.bonus-sel').forEach(sel => {
    bonuses[sel.dataset.bonus] = parseInt(sel.value) || 0;
  });

  const treasury = document.getElementById('modal-treasury').value || 'Very Low';
  const orig = addedTerritories[name];
  addedTerritories[name] = { defense, bonuses, hq: isHQ, treasury };

  const prod = calcTerritoryProduction(name);
  const cons = calcTerritoryConsumption(name);
  const stats = calcTerritoryDefenseStats(name);

  addedTerritories[name] = orig;

  let html = '';
  if (stats) {
    html += `<div class="stat-line"><span class="stat-label">Damage</span><span>${fmtNum(stats.finalDmgMin)}-${fmtNum(stats.finalDmgMax)}</span></div>`;
    html += `<div class="stat-line"><span class="stat-label">Attack Speed</span><span>${stats.atkSpd}x</span></div>`;
    html += `<div class="stat-line"><span class="stat-label">Health</span><span>${fmtNum(stats.boostedHp)}</span></div>`;
    html += `<div class="stat-line"><span class="stat-label">Defense</span><span>${stats.defPct}%</span></div>`;
    html += `<div class="stat-line"><span class="stat-label">Rating</span><span>${stats.rating} — EHP ${fmt(stats.finalHp)} / DPS ${fmt(stats.dps)}</span></div>`;
  }
  if (isHQ) html += `<div class="stat-line"><span class="stat-label">Role</span><span style="color:#fbbf24;">Headquarters</span></div>`;
  const buffPct = calcTreasuryBuff(name, getHQPaths().dist);
  if (buffPct > 0) {
    html += `<div class="stat-line"><span class="stat-label">Treasury Buff</span><span style="color:#4ade80">+${(buffPct * 100).toFixed(1)}%</span></div>`;
  }

  document.getElementById('modal-stats').innerHTML = html;
}

function saveModal() {
  if (currentModalMode === 'bulk') {
    const defenseToApply = {};
    document.querySelectorAll('.defense-sel').forEach(sel => {
      if (sel.value !== "") defenseToApply[sel.dataset.defId] = parseInt(sel.value);
    });
    const bonusesToApply = {};
    document.querySelectorAll('.bonus-sel').forEach(sel => {
      if (sel.value !== "") bonusesToApply[sel.dataset.bonus] = parseInt(sel.value);
    });
    const treasury = document.getElementById('modal-treasury').value;

    for (const n of currentBulkTerritories) {
      if (addedTerritories[n]) {
        for (const [k, v] of Object.entries(defenseToApply)) {
          addedTerritories[n].defense[k] = v;
        }
        for (const [k, v] of Object.entries(bonusesToApply)) {
          addedTerritories[n].bonuses[k] = v;
        }
        if (treasury !== "") {
          addedTerritories[n].treasury = treasury;
        }
      }
    }
    listSelectedTerritories.clear();
    closeModal();
    refreshUI();
    return;
  }

  const defense = {};
  document.querySelectorAll('.defense-sel').forEach(sel => {
    defense[sel.dataset.defId] = parseInt(sel.value) || 0;
  });
  const bonuses = {};
  document.querySelectorAll('.bonus-sel').forEach(sel => {
    bonuses[sel.dataset.bonus] = parseInt(sel.value) || 0;
  });
  const treasury = document.getElementById('modal-treasury').value || 'Very Low';

  const name = currentModalTerritory;
  if (!name) return;
  const isHQ = document.getElementById('modal-hq').checked;
  if (isHQ) {
    for (const n of Object.keys(addedTerritories)) addedTerritories[n].hq = false;
  }
  addedTerritories[name] = { defense, bonuses, hq: isHQ, treasury };
  closeModal();
  refreshUI();
}

function closeModal() {
  currentModalTerritory = null;
  currentModalMode = 'single';
  currentBulkTerritories = [];
  document.getElementById('hq-section').style.display = '';
  document.getElementById('modal-overlay').classList.remove('open');
}

// ═══════════════════════════════════════════════════════════
//  MODAL: SETTINGS / DATA TABS
// ═══════════════════════════════════════════════════════════
function switchModalTab(tab) {
  document.getElementById('modal-tab-settings').style.display = tab === 'settings' ? '' : 'none';
  document.getElementById('modal-tab-data').style.display = tab === 'data' ? '' : 'none';
  document.getElementById('modal-tab-btn-settings').classList.toggle('active', tab === 'settings');
  document.getElementById('modal-tab-btn-data').classList.toggle('active', tab === 'data');
  if (tab === 'data') renderDataTab(currentModalTerritory);
}

function renderDataTab(name) {
  if (!name) return;
  document.getElementById('data-trading-routes').innerHTML = renderTradingRoutesHTML(name);
  document.getElementById('data-resources').innerHTML = renderResourcesHTML(name);
}

function dataSectionBox(title, titleColor, inner) {
  return `<div style="font-family:'Minecraftia', sans-serif; background:#000000; border:2px solid #2C075F; border-radius:4px; padding:12px 14px; margin-bottom:12px;">
    <div style="color:${titleColor}; font-weight:bold; margin-bottom:6px;">${title}</div>
    ${inner}
  </div>`;
}

function renderTradingRoutesHTML(name) {
  const hqName = Object.keys(addedTerritories).find(n => addedTerritories[n].hq);
  if (!hqName) return dataSectionBox('Trading Routes', '#ffffff', `<div style="color:#ffffff;">${escapeHtml(name)}</div>`);

  if (name === hqName) {
    return dataSectionBox('Trading Routes', '#ffffff', `<div style="color:#ffffff;">${escapeHtml(hqName)}(HQ)</div>`);
  }

  const paths = getHQPaths();
  const dist = paths.dist[name];

  if (dist === undefined) {
    const inner = `<div style="color:#ffffff;">${escapeHtml(hqName)}(HQ)</div>` +
      `<div style="color:#FF5555;">→❌ ${escapeHtml(name)}</div>` +
      `<div style="color:#AA0000; margin-top:4px;">This territory has no pipeline to the HQ.</div>`;
    return dataSectionBox('Trading Routes', '#ffffff', inner);
  }

  const path = paths.path[name];
  let inner = `<div style="color:#ffffff;">${escapeHtml(hqName)}(HQ)</div>`;
  for (let i = 1; i < path.length; i++) {
    inner += `<div style="color:#ffffff;">→${escapeHtml(path[i])}</div>`;
  }
  inner += `<div style="color:#ffffff; margin-top:6px;">Trade Time: ${dist} min${dist === 1 ? '' : 's'}</div>`;
  return dataSectionBox('Trading Routes', '#ffffff', inner);
}

function renderResourcesHTML(name) {
  const st = addedTerritories[name];
  if (!st) return '';
  const prod = calcTerritoryProduction(name);
  const cons = calcTerritoryConsumption(name);
  const trav = calcTraversingResources()[name] || zeroCosts();

  const resStorageLv = (st.bonuses || {})['Larger Resource Storage'] || 0;
  const emStorageLv = (st.bonuses || {})['Larger Emerald Storage'] || 0;
  const maxEm = st.hq
    ? [5000, 10000, 20000, 40000, 75000, 170000, 400000][emStorageLv]
    : [3000, 6000, 12000, 24000, 45000, 102000, 240000][emStorageLv];
  const maxRes = st.hq
    ? [1500, 3000, 6000, 12000, 22500, 51000, 120000][resStorageLv]
    : [300, 600, 1200, 2400, 4500, 10200, 24000][resStorageLv];

  const ORDER = [
    { id: 'emeralds', color: '#55FF55', label: 'Emeralds', max: maxEm,  icon: false },
    { id: 'ore',      color: '#FFFFFF', label: 'Ore',      max: maxRes, icon: true },
    { id: 'wood',     color: '#FFAA00', label: 'Wood',     max: maxRes, icon: true },
    { id: 'fish',     color: '#55FFFF', label: 'Fish',     max: maxRes, icon: true },
    { id: 'crops',    color: '#FFFF55', label: 'Crops',    max: maxRes, icon: true }
  ];

  let inner = '';
  for (const r of ORDER) {
    const isZero = prod[r.id] === 0;
    const color = isZero ? '#555555' : r.color;
    const stored = Math.round((prod[r.id] + cons[r.id]) / 60);
    const storedColor = stored >= r.max ? '#FF5555' : color;
    const travMin = Math.round(trav[r.id] / 60);
    const iconHtml = r.icon
      ? RESOURCE_ICONS[r.id].replace('class="res-icon-img"', `class="res-icon-img${isZero ? ' gray-icon' : ''}"`)
      : '';

    inner += `<div style="color:${color};">${iconHtml}+${fmtNum(prod[r.id])} ${r.label} per Hour</div>`;
    inner += `<div style="color:${color};">${iconHtml}<span style="color:${storedColor};">${fmtNum(stored)}</span>/${fmtNum(r.max)} stored (${fmtNum(travMin)} traversing)</div>`;
  }

  return dataSectionBox('Resources', '#55FF55', inner);
}

function calcTraversingResources() {
  if (_traversingCache !== null) return _traversingCache;
  const result = {};
  for (const name of Object.keys(territories)) result[name] = zeroCosts();

  const hqName = Object.keys(addedTerritories).find(n => addedTerritories[n].hq);
  if (!hqName) return (_traversingCache = result);

  const paths = getHQPaths();
  for (const x of Object.keys(addedTerritories)) {
    if (x === hqName) continue;
    const path = paths.path[x];
    if (!path) continue;
    const midNodes = path.slice(1, -1);
    if (midNodes.length === 0) continue;
    const prod = calcTerritoryProduction(x);
    const cons = calcTerritoryConsumption(x);
    for (const y of midNodes) {
      for (const r of RESOURCES) {
        result[y][r] += (prod[r] || 0) + (cons[r] || 0);
      }
    }
  }
  return (_traversingCache = result);
}

document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

// ═══════════════════════════════════════════════════════════
//  TRIBUTES
// ═══════════════════════════════════════════════════════════
function openTributeModal() {
  document.getElementById('tribute-form').innerHTML = RESOURCES.map(r => `
    <div class="tribute-row">
      <label>${RESOURCE_ICONS[r]} ${r}</label>
      <input type="number" id="tribute-${r}" value="${tributeValues[r] || 0}" step="1000">
    </div>
  `).join('');
  document.getElementById('tribute-overlay').classList.add('open');
}

function closeTributeModal() {
  document.getElementById('tribute-overlay').classList.remove('open');
}

function saveTributes() {
  for (const r of RESOURCES) {
    tributeValues[r] = parseInt(document.getElementById(`tribute-${r}`).value) || 0;
  }
  closeTributeModal();
  updateOverview();
}

document.getElementById('tribute-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('tribute-overlay')) closeTributeModal();
});

// ═══════════════════════════════════════════════════════════
//  ADDITIONAL SETTINGS / CONNECTION EDITOR
// ═══════════════════════════════════════════════════════════
const ADDITIONAL_SETTINGS_ITEMS = [
  { label: 'Connection Editor', screen: 'connections' }
];

function openAdditionalSettings() {
  const list = document.getElementById('as-menu-list');
  list.innerHTML = ADDITIONAL_SETTINGS_ITEMS.map(item =>
    `<div class="as-menu-item" onclick="showASScreen('${item.screen}')"><span>${escapeHtml(item.label)}</span><span>›</span></div>`
  ).join('');
  showASScreen('menu');
  document.getElementById('additional-settings-overlay').classList.add('open');
}

function closeAdditionalSettings() {
  document.getElementById('additional-settings-overlay').classList.remove('open');
}

function showASScreen(screen) {
  document.getElementById('as-screen-menu').style.display = screen === 'menu' ? '' : 'none';
  document.getElementById('as-screen-connections').style.display = screen === 'connections' ? '' : 'none';
  if (screen === 'connections') {
    hideAddConnectionForm();
    renderConnectionList();
  }
}

function normalizeConnPair(a, b) {
  return a.localeCompare(b, 'en') <= 0 ? { a, b } : { a: b, b: a };
}

function isConnValid(conn) {
  return !!(addedTerritories[conn.a] && addedTerritories[conn.b]);
}

function toggleAddConnectionForm() {
  const form = document.getElementById('conn-add-form');
  if (form.style.display === 'none' || !form.style.display) {
    document.getElementById('conn-input-a').value = '';
    document.getElementById('conn-input-b').value = '';
    document.getElementById('conn-error').textContent = '';
    updateConnDatalists();
    form.style.display = '';
  } else {
    hideAddConnectionForm();
  }
}

function hideAddConnectionForm() {
  const form = document.getElementById('conn-add-form');
  form.style.display = 'none';
  document.getElementById('conn-error').textContent = '';
}

function updateConnDatalists() {
  const aVal = document.getElementById('conn-input-a').value;
  const bVal = document.getElementById('conn-input-b').value;
  const names = Object.keys(addedTerritories).sort((x, y) => x.localeCompare(y, 'en'));

  document.getElementById('conn-datalist-a').innerHTML =
    names.filter(n => n !== bVal).map(n => `<option value="${escapeHtml(n)}">`).join('');
  document.getElementById('conn-datalist-b').innerHTML =
    names.filter(n => n !== aVal).map(n => `<option value="${escapeHtml(n)}">`).join('');
}

function addCustomConnection() {
  const errEl = document.getElementById('conn-error');
  const aName = document.getElementById('conn-input-a').value.trim();
  const bName = document.getElementById('conn-input-b').value.trim();

  if (!aName || !bName) { errEl.textContent = 'Please enter both territories.'; return; }
  if (!territories[aName] || !territories[bName]) { errEl.textContent = 'Territory not found.'; return; }
  if (!addedTerritories[aName] || !addedTerritories[bName]) { errEl.textContent = 'Both territories must be registered.'; return; }
  if (aName === bName) { errEl.textContent = 'Cannot connect a territory to itself.'; return; }

  const baseRoutes = territories[aName]['Trading Routes'] || [];
  if (baseRoutes.includes(bName)) { errEl.textContent = 'This line already exists.'; return; }

  const pair = normalizeConnPair(aName, bName);
  if (customConnections.some(c => c.a === pair.a && c.b === pair.b)) {
    errEl.textContent = 'This line already exists.';
    return;
  }

  customConnections.push(pair);
  errEl.textContent = '';
  hideAddConnectionForm();
  renderConnectionList();
  refreshUI();
}

function removeCustomConnection(a, b) {
  customConnections = customConnections.filter(c => !(c.a === a && c.b === b));
  renderConnectionList();
  refreshUI();
}

function clearAllCustomConnections() {
  if (!confirm('Remove all custom connections?')) return;
  customConnections = [];
  renderConnectionList();
  refreshUI();
}

function renderConnectionList() {
  const list = document.getElementById('conn-list');
  if (customConnections.length === 0) {
    list.innerHTML = '<div style="color:#64748b;font-size:12px;padding:4px;">No custom connections.</div>';
    return;
  }
  const sorted = [...customConnections].sort((x, y) => {
    const c = x.a.localeCompare(y.a, 'en');
    return c !== 0 ? c : x.b.localeCompare(y.b, 'en');
  });
  list.innerHTML = sorted.map(conn => {
    const inactive = !isConnValid(conn);
    const safeA = escapeHtml(JSON.stringify(conn.a));
    const safeB = escapeHtml(JSON.stringify(conn.b));
    return `<div class="connection-item${inactive ? ' inactive' : ''}">
      <span>${escapeHtml(conn.a)} ↔ ${escapeHtml(conn.b)}</span>
      <button class="rm-btn" onclick="removeCustomConnection(${safeA}, ${safeB})">✕</button>
    </div>`;
  }).join('');
}

document.getElementById('conn-input-a').addEventListener('input', updateConnDatalists);
document.getElementById('conn-input-b').addEventListener('input', updateConnDatalists);

document.getElementById('additional-settings-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('additional-settings-overlay')) closeAdditionalSettings();
});

// ═══════════════════════════════════════════════════════════
//  SHARE LINK
// ═══════════════════════════════════════════════════════════
// ビットレイアウトの詳細はdocs/REQUIREMENTS.md 付録Aを参照。
// 領地IDは9bit固定のため、territory-ids.jsonの要素数が512を超えるとversion 4形式は破綻する。
// その場合はversionを5に上げ、IDのビット数を拡張した新形式を追加すること。
// bonusBitmapは17bit固定（BONUS_CONFIGの要素数と一致）。BONUS_CONFIGに要素を追加する場合は
// bonusBitmapのビット数も同時に更新し、versionを上げること。
class BitWriter {
  constructor() {
    this.bytes = [];
    this.curByte = 0;
    this.curBits = 0;
  }
  writeBits(value, numBits) {
    for (let i = numBits - 1; i >= 0; i--) {
      const bit = (value >>> i) & 1;
      this.curByte = (this.curByte << 1) | bit;
      this.curBits++;
      if (this.curBits === 8) {
        this.bytes.push(this.curByte);
        this.curByte = 0;
        this.curBits = 0;
      }
    }
  }
  toUint8Array() {
    if (this.curBits > 0) {
      this.bytes.push(this.curByte << (8 - this.curBits));
      this.curByte = 0;
      this.curBits = 0;
    }
    return new Uint8Array(this.bytes);
  }
}

class BitReader {
  constructor(bytes) {
    this.bytes = bytes;
    this.bytePos = 0;
    this.bitPos = 0;
  }
  readBits(numBits) {
    let value = 0;
    for (let i = 0; i < numBits; i++) {
      const byte = this.bytes[this.bytePos] || 0;
      const bit = (byte >>> (7 - this.bitPos)) & 1;
      value = (value << 1) | bit;
      this.bitPos++;
      if (this.bitPos === 8) { this.bitPos = 0; this.bytePos++; }
    }
    return value >>> 0;
  }
}

const TREASURY_STR_TO_INT_MAP = { 'Very Low': 0, 'Low': 1, 'Medium': 2, 'High': 3, 'Very High': 4 };
const TREASURY_INT_TO_STR_MAP = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
const TRIBUTE_ORDER = ['emeralds', 'ore', 'crops', 'fish', 'wood'];

function buildShareBits() {
  const w = new BitWriter();
  w.writeBits(4, 4); // version

  const entries = Object.entries(addedTerritories).filter(([name]) => TERRITORY_ID_MAP[name] !== undefined);
  const skipped = Object.keys(addedTerritories).length - entries.length;
  if (skipped > 0) console.warn(`${skipped}件の領地がterritory-ids.jsonに存在しないためShare Linkから除外されました`);

  w.writeBits(entries.length, 12);

  for (const [name, st] of entries) {
    w.writeBits(TERRITORY_ID_MAP[name], 9);
    w.writeBits(st.hq ? 1 : 0, 1);
    w.writeBits(TREASURY_STR_TO_INT_MAP[st.treasury || 'Very Low'] || 0, 3);

    const d = st.defense || {};
    const dVals = [d.damage || 0, d.attack || 0, d.health || 0, d.defense || 0];
    const hasDef = dVals.some(v => v !== 0);
    w.writeBits(hasDef ? 1 : 0, 1);
    if (hasDef) for (const v of dVals) w.writeBits(v, 4);

    const bonusFlags = BONUS_CONFIG.map(b => ((st.bonuses || {})[b.name] || 0) !== 0);
    const hasBonus = bonusFlags.some(f => f);
    w.writeBits(hasBonus ? 1 : 0, 1);
    if (hasBonus) {
      for (const f of bonusFlags) w.writeBits(f ? 1 : 0, 1);
      for (let i = 0; i < BONUS_CONFIG.length; i++) {
        if (bonusFlags[i]) w.writeBits((st.bonuses || {})[BONUS_CONFIG[i].name] || 0, 4);
      }
    }
  }

  const validConns = customConnections.filter(c => TERRITORY_ID_MAP[c.a] !== undefined && TERRITORY_ID_MAP[c.b] !== undefined);
  w.writeBits(validConns.length, 10);
  for (const c of validConns) {
    w.writeBits(TERRITORY_ID_MAP[c.a], 9);
    w.writeBits(TERRITORY_ID_MAP[c.b], 9);
  }

  const tribFlags = TRIBUTE_ORDER.map(r => (tributeValues[r] || 0) !== 0);
  for (const f of tribFlags) w.writeBits(f ? 1 : 0, 1);
  for (let i = 0; i < TRIBUTE_ORDER.length; i++) {
    if (tribFlags[i]) {
      const v = Math.round(tributeValues[TRIBUTE_ORDER[i]]);
      const sign = v < 0 ? 1 : 0;
      const mag = Math.min(Math.abs(v), 16777215);
      w.writeBits(sign, 1);
      w.writeBits(mag, 24);
    }
  }

  return w.toUint8Array();
}

function parseShareBits(bytes) {
  const r = new BitReader(bytes);
  r.readBits(4); // version（現状 v4 のみ）
  const territoryCount = r.readBits(12);

  const newAdded = {};
  for (let i = 0; i < territoryCount; i++) {
    const id = r.readBits(9);
    const hq = r.readBits(1) === 1;
    const treasuryInt = r.readBits(3);

    const hasDef = r.readBits(1) === 1;
    let defense = { damage: 0, attack: 0, health: 0, defense: 0 };
    if (hasDef) {
      defense = { damage: r.readBits(4), attack: r.readBits(4), health: r.readBits(4), defense: r.readBits(4) };
    }

    const hasBonus = r.readBits(1) === 1;
    const bonuses = {};
    if (hasBonus) {
      const flags = [];
      for (let b = 0; b < BONUS_CONFIG.length; b++) flags.push(r.readBits(1) === 1);
      for (let b = 0; b < BONUS_CONFIG.length; b++) {
        if (flags[b]) bonuses[BONUS_CONFIG[b].name] = r.readBits(4);
      }
    }

    const name = TERRITORY_IDS[id];
    if (name === undefined || !territories[name]) continue;
    newAdded[name] = { defense, bonuses, hq, treasury: TREASURY_INT_TO_STR_MAP[treasuryInt] || 'Very Low' };
  }

  const connCount = r.readBits(10);
  const newConns = [];
  for (let i = 0; i < connCount; i++) {
    const aId = r.readBits(9);
    const bId = r.readBits(9);
    const aName = TERRITORY_IDS[aId];
    const bName = TERRITORY_IDS[bId];
    if (aName === undefined || bName === undefined || !territories[aName] || !territories[bName]) continue;
    newConns.push(normalizeConnPair(aName, bName));
  }

  const tribFlags = [];
  for (let i = 0; i < TRIBUTE_ORDER.length; i++) tribFlags.push(r.readBits(1) === 1);
  const newTribute = { emeralds: 0, ore: 0, crops: 0, fish: 0, wood: 0 };
  for (let i = 0; i < TRIBUTE_ORDER.length; i++) {
    if (tribFlags[i]) {
      const sign = r.readBits(1);
      const mag = r.readBits(24);
      newTribute[TRIBUTE_ORDER[i]] = sign ? -mag : mag;
    }
  }

  return { addedTerritories: newAdded, customConnections: newConns, tributeValues: newTribute };
}

function getShareState() {
  const BONUS_NAME_TO_IDX = {};
  BONUS_CONFIG.forEach((b, i) => BONUS_NAME_TO_IDX[b.name] = i);
  const TREASURY_STR_TO_INT = { 'Very Low': 0, 'Low': 1, 'Medium': 2, 'High': 3, 'Very High': 4 };

  const tData = Object.entries(addedTerritories).map(([name, st]) => {
    const item = { n: name };
    if (st.hq) item.h = 1;
    
    let d = [
      (st.defense && st.defense.damage) || 0,
      (st.defense && st.defense.attack) || 0,
      (st.defense && st.defense.health) || 0,
      (st.defense && st.defense.defense) || 0
    ];
    while (d.length > 0 && d[d.length - 1] === 0) d.pop();
    if (d.length > 0) item.d = d;

    const b = {};
    let hasBonus = false;
    for (const [k, v] of Object.entries(st.bonuses || {})) {
      if (v) {
        b[BONUS_NAME_TO_IDX[k]] = v;
        hasBonus = true;
      }
    }
    if (hasBonus) item.b = b;

    const tl = TREASURY_STR_TO_INT[st.treasury || 'Very Low'] || 0;
    if (tl > 0) item.t = tl;

    return item;
  });

  const tr = {};
  for (const [k, v] of Object.entries(tributeValues)) { if (v) tr[k] = v; }
  
  const state = { v: 3, t: tData };
  if (Object.keys(tr).length > 0) state.tr = tr;
  return state;
}

async function copyShareLink() {
  const btn = document.getElementById('share-btn');
  btn.textContent = '⏳';

  let url = '';

  try {
    if (typeof CompressionStream === 'undefined') throw new Error('CompressionStream not supported');
    if (Object.keys(TERRITORY_ID_MAP).length === 0) throw new Error('territory-ids.json not loaded');

    const bytes = buildShareBits();
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const buffer = await new Response(stream).arrayBuffer();
    const outBytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < outBytes.byteLength; i++) {
      binary += String.fromCharCode(outBytes[i]);
    }
    const b64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    url = `${location.origin}${location.pathname}#p=${b64}`;
  } catch (err) {
    console.warn('Bit-packed share link failed, falling back to uncompressed JSON', err);
    const stateStr = JSON.stringify(getShareState());
    const encoded = btoa(unescape(encodeURIComponent(stateStr)));
    url = `${location.origin}${location.pathname}#s=${encoded}`;
  }

  try {
    await navigator.clipboard.writeText(url);
    btn.textContent = '✅';
  } catch (err) {
    prompt('Copy this link:', url);
    btn.textContent = '✅';
  }
  
  setTimeout(() => { btn.textContent = '🔗'; }, 2000);
}

async function loadFromHash() {
  if (!location.hash) return;

  if (location.hash.startsWith('#p=')) {
    try {
      let base64 = location.hash.slice(3).replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      const buffer = await new Response(stream).arrayBuffer();
      const parsed = parseShareBits(new Uint8Array(buffer));
      addedTerritories = parsed.addedTerritories;
      customConnections = parsed.customConnections;
      tributeValues = parsed.tributeValues;
      _hqPathCache = null;
      _traversingCache = null;
      refreshUI();
    } catch (e) {
      console.warn('Failed to load #p= hash:', e);
    }
    return;
  }

  let stateStr = null;
  if (location.hash.startsWith('#c=')) {
    try {
      let base64 = location.hash.slice(3).replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      stateStr = await new Response(stream).text();
    } catch(e) { console.warn('Decompression failed', e); }
  } else if (location.hash.startsWith('#s=')) {
    try {
      stateStr = decodeURIComponent(escape(atob(location.hash.slice(3))));
    } catch(e) { console.warn('Base64 decode failed', e); }
  }
  
  if (!stateStr) return;

  try {
    const state = JSON.parse(stateStr);
    
    tributeValues = { emeralds: 0, ore: 0, crops: 0, fish: 0, wood: 0 };
    addedTerritories = {};
    customConnections = [];

    if (state.tr) {
      for (const r of RESOURCES) tributeValues[r] = state.tr[r] || 0;
    }
    
    if (state.t) {
      const BONUS_IDX_TO_NAME = BONUS_CONFIG.map(b => b.name);
      const TREASURY_INT_TO_STR = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];

      for (const item of state.t) {
        if (!territories[item.n]) continue;
        
        if (state.v === 3) {
          const defense = { damage: 0, attack: 0, health: 0, defense: 0 };
          if (item.d) {
            defense.damage = item.d[0] || 0;
            defense.attack = item.d[1] || 0;
            defense.health = item.d[2] || 0;
            defense.defense = item.d[3] || 0;
          }
          const bonuses = {};
          if (item.b) {
            for (const [idx, v] of Object.entries(item.b)) {
              if (BONUS_IDX_TO_NAME[idx]) bonuses[BONUS_IDX_TO_NAME[idx]] = v;
            }
          }
          addedTerritories[item.n] = {
            defense,
            bonuses,
            hq: item.h === 1,
            treasury: TREASURY_INT_TO_STR[item.t || 0] || 'Very Low'
          };
        } else if (state.v === 1 || state.v === 2) {
          addedTerritories[item.n] = {
            defense: { damage: 0, attack: 0, health: 0, defense: 0, ...item.d },
            bonuses: item.b || {},
            hq: item.hq || false,
            treasury: item.tl || 'Very Low'
          };
        }
      }
    }
    _hqPathCache = null;
    _traversingCache = null;
    refreshUI();
  } catch (e) {
    console.warn('Failed to load from hash:', e);
  }
}

// ═══════════════════════════════════════════════════════════
//  GUILD API
// ═══════════════════════════════════════════════════════════
window.guildTerritoryMap = {};
let guildDisplayToName = {};  // 表示文字列 → 本来のギルド名（Android Chromeのdatalistがvalueしか表示しないための対応）

async function loadGuilds() {
  const input = document.getElementById('guild-select');
  const dl = document.getElementById('guild-list-options');
  try {
    const res = await fetch('https://corsproxy.io/?https://api.wynncraft.com/v3/guild/list/territory');
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();

    const guildMap = {};
    for (const [territoryName, info] of Object.entries(data)) {
      const guildInfo = info.guild;
      if (!guildInfo || !guildInfo.name) continue;

      const guildName = guildInfo.name;
      if (!guildMap[guildName]) {
        guildMap[guildName] = { prefix: guildInfo.prefix || '', territories: [] };
      }
      guildMap[guildName].territories.push(territoryName);

      if (territories[territoryName]) {
        territories[territoryName].Guild = {
          name: guildName,
          prefix: guildInfo.prefix || '',
          uuid: guildInfo.uuid || '',
          acquired: info.acquired || null
        };
      }
    }

    window.guildTerritoryMap = {};
    guildDisplayToName = {};
    const sortedGuilds = Object.keys(guildMap).sort();

    if (dl) {
      dl.innerHTML = sortedGuilds.map(g => {
        window.guildTerritoryMap[g] = guildMap[g].territories;
        const prefix = guildMap[g].prefix;
        const count = guildMap[g].territories.length;
        const display = prefix ? `[${prefix}] ${g} (${count})` : `${g} (${count})`;
        guildDisplayToName[display] = g;
        return `<option value="${escapeHtml(display)}">`;
      }).join('');
    }
    if (input) input.placeholder = "Type to search guild...";
  } catch (err) {
    const errMsg = err.message || 'Unknown Error';
    if (input) input.placeholder = `API error: ${errMsg}`;
    console.warn('Guild API error:', err);
  }
}

// ═══════════════════════════════════════════════════════════
//  INITIALISATION
// ═══════════════════════════════════════════════════════════
async function init() {
  try {
    const res = await fetch('./territories.json');
    territories = await res.json();
  } catch (e) {
    console.error('Failed to load territories.json', e);
    territories = {};
  }

  try {
    const idsRes = await fetch('./territory-ids.json');
    TERRITORY_IDS = await idsRes.json();
    TERRITORY_ID_MAP = {};
    TERRITORY_IDS.forEach((n, i) => { TERRITORY_ID_MAP[n] = i; });
  } catch (e) {
    console.warn('Failed to load territory-ids.json; share links will fall back to the legacy #s= format', e);
    TERRITORY_IDS = [];
    TERRITORY_ID_MAP = {};
  }

  const sorted = Object.keys(territories).sort();
  const dl = document.getElementById('territory-list-options');
  if (dl) dl.innerHTML = sorted.map(n => `<option value="${escapeHtml(n)}">`).join('');

  mapImage = new Image();
  mapImage.onload = () => {
    const scaleX = window.innerWidth / MAP_CONFIG.imageWidth;
    const scaleY = window.innerHeight / MAP_CONFIG.imageHeight;
    scale = Math.min(scaleX, scaleY) * 0.9;
    panX = (window.innerWidth - MAP_CONFIG.imageWidth * scale) / 2;
    panY = (window.innerHeight - MAP_CONFIG.imageHeight * scale) / 2;
    draw();
  };
  mapImage.onerror = () => {
    scale = Math.min(window.innerWidth / MAP_CONFIG.imageWidth, window.innerHeight / MAP_CONFIG.imageHeight) * 0.9;
    panX = (window.innerWidth - MAP_CONFIG.imageWidth * scale) / 2;
    panY = (window.innerHeight - MAP_CONFIG.imageHeight * scale) / 2;
    draw();
  };
  mapImage.src = MAP_CONFIG.imagePath;

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  document.getElementById('loading').style.display = 'none';

  loadGuilds();
  await loadFromHash();
  if (Object.keys(addedTerritories).length === 0) {
    updateOverview();
    updateTerritoryList();
  }
  
  document.fonts.ready.then(() => draw());
}

init();
