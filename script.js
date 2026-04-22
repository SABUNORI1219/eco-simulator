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
  { health: 1800000, defense: 82.0, damageMin: 3800, damageMax: 5700, attackSpeed: 3.0 },
  { health: 2160000, defense: 84.0, damageMin: 4200, damageMax: 6300, attackSpeed: 3.6 },
  { health: 2280000, defense: 86.0, damageMin: 4600, damageMax: 6900, attackSpeed: 3.8 },
  { health: 2580000, defense: 88.0, damageMin: 5000, damageMax: 7500, attackSpeed: 4.2 },
  { health: 2820000, defense: 90.0, damageMin: 5400, damageMax: 8100, attackSpeed: 4.7 }
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
const RESOURCE_ICONS  = { emeralds: '💎', ore: '⛏️', crops: '🌾', fish: '🐟', wood: '🪵' };
const RESOURCE_COLORS = { emeralds: '#4ade80', ore: '#94a3b8', crops: '#facc15', fish: '#38bdf8', wood: '#a16207' };

// ═══════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════
let territories = {};
let addedTerritories = {};  // name -> { defense, bonuses: {bonusName: level}, hq }
let currentModalTerritory = null;
let mapImage = null;

// Pan/Zoom
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let panX = 0, panY = 0, scale = 1;
let isDragging = false, dragStart = { x: 0, y: 0 };
let lastMousePos = { x: 0, y: 0 };
let hoveredTerritory = null;

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
  const hit = hitTest(e.clientX, e.clientY);
  if (hit !== hoveredTerritory) {
    hoveredTerritory = hit;
    draw();
  }
  if (hit) {
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

// ─── Touch support ───
let lastTouchDist = 0;
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (e.touches.length === 1) {
    isDragging = true;
    dragStart = { x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY };
  } else if (e.touches.length === 2) {
    isDragging = false;
    lastTouchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (e.touches.length === 1 && isDragging) {
    panX = e.touches[0].clientX - dragStart.x;
    panY = e.touches[0].clientY - dragStart.y;
    clampPan();
    draw();
  } else if (e.touches.length === 2) {
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    const factor = dist / lastTouchDist;
    const newScale = Math.max(0.03, Math.min(8, scale * factor));
    const ratio = newScale / scale;
    panX = cx - ratio * (cx - panX);
    panY = cy - ratio * (cy - panY);
    scale = newScale;
    lastTouchDist = dist;
    clampPan();
    draw();
  }
}, { passive: false });

canvas.addEventListener('touchend', () => {
  isDragging = false;
});

// ═══════════════════════════════════════════════════════════
//  HIT DETECTION
// ═══════════════════════════════════════════════════════════
function hitTest(cx, cy) {
  for (const name of Object.keys(addedTerritories)) {
    const t = territories[name];
    if (!t) continue;
    const loc = t.Location;
    const p1 = gameToCanvas(loc.start[0], loc.start[1]);
    const p2 = gameToCanvas(loc.end[0], loc.end[1]);
    const x1 = Math.min(p1.x, p2.x), x2 = Math.max(p1.x, p2.x);
    const y1 = Math.min(p1.y, p2.y), y2 = Math.max(p1.y, p2.y);
    if (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2) return name;
  }
  return null;
}

