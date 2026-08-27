// ═══════════════════════════════════════════════════════════
//  eco-logic.js からの計算ロジックimport
//  定数・Treasury/生産/守備ステータス計算・BFSグラフ探索はeco-logic.js側に
//  実装がある（DOM非依存の純粋関数）。今後、計算式を変更する場合はeco-logic.js
//  側を編集すること。script.jsはUIと状態管理のみを担う。
// ═══════════════════════════════════════════════════════════
import * as EcoLogic from './eco-logic.js';
const { DEFENSE_LEVEL_STATS, DEFENSE_COST_TABLE, DEFENSE_TYPES, BONUS_CONFIG, RESOURCES } = EcoLogic;

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

const RESOURCE_ICONS  = {
  emeralds: '<img src="./assets/icons/resources/emerald.png" class="res-icon-img" alt="emeralds">',
  ore: '<img src="./assets/icons/resources/ore.png" class="res-icon-img" alt="ore">',
  crops: '<img src="./assets/icons/resources/crop.png" class="res-icon-img" alt="crops">',
  fish: '<img src="./assets/icons/resources/fish.png" class="res-icon-img" alt="fish">',
  wood: '<img src="./assets/icons/resources/wood.png" class="res-icon-img" alt="wood">'
};
const RESOURCE_COLORS = { emeralds: '#4ade80', ore: '#94a3b8', crops: '#facc15', fish: '#38bdf8', wood: '#a16207' };

// フィルター専用の配色。showTooltip()のratingColor（難易度の文字色）とは独立しており、共有しない。
// Very LowはratingColorの#00AA00より濃い#006600にして、Lowの黄緑との判別を明確にしている。
// Treasury Highはratingtreasury側の#00FF00だとLowの黄緑と45%不透明度で判別できなかったため、
// Defense Highと同じ赤#FF5555に変更した。
const FILTER_COLORS = {
  defense: { "Very Low": "#006600", "Low": "#55FF55", "Medium": "#FFFF55", "High": "#FF5555", "Very High": "#AA0000" },
  treasury: { "Very Low": "#006600", "Low": "#55FF55", "Medium": "#FFFF55", "High": "#FF5555", "Very High": "#55FFFF" },
  resource: { city: "#55FF55", ore: "#FFFFFF", wood: "#FFAA00", fish: "#55FFFF", crops: "#FFFF55" }
};

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
let _fullDistCache = null;
let tributeValues = { emeralds: 0, ore: 0, crops: 0, fish: 0, wood: 0 };
let currentModalMode = 'single'; // 'single' | 'bulk'
let currentBulkTerritories = [];
let customConnections = [];  // [{ a: string, b: string }, ...]（a, bはlocaleCompare('en')昇順で正規化）
let resourceOverrides = {};  // name -> { tier: 'normal'|'city'|'rainbow', resources: string[], double: boolean }

// マップオーバーレイの状態。表示状態にすぎないため共有リンクには含めない。
let filterMode = 'none';   // 'none' | 'defense' | 'treasury' | 'resource'
let filterToggles = {
  defense:  { "Very Low": true, "Low": true, "Medium": true, "High": true, "Very High": true },
  treasury: { "Very Low": true, "Low": true, "Medium": true, "High": true, "Very High": true },
  resource: { ore: true, wood: true, fish: true, crops: true, rainbow: true, city: true },
};
let allTerritoryNames = [];  // Add Specified Territoryのdatalist用（territories.jsonの全領地名）

