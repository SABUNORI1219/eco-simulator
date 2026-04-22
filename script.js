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

const DEFENSE_CONFIG = {
  "Very Low": { hp: "300,000",    dps: "500",    cost: { emeralds: 0,     ore: 0, crops: 0, fish: 0, wood: 0 } },
  "Low":      { hp: "750,000",    dps: "1,500",  cost: { emeralds: 300,   ore: 0, crops: 0, fish: 0, wood: 0 } },
  "Medium":   { hp: "2,000,000",  dps: "4,000",  cost: { emeralds: 1500,  ore: 0, crops: 0, fish: 0, wood: 0 } },
  "High":     { hp: "6,000,000",  dps: "10,000", cost: { emeralds: 7500,  ore: 0, crops: 0, fish: 0, wood: 0 } },
  "Very High":{ hp: "18,000,000", dps: "25,000", cost: { emeralds: 30000, ore: 0, crops: 0, fish: 0, wood: 0 } },
};

// Bonus cost doubles each level: level N costs baseCost * 2^(N-1) per hour
const BONUS_CONFIG = [
  { name: "Stronger Minions", resource: "emeralds", baseCost: 300, productionBonus: 0,   desc: "Strengthens territory guards" },
  { name: "Tower Aura",       resource: "emeralds", baseCost: 300, productionBonus: 0,   desc: "Adds aura damage to tower" },
  { name: "Tower Volley",     resource: "emeralds", baseCost: 300, productionBonus: 0,   desc: "Adds volley attack to tower" },
  { name: "Gather XP Bonus",  resource: "wood",     baseCost: 300, productionBonus: 0,   desc: "Increases gather XP" },
  { name: "Mob XP Bonus",     resource: "ore",      baseCost: 300, productionBonus: 0,   desc: "Increases mob kill XP" },
  { name: "Mob Damage",       resource: "emeralds", baseCost: 300, productionBonus: 0,   desc: "Increases mob damage" },
  { name: "PvP Damage",       resource: "emeralds", baseCost: 300, productionBonus: 0,   desc: "Increases PvP damage" },
  { name: "XP Seeking",       resource: "emeralds", baseCost: 300, productionBonus: 0,   desc: "Better XP drops" },
  { name: "Tome Seeking",     resource: "fish",     baseCost: 300, productionBonus: 0,   desc: "Better tome drops" },
  { name: "Emerald Seeking",  resource: "wood",     baseCost: 300, productionBonus: 0,   desc: "Better emerald drops" },
  { name: "Emerald Rate",     resource: "emeralds", baseCost: 300, productionBonus: 0.2, desc: "+20%/level emerald production" },
  { name: "Ore Rate",         resource: "ore",      baseCost: 300, productionBonus: 0.2, desc: "+20%/level ore production" },
  { name: "Crop Rate",        resource: "crops",    baseCost: 300, productionBonus: 0.2, desc: "+20%/level crop production" },
  { name: "Fish Rate",        resource: "fish",     baseCost: 300, productionBonus: 0.2, desc: "+20%/level fish production" },
  { name: "Wood Rate",        resource: "wood",     baseCost: 300, productionBonus: 0.2, desc: "+20%/level wood production" },
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

      const bothAdded = addedTerritories[name] && addedTerritories[neighbor];
      ctx.strokeStyle = bothAdded ? 'rgba(74,222,128,0.75)' : 'rgba(255,255,255,0.4)';
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

    ctx.lineWidth = isHovered ? Math.max(1.5, scale * 1.5) : Math.max(0.5, scale * 0.8);
    ctx.strokeStyle = isHQ ? '#fbbf24' : isAdded ? '#4ade80' : 'rgba(255,255,255,0.35)';
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
      ctx.fillStyle = isAdded ? '#fff' : 'rgba(255,255,255,0.6)';
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
  const def = DEFENSE_CONFIG[st.defense] || DEFENSE_CONFIG["Very Low"];

  let html = `<h4>${name}</h4>`;
  if (st.hq) html += `<div style="color:#fbbf24;margin-bottom:6px;">⭐ Headquarters</div>`;
  html += `<div style="color:#64748b;font-size:11px;margin-bottom:6px;">Defense: ${st.defense} — HP ${def.hp} / DPS ${def.dps}</div>`;
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
  if (level === 0) return zeroCosts();
  const cost = bonusCfg.baseCost * Math.pow(2, level - 1);
  const result = zeroCosts();
  result[bonusCfg.resource] = cost;
  return result;
}

function calcTerritoryProduction(name) {
  const t = territories[name];
  if (!t) return zeroCosts();
  const base = zeroCosts();
  for (const r of RESOURCES) base[r] = parseFloat(t.resources[r] || 0);

  const st = addedTerritories[name];
  if (!st) return base;

  const result = { ...base };
  for (const bcfg of BONUS_CONFIG) {
    if (bcfg.productionBonus === 0) continue;
    const level = (st.bonuses || {})[bcfg.name] || 0;
    if (level === 0) continue;
    result[bcfg.resource] = Math.round(base[bcfg.resource] * (1 + bcfg.productionBonus * level));
  }
  return result;
}

function calcTerritoryConsumption(name) {
  const st = addedTerritories[name];
  if (!st) return zeroCosts();

  const result = zeroCosts();

  const def = DEFENSE_CONFIG[st.defense] || DEFENSE_CONFIG["Very Low"];
  for (const r of RESOURCES) result[r] += def.cost[r] || 0;

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
    addedTerritories[name] = { defense: 'Very Low', bonuses: {}, hq: false };
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
  document.getElementById('modal-defense').value = st.defense || 'Very Low';
  document.getElementById('modal-hq').checked = !!st.hq;

  const grid = document.getElementById('bonus-grid');
  grid.innerHTML = '';
  for (const bcfg of BONUS_CONFIG) {
    const level = (st.bonuses || {})[bcfg.name] || 0;

    const nameEl = document.createElement('div');
    nameEl.className = 'bonus-name';
    nameEl.innerHTML = `<span title="${bcfg.desc}">${bcfg.name}</span>
      <span class="bonus-cost">${RESOURCE_ICONS[bcfg.resource]} ${bcfg.baseCost}/hr base</span>`;

    const sel = document.createElement('select');
    sel.className = 'bonus-sel';
    sel.dataset.bonus = bcfg.name;
    for (let lv = 0; lv <= 11; lv++) {
      const opt = document.createElement('option');
      opt.value = lv;
      if (lv === 0) {
        opt.textContent = 'Off';
      } else {
        const cost = bcfg.baseCost * Math.pow(2, lv - 1);
        opt.textContent = `Lv ${lv} (${RESOURCE_ICONS[bcfg.resource]}${fmt(cost)}/hr)`;
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

  const defense = document.getElementById('modal-defense').value;
  const isHQ = document.getElementById('modal-hq').checked;
  const bonuses = {};
  document.querySelectorAll('.bonus-sel').forEach(sel => {
    bonuses[sel.dataset.bonus] = parseInt(sel.value) || 0;
  });

  const orig = addedTerritories[name];
  addedTerritories[name] = { defense, bonuses, hq: isHQ };

  const prod = calcTerritoryProduction(name);
  const cons = calcTerritoryConsumption(name);
  const def = DEFENSE_CONFIG[defense] || DEFENSE_CONFIG["Very Low"];

  addedTerritories[name] = orig;

  let html = `<div class="stat-line"><span class="stat-label">Defense</span><span>${defense} — HP ${def.hp} / DPS ${def.dps}</span></div>`;
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
  const defense = document.getElementById('modal-defense').value;
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