function handleClick(cx, cy) {
  const hit = hitTest(cx, cy);
  if (hit) openModal(hit);
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
  ctx.lineWidth = Math.max(1, scale * 3);

  for (const [name, t] of Object.entries(territories)) {
    if (!t['Trading Routes']) continue;
    for (const neighbor of t['Trading Routes']) {
      const key = [name, neighbor].sort().join('|');
      if (drawn.has(key)) continue;
      drawn.add(key);

      if (!territories[neighbor]) continue;

      const c1 = territoryCenter(name);
      const c2 = territoryCenter(neighbor);

      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.beginPath();
      ctx.moveTo(c1.x, c1.y);
      ctx.lineTo(c2.x, c2.y);
      ctx.stroke();
    }
  }
  ctx.restore();
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

    if (!isAdded && scale < 0.05) continue;

    if (isAdded) {
      ctx.fillStyle = isHQ
        ? 'rgba(251,191,36,0.25)'
        : isHovered
          ? 'rgba(74,222,128,0.25)'
          : 'rgba(74,222,128,0.12)';
      ctx.fillRect(x, y, w, h);
    } else if (isHovered) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x, y, w, h);
    }

    ctx.lineWidth = isAdded ? Math.max(1.0, scale * 1.2) : (isHovered ? Math.max(1.5, scale * 1.5) : Math.max(0.5, scale * 0.8));
    ctx.strokeStyle = isHQ ? '#fbbf24' : isAdded ? '#22c55e' : '#ffffff';
    ctx.strokeRect(x, y, w, h);

    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;

    if (isAdded && scale > 0.06) {
      ctx.font = `${Math.max(12, scale * 16)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isHQ ? '⭐' : '🏴', cx, cy);
    }

    if (scale > 0.25) {
      const fontSize = Math.min(14, Math.max(7, scale * 10));
      ctx.font = `${fontSize}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = isAdded ? '#fff' : 'rgba(255,255,255,0.95)';
      ctx.textAlign = 'center';
      ctx.textBaseline = isAdded && scale > 0.06 ? 'top' : 'middle';
      ctx.fillText(name, cx, isAdded && scale > 0.06 ? cy + fontSize * 0.8 : cy);
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

  let html = `<h4>${name}</h4>`;
  if (st.hq) html += `<div style="color:#fbbf24;margin-bottom:6px;">⭐ Headquarters</div>`;
  if (stats) {
    html += `<div style="color:#64748b;font-size:11px;margin-bottom:6px;">
      Damage: ${fmt(stats.finalDmgMin)}-${fmt(stats.finalDmgMax)}<br>
      Attack Speed: ${stats.atkSpd}x<br>
      Health: ${fmt(stats.boostedHp)}<br>
      Defense: ${stats.defPct}%<br>
      Rating: ${stats.rating} — EHP ${fmt(stats.finalHp)} / DPS ${fmt(stats.dps)}<br>
      Conn. Bonus: +${Math.round((stats.mult - 1) * 100)}%</div>`;
  }
  html += `<div style="font-size:11px;color:#64748b;margin-bottom:4px;">Production / Consumption</div>`;

  for (const r of RESOURCES) {
    const p = prod[r], c = cons[r];
    if (p === 0 && c === 0) continue;
    const net = p - c;
    const col = net >= 0 ? '#60a5fa' : '#f87171';
    html += `<div class="tt-row">
      <span class="tt-label">${RESOURCE_ICONS[r]} ${r}</span>
      <span class="tt-val" style="color:${col}">${fmt(p)} / ${fmt(c)} (${net >= 0 ? '+' : ''}${fmt(net)})</span>
    </div>`;
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
  if (t['Trading Routes']) {
    for (const route of t['Trading Routes']) {
      if (addedTerritories[route]) connections++;
    }
  }

  const mult = 1.0 + (0.3 * connections);
  
  const hLevel = st.defense.health || 0;
  const dLevel = st.defense.damage || 0;
  const aLevel = st.defense.attack || 0;
  const defLevel = st.defense.defense || 0;

  const baseHp = DEFENSE_LEVEL_STATS[hLevel].health;
  const defPct = DEFENSE_LEVEL_STATS[defLevel].defense;
  const dmgMin = DEFENSE_LEVEL_STATS[dLevel].damageMin;
  const dmgMax = DEFENSE_LEVEL_STATS[dLevel].damageMax;
  const atkSpd = DEFENSE_LEVEL_STATS[aLevel].attackSpeed;

  const boostedHp = baseHp * mult;
  const boostedHp = Math.round(baseHp * mult);
  const finalHp = Math.round(boostedHp / (1 - defPct / 100));
  const finalDmgMin = Math.round(dmgMin * mult);
  const finalDmgMax = Math.round(dmgMax * mult);
  const avgDmg = (dmgMin + dmgMax) / 2;
  const finalAvgDmg = avgDmg * mult;
  const dps = Math.round(finalAvgDmg * atkSpd);

  const totalLevels = hLevel + dLevel + aLevel + defLevel;
  const auraLevel = (st.bonuses || {})["Tower Aura"] || 0;
  const volleyLevel = (st.bonuses || {})["Tower Volley"] || 0;
  let difficulty = hLevel + dLevel + aLevel + defLevel;
  difficulty += auraLevel > 0 ? auraLevel + 5 : -5;
  difficulty += volleyLevel > 0 ? volleyLevel + 3 : -3;

  let rating = "Very Low";
  if (totalLevels >= 36) rating = "Very High";
  else if (totalLevels >= 27) rating = "High";
  else if (totalLevels >= 18) rating = "Medium";
  else if (totalLevels >= 9) rating = "Low";
  if (difficulty >= 49) rating = "Very High";
  else if (difficulty >= 31) rating = "High";
  else if (difficulty >= 19) rating = "Medium";
  else if (difficulty >= 6) rating = "Low";

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
  
  const result = { ...base };
  result.emeralds = Math.round(base.emeralds * effEmMult * rateEmMult);
  for (const r of ['ore', 'crops', 'wood', 'fish']) {
    result[r] = Math.round(base[r] * effResMult * rateResMult);
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
    for (let lv = 1; lv <= level; lv++) {
      const c = calcBonusCostForLevel(bcfg, lv);
      for (const r of RESOURCES) result[r] += c[r] || 0;
    }
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
  let html = '';

  for (const r of RESOURCES) {
    const prod = production[r];
    const cons = consumption[r];
    const net = prod - cons;
    const pct = prod > 0 ? Math.min(100, (cons / prod) * 100) : (cons > 0 ? 100 : 0);
    const netCls = net >= 0 ? 'pos' : 'neg';
    const netStr = (net >= 0 ? '+' : '') + fmt(net) + '/hr';
    const col = RESOURCE_COLORS[r];

    html += `
    <div class="res-row">
      <div class="res-header">
        <span class="res-icon">${RESOURCE_ICONS[r]}</span>
        <span class="res-name">${r}</span>
        <span class="res-net ${netCls}">${netStr}</span>
      </div>
      <div class="res-detail">Prod: ${fmt(prod)}/hr &nbsp;|&nbsp; Cons: ${fmt(cons)}/hr &nbsp;|&nbsp; ${pct.toFixed(1)}% used</div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${pct}%;background:${col};"></div>
      </div>
    </div>
    <hr class="divider">`;
  }
  body.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
//  TERRITORY LIST
// ═══════════════════════════════════════════════════════════
function updateTerritoryList() {
  const list = document.getElementById('territory-list');
  const count = Object.keys(addedTerritories).length;
  document.getElementById('added-count').textContent = count;

  if (count === 0) {
    list.innerHTML = '<div style="color:#64748b;font-size:12px;padding:4px;">No territories added.</div>';
    return;
  }

  list.innerHTML = Object.keys(addedTerritories).map(name => {
    const st = addedTerritories[name];
    return `<div class="territory-item" onclick="openModal('${escapeHtml(name)}')">
      <span>${st.hq ? '⭐ ' : '🏴 '}${name}</span>
      <button class="rm-btn" onclick="event.stopPropagation();removeTerritory('${escapeHtml(name)}')">✕</button>
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
    addedTerritories[name] = { defense: { damage: 0, attack: 0, health: 0, defense: 0 }, bonuses: {}, hq: false };
  }
  refreshUI();
}

function removeTerritory(name) {
  delete addedTerritories[name];
  refreshUI();
}

function clearAllTerritories() {
  if (!confirm('Remove all territories?')) return;
  addedTerritories = {};
  refreshUI();
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
  refreshUI();
}

function refreshUI() {
  updateOverview();
  updateTerritoryList();
  draw();
}

// ═══════════════════════════════════════════════════════════
//  MODAL
// ═══════════════════════════════════════════════════════════
function openModal(name) {
  currentModalTerritory = name;
  const st = addedTerritories[name];
  document.getElementById('modal-title').textContent = name;
  document.getElementById('modal-hq').checked = !!st.hq;

  const defGrid = document.getElementById('defense-grid');
  defGrid.innerHTML = '';
  for (const dt of DEFENSE_TYPES) {
    const level = (st.defense || {})[dt.id] || 0;
    
    const nameEl = document.createElement('div');
    nameEl.className = 'bonus-name';
    nameEl.innerHTML = `<span>${dt.name}</span><span class="bonus-cost">${RESOURCE_ICONS[dt.resource]}</span>`;
    
    const sel = document.createElement('select');
    sel.className = 'defense-sel';
    sel.dataset.defId = dt.id;
    
    for (let lv = 0; lv <= 11; lv++) {
      const opt = document.createElement('option');
      opt.value = lv;
      const cost = DEFENSE_COST_TABLE[lv];
      opt.textContent = lv === 0 ? 'Lv 0 (Free)' : `Lv ${lv} (${RESOURCE_ICONS[dt.resource]}${fmt(cost)}/hr)`;
      if (lv === level) opt.selected = true;
      sel.appendChild(opt);
    }
    sel.addEventListener('change', updateModalStats);
    
    defGrid.appendChild(nameEl);
    defGrid.appendChild(sel);
  }

  const grid = document.getElementById('bonus-grid');
  grid.innerHTML = '';
  for (const bcfg of BONUS_CONFIG) {
    const level = (st.bonuses || {})[bcfg.name] || 0;

    const nameEl = document.createElement('div');
    nameEl.className = 'bonus-name';
    nameEl.innerHTML = `<span title="${bcfg.desc}">${bcfg.name}</span>`;

    const sel = document.createElement('select');
    sel.className = 'bonus-sel';
    sel.dataset.bonus = bcfg.name;
    
    const maxLv = bcfg.maxLevel || 11;
    for (let lv = 0; lv <= maxLv; lv++) {
      const opt = document.createElement('option');
      opt.value = lv;
      
      const effText = bcfg.levels ? bcfg.levels[lv] : `Lv ${lv}`;
      if (lv === 0) {
        opt.textContent = `Lv 0: ${effText} (Free)`;
      } else {
        const cost = bcfg.costs[lv];
        opt.textContent = `Lv ${lv}: ${effText} (${RESOURCE_ICONS[bcfg.resource]}${fmt(cost)}/hr)`;
      }
      if (lv === level) opt.selected = true;
      sel.appendChild(opt);
    }
    sel.addEventListener('change', updateModalStats);

    grid.appendChild(nameEl);
    grid.appendChild(sel);
  }

  updateModalStats();
  document.getElementById('modal-overlay').classList.add('open');
}

function updateModalStats() {
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

  const orig = addedTerritories[name];
  addedTerritories[name] = { defense, bonuses, hq: isHQ };

  const prod = calcTerritoryProduction(name);
  const cons = calcTerritoryConsumption(name);
  const stats = calcTerritoryDefenseStats(name);

  addedTerritories[name] = orig;

  let html = '';
  if (stats) {
    html += `<div class="stat-line"><span class="stat-label">Damage</span><span>${fmt(stats.finalDmgMin)}-${fmt(stats.finalDmgMax)}</span></div>`;
    html += `<div class="stat-line"><span class="stat-label">Attack Speed</span><span>${stats.atkSpd}x</span></div>`;
    html += `<div class="stat-line"><span class="stat-label">Health</span><span>${fmt(stats.boostedHp)}</span></div>`;
    html += `<div class="stat-line"><span class="stat-label">Defense</span><span>${stats.defPct}%</span></div>`;
    html += `<div class="stat-line"><span class="stat-label">Rating</span><span>${stats.rating} — EHP ${fmt(stats.finalHp)} / DPS ${fmt(stats.dps)}</span></div>`;
  }
  if (isHQ) html += `<div class="stat-line"><span class="stat-label">Role</span><span style="color:#fbbf24;">⭐ Headquarters</span></div>`;
  html += `<hr style="border-color:#334155;margin:6px 0;">`;

  for (const r of RESOURCES) {
    const net = prod[r] - cons[r];
    if (prod[r] === 0 && cons[r] === 0) continue;
    const col = net >= 0 ? '#60a5fa' : '#f87171';
    html += `<div class="stat-line">
      <span class="stat-label">${RESOURCE_ICONS[r]} ${r}</span>
      <span>${fmt(prod[r])}/hr prod &nbsp;− ${fmt(cons[r])}/hr cons = <b style="color:${col}">${net >= 0 ? '+' : ''}${fmt(net)}/hr</b></span>
    </div>`;
  }

  document.getElementById('modal-stats').innerHTML = html;
}

function saveModal() {
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

  if (isHQ) {
    for (const n of Object.keys(addedTerritories)) {
      addedTerritories[n].hq = false;
    }
  }

  addedTerritories[name] = { defense, bonuses, hq: isHQ };
  closeModal();
  refreshUI();
}

function closeModal() {
  currentModalTerritory = null;
  document.getElementById('modal-overlay').classList.remove('open');
}

document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

// ═══════════════════════════════════════════════════════════
//  GUILD API
// ═══════════════════════════════════════════════════════════
window.guildTerritoryMap = {};

async function loadGuilds() {
  const sel = document.getElementById('guild-select');
  try {
    const res = await fetch('https://api.wynncraft.com/v3/guild/list/territory');
    const data = await res.json();

    const guildMap = {};
    for (const [territoryName, info] of Object.entries(data)) {
      const guildName = info.guild?.name || info.name;
      if (!guildName) continue;
      if (!guildMap[guildName]) guildMap[guildName] = [];
      guildMap[guildName].push(territoryName);

      if (territories[territoryName]) {
        territories[territoryName].Guild = {
          name: guildName,
          prefix: info.guild?.prefix || info.prefix || '',
          uuid: info.guild?.uuid || info.uuid || '',
        };
      }
    }

    window.guildTerritoryMap = guildMap;

    const sorted = Object.keys(guildMap).sort();
    sel.innerHTML = '<option value="">— select guild —</option>' +
      sorted.map(g => {
        const prefix = guildMap[g][0] && territories[guildMap[g][0]]
          ? (territories[guildMap[g][0]].Guild?.prefix || '')
          : '';
        return `<option value="${escapeHtml(g)}">[${escapeHtml(prefix)}] ${escapeHtml(g)} (${guildMap[g].length})</option>`;
      }).join('');
  } catch (err) {
    sel.innerHTML = '<option value="">— API unavailable —</option>';
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

  const tSel = document.getElementById('territory-select');
  const sorted = Object.keys(territories).sort();
  tSel.innerHTML = '<option value="">— select territory —</option>' +
    sorted.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');

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
  updateOverview();
  updateTerritoryList();
}

init();