// Live モードの状態。表示レイヤーであり、addedTerritoriesは書き換えない（書き換えるのはギルド取り込み操作のみ）。
// 共有リンクには含めない（ページを開き直せばOFFに戻る）。
// 守備推定は単一スナップショットで完結するため、stored の履歴（旧liveHistory）は持たない。
let liveMode = false;
let liveData = null;       // 直近取得した /v3/guild/list/territory のレスポンス（{ [territoryName]: {...} }、生の形のまま保持）
let _awbEstimates = null;  // 直近取得したAWB共有バックエンド（/eco/territories）のレスポンス。取得失敗時・未取得時はnull
let guildColorMap = {};    // prefix -> "#RRGGBB"（Liveモードを ON にした時に1回だけ取得）
let _livePollTimer = null;
let _liveTimeTickTimer = null; // 1秒間隔。新規データ取得・f再計算は一切行わず、経過時間表示のみ再計算する
let _liveFetchError = null;
let liveGuildDisplayToUuid = {};  // Import This Guild用。表示文字列 → ギルドuuid
let allLiveGuildDisplays = [];    // Import This Guild用のdatalist（liveData更新のたびに再構築）

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
  if (hit && isTooltipTarget(hit)) {
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
  // Liveモードでタップにより固定表示中のツールチップは、ジェスチャーの中断では消さない。
  if (!(liveMode && liveTooltipPinnedName)) hideTooltip();
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

    // Liveモードでは長押しではなくタップでツールチップを表示するため、長押しタイマーは不要。
    if (!liveMode) {
      longPressTimer = setTimeout(() => {
        longPressTimer = null;
        if (touchMoved) return;
        const hit = hitTestAll(touchStartPos.x, touchStartPos.y);
        if (hit && isTooltipTarget(hit)) {
          longPressTriggered = true;
          showTooltip(touchStartPos.x, touchStartPos.y, hit, true);
        }
      }, 500);
    }
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
      if (!(liveMode && liveTooltipPinnedName)) hideTooltip();
    }
    panX = t.clientX - touchDragStart.x;
    panY = t.clientY - touchDragStart.y;
    clampPan();
    draw();
  } else if (e.touches.length === 2) {
    touchMoved = true;
    clearLongPressTimer();
    if (!(liveMode && liveTooltipPinnedName)) hideTooltip();
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
      handleClick(touchStartPos.x, touchStartPos.y, true);
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

// Liveモード・スマホでタップにより固定表示中の領地名。次のタップ（別の場所 or 同じ領地）まで表示し続ける。
let liveTooltipPinnedName = null;

// Liveモードで現在表示中のツールチップの引数（{mx, my, name, above}|null）。ポーリングごとに
// refreshLiveTooltipIfOpen()がこれを使って同じ領地・同じ位置でshowLiveTooltip()を再実行し、
// 表示中のツールチップの内容（Estimated Defence・Resources move in Xs等）を現在のf/liveDataで
// 再計算する。2026-08修正: 従来はhoveredTerritoryが変化した瞬間（マウスが別の領地に移った時）
// にしか再描画されず、同じ領地にカーソルを置いたままポーリングが進んでも表示が初回表示時点の
// まま固定されていた（詳細はCLAUDE.md「守備ステータスの推定」参照）。

// Liveモードは表示レイヤーであり、シミュレーション状態（選択・モーダル編集）を触る操作は無効にする。
// スマホでは代わりに、タップでツールチップの固定表示をトグルする（isTouch経由でのみ、マウスクリックでは何もしない）。
function handleLiveTap(cx, cy, hit) {
  if (!hit || !isTooltipTarget(hit) || hit === liveTooltipPinnedName) {
    liveTooltipPinnedName = null;
    hideTooltip();
    return;
  }
  liveTooltipPinnedName = hit;
  showTooltip(cx, cy, hit, true);
}

function handleClick(cx, cy, isTouch = false) {
  const hit = hitTestAll(cx, cy);
  if (liveMode) {
    if (isTouch) handleLiveTap(cx, cy, hit);
    return;
  }
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
    ctx.imageSmoothingEnabled = (scale < 1);
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
  if (liveMode) {
    drawTerritoriesLive();
  } else {
    drawTerritories();
  }

  ctx.restore();
}

function drawConnections() {
  const drawn = new Set();

  // 1. 基本ルート
  const baseLines = [];
  for (const [name, t] of Object.entries(territories)) {
    if (!t['Trading Routes']) continue;
    for (const neighbor of t['Trading Routes']) {
      const key = [name, neighbor].sort().join('|');
      if (drawn.has(key)) continue;
      drawn.add(key);

      if (!territories[neighbor]) continue;
      baseLines.push([territoryCenter(name), territoryCenter(neighbor)]);
    }
  }

  // 2. 無効な追加線 / 3. 有効な追加線
  const invalidLines = [];
  const validLines = [];
  for (const conn of customConnections) {
    if (!territories[conn.a] || !territories[conn.b]) continue;
    const c1 = territoryCenter(conn.a);
    const c2 = territoryCenter(conn.b);
    if (addedTerritories[conn.a] && addedTerritories[conn.b]) {
      validLines.push([c1, c2]);
    } else {
      invalidLines.push([c1, c2]);
    }
  }

  ctx.save();
  const bodyWidth = Math.max(1.5, scale * 4);
  const filterActive = filterMode !== 'none';

  // 各グループ「縁取り→本体」の順で描画（縁取りは白系・常に実線）。
  // Map Filter中は縁取りを省略し、色を差し替える。
  const strokeGroup = (lines, bodyColor) => {
    if (lines.length === 0) return;
    if (!filterActive) {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = bodyWidth + 2;
      for (const [c1, c2] of lines) {
        ctx.beginPath();
        ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = bodyWidth;
    for (const [c1, c2] of lines) {
      ctx.beginPath();
      ctx.moveTo(c1.x, c1.y);
      ctx.lineTo(c2.x, c2.y);
      ctx.stroke();
    }
  };

  if (filterActive) {
    strokeGroup(baseLines, 'rgba(0,0,0,0.35)');
    strokeGroup(invalidLines, 'rgba(236,72,153,0.15)');
    strokeGroup(validLines, 'rgba(236,72,153,0.35)');
  } else {
    strokeGroup(baseLines, 'rgba(0,0,0,0.97)');
    strokeGroup(invalidLines, 'rgba(236,72,153,0.35)');
    strokeGroup(validLines, 'rgba(236,72,153,0.97)');
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

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// 矩形(x,y,w,h)をcolors.length個の色で斜め分割して塗る（Map Filterのオーバーレイ用）。
// 境界線は左下から右上に向かって傾く（shearの係数0.5は見た目の調整値）。
// 各帯は「面積」が等しくなるように境界を決める（x軸等分だと先頭が大きく末尾が小さくなるため）。
function drawSplitFill(x, y, w, h, colors, opacity) {
  const n = colors.length;
  if (n === 0) return;
  if (n === 1) {
    ctx.fillStyle = hexToRgba(colors[0], opacity);
    ctx.fillRect(x, y, w, h);
    return;
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const s     = h * 0.5;
  const p     = Math.min(s, w);
  const q     = Math.abs(w - s);
  const hmax  = h * Math.min(1, w / s);
  const total = w * h;

  const t = new Array(n + 1);
  t[0] = x - s;
  t[n] = x + w;
  for (let i = 1; i < n; i++) {
    const A = total * i / n;
    let u;
    if (A <= hmax * p / 2) {
      u = Math.sqrt(2 * p * A / hmax);
    } else if (A <= hmax * p / 2 + hmax * q) {
      u = p + (A - hmax * p / 2) / hmax;
    } else {
      u = 2 * p + q - Math.sqrt(2 * p * (total - A) / hmax);
    }
    t[i] = x - s + u;
  }

  for (let i = 0; i < n; i++) {
    const t0 = (i === 0)     ? t[0] - 1 : t[i];
    const t1 = (i === n - 1) ? t[n] + 1 : t[i + 1];
    ctx.fillStyle = hexToRgba(colors[i], opacity);
    ctx.beginPath();
    ctx.moveTo(t0,     y + h);
    ctx.lineTo(t1,     y + h);
    ctx.lineTo(t1 + s, y);
    ctx.lineTo(t0 + s, y);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
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

    // Map Filter: 該当/非該当の判定（未登録領地は判定対象外）
    const filterActive = filterMode !== 'none';
    let filterMatched = [];
    if (filterActive && isAdded) {
      filterMatched = getFilterCategories(name).filter(c => filterToggles[filterMode][c]);
    }
    const isFilterHit = filterActive && isAdded && filterMatched.length > 0;
    const isFilterDimmed = filterActive && isAdded && filterMatched.length === 0;

    ctx.save();
    if (isFilterDimmed) ctx.globalAlpha = 0.35;

    // Fill
    if (isFilterHit) {
      let splitColors;
      if (filterMode === 'resource' && filterMatched.includes('rainbow')) {
        splitColors = [FILTER_COLORS.resource.ore, FILTER_COLORS.resource.wood, FILTER_COLORS.resource.fish, FILTER_COLORS.resource.crops];
      } else {
        splitColors = filterMatched.map(c => FILTER_COLORS[filterMode][c]);
      }
      drawSplitFill(x, y, w, h, splitColors, isHovered ? 0.6 : 0.45);
    } else if (isAdded) {
      if (isListSelected) {
        ctx.fillStyle = isHovered ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.25)';
      } else {
        ctx.fillStyle = isHQ
          ? 'rgba(251,191,36,0.25)'
          : isHovered ? 'rgba(34,211,238,0.28)' : 'rgba(34,211,238,0.14)';
      }
      ctx.fillRect(x, y, w, h);
    } else if (isSelected) {
      ctx.fillStyle = isHovered ? 'rgba(96,165,250,0.28)' : 'rgba(96,165,250,0.16)';
      ctx.fillRect(x, y, w, h);
    } else if (isHovered) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x, y, w, h);
    }

    // Outline（本体のスタイルを決定してから、縁取り→本体の順で描画。フィルターの影響を受けない）
    let bodyLineWidth, bodyStrokeStyle, bodyDash;
    if (isAdded && isListSelected) {
      bodyDash = [Math.max(4, scale * 8), Math.max(4, scale * 8)];
      bodyLineWidth = Math.max(2.0, scale * 2.5);
      bodyStrokeStyle = '#3b82f6';
    } else {
      bodyDash = [];
      if (isDisconnected) {
        bodyDash = [Math.max(6, scale * 6), Math.max(4, scale * 4)];
        bodyLineWidth = Math.max(2.0, scale * 2.2);
        bodyStrokeStyle = '#ef4444';
      } else if (isHQ) {
        bodyLineWidth = Math.max(4.0, scale * 4.4);
        bodyStrokeStyle = '#fbbf24';
      } else if (isAdded) {
        bodyLineWidth = Math.max(2.0, scale * 2.2);
        bodyStrokeStyle = '#22d3ee';
      } else if (isSelected) {
        bodyLineWidth = Math.max(1.8, scale * 2.0);
        bodyStrokeStyle = '#3b82f6';
      } else if (isHovered) {
        bodyLineWidth = Math.max(1.5, scale * 1.8);
        bodyStrokeStyle = 'rgba(255,255,255,0.9)';
      } else {
        bodyLineWidth = Math.max(1.0, scale * 1.4);
        bodyStrokeStyle = 'rgba(255,255,255,0.55)';
      }
    }

    // 縁取り（常に実線・黒系）
    ctx.setLineDash([]);
    ctx.lineWidth = bodyLineWidth + 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.strokeRect(x, y, w, h);

    // 本体
    ctx.setLineDash(bodyDash);
    ctx.lineWidth = bodyLineWidth;
    ctx.strokeStyle = bodyStrokeStyle;
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    ctx.restore();

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
      const res = getTerritoryResources(name);
      const em = res.emeralds;
      const ore = res.ore;
      const crops = res.crops;
      const fish = res.fish;
      const wood = res.wood;

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

// Liveモード用の描画。全437領地を所有ギルドのカラーで塗り分ける。addedTerritoriesに基づく描画は行わない。
function drawTerritoriesLive() {
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

    const info = liveData ? liveData[name] : null;
    const isOwned = !!(info && info.guild && info.guild.name);
    const isHQ = isOwned && info.hq === true;
    const guildColor = isOwned ? getGuildColor(info.guild.prefix) : null;
    const isHovered = name === hoveredTerritory;
    const isSelected = selectedTerritories.has(name);

    // 取られてから10分以内の領地は赤の破線でハイライトする（既存の非接続領地の描画を流用）。
    const capturedElapsedMs = isOwned ? recentlyCapturedElapsedMs(info) : null;
    const isRecentlyCaptured = capturedElapsedMs !== null;

    // Map Filter: 該当/非該当の判定（無所属領地は判定対象外）
    const filterActive = filterMode !== 'none';
    let filterMatched = [];
    if (filterActive && isOwned) {
      filterMatched = getFilterCategoriesLive(name).filter(c => filterToggles[filterMode][c]);
    }
    const isFilterHit = filterActive && isOwned && filterMatched.length > 0;
    const isFilterDimmed = filterActive && isOwned && filterMatched.length === 0;

    ctx.save();
    if (isFilterDimmed) ctx.globalAlpha = 0.35;

    // Fill
    if (isFilterHit) {
      let splitColors;
      if (filterMode === 'resource' && filterMatched.includes('rainbow')) {
        splitColors = [FILTER_COLORS.resource.ore, FILTER_COLORS.resource.wood, FILTER_COLORS.resource.fish, FILTER_COLORS.resource.crops];
      } else {
        splitColors = filterMatched.map(c => FILTER_COLORS[filterMode][c]);
      }
      drawSplitFill(x, y, w, h, splitColors, isHovered ? 0.6 : 0.45);
    } else if (isSelected) {
      ctx.fillStyle = isHovered ? 'rgba(96,165,250,0.28)' : 'rgba(96,165,250,0.16)';
      ctx.fillRect(x, y, w, h);
    } else if (isOwned) {
      ctx.fillStyle = hexToRgba(guildColor, isHQ ? (isHovered ? 0.35 : 0.22) : (isHovered ? 0.28 : 0.14));
      ctx.fillRect(x, y, w, h);
    } else if (isHovered) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x, y, w, h);
    }

    // Outline（縁取り→本体の順で描画。フィルターの影響を受けない）
    let bodyLineWidth, bodyStrokeStyle, bodyDash = [];
    if (isSelected) {
      bodyLineWidth = Math.max(1.8, scale * 2.0);
      bodyStrokeStyle = '#3b82f6';
    } else if (isRecentlyCaptured) {
      bodyDash = [Math.max(6, scale * 6), Math.max(4, scale * 4)];
      bodyLineWidth = Math.max(2.0, scale * 2.2);
      bodyStrokeStyle = '#ef4444';
    } else if (isHQ) {
      bodyLineWidth = Math.max(4.0, scale * 4.4);
      bodyStrokeStyle = guildColor;
    } else if (isOwned) {
      bodyLineWidth = Math.max(2.0, scale * 2.2);
      bodyStrokeStyle = guildColor;
    } else if (isHovered) {
      bodyLineWidth = Math.max(1.5, scale * 1.8);
      bodyStrokeStyle = 'rgba(255,255,255,0.9)';
    } else {
      bodyLineWidth = Math.max(1.0, scale * 1.4);
      bodyStrokeStyle = 'rgba(255,255,255,0.55)';
    }

    ctx.setLineDash([]);
    ctx.lineWidth = bodyLineWidth + 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.strokeRect(x, y, w, h);

    ctx.setLineDash(bodyDash);
    ctx.lineWidth = bodyLineWidth;
    ctx.strokeStyle = bodyStrokeStyle;
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    ctx.restore();

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
      } else if (isOwned) {
        const flags = getLiveResourceFlags(info);
        const isLiveRainbow = flags.ore && flags.wood && flags.fish && flags.crops;

        if (isLiveRainbow) {
          // 虹資源地 (2x2 Grid)。既存のシミュレーションモードと同じ配置。
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
          const iconsToDraw = [];
          if (flags.city) iconsToDraw.push(resImages.emeralds);
          if (flags.ore) { iconsToDraw.push(resImages.ore); if (flags.oreDouble) iconsToDraw.push(resImages.ore); }
          if (flags.crops) { iconsToDraw.push(resImages.crops); if (flags.cropsDouble) iconsToDraw.push(resImages.crops); }
          if (flags.fish) { iconsToDraw.push(resImages.fish); if (flags.fishDouble) iconsToDraw.push(resImages.fish); }
          if (flags.wood) { iconsToDraw.push(resImages.wood); if (flags.woodDouble) iconsToDraw.push(resImages.wood); }

          if (iconsToDraw.length > 0) {
            const totalW = iconsToDraw.length * iconSize + (iconsToDraw.length - 1) * gap;
            let sx = cx - totalW / 2;
            const sy = cy - iconSize * 0.8;

            for (const img of iconsToDraw) {
              drawIcon(img, sx, sy, iconSize);
              sx += iconSize + gap;
            }
            textY = sy + iconSize + gap + 2;
          }
        }
      }

      const fontSize = Math.min(18, Math.max(9, scale * 13));
      ctx.font = `${fontSize}px 'Minecraftia', sans-serif`;
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.lineWidth = Math.max(2, fontSize * 0.15);
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.fillStyle = isOwned ? '#ffffff' : isSelected ? '#93c5fd' : 'rgba(255,255,255,0.82)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      ctx.strokeText(name, cx, textY);
      ctx.fillText(name, cx, textY);

      if (isRecentlyCaptured) {
        const capturedMinutes = Math.floor(capturedElapsedMs / 60000);
        const capturedSeconds = Math.floor(capturedElapsedMs / 1000) % 60;
        const capturedText = `${capturedMinutes}m ${capturedSeconds}s`;
        const capturedY = y - fontSize - 4;
        ctx.fillStyle = '#ef4444';
        ctx.strokeText(capturedText, cx, capturedY);
        ctx.fillText(capturedText, cx, capturedY);
      }

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    } else if (isHQ && scale > 0.06) {
      ctx.fillStyle = guildColor;
      const size = Math.max(8, scale * 50);
      ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
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
  return EcoLogic.getNeighbors(name, territories, addedTerritories, customConnections);
}

// 全437領地＋すべてのカスタム接続線（有効・無効を問わない）を経由する隣接一覧。
// HQのConnections/Externalsのカウント、Treasuryバフの距離計算にのみ使用する。
function getAllNeighbors(name) {
  return EcoLogic.getAllNeighbors(name, territories, customConnections);
}

// HQからの距離を全437領地対象でBFS（getAllNeighbors経由）。HQ未設定時は{}を返す。
function getFullGraphDistances() {
  if (_fullDistCache !== null) return _fullDistCache;
  return (_fullDistCache = EcoLogic.getFullGraphDistances(territories, addedTerritories, customConnections));
}

// ═══════════════════════════════════════════════════════════
//  TOOLTIP
// ═══════════════════════════════════════════════════════════
const tooltip = document.getElementById('tooltip');
let _lastLiveTooltipArgs = null;

// Very Low/Low/Medium/High/Very High の難易度ラベルに対応する文字色。
// showTooltip（守備ステータス）とshowLiveTooltip（実データのdefences）で共有する。
function ratingColor(rating) {
  switch (rating) {
    case "Very Low": return '#00AA00';
    case "Low": return '#55FF55';
    case "Medium": return '#FFFF55';
    case "High": return '#FF5555';
    case "Very High": return '#AA0000';
    default: return '#55FF55';
  }
}

// マウスホバー/長押しでツールチップを表示する対象かどうか。
// 通常モードは登録済み領地のみ、Liveモードはliveデータを持つ領地のみが対象。
function isTooltipTarget(name) {
  if (liveMode) return !!(liveData && liveData[name]);
  return !!addedTerritories[name];
}

function showTooltip(mx, my, name, above = false) {
  if (liveMode) {
    showLiveTooltip(mx, my, name, above);
    return;
  }
  const prod = calcTerritoryProduction(name);
  const cons = calcTerritoryConsumption(name);
  const st = addedTerritories[name];
  const stats = calcTerritoryDefenseStats(name);

  let titleSuffix = '';
  if (st.hq) {
    titleSuffix = '(HQ)';
  } else {
    const hqName = Object.keys(addedTerritories).find(n => addedTerritories[n].hq);
    if (hqName) {
      const dist = getFullGraphDistances()[name];
      if (dist === 1) titleSuffix = '(Conn)';
      else if (dist === 2 || dist === 3) titleSuffix = '(Ext)';
    }
  }
  const nameSuffix = hasValidResourceOverride(name) ? '*' : '';
  let titleText = name + nameSuffix + titleSuffix;
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
  const buffPct = calcTreasuryBuff(name);
  if (buffPct > 0) {
    html += `<div style="margin-top:8px;"><span style="color:#FF55FF;">♦ Treasury Bonus: </span><span style="color:#FFFFFF;">${fmtPct1(buffPct * 100)}%</span></div>`;
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
    html += `<div style="margin-top:8px;"><span style="color:#FF55FF;">Total Stats (</span><span style="color:${ratingColor(stats.rating)};">${stats.rating}</span><span style="color:#FF55FF;">):</span></div>`;
    html += `<div><span style="color:#FF55FF;">- </span><span style="color:#AAAAAA;">Damage: ${fmtNum(stats.finalDmgMin)} - ${fmtNum(stats.finalDmgMax)}</span></div>`;
    html += `<div><span style="color:#FF55FF;">- </span><span style="color:#AAAAAA;">Attacks per Second: ${stats.atkSpd}</span></div>`;
    html += `<div><span style="color:#FF55FF;">- </span><span style="color:#AAAAAA;">Health: ${fmtNum(stats.boostedHp)}</span></div>`;
    html += `<div><span style="color:#FF55FF;">- </span><span style="color:#AAAAAA;">Defense: ${stats.defPct}%</span></div>`;
    html += `<div><span style="color:#FF55FF;">- </span><span style="color:#AAAAAA;">EHP: ${fmt(stats.finalHp)} / DPS: ${fmt(stats.dps)}</span></div>`;
  }

  tooltip.innerHTML = html;
  tooltip.style.display = 'block';
  positionTooltip(mx, my, above);
}

// ═══════════════════════════════════════════════════════════
//  LIVE TOOLTIP（Phase 4: 実データの表示。Phase 5で推定値を追加する）
// ═══════════════════════════════════════════════════════════
const LIVE_RATING_MAP = { VERY_LOW: 'Very Low', LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', VERY_HIGH: 'Very High' };

// ストレージレベル判定用テーブル（showTooltip/renderResourcesHTMLと同じ値。CLAUDE.md「生産資源のプリセット」隣接の表を参照）
const LIVE_STORAGE_LEVELS = {
  emeralds: { normal: [3000, 6000, 12000, 24000, 45000, 102000, 240000], hq: [5000, 10000, 20000, 40000, 75000, 170000, 400000] },
  resource: { normal: [300, 600, 1200, 2400, 4500, 10200, 24000], hq: [1500, 3000, 6000, 12000, 22500, 51000, 120000] }
};

function detectStorageLevel(limit, isHQ, isEmerald) {
  const table = isEmerald ? LIVE_STORAGE_LEVELS.emeralds : LIVE_STORAGE_LEVELS.resource;
  const arr = isHQ ? table.hq : table.normal;
  const idx = arr.indexOf(limit);
  return idx === -1 ? null : idx;
}

// Efficient Emeralds(Lv0-3) × Emerald Rate(Lv0-3)、Efficient Resources(Lv0-6) × Resource Rate(Lv0-3)の
// 全組み合わせの積と、実測倍率(generation ÷ (baseGeneration × (1+treasuryBuff)))を照合する。
// 一致する組み合わせが複数残る場合は「倍率のみ確定」として扱う（CLAUDE.md 4.4(A)参照）。
const LIVE_EFF_EMERALD_MULTS = [1, 1.35, 2.0, 4.0];
const LIVE_RATE_MULTS = [1, 4 / 3, 2, 4]; // Emerald Rate / Resource Rate 共通（4s/3s/2s/1s）
const LIVE_EFF_RESOURCE_MULTS = [1, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];

function detectRateBonusCombo(generation, baseGeneration, treasuryBuff, isEmerald) {
  if (!baseGeneration || generation <= 0) return null;
  const denom = baseGeneration * (1 + treasuryBuff);
  if (denom <= 0) return null;
  const observedMult = generation / denom;

  const effMults = isEmerald ? LIVE_EFF_EMERALD_MULTS : LIVE_EFF_RESOURCE_MULTS;
  const effName = isEmerald ? 'Efficient Emeralds' : 'Efficient Resources';
  const rateName = isEmerald ? 'Emerald Rate' : 'Resource Rate';

  const matches = [];
  for (let e = 0; e < effMults.length; e++) {
    for (let r = 0; r < LIVE_RATE_MULTS.length; r++) {
      const combo = effMults[e] * LIVE_RATE_MULTS[r];
      if (Math.abs(combo - observedMult) / Math.max(combo, observedMult) < 0.005) {
        matches.push({ [effName]: e, [rateName]: r });
      }
    }
  }
  return { multiplier: observedMult, matches };
}

const LIVE_RESOURCE_ROW_ORDER = [
  { key: 'emeralds', type: 'EMERALD', color: '#55FF55', label: 'Emeralds', icon: '' },
  { key: 'ore',      type: 'ORE',     color: '#FFFFFF', label: 'Ore',      icon: RESOURCE_ICONS.ore },
  { key: 'wood',     type: 'WOOD',    color: '#FFAA00', label: 'Wood',     icon: RESOURCE_ICONS.wood },
  { key: 'fish',     type: 'FISH',    color: '#55FFFF', label: 'Fish',     icon: RESOURCE_ICONS.fish },
  { key: 'crops',    type: 'CROP',    color: '#FFFF55', label: 'Crops',    icon: RESOURCE_ICONS.crops }
];

// 実データから「確定できるアップグレード」を算出する共通処理（CLAUDE.md 4.4参照）。
// showLiveTooltip（表示）・getDefenseEstimate（推定のconfirmedExtra）・importLiveGuild（Phase 6の取り込み）で共有する。
// bfsCacheを渡すと、同じギルドHQからのBFS距離を使い回す（computeGlobalTransferPhaseが
// 全所有領地に対してループする際、ギルドごとに1回だけBFSすれば済むようにするための最適化）。
function computeLiveConfirmedInfo(name, info, bfsCache) {
  const guildHqName = info.guild.hq;
  let hqDist;
  if (guildHqName && territories[guildHqName]) {
    let distances;
    if (bfsCache) {
      distances = bfsCache[guildHqName] || (bfsCache[guildHqName] = EcoLogic.bfsDistancesFrom(guildHqName, territories, []));
    } else {
      distances = EcoLogic.bfsDistancesFrom(guildHqName, territories, []);
    }
    hqDist = distances[name];
  }

  const treasuryLabel = LIVE_RATING_MAP[info.treasury] || info.treasury;
  const defenceLabel = LIVE_RATING_MAP[info.defences] || info.defences;
  const treasuryBuff = EcoLogic.calcTreasuryBuff(treasuryLabel, hqDist);

  const resByType = {};
  for (const r of info.resources || []) resByType[r.type] = r;

  let emStorageLv = null, resStorageLv = null;
  let emComboMatches = null;  // Efficient Emeralds / Emerald Rate
  let resCombo = null;        // Efficient Resources / Resource Rate（ore/wood/fish/crops全てに一様にかかる単一のボーナスのため1回だけ検出する）
  const resourceSnapshot = {}; // ore/crops/wood/fish の {stored, limit, generation}（推定エンジンに渡す）

  for (const row of LIVE_RESOURCE_ROW_ORDER) {
    const data = resByType[row.type];
    if (!data) continue;
    const { generation, stored, limit } = data;
    // API側にbaseGenerationが無い場合はterritories.jsonの基礎生成量にフォールバックする
    const baseGeneration = (data.baseGeneration !== undefined && data.baseGeneration !== null)
      ? data.baseGeneration
      : parseFloat((territories[name] && territories[name].resources[row.key]) || 0);

    // baseGenerationはグローバルf探索のエメラルドveto判定（Trio A検出）にも使うため保持する。
    if (row.key !== 'emeralds') resourceSnapshot[row.key] = { stored, limit, generation, baseGeneration };

    const isEmerald = row.key === 'emeralds';
    const lv = detectStorageLevel(limit, info.hq, isEmerald);
    if (lv !== null) {
      if (isEmerald) emStorageLv = lv;
      else if (resStorageLv === null) resStorageLv = lv;
    }

    if (isEmerald) {
      emComboMatches = detectRateBonusCombo(generation, baseGeneration, treasuryBuff, true);
    } else if (resCombo === null) {
      resCombo = detectRateBonusCombo(generation, baseGeneration, treasuryBuff, false);
    }
  }

  return { guildHqName, hqDist, treasuryLabel, defenceLabel, treasuryBuff, resByType, resourceSnapshot, emStorageLv, resStorageLv, emComboMatches, resCombo };
}

// 取得直後（10分以内）の領地はstoredが捕獲時にリセットされ、転送位相モデルに従わなくなるため、
// マップの赤破線ハイライトとグローバルf算出の両方でこの閾値を共有する。
const RECENTLY_CAPTURED_MS = 600000;
// 取得からの経過msを返す（10分以内のみ）。対象外・acquired不正の場合はnullを返す。
function recentlyCapturedElapsedMs(info) {
  if (!info.acquired) return null;
  const acquiredMs = new Date(info.acquired).getTime();
  if (isNaN(acquiredMs)) return null;
  const elapsed = Date.now() - acquiredMs;
  return (elapsed >= 0 && elapsed < RECENTLY_CAPTURED_MS) ? elapsed : null;
}

// Damage/Attack/Health/Defense消費（ore/crops/wood/fish）の確定分。一意に確定した組み合わせのみを反映する。
function buildConfirmedExtraFromLiveInfo(confirmed) {
  const confirmedExtra = { ore: 0, crops: 0, wood: 0, fish: 0 };
  if (confirmed.emComboMatches && confirmed.emComboMatches.matches.length === 1) {
    const m = confirmed.emComboMatches.matches[0];
    if (m['Efficient Emeralds'] !== undefined) confirmedExtra.ore = getBonusConfig('Efficient Emeralds').costs[m['Efficient Emeralds']];
    if (m['Emerald Rate'] !== undefined) confirmedExtra.crops = getBonusConfig('Emerald Rate').costs[m['Emerald Rate']];
  }
  if (confirmed.emStorageLv !== null) confirmedExtra.wood = getBonusConfig('Larger Emerald Storage').costs[confirmed.emStorageLv];
  return confirmedExtra;
}

// 保持期間（acquiredからの経過時間）の文字色。Treasury段階から動的に決まる。
const HELD_TIME_COLORS = { 'Very Low': '#FF5555', 'Low': '#FFAA00', 'Medium': '#FFFF55', 'High': '#55FF55', 'Very High': '#55FFFF' };

// 経過時間の桁に応じて段階的に表示を切り替える（1分未満は"XXs"、1時間未満は"XXm XXs"、
// 1日未満は"XXh XXm"、それ以上は"XXd XXh"）。"0h"のような目安にならない表示を避けるため。
// acquiredが無い/不正な場合はnullを返す。
function fmtHeldDuration(acquiredStr) {
  if (!acquiredStr) return null;
  const acquiredMs = new Date(acquiredStr).getTime();
  if (isNaN(acquiredMs)) return null;
  const diffMs = Date.now() - acquiredMs;
  if (diffMs < 0) return null;
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function showLiveTooltip(mx, my, name, above) {
  const info = liveData && liveData[name];
  if (!info) { hideTooltip(); return; }

  _lastLiveTooltipArgs = { mx, my, name, above };

  const isOwned = !!(info.guild && info.guild.name);
  if (!isOwned) {
    tooltip.innerHTML = `<div style="color:#ffffff; font-weight:bold; font-size:14px;">${escapeHtml(name)}</div>` +
      `<div style="color:#94a3b8; margin-top:6px;">Unclaimed</div>`;
    tooltip.style.display = 'block';
    positionTooltip(mx, my, above);
    return;
  }

  const confirmed = computeLiveConfirmedInfo(name, info);
  const { hqDist, treasuryLabel, defenceLabel, treasuryBuff, resByType } = confirmed;

  let titleSuffix = '';
  if (info.hq) {
    titleSuffix = '(HQ)';
  } else if (hqDist === 1) {
    titleSuffix = '(Conn)';
  } else if (hqDist === 2 || hqDist === 3) {
    titleSuffix = '(Ext)';
  }

  let html = `<div style="color:#ffffff; font-weight:bold; font-size:14px; margin-bottom:2px;">${escapeHtml(name)}${titleSuffix}</div>`;
  const prefixText = info.guild.prefix ? `[${info.guild.prefix}] ` : '';
  html += `<div style="color:#94a3b8;">${escapeHtml(prefixText + info.guild.name)}</div>`;

  const heldText = fmtHeldDuration(info.acquired);
  if (heldText) {
    html += `<div style="color:${HELD_TIME_COLORS[treasuryLabel] || '#94a3b8'}; margin-bottom:8px;">Held ${heldText}</div>`;
  }

  for (const row of LIVE_RESOURCE_ROW_ORDER) {
    const data = resByType[row.type];
    if (!data) continue;
    const { generation, stored, limit } = data;
    if (generation > 0 || stored > 0) {
      if (generation > 0) html += `<div style="color:${row.color};">${row.icon}+${fmtNum(generation)} ${row.label} per Hour</div>`;
      // 満杯（stored === limit）は正常な状態なので赤にしない。limitを超えた場合のみ警告色にする。
      const storedColor = stored > limit ? '#FF5555' : row.color;
      html += `<div style="color:${row.color};">${row.icon}<span style="color:${storedColor};">${fmtNum(stored)}</span>/${fmtNum(limit)} stored</div>`;
    }
  }

  html += `<div style="margin-top:8px;"><span style="color:#FF55FF;">♦ Treasury: </span><span style="color:#FFFFFF;">${escapeHtml(treasuryLabel)}</span>`;
  if (treasuryBuff > 0) html += ` <span style="color:#FFFFFF;">(+${fmtPct1(treasuryBuff * 100)}%)</span>`;
  html += `</div>`;
  html += `<div><span style="color:#FF55FF;">♦ Defence: </span><span style="color:${ratingColor(defenceLabel)};">${escapeHtml(defenceLabel)}</span></div>`;

  // 守備ステータスの推定（Estimatedは確定値とは視覚的に区別する）。優先順位:
  // 1) AWB共有バックエンド（/eco/territories）の今回のポーリングでの応答（_awbEstimates）
  // 2) 品質付きキャッシュ（Item 9）のTier A/Bエントリ（構成が変わっていない限り、過去に
  //    観測できた「良いf」での推定のほうが現在ポーリングの生の推定より信頼できるため）
  // 3) 現在ポーリングの生の確定推定 4) 簡易推定
  // AWBが今回失敗した場合（_awbEstimates===null）は全領地が2〜4にフォールバックする。
  // AWBが成功したが該当領地のエントリ自体が無い、またはlevelsが4項目ともnullの場合は、
  // その領地だけ2〜4にフォールバックする（全体を一律フォールバックにしない）。
  // Storage/資源ブースト等の確定ボーナス一覧（Upgrades:）は表示しない。推定の内部計算では使い続ける。
  // getDefenseEstimate/getDefenseEstimateApproximateは、ここで得たconfirmed（現在ポーリングの
  // 最新liveData由来）ではなく、_phaseSourceLiveData（fと同じスナップショット）を内部で
  // 参照し直す。両者を混ぜないことがCLAUDE.md「Res Tickと表示されている資源量が噛み合わない」
  // への対策の要のため、ここでは意図的にconfirmedExtra/resourceSnapshotを渡さない。
  const awbEntry = _awbEstimates && _awbEstimates[name];
  const awbHtml = awbEntry ? renderAwbEstimateHTML(awbEntry) : '';
  if (awbHtml) {
    html += awbHtml;
  } else {
    const cachedEntry = _qualityCache[name];
    if (cachedEntry) {
      html += renderDefenseEstimateHTML(cachedEntry.estimate, { observedAt: cachedEntry.observedAt, tier: cachedEntry.tier });
    } else {
      const estimate = getDefenseEstimate(name);
      if (estimate.levels) {
        html += renderDefenseEstimateHTML(estimate);
      } else {
        const approx = getDefenseEstimateApproximate(name);
        html += renderDefenseEstimateApproximateHTML(approx);
      }
    }
  }

  tooltip.innerHTML = html;
  tooltip.style.display = 'block';
  positionTooltip(mx, my, above);
}

// ═══════════════════════════════════════════════════════════
//  LIVE DEFENSE ESTIMATE（オンデマンド計算・領地ごとにキャッシュ）
//  推定ロジック本体（グローバル位相探索・候補列挙）はeco-logic.jsにある。
//  推定は単一スナップショットで完結し、履歴を必要としない。
// ═══════════════════════════════════════════════════════════
// 調査用診断ログ（[phase]/[sample]/[cache-diag]）の出力可否。デフォルトはOFF（実運用テスト時の
// ブラウザ負荷を減らすため、2026-08導入）。キャッシュ判定ロジック自体（shouldUpdateCache等）は
// 一切変更しない、純粋に出力の有無のみを制御するフラグ。
// 有効化方法: URLに`?diag=1`を付けて開く（`loadFromHash()`のURLハッシュとは独立、`location.search`を見る）、
// またはブラウザのコンソールから`enableDiagLogging()`を呼ぶ（localStorageに保存され、リロード後も有効なまま）。
// 無効化は`disableDiagLogging()`。
let _diagLoggingEnabled = (() => {
  try {
    if (new URLSearchParams(window.location.search).get('diag') === '1') return true;
    return localStorage.getItem('ecoDiagLogging') === '1';
  } catch (e) {
    return false;
  }
})();

function diagLog(...args) {
  if (_diagLoggingEnabled) console.log(...args);
}

function enableDiagLogging() {
  _diagLoggingEnabled = true;
  try { localStorage.setItem('ecoDiagLogging', '1'); } catch (e) { /* localStorage無効環境では永続化しないだけで機能する */ }
  console.log('[diag] logging enabled (persisted via localStorage; call disableDiagLogging() to turn off)');
}

function disableDiagLogging() {
  _diagLoggingEnabled = false;
  try { localStorage.removeItem('ecoDiagLogging'); } catch (e) { /* 同上 */ }
  console.log('[diag] logging disabled');
}

let _defenseEstimateCache = {}; // name -> { key, result }
let _globalTransferPhase = null; // f（Live データ取得のたびに1回だけ再計算する。CLAUDE.md「守備ステータス推定」参照）

// _globalTransferPhaseの計算に使ったliveDataのスナップショット（同じポーリング回のオブジェクト参照）。
// _globalTransferPhaseと必ず同時に更新する（computeGlobalTransferPhase()のfinish()内のみで書き込む）。
// 守備ステータス推定（stored[r] = consumption[r]×f + generation[r]×(1/60−f)）はstored/generationと
// fが同じ瞬間のスナップショットであることが前提のモデルのため、推定計算は必ずこちらを参照し、
// 常に最新の`liveData`と混ぜてはならない（CLAUDE.md「Res Tickと表示されている資源量が噛み合わない」参照）。
// Held時間・赤破線ハイライト・資源生産表示など、時間経過に伴うリアルタイム表示は引き続き
// 最新の`liveData`を参照する（推定値の鮮度とは別の要件のため）。
let _phaseSourceLiveData = null;

// 推定結果の品質付きキャッシュ（Item 9）。name -> CachedEstimate。メモリ内・Liveモードの
// セッションスコープのみ（Liveモード OFF でクリアする。CLAUDE.md「守備ステータスの推定」参照）。
let _qualityCache = {};

// 指定ギルドが所有する全領地名のSet（addedTerritoriesの代わりに使う）。datasetを省略すると
// 常に最新のliveDataを使う（Import This Guild等、リアルタイム性が必要な用途向け）。守備推定
// （getDefenseEstimate等）は_phaseSourceLiveDataを明示的に渡し、fと同じスナップショットで揃える。
function getOwnedNamesForGuild(guildUuid, dataset = liveData) {
  const result = new Set();
  if (!dataset) return result;
  for (const [n, info] of Object.entries(dataset)) {
    if (info.guild && info.guild.uuid === guildUuid) result.add(n);
  }
  return result;
}

// fの探索（EcoLogic.estimateGlobalTransferPhase、数百ms〜1秒程度）はメインスレッドをブロック
// しないようWeb Worker（phase-worker.js）で実行する。ワーカーはliveMode中1つだけ使い回す。
let _phaseWorker = null;
let _phaseRequestId = 0;

// Worker生成に失敗した場合（module worker非対応環境等）はnullを返す。呼び出し側はnullを
// 「推定不可」として扱い、Liveモード自体は継続する。
function getPhaseWorker() {
  if (_phaseWorker) return _phaseWorker;
  try {
    _phaseWorker = new Worker(new URL('./phase-worker.js', import.meta.url), { type: 'module' });
  } catch (err) {
    _phaseWorker = null;
  }
  return _phaseWorker;
}

function stopPhaseWorker() {
  if (_phaseWorker) {
    _phaseWorker.terminate();
    _phaseWorker = null;
  }
  _phaseWorkerBusy = false;
}

// Stronger Minions(×5)・Tower Multi-Attacks(×2)の候補列挙追加により探索の候補空間が
// 10倍に増え、実測で15〜40秒かかる（2026-08）。ポーリング間隔（30秒）を探索時間が超えると
// リクエストが詰まるため、ポーリング間隔の3倍を確保する。
const PHASE_WORKER_TIMEOUT_MS = 90000;

// Worker が前回のリクエストを処理中かどうか。trueの間は新しいリクエストを投げず、
// そのポーリング回はスキップして前回のfをそのまま使い続ける（探索時間がポーリング間隔
// 30秒を超えるとリクエストがキューに詰まり、雪だるま式に全滅するのを防ぐため）。
let _phaseWorkerBusy = false;

// fの計算が連続で失敗した回数。1回の失敗だけではfをnullにせず前回値を保持し、
// PHASE_FAILURE_STREAK_LIMIT回（約2.5分）連続で失敗して初めてnullにする。
let _phaseFailureStreak = 0;
const PHASE_FAILURE_STREAK_LIMIT = 5;

// 全437領地のstoredから、グローバルな転送位相fを求める。
// 1回のLiveデータ取得につき1回だけ呼び出す。前回の探索が完了していない場合はスキップする。
// 失敗時は連続失敗回数がPHASE_FAILURE_STREAK_LIMITに達するまで_globalTransferPhaseを
// 前回値のまま保持する（推定セクションのみ非表示になり、Liveモードの他の表示は継続する）。
//
// 2026-08、エメラルド（EMERALD）のstored/generationから直接fを逆算する方式を検証したが、
// XP Seeking（emeralds消費・観測不能）が未計上のまま多数の領地に効いているらしく、実データで
// fの中央値がF_MAX付近に偏り、Tromsの実測検算（ore/wood/fish/crops）と食い違ったため不採用と
// した。詳細はeco-logic.js「Step 1」コメントおよびCLAUDE.md「守備ステータスの推定」参照。
function computeGlobalTransferPhase() {
  if (!liveData) { _globalTransferPhase = null; _phaseSourceLiveData = null; _phaseFailureStreak = 0; return Promise.resolve(); }

  if (_phaseWorkerBusy) {
    diagLog('[phase] skipped: previous search still in progress, keeping previous f');
    return Promise.resolve();
  }

  // このラウンドのinputsが由来するliveDataのスナップショット参照を保持する。setInterval経由の
  // ポーリングはWorker計算の完了を待たずに次のfetchLiveTerritoryData()を呼びうるため、
  // このPromiseが解決する時点ではモジュール変数liveDataが別ラウンドのものに差し替わっている
  // 可能性がある。finish()の成功時にはこのliveDataForThisRoundを_phaseSourceLiveDataへ
  // 代入することで、_globalTransferPhaseとその計算元スナップショットを必ず同時に更新する。
  const liveDataForThisRound = liveData;

  const inputs = [];
  const bfsCache = {}; // guildHqName -> distances（ギルドごとに1回だけBFSする）
  // try/catch: 1領地のデータ異常でinputs構築全体が例外送出され、フェーズ探索と
  // updateQualityCache()の両方が丸ごとスキップされる経路を防ぐため、1領地単位で例外を
  // 分離する（例外発生時はログのみ行い、以降の領地の処理は継続する）。
  for (const [name, info] of Object.entries(liveDataForThisRound)) {
    if (!info.guild || !info.guild.name || !info.resources) continue;
    // 取得直後（10分以内）は資源のstoredが捕獲時にリセットされ転送位相モデルに従わないため除外する
    if (recentlyCapturedElapsedMs(info) !== null) continue;
    try {
      const confirmed = computeLiveConfirmedInfo(name, info, bfsCache);
      const confirmedExtra = buildConfirmedExtraFromLiveInfo(confirmed);
      const em = confirmed.resByType['EMERALD'];
      inputs.push({
        observedRating: confirmed.defenceLabel, isHQ: info.hq,
        confirmedExtra, resourceSnapshot: confirmed.resourceSnapshot,
        treasuryBuff: confirmed.treasuryBuff,
        emGeneration: em ? em.generation : undefined,
        emStored: em ? em.stored : undefined
      });
    } catch (err) {
      console.error(`Failed to build phase input for ${name}:`, err);
    }
  }

  const worker = getPhaseWorker();
  if (!worker) {
    _phaseFailureStreak++;
    if (_phaseFailureStreak >= PHASE_FAILURE_STREAK_LIMIT) { _globalTransferPhase = null; _phaseSourceLiveData = null; }
    return Promise.resolve();
  }

  const requestId = ++_phaseRequestId;
  _phaseWorkerBusy = true;
  return new Promise(resolve => {
    let settled = false;
    const cleanup = () => {
      worker.removeEventListener('message', messageHandler);
      worker.removeEventListener('error', errorHandler);
      clearTimeout(timeoutId);
    };
    const finish = (result, isTimeout) => {
      if (settled) return;
      settled = true;
      cleanup();
      _phaseWorkerBusy = false;
      if (isTimeout) {
        // キューに溜まった古いリクエストを破棄するため、Workerごと作り直す
        stopPhaseWorker();
      }
      if (result) {
        _globalTransferPhase = result.f;
        _phaseSourceLiveData = liveDataForThisRound;
        _phaseFailureStreak = 0;
        // 調査タスク（CLAUDE.md「守備ステータスの推定」参照）用の一時ログ。UIには出さない。
        const h = result.histogram;
        diagLog(`[phase] ${new Date().toISOString()} f=${result.f.toFixed(6)} secondsToTransfer=${Math.round(3600 * result.f)} coverage=${result.coverage} exactlyOne=${result.exactlyOne} histogram(0/1/2-3/4-10/11+)=${h.zero}/${h.one}/${h.twoToThree}/${h.fourToTen}/${h.elevenPlus}`);
        logSampleTerritoryEstimates();
      } else {
        _phaseFailureStreak++;
        if (_phaseFailureStreak >= PHASE_FAILURE_STREAK_LIMIT) { _globalTransferPhase = null; _phaseSourceLiveData = null; }
        diagLog(`[phase] failed (streak=${_phaseFailureStreak}${isTimeout ? ', timeout' : ''}), keeping previous f=${_globalTransferPhase}`);
      }
      resolve();
    };
    const messageHandler = (e) => {
      if (e.data.requestId !== requestId) return; // 古いリクエストの結果は無視（追い越し対策）
      finish(e.data.result, false);
    };
    const errorHandler = () => finish(null, false);
    const timeoutId = setTimeout(() => finish(null, true), PHASE_WORKER_TIMEOUT_MS);

    worker.addEventListener('message', messageHandler);
    worker.addEventListener('error', errorHandler);
    worker.postMessage({ requestId, inputs });
  });
}

// Phase 5 調査（目的関数差し替え後の検証）用の一時ログ。固定10領地について、
// ツールチップを開かなくても毎ポーリング推定値を記録する。UIには出さない。調査後は削除予定。
const SAMPLE_TERRITORY_NAMES = ['Detlas', 'Ragni', 'Nemract', 'Cinfras', 'Llevigar', 'Elkurn', 'Thesead', 'Rodoroc', 'Troms', 'Olux'];
function logSampleTerritoryEstimates() {
  // try/catch: このループはcomputeGlobalTransferPhase()のfinish()から同期的に呼ばれ、
  // finish()はこの直後にresolve()する。1領地分の例外がここで送出されると、finish()が
  // resolve()に到達できず、computeGlobalTransferPhase()が返すPromiseが永久にpendingのまま
  // 残る（fetchLiveTerritoryData()側のawaitがそのポーリング回だけ完了しなくなり、
  // updateQualityCache()も呼ばれなくなる）。1領地分の例外はログのみに留め、残りの
  // サンプル領地の処理は継続する。
  for (const name of SAMPLE_TERRITORY_NAMES) {
    try {
      // fと同じスナップショット（_phaseSourceLiveData）から読む。常に最新のliveDataを使うと、
      // ポーリングの追い越し（CLAUDE.md「Res Tickと表示されている資源量が噛み合わない」参照）で
      // 新しい資源量と古いfが混ざり、推定値が不正確になる。
      const info = _phaseSourceLiveData && _phaseSourceLiveData[name];
      if (!info || !info.guild || !info.guild.name || !info.resources) { diagLog(`[sample] ${name}: unowned/no data`); continue; }
      const confirmed = computeLiveConfirmedInfo(name, info);
      const confirmedExtra = buildConfirmedExtraFromLiveInfo(confirmed);
      const ownedNames = getOwnedNamesForGuild(info.guild.uuid, _phaseSourceLiveData);
      const { mult } = EcoLogic.calcLiveDefenseMult(name, territories, ownedNames, info.hq, []);
      const estimate = EcoLogic.estimateDefenseStats({
        observedRating: confirmed.defenceLabel, isHQ: info.hq, mult, confirmedExtra,
        resourceSnapshot: confirmed.resourceSnapshot, f: _globalTransferPhase
      });
      if (!estimate.levels) { diagLog(`[sample] ${name}: levels=null (defences=${confirmed.defenceLabel})`); continue; }
      const L = estimate.levels;
      diagLog(`[sample] ${name}: Damage${L.damage}/Attack${L.attack}/Health${L.health}/Defense${L.defense} residual=${estimate.residual.toFixed(4)} (defences=${confirmed.defenceLabel})`);
    } catch (err) {
      console.error(`[sample] EXCEPTION for ${name}:`, err);
    }
  }
}

// 推定はfと同じスナップショット（_phaseSourceLiveData）からのみ算出する。呼び出し側から
// info/confirmedExtra/resourceSnapshot（現在ポーリングの最新liveData由来）を渡させる旧方式は、
// Worker計算がポーリング間隔（30秒）を超えた際に「最新の資源量」と「1つ前のf」が混ざる
// バグの原因だったため廃止した（CLAUDE.md「Res Tickと表示されている資源量が噛み合わない」参照）。
// 領地がまだ_phaseSourceLiveDataに存在しない（Liveモード開始直後・直近捕獲でf探索対象外等）場合は
// levels:nullを返し、呼び出し側は簡易推定へフォールバックしない（簡易推定も同じ理由でf同期が必要なため）。
const EMPTY_ESTIMATE = { levels: null, ehp: null, dps: null, secondsToTransfer: null, residual: null, candidateCount: 0, consumption: null, mult: 1 };
function getDefenseEstimate(name) {
  const info = _phaseSourceLiveData && _phaseSourceLiveData[name];
  if (!info || !info.guild || !info.guild.name || !info.resources) return EMPTY_ESTIMATE;

  const cacheKey = _globalTransferPhase; // _phaseSourceLiveDataは_globalTransferPhaseと必ず同時に更新されるため、fの値だけでラウンドを一意に識別できる
  const cached = _defenseEstimateCache[name];
  if (cached && cached.key === cacheKey) return cached.result;

  const confirmed = computeLiveConfirmedInfo(name, info);
  const confirmedExtra = buildConfirmedExtraFromLiveInfo(confirmed);
  const ownedNames = getOwnedNamesForGuild(info.guild.uuid, _phaseSourceLiveData);
  const { mult } = EcoLogic.calcLiveDefenseMult(name, territories, ownedNames, info.hq, []);

  const result = {
    ...EcoLogic.estimateDefenseStats({
      observedRating: confirmed.defenceLabel, isHQ: info.hq, mult, confirmedExtra,
      resourceSnapshot: confirmed.resourceSnapshot, f: _globalTransferPhase
    }),
    mult
  };

  _defenseEstimateCache[name] = { key: cacheKey, result };
  return result;
}

// ═══════════════════════════════════════════════════════════
//  推定結果の品質付きキャッシュ保持（Item 9）
//  computeGlobalTransferPhase()の直後（fetchLiveTerritoryData()内）にポーリングごと1回呼ばれる。
//  全所有領地についてStep2（estimateDefenseStats）をこの時点のfで評価し、候補が1件に絞れた
//  （Tier A/B）場合のみキャッシュを更新する。判定ロジック自体はeco-logic.jsの純関数に委譲する。
// ═══════════════════════════════════════════════════════════
function updateQualityCache() {
  const nowMs = Date.now();

  // try/catch: 1領地の処理で例外が発生しても、以降の領地の破棄判定・更新判定が
  // スキップされないよう1領地単位で例外を分離する（例外発生時はログのみ行い処理を継続する）。

  // 破棄判定を先に行う（現在のliveDataに存在しない・acquired/defences/guild変化・2時間経過・
  // 資源量ベースの追加判定のいずれか）。resourceSnapshot/fは鮮度優先で常に最新のliveData/
  // _globalTransferPhaseから作る（BFSを必要としない生のstored/generationのみで足りるため、
  // computeLiveConfirmedInfo()は使わない）。
  for (const name of Object.keys(_qualityCache)) {
    try {
      const cached = _qualityCache[name];
      const info = liveData && liveData[name];
      let currentInfo = null;
      if (info && info.guild && info.guild.name) {
        const resourceSnapshot = {};
        for (const r of info.resources || []) {
          const key = LIVE_RESOURCE_TYPE_MAP[r.type];
          if (key && key !== 'emeralds') resourceSnapshot[key] = { stored: r.stored, generation: r.generation };
        }
        currentInfo = {
          acquired: info.acquired, defences: info.defences, guild: info.guild.name,
          resourceSnapshot, f: _globalTransferPhase
        };
      }
      const { discard, resourceMismatchStreak } = EcoLogic.shouldDiscardCache(cached, currentInfo, nowMs);
      if (discard) delete _qualityCache[name];
      else cached.resourceMismatchStreak = resourceMismatchStreak;
    } catch (err) {
      console.error(`Failed to evaluate cache discard for ${name}:`, err);
    }
  }

  if (_globalTransferPhase === null || !_phaseSourceLiveData) return;

  // 新規のTier A/B評価は、fと同じスナップショット（_phaseSourceLiveData）からのみ行う。
  // 最新のliveDataを使うと、Worker計算がポーリング間隔を超えた際に「最新の資源量」と
  // 「1つ前のf」が混ざり、誤った推定が高品質としてキャッシュされうる
  // （CLAUDE.md「Res Tickと表示されている資源量が噛み合わない」参照）。
  // なお直前の破棄判定（上のループ）は意図的に最新のliveDataを使い続ける
  // （領地喪失・defences変化等は鮮度優先で即座に検知したいため）。
  const bfsCache = {}; // ギルドごとに1回だけBFSする（computeGlobalTransferPhaseと同じ最適化）
  for (const [name, info] of Object.entries(_phaseSourceLiveData)) {
    if (!info.guild || !info.guild.name || !info.resources) continue;
    try {
      // 取得直後はstoredが捕獲時にリセットされ転送位相モデルに従わないため、キャッシュ更新の対象外とする
      if (recentlyCapturedElapsedMs(info) !== null) continue;

      const confirmed = computeLiveConfirmedInfo(name, info, bfsCache);
      const confirmedExtra = buildConfirmedExtraFromLiveInfo(confirmed);
      const ownedNames = getOwnedNamesForGuild(info.guild.uuid, _phaseSourceLiveData);
      const { mult } = EcoLogic.calcLiveDefenseMult(name, territories, ownedNames, info.hq, []);
      const result = EcoLogic.estimateDefenseStats({
        observedRating: confirmed.defenceLabel, isHQ: info.hq, mult, confirmedExtra,
        resourceSnapshot: confirmed.resourceSnapshot, f: _globalTransferPhase
      });
      if (result.candidateCount !== 1) continue; // Tier C相当。キャッシュに触れない

      const em = confirmed.resByType['EMERALD'];
      const emeraldAdmissible = EcoLogic.computeTerritoryEmeraldAdmissible(
        confirmed.resourceSnapshot, confirmed.treasuryBuff, info.hq,
        em ? em.generation : undefined, em ? em.stored : undefined
      );
      const tier = EcoLogic.determineTier(result.candidateCount, emeraldAdmissible, _globalTransferPhase);
      if (tier === 'C') continue;

      const storedValues = [];
      const producingChannels = [];
      for (const r of ['ore', 'crops', 'wood', 'fish']) {
        const d = confirmed.resourceSnapshot[r];
        if (!d) continue;
        storedValues.push(d.stored);
        if (d.generation > 0) {
          producingChannels.push({ resource: r, generation: d.generation, consumption: result.consumption[r] });
        }
      }
      if (storedValues.length === 0) continue;

      const quality = EcoLogic.computeQualityScore(storedValues, _globalTransferPhase, producingChannels);
      const cachedBefore = _qualityCache[name] || null;
      if (!EcoLogic.shouldUpdateCache(cachedBefore, tier, quality)) continue;

      // 調査用の一時ログ（CLAUDE.md「問題3」参照、調査後削除予定）。低品質なTier Aが
      // より高品質なTier Bを問答無用で上書きしてしまっていないかを実データで確認するため、
      // 「TierがB→Aへ変わる」かつ「新しい品質のほうが低い」更新だけを記録する
      // （shouldUpdateCacheの仕様上、Tier Aは品質を問わずTier Bに勝つため、この組み合わせは
      // 理論上いつでも起こりうる。実際にどれくらいの頻度・落差で発生しているかを見たい）。
      if (cachedBefore && cachedBefore.tier === 'B' && tier === 'A' && quality < cachedBefore.quality) {
        diagLog(`[cache-diag] ${name}: B(quality=${cachedBefore.quality.toFixed(4)}, levels=${JSON.stringify(cachedBefore.estimate.levels)}) -> A(quality=${quality.toFixed(4)}, levels=${JSON.stringify(result.levels)}) at ${new Date(nowMs).toISOString()}`);
      }

      _qualityCache[name] = {
        territoryName: name,
        tier,
        quality,
        estimate: { ...result, mult }, // renderDefenseEstimateHTMLがそのまま渡せる形（getDefenseEstimateの戻り値と同型）
        observedAt: new Date(nowMs).toISOString(),
        acquired: info.acquired,
        defences: info.defences,
        guild: info.guild.name,
        resourceMismatchStreak: 0 // 新規/更新された観測は資源量ベースの不一致とは無関係のため0から開始する
      };
    } catch (err) {
      console.error(`Failed to evaluate cache update for ${name}:`, err);
    }
  }
}

// アイコン付きの1行（Damage/Attack Speed/HP/Defence共通の見た目）。lvがnullなら"?"を表示する。
function defenseStatLine(icon, text, lv) {
  return `<div><img src="./assets/icons/upgrades/${icon}.png" class="res-icon-img" alt="${icon}"> <span style="color:#94a3b8;">${text}</span> <span style="color:#64748b;">(${lv === null ? '?' : lv})</span></div>`;
}

// 推定できない場合（levelsがnull）はセクションごと空文字列を返す。範囲ではなく単一値を表示する。
// Damage/HPはConnections/Externals由来の倍率（mult）を反映する。Attacks per second/Defence%には
// 倍率を掛けない（computeStatsFromLevelsの仕様どおり）。
// cacheMeta（{observedAt, tier}、Item 9）を渡すと、キャッシュされた推定である旨（観測時刻・Tier A表示）を
// 見出しの下に1行追加する。省略時（現在ポーリングの生の推定を表示する場合）は何も追加しない。
function renderDefenseEstimateHTML(estimate, cacheMeta) {
  if (!estimate.levels) return '';

  const L = estimate.levels;
  const stats = EcoLogic.computeStatsFromLevels(L.health, L.damage, L.attack, L.defense, estimate.mult);
  let html = `<div style="color:#FF55FF; margin-top:8px;">Estimated Defense:</div>`;
  if (cacheMeta) {
    const elapsed = fmtHeldDuration(cacheMeta.observedAt) || '0s';
    const tierTag = cacheMeta.tier === 'A' ? ' · verified' : '';
    html += `<div style="color:#64748b; font-size:0.85em;">(observed ${elapsed} ago${tierTag})</div>`;
  }
  html += defenseStatLine('damage', `${fmtNum(stats.finalDmgMin)}-${fmtNum(stats.finalDmgMax)} Damage`, L.damage);
  html += defenseStatLine('attack-speed', `${stats.atkSpd.toFixed(1)} Attacks per second`, L.attack);
  html += defenseStatLine('health', `${fmtHp(stats.finalHp)} HP`, L.health);
  html += defenseStatLine('defense', `${fmtPct1(stats.defPct)}% Defence`, L.defense);

  html += `<div style="color:#FF55FF; margin-top:8px;">Estimated Stats:</div>`;
  html += `<div><span style="color:#FF55FF;">- </span><span style="color:#94a3b8;">EHP ${fmt(estimate.ehp)}</span></div>`;
  html += `<div><span style="color:#FF55FF;">- </span><span style="color:#94a3b8;">DPS ${fmt(estimate.dps)}</span></div>`;

  if (estimate.secondsToTransfer !== null && estimate.secondsToTransfer !== undefined) {
    html += `<div style="margin-top:8px; color:#555555;">Resources move in ${estimate.secondsToTransfer}s</div>`;
  }

  return html;
}

// 確定推定（estimateDefenseStats）がlevels:nullのときのみ呼ばれるフォールバック。
// キャッシュはしない（O(1)で軽量なため）。確定推定と同じ理由で、必ずfと同じスナップショット
// （_phaseSourceLiveData）から算出する（この式もf/generation/storedの整合を前提とするモデルのため）。
function getDefenseEstimateApproximate(name) {
  const info = _phaseSourceLiveData && _phaseSourceLiveData[name];
  if (!info || !info.guild || !info.guild.name || !info.resources) {
    return { levels: { damage: null, attack: null, health: null, defense: null }, ehp: null, dps: null, secondsToTransfer: null, mult: 1 };
  }
  const confirmed = computeLiveConfirmedInfo(name, info);
  const confirmedExtra = buildConfirmedExtraFromLiveInfo(confirmed);
  const ownedNames = getOwnedNamesForGuild(info.guild.uuid, _phaseSourceLiveData);
  const { mult } = EcoLogic.calcLiveDefenseMult(name, territories, ownedNames, info.hq, []);
  return {
    ...EcoLogic.estimateDefenseStatsApproximate({
      observedRating: confirmed.defenceLabel, isHQ: info.hq, mult, confirmedExtra,
      resourceSnapshot: confirmed.resourceSnapshot, f: _globalTransferPhase
    }),
    mult
  };
}

// 4スタッツとも決定不能な場合は空文字列を返す（セクション自体を出さない）。
// 確定推定（renderDefenseEstimateHTML）とは見出し・色をグレー系にして明確に区別する。
// 各スタッツが個別に決定不能な場合は"?"を表示する。HPはhealth・defenseの両方が
// 決定できている場合のみ表示する（computeStatsFromLevelsの仕様上、両方揃わないと算出できないため）。
function renderDefenseEstimateApproximateHTML(estimate) {
  const L = estimate.levels;
  if (L.damage === null && L.attack === null && L.health === null && L.defense === null) return '';

  const stats = EcoLogic.computeStatsFromLevels(L.health ?? 0, L.damage ?? 0, L.attack ?? 0, L.defense ?? 0, estimate.mult);
  let html = `<div style="color:#8B96A3; margin-top:8px;">Estimated Defence (approximate):</div>`;
  html += defenseStatLine('damage', L.damage !== null ? `${fmtNum(stats.finalDmgMin)}-${fmtNum(stats.finalDmgMax)} Damage` : 'Damage', L.damage);
  html += defenseStatLine('attack-speed', L.attack !== null ? `${stats.atkSpd.toFixed(1)} Attacks per second` : 'Attacks per second', L.attack);
  html += defenseStatLine('health', (L.health !== null && L.defense !== null) ? `${fmtHp(stats.finalHp)} HP` : 'HP', L.health);
  html += defenseStatLine('defense', L.defense !== null ? `${fmtPct1(stats.defPct)}% Defence` : 'Defence', L.defense);

  if (estimate.ehp !== null || estimate.dps !== null) {
    html += `<div style="color:#8B96A3; margin-top:8px;">Estimated Stats (approximate):</div>`;
    if (estimate.ehp !== null) html += `<div><span style="color:#8B96A3;">- </span><span style="color:#94a3b8;">EHP ${fmt(estimate.ehp)}</span></div>`;
    if (estimate.dps !== null) html += `<div><span style="color:#8B96A3;">- </span><span style="color:#94a3b8;">DPS ${fmt(estimate.dps)}</span></div>`;
  }

  if (estimate.secondsToTransfer !== null && estimate.secondsToTransfer !== undefined) {
    html += `<div style="margin-top:8px; color:#555555;">Resources move in ${estimate.secondsToTransfer}s</div>`;
  }
  html += `<div style="margin-top:4px; color:#555555; font-size:0.85em;">Approximate: hidden bonuses inferred from defence rating</div>`;

  return html;
}

// AWB共有バックエンド（/eco/territories）から取得した推定エントリをツールチップ用HTMLに変換する。
// AWB側が既にDamage/HP等の最終値（Connections/Externals由来の倍率込み）を計算済みのため、
// ローカルのcomputeStatsFromLevels等は使わずレスポンスの値をそのまま表示する。
// levels内のdamage/attack/health/defenseは個別にnullになりうる（実データで複数件確認済み）ため、
// 1項目でもnullなら4項目まとめてnull扱いにはせず、項目ごとに"?"表示へフォールバックする。
// 4項目すべてnullの場合のみ空文字列を返す（呼び出し側でローカル計算にフォールバックさせる）。
function renderAwbEstimateHTML(entry) {
  const L = entry.levels || {};
  if (L.damage == null && L.attack == null && L.health == null && L.defense == null) return '';

  const isApprox = !!entry.approximate;
  const accentColor = isApprox ? '#8B96A3' : '#FF55FF';

  let html = `<div style="color:${accentColor}; margin-top:8px;">${isApprox ? 'Estimated Defence (approximate):' : 'Estimated Defense:'}</div>`;

  const elapsed = fmtHeldDuration(entry.observedAt) || '0s';
  const tierTag = entry.tier === 'A' ? ' · verified' : '';
  html += `<div style="color:#64748b; font-size:0.85em;">(observed ${elapsed} ago${tierTag})</div>`;

  const [dmgMin, dmgMax] = entry.damageRange || [null, null];
  html += defenseStatLine('damage', (dmgMin != null && dmgMax != null) ? `${fmtNum(dmgMin)}-${fmtNum(dmgMax)} Damage` : 'Damage', L.damage ?? null);
  html += defenseStatLine('attack-speed', entry.attackSpeed != null ? `${entry.attackSpeed.toFixed(1)} Attacks per second` : 'Attacks per second', L.attack ?? null);
  html += defenseStatLine('health', entry.hp != null ? `${fmtHp(entry.hp)} HP` : 'HP', L.health ?? null);
  html += defenseStatLine('defense', entry.defensePercent != null ? `${fmtPct1(entry.defensePercent)}% Defence` : 'Defence', L.defense ?? null);

  if (entry.ehp != null || entry.dps != null) {
    html += `<div style="color:${accentColor}; margin-top:8px;">Estimated Stats${isApprox ? ' (approximate)' : ''}:</div>`;
    if (entry.ehp != null) html += `<div><span style="color:${accentColor};">- </span><span style="color:#94a3b8;">EHP ${fmt(entry.ehp)}</span></div>`;
    if (entry.dps != null) html += `<div><span style="color:${accentColor};">- </span><span style="color:#94a3b8;">DPS ${fmt(entry.dps)}</span></div>`;
  }

  if (isApprox) {
    html += `<div style="margin-top:4px; color:#555555; font-size:0.85em;">Approximate: hidden bonuses inferred from defence rating</div>`;
  }

  return html;
}

function positionTooltip(mx, my, above) {
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

function showUpgradeTooltip(mx, my, displayName, above) {
  tooltip.innerHTML = `<div style="color:#ffffff;">${escapeHtml(displayName)}</div>`;
  tooltip.style.display = 'block';
  positionTooltip(mx, my, above);
}

function hideTooltip() {
  tooltip.style.display = 'none';
  _lastLiveTooltipArgs = null;
}

// ポーリングごと（fetchLiveTerritoryData内）に呼ぶ。表示中のLiveツールチップがあれば、
// 同じ領地・同じ位置でshowLiveTooltip()を再実行して内容を現在のf/liveDataで再計算する。
// マウスが離れる等で既にhideTooltip()済み（_lastLiveTooltipArgs===null）の場合は何もしない。
function refreshLiveTooltipIfOpen() {
  if (!liveMode || !_lastLiveTooltipArgs || tooltip.style.display !== 'block') return;
  const { mx, my, name, above } = _lastLiveTooltipArgs;
  showLiveTooltip(mx, my, name, above);
}

// ═══════════════════════════════════════════════════════════
//  RESOURCE CALCULATIONS
//  計算の実体はeco-logic.jsにある。ここでは状態（territories等）を
//  引数として渡す薄いラッパーのみを持つ。
// ═══════════════════════════════════════════════════════════
function zeroCosts() {
  return EcoLogic.zeroCosts();
}

function calcTerritoryDefenseStats(name) {
  return EcoLogic.calcTerritoryDefenseStats(name, territories, addedTerritories, customConnections);
}

// resourceOverridesが有効な場合はそれを、そうでなければterritories.jsonの基本資源を返す。
// 資源を読むすべての処理はこれ経由に統一する。
function getTerritoryResources(name) {
  return EcoLogic.getTerritoryResources(name, territories, resourceOverrides, addedTerritories);
}

function calcTerritoryProduction(name) {
  const buff = calcTreasuryBuff(name);
  return EcoLogic.calcTerritoryProduction(name, territories, addedTerritories, resourceOverrides, buff);
}

function calcTerritoryConsumption(name) {
  return EcoLogic.calcTerritoryConsumption(addedTerritories[name]);
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

// Estimated Defence の HP 表示専用（k単位、例: 3,300k）
function fmtHp(n) {
  return Math.round(n / 1000).toLocaleString('en-US') + 'k';
}

// 小数第1位まで丸めたうえで、末尾の.0を落とす（Treasuryのバフ率表示用）
function fmtPct1(n) {
  const s = n.toFixed(1);
  return s.endsWith('.0') ? s.slice(0, -2) : s;
}

// ═══════════════════════════════════════════════════════════
//  TREASURY
// ═══════════════════════════════════════════════════════════
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

function getHQPaths() {
  if (_hqPathCache !== null) return _hqPathCache;
  return (_hqPathCache = EcoLogic.getHQPaths(territories, addedTerritories, customConnections));
}

function isConnectedToHQ(name) {
  return EcoLogic.isConnectedToHQ(name, addedTerritories, getHQPaths());
}

function calcTreasuryBuff(name) {
  const level = (addedTerritories[name] && addedTerritories[name].treasury) || 'Very Low';
  const dist = getFullGraphDistances()[name];
  return EcoLogic.calcTreasuryBuff(level, dist);
}

// ═══════════════════════════════════════════════════════════
//  MAP FILTER
// ═══════════════════════════════════════════════════════════
// 判定対象は登録済み領地のみ。未登録領地は常に空配列を返す。
function getFilterCategories(name) {
  if (!addedTerritories[name]) return [];

  if (filterMode === 'defense') {
    const stats = calcTerritoryDefenseStats(name);
    return [stats ? stats.rating : 'Very Low'];
  }

  if (filterMode === 'treasury') {
    return [addedTerritories[name].treasury || 'Very Low'];
  }

  if (filterMode === 'resource') {
    const res = getTerritoryResources(name);
    if (res.ore > 0 && res.wood > 0 && res.fish > 0 && res.crops > 0) return ['rainbow'];
    const cats = [];
    if (res.emeralds >= 18000) cats.push('city');
    if (res.ore > 0) cats.push('ore');
    if (res.wood > 0) cats.push('wood');
    if (res.fish > 0) cats.push('fish');
    if (res.crops > 0) cats.push('crops');
    return cats;
  }

  return [];
}

// Liveモード用。全437領地が判定対象（「登録済みのみ」という制約が意味を持たないため）。
// 無所属の領地は常に空配列を返す（未登録領地の扱いと同様、フィルターの判定対象外）。
function getFilterCategoriesLive(name) {
  const info = liveData && liveData[name];
  if (!info || !info.guild || !info.guild.name) return [];

  if (filterMode === 'defense') {
    return [LIVE_RATING_MAP[info.defences] || 'Very Low'];
  }

  if (filterMode === 'treasury') {
    return [LIVE_RATING_MAP[info.treasury] || 'Very Low'];
  }

  if (filterMode === 'resource') {
    const gen = {};
    let emBaseGeneration = 0;
    for (const r of info.resources || []) {
      const key = LIVE_RESOURCE_TYPE_MAP[r.type];
      if (key) gen[key] = r.generation;
      if (r.type === 'EMERALD') emBaseGeneration = r.baseGeneration || 0;
    }
    if (gen.ore > 0 && gen.wood > 0 && gen.fish > 0 && gen.crops > 0) return ['rainbow'];
    const cats = [];
    if (emBaseGeneration >= 18000) cats.push('city');
    if (gen.ore > 0) cats.push('ore');
    if (gen.wood > 0) cats.push('wood');
    if (gen.fish > 0) cats.push('fish');
    if (gen.crops > 0) cats.push('crops');
    return cats;
  }

  return [];
}

// マップ上の資源アイコン描画用（drawTerritoriesLive）。判定にはgenerationを使う（>0で産出中と判定）。
// cityのみbaseGeneration（18,000以上）で判定する（generationはTreasuryバフ等で変動するため）。
// ダブル資源地（baseGeneration>=7200）はdrawTerritories()の通常モードと同じ基準でアイコンを
// 2つ表示するため、doubleフラグも合わせて返す（2026-08修正。従来はboolean一つのみでLive Mode側の
// アイコンが常に1個になっていた）。isCity判定と同様baseGenerationを使う（Treasuryバフ等の影響を
// 受けない、領地固有の基礎生成量のため）。
function getLiveResourceFlags(info) {
  const flags = {
    city: false, ore: false, wood: false, fish: false, crops: false,
    oreDouble: false, woodDouble: false, fishDouble: false, cropsDouble: false
  };
  for (const r of info.resources || []) {
    const key = LIVE_RESOURCE_TYPE_MAP[r.type];
    if (!key) continue;
    if (key === 'emeralds') {
      if ((r.baseGeneration || 0) >= 18000) flags.city = true;
    } else if ((r.generation || 0) > 0) {
      flags[key] = true;
      if ((r.baseGeneration || 0) >= 7200) flags[`${key}Double`] = true;
    }
  }
  return flags;
}

// Territory Managerリスト・Select All・Clear Allで使う表示判定。HQは常にtrue。
function isFilterVisible(name) {
  if (filterMode === 'none') return true;
  if (addedTerritories[name] && addedTerritories[name].hq) return true;
  return getFilterCategories(name).some(c => filterToggles[filterMode][c]);
}

function openFilterModal() {
  renderFilterModal();
  document.getElementById('filter-overlay').classList.add('open');
}

function closeFilterModal() {
  document.getElementById('filter-overlay').classList.remove('open');
}

function setFilterMode(mode) {
  filterMode = mode;
  document.getElementById('filter-btn').classList.toggle('active', filterMode !== 'none');
  renderFilterModal();
  refreshUI();
}

function toggleFilterValue(mode, key) {
  filterToggles[mode][key] = !filterToggles[mode][key];
  refreshUI();
}

function clearFilter() {
  filterMode = 'none';
  document.getElementById('filter-btn').classList.remove('active');
  renderFilterModal();
  refreshUI();
}

const FILTER_MODE_LABELS = { none: 'None', defense: 'Defense', treasury: 'Treasury', resource: 'Resource' };
const FILTER_TOGGLE_LABELS = {
  defense: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
  treasury: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
  resource: [
    { key: 'ore', label: 'Ore' }, { key: 'wood', label: 'Wood' }, { key: 'fish', label: 'Fish' },
    { key: 'crops', label: 'Crops' }, { key: 'rainbow', label: 'Rainbow' }, { key: 'city', label: 'City' }
  ]
};

function renderFilterModal() {
  document.querySelectorAll('input[name="filter-mode"]').forEach(r => {
    r.checked = r.value === filterMode;
  });

  const box = document.getElementById('filter-toggles');
  if (filterMode === 'none') {
    box.innerHTML = '';
    box.style.display = 'none';
    return;
  }
  box.style.display = '';

  const keys = filterMode === 'resource' ? FILTER_TOGGLE_LABELS.resource : FILTER_TOGGLE_LABELS[filterMode].map(k => ({ key: k, label: k }));
  box.innerHTML = keys.map(({ key, label }) => {
    const checked = filterToggles[filterMode][key] ? 'checked' : '';
    const safeKey = escapeHtml(JSON.stringify(key));
    return `<label class="filter-toggle-row"><input type="checkbox" ${checked} onchange="toggleFilterValue('${filterMode}', ${safeKey})"> ${escapeHtml(label)}</label>`;
  }).join('');
}

document.getElementById('filter-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('filter-overlay')) closeFilterModal();
});

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
function hasValidResourceOverride(name) {
  return !!(resourceOverrides[name] && addedTerritories[name]);
}

function getTerritoryListIconHTML(name) {
  const st = addedTerritories[name];
  const t = territories[name];
  if (!st || !t) return '';

  if (st.hq) {
    return `<img src="./assets/icons/others/guild_headquarter.png" class="hq-list-icon" alt="HQ">`;
  }

  const hasHQ = Object.keys(addedTerritories).some(n => addedTerritories[n].hq);
  if (hasHQ && !isConnectedToHQ(name)) {
    return `<img src="./assets/icons/others/disconnected.png" class="list-icon" onerror="this.style.display='none'" alt="Disconnected">`;
  }

  const res = getTerritoryResources(name);
  const em = res.emeralds;
  const ore = res.ore;
  const crops = res.crops;
  const fish = res.fish;
  const wood = res.wood;

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
  const totalCount = Object.keys(addedTerritories).length;

  if (totalCount === 0) {
    document.getElementById('added-count').textContent = '0';
    list.innerHTML = '<div style="color:#64748b;font-size:12px;padding:4px;">No territories added.</div>';
    return;
  }

  // 第1キー: 接続状態（HQ→到達可能→到達不能）、第2キー: Defense+Bonusレベル総和の降順、
  // 第3キー: 領地名のアルファベット昇順（localeCompare('en')。Phase 1の降順ルールはここには適用しない）
  const getGroup = (name) => {
    const st = addedTerritories[name];
    if (st.hq) return 0;
    return isConnectedToHQ(name) ? 1 : 2;
  };

  const getUpgradeLevelSum = (name) => {
    const st = addedTerritories[name];
    if (!st) return 0;
    let sum = 0;
    if (st.defense) for (const v of Object.values(st.defense)) sum += v || 0;
    if (st.bonuses) for (const v of Object.values(st.bonuses)) sum += v || 0;
    return sum;
  };

  const sortedNames = Object.keys(addedTerritories).sort((a, b) => {
    const groupA = getGroup(a);
    const groupB = getGroup(b);
    if (groupA !== groupB) return groupA - groupB;

    const sumA = getUpgradeLevelSum(a);
    const sumB = getUpgradeLevelSum(b);
    if (sumA !== sumB) return sumB - sumA;

    return a.localeCompare(b, 'en');
  });

  const hasHQ = Object.keys(addedTerritories).some(n => addedTerritories[n].hq);

  const visibleNames = filterMode === 'none' ? sortedNames : sortedNames.filter(isFilterVisible);
  document.getElementById('added-count').textContent = filterMode === 'none'
    ? `${totalCount}` : `${visibleNames.length} / ${totalCount}`;

  if (visibleNames.length === 0) {
    list.innerHTML = '<div style="color:#64748b;font-size:12px;padding:4px;">No territories match the current filter.</div>';
    return;
  }

  list.innerHTML = visibleNames.map(name => {
    const isSel = listSelectedTerritories.has(name);
    const isDisconnected = hasHQ && !isConnectedToHQ(name);
    const safeNameArg = escapeHtml(JSON.stringify(name));
    const iconHTML = getTerritoryListIconHTML(name);
    const cls = 'territory-item' + (isSel ? ' list-selected' : '') + (isDisconnected ? ' disconnected' : '');
    const nameSuffix = hasValidResourceOverride(name) ? '*' : '';
    return `<div class="${cls}" onclick="toggleListSelection(${safeNameArg})">
      <div class="territory-item-left">
        ${iconHTML}
        <span>${escapeHtml(name)}${nameSuffix}</span>
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
  if (filterMode === 'none') {
    if (!confirm('Remove all territories?')) return;
    addedTerritories = {};
    listSelectedTerritories.clear();
    refreshUI();
    return;
  }

  const namesToRemove = Object.keys(addedTerritories).filter(n => !addedTerritories[n].hq && isFilterVisible(n));
  if (namesToRemove.length === 0) return;
  if (!confirm(`Remove ${namesToRemove.length} filtered territories?`)) return;
  for (const n of namesToRemove) {
    delete addedTerritories[n];
    listSelectedTerritories.delete(n);
  }
  refreshUI();
}

function resetSelected() {
  const names = [...listSelectedTerritories].filter(n => addedTerritories[n]);
  if (names.length === 0) return;
  if (!confirm(`Reset all upgrades for ${names.length} selected territories?`)) return;
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
  const names = filterMode === 'none'
    ? Object.keys(addedTerritories)
    : Object.keys(addedTerritories).filter(isFilterVisible);
  listSelectedTerritories = new Set(names);
  updateTerritoryList();
  draw();
}

function selectNone() {
  listSelectedTerritories.clear();
  selectedTerritories.clear();
  updateSelectedCount();
  updateTerritoryList();
  draw();
}

function editSelected() {
  const names = [...listSelectedTerritories].filter(n => addedTerritories[n]);
  if (names.length === 0) return;
  openModal(names[0], names.length > 1 ? names : null);
}

function updateTerritorySelectDatalist() {
  const sel = document.getElementById('territory-select');
  const dl = document.getElementById('territory-list-options');
  if (!sel || !dl) return;
  dl.innerHTML = allTerritoryNames.includes(sel.value)
    ? '' : allTerritoryNames.map(n => `<option value="${escapeHtml(n)}">`).join('');
}

function addSelectedTerritory() {
  const sel = document.getElementById('territory-select');
  if (!sel.value) return;
  addTerritory(sel.value);
  sel.value = '';
  updateTerritorySelectDatalist();
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
  updateGuildSelectDatalist();
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
  _fullDistCache = null;
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
    : name + (hasValidResourceOverride(name) ? '*' : '');

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

      // PC: ホバーでツールチップ表示（名前のみ）
      itemEl.addEventListener('mouseenter', (e) => {
        showUpgradeTooltip(e.clientX, e.clientY, displayName, false);
      });
      itemEl.addEventListener('mouseleave', () => {
        hideTooltip();
      });

      // スマホ: 500ms長押しでツールチップ表示。移動10px以上でキャンセル、指を離すと消える。
      // 長押しが発生した場合は <select> のピッカーを開かせない。
      let upTouchStart = null;
      let upTouchMoved = false;
      let upLongPressTimer = null;
      let upLongPressTriggered = false;

      sel.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        upTouchStart = { x: t.clientX, y: t.clientY };
        upTouchMoved = false;
        upLongPressTriggered = false;
        upLongPressTimer = setTimeout(() => {
          upLongPressTimer = null;
          if (upTouchMoved) return;
          upLongPressTriggered = true;
          showUpgradeTooltip(upTouchStart.x, upTouchStart.y, displayName, true);
        }, 500);
      }, { passive: true });

      sel.addEventListener('touchmove', (e) => {
        if (!upTouchStart) return;
        const t = e.touches[0];
        const dx = t.clientX - upTouchStart.x;
        const dy = t.clientY - upTouchStart.y;
        if (!upTouchMoved && Math.hypot(dx, dy) > 10) {
          upTouchMoved = true;
          if (upLongPressTimer !== null) { clearTimeout(upLongPressTimer); upLongPressTimer = null; }
          hideTooltip();
        }
      }, { passive: true });

      const endUpgradeTouch = () => {
        if (upLongPressTimer !== null) { clearTimeout(upLongPressTimer); upLongPressTimer = null; }
        if (upLongPressTriggered) hideTooltip();
      };
      sel.addEventListener('touchend', endUpgradeTouch);
      sel.addEventListener('touchcancel', endUpgradeTouch);

      sel.addEventListener('click', (e) => {
        if (upLongPressTriggered) {
          e.preventDefault();
          e.stopPropagation();
          upLongPressTriggered = false;
        }
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
  const buffPct = calcTreasuryBuff(name);
  if (buffPct > 0) {
    html += `<div class="stat-line"><span class="stat-label">Treasury Buff</span><span style="color:#4ade80">+${fmtPct1(buffPct * 100)}%</span></div>`;
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

function renderTradingRoutesHTML(name) {
  const hqName = Object.keys(addedTerritories).find(n => addedTerritories[n].hq);
  if (!hqName) return `<div style="color:#ffffff;">${escapeHtml(name)}</div>`;

  if (name === hqName) {
    return `<div style="color:#ffffff;">${escapeHtml(hqName)}(HQ)</div>`;
  }

  const paths = getHQPaths();
  const dist = paths.dist[name];

  if (dist === undefined) {
    return `<div style="color:#ffffff;">${escapeHtml(hqName)}(HQ)</div>` +
      `<div style="color:#FF5555;">→<img src="./assets/icons/others/disconnected.png" class="data-disconnect-icon" onerror="this.style.display='none'">${escapeHtml(name)}</div>` +
      `<div style="color:#AA0000; margin-top:4px;">This territory has no pipeline to the HQ.</div>`;
  }

  const path = paths.path[name];
  let inner = `<div style="color:#ffffff;">${escapeHtml(hqName)}(HQ)</div>`;
  for (let i = 1; i < path.length; i++) {
    inner += `<div style="color:#ffffff;">→${escapeHtml(path[i])}</div>`;
  }
  inner += `<div style="color:#ffffff; margin-top:6px;">Trade Time: ${dist} min${dist === 1 ? '' : 's'}</div>`;
  return inner;
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
    const prodColor = isZero ? '#555555' : r.color;
    const stored = Math.round((prod[r.id] + cons[r.id]) / 60);
    const storedColor = stored >= r.max ? '#FF5555' : r.color;
    const travMin = Math.round(trav[r.id] / 60);
    const prodIconHtml = r.icon
      ? RESOURCE_ICONS[r.id].replace('class="res-icon-img"', `class="res-icon-img${isZero ? ' gray-icon' : ''}"`)
      : '';
    const storedIconHtml = r.icon ? RESOURCE_ICONS[r.id] : '';

    inner += `<div style="color:${prodColor};">${prodIconHtml}+${fmtNum(prod[r.id])} ${r.label} per Hour</div>`;
    inner += `<div style="color:${r.color};">${storedIconHtml}<span style="color:${storedColor};">${fmtNum(stored)}</span>/${fmtNum(r.max)} stored (${fmtNum(travMin)} traversing)</div>`;
  }

  return inner;
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
  { label: 'Connection Editor', screen: 'connections' },
  { label: 'Resource Editor', screen: 'resources' },
  { label: 'Live Data', screen: 'live' }
];

function openCustomSettings() {
  const list = document.getElementById('cs-menu-list');
  list.innerHTML = ADDITIONAL_SETTINGS_ITEMS.map(item =>
    `<div class="cs-menu-item" onclick="showCSScreen('${item.screen}')"><span>${escapeHtml(item.label)}</span><span>›</span></div>`
  ).join('');
  showCSScreen('menu');
  document.getElementById('custom-settings-overlay').classList.add('open');
}

function closeCustomSettings() {
  document.getElementById('custom-settings-overlay').classList.remove('open');
}

function showCSScreen(screen) {
  document.getElementById('cs-screen-menu').style.display = screen === 'menu' ? '' : 'none';
  document.getElementById('cs-screen-connections').style.display = screen === 'connections' ? '' : 'none';
  document.getElementById('cs-screen-resources').style.display = screen === 'resources' ? '' : 'none';
  document.getElementById('cs-screen-live').style.display = screen === 'live' ? '' : 'none';
  if (screen === 'connections') {
    hideAddConnectionForm();
    renderConnectionList();
  } else if (screen === 'resources') {
    hideAddResourceForm();
    renderResourceOverrideList();
  } else if (screen === 'live') {
    renderLiveDataScreen();
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

  document.getElementById('conn-datalist-a').innerHTML = names.includes(aVal)
    ? '' : names.filter(n => n !== bVal).map(n => `<option value="${escapeHtml(n)}">`).join('');
  document.getElementById('conn-datalist-b').innerHTML = names.includes(bVal)
    ? '' : names.filter(n => n !== aVal).map(n => `<option value="${escapeHtml(n)}">`).join('');
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

function tryShowConnPicker(inputId, datalistId) {
  if (Object.keys(addedTerritories).length === 0) return;
  if (window.matchMedia('(max-width: 640px)').matches) return;
  const input = document.getElementById(inputId);
  const datalist = document.getElementById(datalistId);
  if (datalist.options.length === 0) return;
  try {
    input.showPicker();
  } catch (e) {
    // 未対応環境ではdatalistの標準挙動にフォールバック
  }
}
document.getElementById('conn-input-a').addEventListener('click', () => tryShowConnPicker('conn-input-a', 'conn-datalist-a'));
document.getElementById('conn-input-b').addEventListener('click', () => tryShowConnPicker('conn-input-b', 'conn-datalist-b'));
document.getElementById('territory-select').addEventListener('input', updateTerritorySelectDatalist);
document.getElementById('guild-select').addEventListener('input', updateGuildSelectDatalist);

document.getElementById('custom-settings-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('custom-settings-overlay')) closeCustomSettings();
});

// ═══════════════════════════════════════════════════════════
//  ADDITIONAL SETTINGS / RESOURCE EDITOR
// ═══════════════════════════════════════════════════════════
function toggleAddResourceForm() {
  const form = document.getElementById('res-add-form');
  if (form.style.display === 'none' || !form.style.display) {
    document.getElementById('res-input').value = '';
    document.getElementById('res-tier-normal').checked = true;
    document.querySelectorAll('.res-resource-cb').forEach(cb => cb.checked = false);
    document.getElementById('res-amount-normal').checked = true;
    document.getElementById('res-error').textContent = '';
    updateResourceFormState();
    updateResourceDatalist();
    form.style.display = '';
  } else {
    hideAddResourceForm();
  }
}

function hideAddResourceForm() {
  const form = document.getElementById('res-add-form');
  form.style.display = 'none';
  document.getElementById('res-error').textContent = '';
}

function updateResourceDatalist() {
  const val = document.getElementById('res-input').value;
  const names = Object.keys(addedTerritories).sort((x, y) => x.localeCompare(y, 'en'));
  document.getElementById('res-datalist').innerHTML = names.includes(val)
    ? '' : names.map(n => `<option value="${escapeHtml(n)}">`).join('');
}

function tryShowResPicker() {
  if (Object.keys(addedTerritories).length === 0) return;
  if (window.matchMedia('(max-width: 640px)').matches) return;
  const input = document.getElementById('res-input');
  const datalist = document.getElementById('res-datalist');
  if (datalist.options.length === 0) return;
  try {
    input.showPicker();
  } catch (e) {
    // 未対応環境ではdatalistの標準挙動にフォールバック
  }
}

// Rainbow選択時は資源・Amountを無効化。資源が2つ選択されている間はAmountをNormal固定で無効化し、
// 残りのチェックボックスも無効化する（3つ目を選べないようにする）。
function updateResourceFormState() {
  const tierInput = document.querySelector('input[name="res-tier"]:checked');
  const isRainbow = tierInput && tierInput.value === 'rainbow';
  const checkedBoxes = [...document.querySelectorAll('.res-resource-cb')].filter(cb => cb.checked);
  const twoSelected = checkedBoxes.length >= 2;

  document.querySelectorAll('.res-resource-cb').forEach(cb => {
    cb.disabled = isRainbow || (twoSelected && !cb.checked);
  });

  const amountDisabled = isRainbow || twoSelected;
  document.getElementById('res-amount-normal').disabled = amountDisabled;
  document.getElementById('res-amount-double').disabled = amountDisabled;
  if (amountDisabled) document.getElementById('res-amount-normal').checked = true;
}

function addResourceOverride() {
  const errEl = document.getElementById('res-error');
  const name = document.getElementById('res-input').value.trim();

  if (!name) { errEl.textContent = 'Please enter a territory.'; return; }
  if (!territories[name]) { errEl.textContent = 'Territory not found.'; return; }
  if (!addedTerritories[name]) { errEl.textContent = 'The territory must be registered.'; return; }

  const tier = document.querySelector('input[name="res-tier"]:checked').value;
  const checkedBoxes = [...document.querySelectorAll('.res-resource-cb')].filter(cb => cb.checked);
  const resources = tier === 'rainbow' ? [] : checkedBoxes.map(cb => cb.dataset.resource);

  if (tier !== 'rainbow' && resources.length === 0) { errEl.textContent = 'Select at least one resource.'; return; }
  if (resources.length > 2) { errEl.textContent = 'You can select up to two resources.'; return; }

  const double = resources.length === 1 && document.getElementById('res-amount-double').checked;

  resourceOverrides[name] = { tier, resources, double };

  errEl.textContent = '';
  hideAddResourceForm();
  renderResourceOverrideList();
  refreshUI();
}

function removeResourceOverride(name) {
  delete resourceOverrides[name];
  renderResourceOverrideList();
  refreshUI();
}

function clearAllResourceOverrides() {
  if (!confirm('Remove all resource overrides?')) return;
  resourceOverrides = {};
  renderResourceOverrideList();
  refreshUI();
}

function formatResourceOverrideLabel(override) {
  if (override.tier === 'rainbow') return 'Rainbow';
  const amount = (override.resources.length === 1 && override.double) ? 7200 : 3600;
  const resLabel = { ore: 'Ore', wood: 'Wood', fish: 'Fish', crops: 'Crops' };
  const parts = [];
  if (override.tier === 'city') parts.push('City');
  parts.push(...override.resources.map(r => `${resLabel[r]} ${amount.toLocaleString('en-US')}`));
  return parts.join(' + ');
}

function renderResourceOverrideList() {
  const list = document.getElementById('res-list');
  const names = Object.keys(resourceOverrides);
  if (names.length === 0) {
    list.innerHTML = '<div style="color:#64748b;font-size:12px;padding:4px;">No resource overrides.</div>';
    return;
  }
  const sorted = names.sort((a, b) => a.localeCompare(b, 'en'));
  list.innerHTML = sorted.map(name => {
    const inactive = !addedTerritories[name];
    const safeName = escapeHtml(JSON.stringify(name));
    const label = formatResourceOverrideLabel(resourceOverrides[name]);
    return `<div class="connection-item${inactive ? ' inactive' : ''}">
      <span>${escapeHtml(name)} → ${label}</span>
      <button class="rm-btn" onclick="removeResourceOverride(${safeName})">✕</button>
    </div>`;
  }).join('');
}

document.getElementById('res-input').addEventListener('input', updateResourceDatalist);
document.getElementById('res-input').addEventListener('click', tryShowResPicker);
document.querySelectorAll('input[name="res-tier"]').forEach(r => r.addEventListener('change', updateResourceFormState));
document.querySelectorAll('.res-resource-cb').forEach(cb => cb.addEventListener('change', updateResourceFormState));
document.getElementById('live-import-guild-select').addEventListener('input', updateLiveImportGuildDatalist);
document.getElementById('live-import-guild-select').addEventListener('click', tryShowLiveGuildPicker);

// ═══════════════════════════════════════════════════════════
//  SHARE LINK
// ═══════════════════════════════════════════════════════════
// ビットレイアウトの詳細はCLAUDE.mdのShare Link仕様を参照。
// 領地IDは9bit固定のため、territory-ids.jsonの要素数が512を超えるとversion 5形式は破綻する。
// その場合はversionを上げ、IDのビット数を拡張した新形式を追加すること。
// bonusBitmapは17bit固定（BONUS_CONFIGの要素数と一致）。BONUS_CONFIGに要素を追加する場合は
// bonusBitmapのビット数も同時に更新し、versionを上げること。
// 資源オーバーライドのtier(2bit)とresourceMap(4bit)のビット割り当ても共有リンクの一部である。
// 値の意味を変更する場合はversionを上げること。
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

const RESOURCE_OVERRIDE_ORDER = ['ore', 'wood', 'fish', 'crops'];
const TIER_STR_TO_INT_MAP = { normal: 0, city: 1, rainbow: 2 };
const TIER_INT_TO_STR_MAP = ['normal', 'city', 'rainbow'];

function buildShareBits() {
  const w = new BitWriter();
  w.writeBits(5, 4); // version

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

  // 資源オーバーライド（無効なオーバーライドも保存する。IDが存在しない領地はスキップ）
  const overrideEntries = Object.entries(resourceOverrides).filter(([name]) => TERRITORY_ID_MAP[name] !== undefined);
  const skippedOverrides = Object.keys(resourceOverrides).length - overrideEntries.length;
  if (skippedOverrides > 0) console.warn(`${skippedOverrides}件の資源オーバーライドがterritory-ids.jsonに存在しないためShare Linkから除外されました`);

  w.writeBits(overrideEntries.length, 10);
  for (const [name, ov] of overrideEntries) {
    w.writeBits(TERRITORY_ID_MAP[name], 9);
    w.writeBits(TIER_STR_TO_INT_MAP[ov.tier] || 0, 2);
    if (ov.tier === 'rainbow') {
      for (let i = 0; i < 4; i++) w.writeBits(0, 1);
      w.writeBits(0, 1);
    } else {
      for (const res of RESOURCE_OVERRIDE_ORDER) w.writeBits(ov.resources.includes(res) ? 1 : 0, 1);
      w.writeBits(ov.double ? 1 : 0, 1);
    }
  }

  return w.toUint8Array();
}

function parseShareBits(bytes) {
  const r = new BitReader(bytes);
  const version = r.readBits(4); // v4以前は資源オーバーライドのセクションを持たない
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

  // 資源オーバーライド（v5以降のみ。v4以前のリンクは空として扱う）
  const newOverrides = {};
  if (version >= 5) {
    const overrideCount = r.readBits(10);
    for (let i = 0; i < overrideCount; i++) {
      const id = r.readBits(9);
      const tierInt = r.readBits(2);
      const resourceBits = [];
      for (let b = 0; b < 4; b++) resourceBits.push(r.readBits(1) === 1);
      const doubleFlag = r.readBits(1) === 1;

      const name = TERRITORY_IDS[id];
      if (name === undefined || !territories[name]) continue;

      const tier = TIER_INT_TO_STR_MAP[tierInt] || 'normal';
      if (tier === 'rainbow') {
        newOverrides[name] = { tier, resources: [], double: false };
      } else {
        const resources = RESOURCE_OVERRIDE_ORDER.filter((_, idx) => resourceBits[idx]);
        newOverrides[name] = { tier, resources, double: doubleFlag };
      }
    }
  }

  return { addedTerritories: newAdded, customConnections: newConns, tributeValues: newTribute, resourceOverrides: newOverrides };
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
      resourceOverrides = parsed.resourceOverrides;
      _hqPathCache = null;
      _traversingCache = null;
      _fullDistCache = null;
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
    resourceOverrides = {};

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
    _fullDistCache = null;
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
let allGuildDisplays = [];    // Add From On-map Guildのdatalist用（表示文字列一覧）

function updateGuildSelectDatalist() {
  const sel = document.getElementById('guild-select');
  const dl = document.getElementById('guild-list-options');
  if (!sel || !dl) return;
  dl.innerHTML = allGuildDisplays.includes(sel.value)
    ? '' : allGuildDisplays.map(d => `<option value="${escapeHtml(d)}">`).join('');
}

async function loadGuilds() {
  const input = document.getElementById('guild-select');
  try {
    const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent('https://api.wynncraft.com/v3/guild/list/territory')}`, { cache: 'no-store' });
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

    allGuildDisplays = sortedGuilds.map(g => {
      window.guildTerritoryMap[g] = guildMap[g].territories;
      const prefix = guildMap[g].prefix;
      const count = guildMap[g].territories.length;
      const display = prefix ? `[${prefix}] ${g} (${count})` : `${g} (${count})`;
      guildDisplayToName[display] = g;
      return display;
    });
    updateGuildSelectDatalist();
    if (input) input.placeholder = "Type to search guild...";
  } catch (err) {
    const errMsg = err.message || 'Unknown Error';
    if (input) input.placeholder = `API error: ${errMsg}`;
    console.warn('Guild API error:', err);
  }
}

// ═══════════════════════════════════════════════════════════
//  LIVE DATA
//  公式APIから全437領地の実データを取得し、表示レイヤーとして反映するモード。
//  addedTerritories等のシミュレーション状態は一切書き換えない（Phase 6の取り込み操作を除く）。
// ═══════════════════════════════════════════════════════════
const LIVE_RESOURCE_TYPE_MAP = { EMERALD: 'emeralds', ORE: 'ore', WOOD: 'wood', FISH: 'fish', CROP: 'crops' };
const LIVE_POLL_INTERVAL_MS = 60000;

// AWB共有バックエンド（守備推定の共有計算結果を配信する外部サービス）。
// /eco/territoriesが成功すればその結果を最優先で使い、ローカルのグローバル位相探索
// （computeGlobalTransferPhase）は実行しない（無駄な計算を避けるため）。失敗時は
// 既存のローカル計算パスにフォールバックする（docs/eco-simulator-awb-integration_1.md参照）。
const AWB_ECO_SERVICE_URL = 'https://full-agnes-sabuo-projects-4618b097.koyeb.app';
const AWB_FETCH_TIMEOUT_MS = 8000;

// LIVEバッジの表示切り替え。データ取得に失敗している間だけエラー色にする。
function updateLiveBadge() {
  const badge = document.getElementById('live-badge');
  if (!badge) return;
  badge.style.display = liveMode ? '' : 'none';
  badge.classList.toggle('error', liveMode && !!_liveFetchError);
}

// AWB共有バックエンドから守備推定（tier/levels/ehp/hp/dps/damageRange/attackSpeed/
// defensePercent/observedAt/approximate、領地名をキーにしたオブジェクト）を取得する。
// タイムアウト・ネットワークエラー・非2xxはいずれもnullを返し、呼び出し側でローカル計算に
// フォールバックさせる。
async function fetchAwbEstimates() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AWB_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${AWB_ECO_SERVICE_URL}/eco/territories`, { cache: 'no-store', signal: controller.signal });
    if (!res.ok) throw new Error(`AWB API error: ${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn('AWB eco service fetch error:', err);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// API取得失敗時は直前のliveDataを保持したまま次のポーリングを待つ（画面を空にしない）。
// マップ描画用の生データ取得はcorsproxy経由のWynncraft API直叩きのまま変更しない。
// 守備推定はまずAWB共有バックエンド（/eco/territories）を叩き、成功すればその結果を
// _awbEstimatesに保持してツールチップ表示の最優先ソースにする（showLiveTooltip参照）。
// この経路が使われた回はローカルのグローバル位相探索（computeGlobalTransferPhase）・
// updateQualityCacheを実行しない。失敗した場合のみ、今まで通りローカル計算を実行する。
async function fetchLiveTerritoryData() {
  try {
    const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent('https://api.wynncraft.com/v3/guild/list/territory')}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    const data = await res.json();

    liveData = data;
    _liveFetchError = null;

    const awbData = await fetchAwbEstimates();
    if (awbData) {
      _awbEstimates = awbData;
    } else {
      _awbEstimates = null;
      await computeGlobalTransferPhase(); // Web Worker内で実行するためメインスレッドはブロックしない
      updateQualityCache(); // 品質付きキャッシュ（Item 9）の破棄判定・更新
    }
    updateLiveGuildOptions();
    refreshLiveTooltipIfOpen(); // 表示中のツールチップがあれば内容を現在のAWB/f/liveDataで再計算する
  } catch (err) {
    _liveFetchError = err.message || 'Unknown Error';
    console.warn('Live territory fetch error:', err);
  }
  updateLiveBadge();
  if (liveMode) draw();
}

// ギルドカラーはLiveモードをONにした時の1回のみ取得する（ほぼ変化しないため）。
async function fetchGuildColors() {
  try {
    const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent('https://athena.wynntils.com/cache/get/guildList')}`);
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    const list = await res.json();
    const map = {};
    for (const g of list) {
      if (g && g.prefix) map[g.prefix] = g.color || '#FFFFFF';
    }
    guildColorMap = map;
  } catch (err) {
    console.warn('Guild color API error:', err);
    guildColorMap = {};
  }
}

function getGuildColor(prefix) {
  return (prefix && guildColorMap[prefix]) || '#FFFFFF';
}

// ═══════════════════════════════════════════════════════════
//  定点観測ロガー（調査用、Liveモード専用）
//  URLに?watch=1を付けたときのみ有効。Liveモードが ON の間だけ5分間隔で動作し、
//  監視対象領地の状態（Tier・表示中の守備レベル・候補数・veto有無・品質・キャッシュ観測時刻・
//  生資源値）をコンソールへ出力し、_watchLogにも蓄積する。あわせてLiveモードが（ユーザーの
//  手動トグル以外の経路で）OFFになった事象・Liveモード中の未捕捉例外も_liveModeEventsに記録する。
//  exportWatchLog()で全記録をJSONファイルとしてダウンロードできる。
// ═══════════════════════════════════════════════════════════
const WATCH_LOGGING_ENABLED = new URLSearchParams(window.location.search).get('watch') === '1';
const WATCH_LOG_INTERVAL_MS = 5 * 60 * 1000;
// 監視対象領地（ベース名。(HQ)/(Conn)/(Ext)等の接尾辞は付けない）。書き換えやすいようここに集約する。
const WATCH_TERRITORY_BASE_NAMES = ["Bantisu Approach", "Krolton's Cave", "Nemract", "Troms", "Elkurn", "Lexdale Penitentiary", "Llevigar Farm", "Timasca"];
let _watchLogTimer = null;
let _watchLog = [];
// Liveモードの自動OFF・未捕捉例外の事象ログ（{at, type: 'off'|'error', reason}）。
let _liveModeEvents = [];

// liveData/_qualityCacheのキーは常にベース名（(HQ)/(Conn)/(Ext)等の接尾辞はツールチップの
// タイトル表示専用でキーには付かない）。WATCH_TERRITORY_BASE_NAMES側に誤って接尾辞付きの
// 値が混ざっても照合できるよう、比較前に必ずこのヘルパーを通す。
function stripTerritorySuffix(name) {
  return name.replace(/\((?:HQ|Conn|Ext)\)$/, '');
}

// candidateCount===1だがエメラルドvetoでTier Cに落ちたかどうかを判定する。fと同じスナップショット
// （_phaseSourceLiveData）から算出する必要があるため、getDefenseEstimate()と同じ由来のinfoを使う
// （updateQualityCache()内のemeraldAdmissible計算と同じ手順、CLAUDE.md「エメラルドチャンネルに
// よるexactlyOneの拘束（veto）」参照）。
function computeWatchVetoStatus(name, candidateCount) {
  if (candidateCount !== 1 || _globalTransferPhase === null) return false;
  const phaseInfo = _phaseSourceLiveData && _phaseSourceLiveData[name];
  if (!phaseInfo || !phaseInfo.guild || !phaseInfo.resources) return false;
  const confirmed = computeLiveConfirmedInfo(name, phaseInfo);
  const em = confirmed.resByType['EMERALD'];
  const emeraldAdmissible = EcoLogic.computeTerritoryEmeraldAdmissible(
    confirmed.resourceSnapshot, confirmed.treasuryBuff, phaseInfo.hq,
    em ? em.generation : undefined, em ? em.stored : undefined
  );
  return EcoLogic.isVetoed(candidateCount, emeraldAdmissible, _globalTransferPhase);
}

// showLiveTooltip()と同じ優先順位（品質付きキャッシュのTier A/B優先→無ければ現在ポーリングの
// 生の確定推定→それも不可なら簡易推定）で、監視対象1領地分のスナップショットを組み立てる。
// stored/generationの両方を残す（fと合わせてisCachedConsumptionStillPlausible相当の判定を
// 事後に再現できるようにするため。2026-08、resourceMismatchStreak導入時の検証で必要になった）。
function buildWatchEntry(baseName) {
  const name = stripTerritorySuffix(baseName);
  const info = liveData && liveData[name];
  if (!info || !info.guild || !info.guild.name) return { name, owned: false };

  const stored = {};
  for (const r of info.resources || []) {
    const key = LIVE_RESOURCE_TYPE_MAP[r.type];
    if (key) stored[key] = { stored: r.stored, generation: r.generation };
  }

  const cachedEntry = _qualityCache[name];
  if (cachedEntry) {
    // キャッシュされているのは常にTier A/B（candidateCount===1かつ非veto）のため、
    // candidateCount/vetoedは再計算せず固定値で返す。
    return {
      name, owned: true, guild: info.guild.name, source: 'cache',
      tier: cachedEntry.tier, levels: cachedEntry.estimate.levels,
      candidateCount: cachedEntry.estimate.candidateCount, vetoed: false,
      consumption: cachedEntry.estimate.consumption,
      resourceMismatchStreak: cachedEntry.resourceMismatchStreak || 0,
      quality: cachedEntry.quality, observedAt: cachedEntry.observedAt, stored
    };
  }

  const estimate = getDefenseEstimate(name);
  const candidateCount = estimate.candidateCount;
  const vetoed = computeWatchVetoStatus(name, candidateCount);
  if (estimate.levels) {
    return { name, owned: true, guild: info.guild.name, source: 'live', tier: 'C', levels: estimate.levels, candidateCount, vetoed, consumption: estimate.consumption, resourceMismatchStreak: null, quality: null, observedAt: null, stored };
  }

  const approx = getDefenseEstimateApproximate(name);
  return { name, owned: true, guild: info.guild.name, source: 'approx', tier: 'C', levels: approx.levels, candidateCount, vetoed, consumption: null, resourceMismatchStreak: null, quality: null, observedAt: null, stored };
}

function logWatchSnapshot() {
  if (!liveMode || !liveData) return;
  // fはこのスナップショット全体で共通の値のため、entry単位ではなくレコード直下に1回だけ記録する
  // （2026-08追加。resourceMismatchStreak導入の検証で、stored/generationだけでなくfも無いと
  // isCachedConsumptionStillPlausible相当の判定を事後に再現できないと判明したため）。
  const record = { at: new Date().toISOString(), f: _globalTransferPhase, entries: WATCH_TERRITORY_BASE_NAMES.map(buildWatchEntry) };
  _watchLog.push(record);
  console.log(`[watch] ${record.at}`, record.entries);
}

// Liveモードの自動OFF・Liveモード中の未捕捉例外を記録する（reasonは呼び出し元が渡す文字列）。
function recordLiveModeEvent(type, reason) {
  if (!WATCH_LOGGING_ENABLED) return;
  const event = { at: new Date().toISOString(), type, reason };
  _liveModeEvents.push(event);
  console.log(`[watch-event] ${event.at} ${type}: ${reason}`);
}

// Liveモード中に未捕捉の例外・Promise rejectionが発生した場合、importLiveGuild()等の
// 途中で例外が起きてLiveモードが意図せずOFFになるケースを事後に確認できるよう記録する
// （通常利用への影響を避けるため?watch=1のときのみ登録する）。
if (WATCH_LOGGING_ENABLED) {
  window.addEventListener('error', (e) => {
    if (liveMode) recordLiveModeEvent('error', `uncaught error: ${e.message || e}`);
  });
  window.addEventListener('unhandledrejection', (e) => {
    if (liveMode) recordLiveModeEvent('error', `unhandled rejection: ${(e.reason && e.reason.message) || e.reason}`);
  });
}

// コンソールから呼ぶ。蓄積した全記録（定点観測＋Liveモード事象ログ）をJSONファイルとして
// ダウンロードする（ファイル名 watch-log-<日時>.json）。あわせてJSON文字列も返す。
function exportWatchLog() {
  const payload = { exportedAt: new Date().toISOString(), watchSnapshots: _watchLog, liveModeEvents: _liveModeEvents };
  const json = JSON.stringify(payload);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const a = document.createElement('a');
  a.href = url;
  a.download = `watch-log-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return json;
}

function startWatchLogging() {
  if (!WATCH_LOGGING_ENABLED) return;
  stopWatchLogging();
  _watchLogTimer = setInterval(logWatchSnapshot, WATCH_LOG_INTERVAL_MS);
}

function stopWatchLogging() {
  if (_watchLogTimer !== null) {
    clearInterval(_watchLogTimer);
    _watchLogTimer = null;
  }
}

function startLivePolling() {
  stopLivePollingTimer();
  fetchLiveTerritoryData();
  _livePollTimer = setInterval(fetchLiveTerritoryData, LIVE_POLL_INTERVAL_MS);
}

function stopLivePollingTimer() {
  if (_livePollTimer !== null) {
    clearInterval(_livePollTimer);
    _livePollTimer = null;
  }
}

// マップの赤破線ハイライトの経過時間・Held表示・ツールチップの観測時刻表示は、データ自体は
// ポーリング（30秒間隔）でしか更新されないが、経過時間の「表示」はその場で計算できるため、
// ポーリングとは独立に1秒間隔で再描画する（2026-08追加）。新規データ取得・f再計算は一切行わない。
const LIVE_TIME_TICK_INTERVAL_MS = 1000;
function startLiveTimeTicking() {
  stopLiveTimeTicking();
  _liveTimeTickTimer = setInterval(() => {
    draw(); // drawTerritoriesLive()内のrecentlyCapturedElapsedMs()/Held表示が最新のDate.now()で再計算される
    refreshLiveTooltipIfOpen(); // ツールチップのHeld/観測時刻表示を再計算する
  }, LIVE_TIME_TICK_INTERVAL_MS);
}
function stopLiveTimeTicking() {
  if (_liveTimeTickTimer !== null) {
    clearInterval(_liveTimeTickTimer);
    _liveTimeTickTimer = null;
  }
}

// reason: OFFになった経緯を事後に区別するための文字列（定点観測ロガー用、CLAUDE.md参照）。
// index.htmlのonchange="onLiveModeToggle()"（ユーザーによる手動トグル）からは引数無しで
// 呼ばれ既定値'user-checkbox'になる。importLiveGuild()等の他コードから明示的にOFFへ倒す
// 場合は個別の理由文字列を渡す。
async function onLiveModeToggle(reason = 'user-checkbox') {
  const checked = document.getElementById('live-mode-toggle').checked;
  if (checked) {
    liveMode = true;
    // Liveモードは表示レイヤーであり、シミュレーション状態を触る操作は無効にする。
    // マップ選択（青ハイライト）はLiveモードに入った時点でクリアし、Add Selected Territoriesも押せなくする。
    selectedTerritories.clear();
    liveTooltipPinnedName = null;
    updateSelectedCount();
    document.getElementById('add-selected-btn').disabled = true;
    updateLiveBadge();
    renderLiveDataScreen();
    await fetchGuildColors();
    startLivePolling();
    startWatchLogging();
    startLiveTimeTicking();
  } else {
    liveMode = false;
    recordLiveModeEvent('off', reason);
    stopLivePollingTimer();
    stopWatchLogging();
    stopLiveTimeTicking();
    liveData = null;
    _liveFetchError = null;
    _awbEstimates = null;
    _defenseEstimateCache = {};
    _qualityCache = {};
    _globalTransferPhase = null;
    _phaseSourceLiveData = null;
    _phaseFailureStreak = 0;
    stopPhaseWorker();
    liveTooltipPinnedName = null;
    hideTooltip();
    allLiveGuildDisplays = [];
    liveGuildDisplayToUuid = {};
    document.getElementById('add-selected-btn').disabled = false;
    updateLiveBadge();
    renderLiveDataScreen();
    refreshUI();
  }
}

function renderLiveDataScreen() {
  const toggle = document.getElementById('live-mode-toggle');
  if (!toggle) return;
  toggle.checked = liveMode;
}

// ═══════════════════════════════════════════════════════════
//  GUILD IMPORT（Phase 6）
// ═══════════════════════════════════════════════════════════
function updateLiveGuildOptions() {
  liveGuildDisplayToUuid = {};
  if (!liveData) { allLiveGuildDisplays = []; return; }

  const guildMap = {};
  for (const info of Object.values(liveData)) {
    if (!info.guild || !info.guild.name || !info.guild.uuid) continue;
    const uuid = info.guild.uuid;
    if (!guildMap[uuid]) guildMap[uuid] = { name: info.guild.name, prefix: info.guild.prefix || '', count: 0 };
    guildMap[uuid].count++;
  }

  const sortedUuids = Object.keys(guildMap).sort((a, b) => guildMap[a].name.localeCompare(guildMap[b].name, 'en'));
  allLiveGuildDisplays = sortedUuids.map(uuid => {
    const g = guildMap[uuid];
    const display = g.prefix ? `[${g.prefix}] ${g.name} (${g.count})` : `${g.name} (${g.count})`;
    liveGuildDisplayToUuid[display] = uuid;
    return display;
  });

  updateLiveImportGuildDatalist();
}

function updateLiveImportGuildDatalist() {
  const sel = document.getElementById('live-import-guild-select');
  const dl = document.getElementById('live-import-guild-options');
  if (!sel || !dl) return;
  dl.innerHTML = allLiveGuildDisplays.includes(sel.value)
    ? '' : allLiveGuildDisplays.map(d => `<option value="${escapeHtml(d)}">`).join('');
}

function tryShowLiveGuildPicker() {
  if (allLiveGuildDisplays.length === 0) return;
  if (window.matchMedia('(max-width: 640px)').matches) return;
  const input = document.getElementById('live-import-guild-select');
  const datalist = document.getElementById('live-import-guild-options');
  if (datalist.options.length === 0) return;
  try {
    input.showPicker();
  } catch (e) {
    // 未対応環境ではdatalistの標準挙動にフォールバック
  }
}

// Liveデータを使って実際のギルド構成をシミュレーターへ取り込む。
// Defenseレベルは推定であり範囲でしか出ない。範囲の中央値等を勝手に代入すると、
// シミュレーション結果が「実測っぽい嘘の数字」になり、ユーザーが自分で設定した値と
// 区別できなくなる。そのためDefenseは常に0のまま登録し、ユーザーが自分で入力する方針とする。
// 生産ボーナスもPhase 4で一意に確定したものだけを入れ、複数候補が残るものは0のままとする。
function importLiveGuild() {
  const sel = document.getElementById('live-import-guild-select');
  const uuid = liveGuildDisplayToUuid[sel.value];
  if (!uuid || !liveData) return;

  const entries = Object.entries(liveData).filter(([n, info]) => info.guild && info.guild.uuid === uuid && territories[n]);
  if (entries.length === 0) return;

  if (!confirm('This will replace all currently registered territories. Continue?')) return;

  addedTerritories = {};
  for (const [name, info] of entries) {
    addedTerritories[name] = {
      defense: { damage: 0, attack: 0, health: 0, defense: 0 },
      bonuses: {},
      hq: info.hq === true,
      treasury: LIVE_RATING_MAP[info.treasury] || 'Very Low'
    };
  }

  // try/catch: 1領地分のcomputeLiveConfirmedInfo()が例外を投げると、この直後の
  // sel.value=''/updateLiveImportGuildDatalist()/Liveモード自動OFF/refreshUI()に到達できず、
  // addedTerritoriesは既に全置換済み（直前のループ）のままUIがLiveモード表示に固まって残る。
  // bonusesは直前のループで既に{}に初期化済みのため、1領地分の例外はログのみに留めて
  // そのままスキップ（ボーナス確定なし＝安全側）し、残りの領地の取り込みは継続する。
  for (const [name, info] of entries) {
    try {
      const confirmed = computeLiveConfirmedInfo(name, info);
      const bonuses = addedTerritories[name].bonuses;
      if (confirmed.emComboMatches && confirmed.emComboMatches.matches.length === 1) {
        const m = confirmed.emComboMatches.matches[0];
        if (m['Efficient Emeralds'] !== undefined) bonuses['Efficient Emeralds'] = m['Efficient Emeralds'];
        if (m['Emerald Rate'] !== undefined) bonuses['Emerald Rate'] = m['Emerald Rate'];
      }
      if (confirmed.resCombo && confirmed.resCombo.matches.length === 1) {
        const m = confirmed.resCombo.matches[0];
        if (m['Efficient Resources'] !== undefined) bonuses['Efficient Resources'] = m['Efficient Resources'];
        if (m['Resource Rate'] !== undefined) bonuses['Resource Rate'] = m['Resource Rate'];
      }
      if (confirmed.emStorageLv !== null) bonuses['Larger Emerald Storage'] = confirmed.emStorageLv;
      if (confirmed.resStorageLv !== null) bonuses['Larger Resource Storage'] = confirmed.resStorageLv;
    } catch (err) {
      console.error(`[import] EXCEPTION computing confirmed bonuses for ${name}:`, err);
    }
  }

  sel.value = '';
  updateLiveImportGuildDatalist();

  // 取り込み後はLiveモードを自動的にOFFにする（表示がLiveデータのままだと取り込んだ内容が確認できないため）
  document.getElementById('live-mode-toggle').checked = false;
  onLiveModeToggle('import-guild');

  closeCustomSettings();
  refreshUI();
}

// ═══════════════════════════════════════════════════════════
//  GLOBAL EXPORTS
//  index.html / script.js内で生成されるHTMLのonclick等の属性から呼ばれる関数は、
//  type="module"化によりグローバルスコープへ自動で出ないため、明示的にwindowへ公開する。
// ═══════════════════════════════════════════════════════════
Object.assign(window, {
  openTributeModal, copyShareLink, addSelectedTerritory, addGuildTerritories, addSelectedTerritories,
  selectAll, selectNone, editSelected, resetSelected, clearAllTerritories, switchModalTab, closeModal,
  saveModal, closeTributeModal, saveTributes, openCustomSettings, openFilterModal, toggleMobileSheet,
  showCSScreen, toggleAddConnectionForm, clearAllCustomConnections, addCustomConnection,
  toggleAddResourceForm, clearAllResourceOverrides, addResourceOverride, setFilterMode, updateModalStats,
  clearFilter, closeFilterModal, closeCustomSettings, toggleListSelection, removeTerritory,
  removeCustomConnection, removeResourceOverride, toggleFilterValue,
  onLiveModeToggle, importLiveGuild, enableDiagLogging, disableDiagLogging, exportWatchLog
});

// ═══════════════════════════════════════════════════════════
//  INITIALISATION
// ═══════════════════════════════════════════════════════════
async function init() {
  try {
    const verRes = await fetch('./script.js', { method: 'HEAD', cache: 'no-store' });
    const lastModified = verRes.headers.get('Last-Modified');
    console.log(`eco-simulator loaded: ${lastModified || 'unknown'}`);
  } catch (e) {
    console.log('eco-simulator loaded: unknown');
  }

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

  allTerritoryNames = Object.keys(territories).sort();
  updateTerritorySelectDatalist();

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
