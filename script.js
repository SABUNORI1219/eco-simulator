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
let _hqDistanceCache = null;
let tributeValues = { emeralds: 0, ore: 0, crops: 0, fish: 0, wood: 0 };
let currentModalMode = 'single'; // 'single' | 'bulk'
let currentBulkTerritories = [];

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
  const W = canvas.width, H = canvas.height;
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
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
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
      if (isHQ) {
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
//  TOOLTIP
// ═══════════════════════════════════════════════════════════
const tooltip = document.getElementById('tooltip');

function showTooltip(mx, my, name) {
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
  const buffPct = calcTreasuryBuff(name, getHQDistances());
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

      const currT = territories[curr];
      if (currT && currT['Trading Routes']) {
        for (const conn of currT['Trading Routes']) {
          if (!visited.has(conn)) queue.push({ curr: conn, dist: dist + 1 });
        }
      }
    }
    connections = connSet.size;
    externals = extSet.size;
    mult = (1.5 + (0.25 * externals)) * (1.0 + (0.30 * connections));
  } else {
    if (t['Trading Routes']) {
      for (const route of t['Trading Routes']) {
        if (addedTerritories[route]) connections++;
      }
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

  if (st.hq) rating = "Very High";

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
  
  const treasBuff = 1 + calcTreasuryBuff(name, getHQDistances());

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

function getHQDistances() {
  if (_hqDistanceCache !== null) return _hqDistanceCache;
  const hqName = Object.keys(addedTerritories).find(n => addedTerritories[n].hq);
  if (!hqName) return (_hqDistanceCache = {});
  const dist = { [hqName]: 0 };
  const queue = [hqName];
  while (queue.length > 0) {
    const curr = queue.shift();
    const t = territories[curr];
    if (!t || !t['Trading Routes']) continue;
    for (const nb of t['Trading Routes']) {
      if (dist[nb] === undefined) { dist[nb] = dist[curr] + 1; queue.push(nb); }
    }
  }
  return (_hqDistanceCache = dist);
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

  list.innerHTML = sortedNames.map(name => {
    const isSel = listSelectedTerritories.has(name);
    const safeNameArg = escapeHtml(JSON.stringify(name));
    const iconHTML = getTerritoryListIconHTML(name);
    return `<div class="territory-item${isSel ? ' list-selected' : ''}" onclick="toggleListSelection(${safeNameArg})">
      <div class="territory-item-left">
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
function addTerritory(name) {
  if (!territories[name]) return;
  if (!addedTerritories[name]) {
    let initialTreasury = 'Very Low';
    if (territories[name].Guild && territories[name].Guild.acquired) {
      initialTreasury = calculateTreasuryFromAcquired(territories[name].Guild.acquired);
    }
    addedTerritories[name] = { defense: { damage: 0, attack: 0, health: 0, defense: 0 }, bonuses: {}, hq: false, treasury: initialTreasury };
  }
  selectedTerritories.delete(name);
  updateSelectedCount();
  refreshUI();
}

function addSelectedTerritories() {
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
  if (names.length === 0) return;
  if (!confirm(`Reset upgrades and bonuses for ${names.length} selected territories?`)) return;
  for (const n of names) {
    addedTerritories[n].defense = { damage: 0, attack: 0, health: 0, defense: 0 };
    addedTerritories[n].bonuses = {};
  }
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
  const guildName = sel.value;

  for (const [name, t] of Object.entries(territories)) {
    if (t.Guild && t.Guild.name === guildName) addTerritory(name);
  }
  if (window.guildTerritoryMap && window.guildTerritoryMap[guildName]) {
    for (const name of window.guildTerritoryMap[guildName]) addTerritory(name);
  }
  sel.value = '';
  refreshUI();
}

function refreshUI() {
  _hqDistanceCache = null;
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
  const buffPct = calcTreasuryBuff(name, getHQDistances());
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
//  SHARE LINK
// ═══════════════════════════════════════════════════════════
function getShareState() {
  const tData = Object.entries(addedTerritories).map(([name, st]) => {
    const d = {};
    for (const [k, v] of Object.entries(st.defense || {})) { if (v) d[k] = v; }
    const b = {};
    for (const [k, v] of Object.entries(st.bonuses || {})) { if (v) b[k] = v; }
    const tl = st.treasury || 'Very Low';
    return { n: name, hq: st.hq || false, d, b, tl };
  });
  const tr = {};
  for (const [k, v] of Object.entries(tributeValues)) { if (v) tr[k] = v; }
  return { v: 2, tr, t: tData };
}

function copyShareLink() {
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(getShareState()))));
  const url = `${location.origin}${location.pathname}#s=${encoded}`;
  const btn = document.getElementById('share-btn');
  navigator.clipboard.writeText(url).then(() => {
    btn.textContent = '✅';
    setTimeout(() => { btn.textContent = '🔗'; }, 2000);
  }).catch(() => { prompt('Copy this link:', url); });
}

function loadFromHash() {
  if (!location.hash.startsWith('#s=')) return;
  try {
    const state = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(3)))));
    if (state.v !== 1 && state.v !== 2) return;
    if (state.tr) {
      for (const r of RESOURCES) tributeValues[r] = state.tr[r] || 0;
    }
    if (state.t) {
      addedTerritories = {};
      for (const item of state.t) {
        if (!territories[item.n]) continue;
        addedTerritories[item.n] = {
          defense: { damage: 0, attack: 0, health: 0, defense: 0, ...item.d },
          bonuses: item.b || {},
          hq: item.hq || false,
          treasury: item.tl || 'Very Low'
        };
      }
    }
    _hqDistanceCache = null;
    refreshUI();
  } catch (e) {
    console.warn('Failed to load from hash:', e);
  }
}

// ═══════════════════════════════════════════════════════════
//  GUILD API
// ═══════════════════════════════════════════════════════════
window.guildTerritoryMap = {};

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
    const sortedGuilds = Object.keys(guildMap).sort();
    
    if (dl) {
      dl.innerHTML = sortedGuilds.map(g => {
        window.guildTerritoryMap[g] = guildMap[g].territories;
        const prefix = guildMap[g].prefix;
        const count = guildMap[g].territories.length;
        const prefixStr = prefix ? `[${escapeHtml(prefix)}] ` : '';
        return `<option value="${escapeHtml(g)}">${prefixStr}${escapeHtml(g)} (${count})</option>`;
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
  loadFromHash();
  if (Object.keys(addedTerritories).length === 0) {
    updateOverview();
    updateTerritoryList();
  }
  
  document.fonts.ready.then(() => draw());
}

init();
