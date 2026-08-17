// ═══════════════════════════════════════════════════════════
//  eco-logic.js
//  DOM非依存の純粋ロジック（定数・Treasury・生産・守備・グラフ）。
//  script.js からのみimportされる想定だが、将来的に別のフロントエンド
//  （ゲーム内MOD等）からも再利用できるよう、fetch/localStorage/DOM APIを
//  一切参照しない。グローバル変数は持たず、必要な状態はすべて引数で受け取る。
// ═══════════════════════════════════════════════════════════

export const DEFENSE_LEVEL_STATS = [
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

export const DEFENSE_COST_TABLE = [0, 100, 300, 600, 1200, 2400, 4800, 8400, 12000, 15600, 19200, 22800];

export const DEFENSE_TYPES = [
  { id: "damage", name: "Damage", resource: "ore" },
  { id: "attack", name: "Attack Speed", resource: "crops" },
  { id: "health", name: "Health", resource: "wood" },
  { id: "defense", name: "Defense", resource: "fish" }
];

export const BONUS_CONFIG = [
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

export const RESOURCES = ['emeralds', 'ore', 'crops', 'fish', 'wood'];

// dist 0-2: 10%, dist 3: 8.5%, dist 4: 7%, dist 5: 5.5%, dist 6+: 4%
export const TREASURY_BASE_PCTS = [0.10, 0.10, 0.10, 0.085, 0.07, 0.055, 0.04];
export const TREASURY_LEVEL_MULT = { 'Very Low': 0, 'Low': 1, 'Medium': 2, 'High': 2.5, 'Very High': 3 };

// 生産資源のプリセット（CLAUDE.md「生産資源のプリセット」参照）。
// 通常 9,000+3,600 / ダブル 9,000+7,200 / City 18,000+3,600 / Rainbow 1,800+900×4。
export function zeroCosts() {
  return { emeralds: 0, ore: 0, crops: 0, fish: 0, wood: 0 };
}

export function calcBonusCostForLevel(bonusCfg, level) {
  if (level === 0 || !bonusCfg.costs || level >= bonusCfg.costs.length) return zeroCosts();
  const result = zeroCosts();
  result[bonusCfg.resource] = bonusCfg.costs[level];
  return result;
}

// resourceOverridesが有効な場合はそれを、そうでなければterritories.jsonの基本資源を返す。
export function getTerritoryResources(name, territories, resourceOverrides, addedTerritories) {
  const override = resourceOverrides[name];
  if (override && addedTerritories[name]) {
    if (override.tier === 'rainbow') {
      return { emeralds: 1800, ore: 900, wood: 900, fish: 900, crops: 900 };
    }
    const result = zeroCosts();
    result.emeralds = override.tier === 'city' ? 18000 : 9000;
    const amount = (override.resources.length === 1 && override.double) ? 7200 : 3600;
    for (const r of override.resources) result[r] = amount;
    return result;
  }
  const t = territories[name];
  if (!t) return zeroCosts();
  const result = zeroCosts();
  for (const r of RESOURCES) result[r] = parseFloat(t.resources[r] || 0);
  return result;
}

// treasuryBuffFraction は呼び出し側が calcTreasuryBuff() で算出済みの値を渡す
// （このモジュール内で完結させるとグラフ探索への依存が生じるため、引数で受け取る設計にしている）。
export function calcTerritoryProduction(name, territories, addedTerritories, resourceOverrides, treasuryBuffFraction) {
  const t = territories[name];
  if (!t) return zeroCosts();
  const base = getTerritoryResources(name, territories, resourceOverrides, addedTerritories);

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

  const treasBuff = 1 + treasuryBuffFraction;

  const result = { ...base };
  result.emeralds = Math.round(base.emeralds * effEmMult * rateEmMult * treasBuff);
  for (const r of ['ore', 'crops', 'wood', 'fish']) {
    result[r] = Math.round(base[r] * effResMult * rateResMult * treasBuff);
  }

  return result;
}

// st は addedTerritories[name]（{ defense, bonuses, ... }）をそのまま渡す。
export function calcTerritoryConsumption(st) {
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

// 距離とTreasuryレベルから生産バフ率を返す。distはgetFullGraphDistances()で算出済みの値を渡す。
export function calcTreasuryBuff(treasuryLevel, dist) {
  const mult = TREASURY_LEVEL_MULT[treasuryLevel];
  if (!mult) return 0;
  if (dist === undefined) return 0;
  return TREASURY_BASE_PCTS[Math.min(dist, 6)] * mult;
}

// ═══════════════════════════════════════════════════════════
//  GRAPH（BFS距離・最短経路）
// ═══════════════════════════════════════════════════════════

// 基本ルート＋有効な追加接続線（両端とも登録済み）を合わせた隣接領地一覧。
export function getNeighbors(name, territories, addedTerritories, customConnections) {
  const result = new Set((territories[name] && territories[name]['Trading Routes']) || []);
  for (const conn of customConnections) {
    if (!addedTerritories[conn.a] || !addedTerritories[conn.b]) continue;
    if (conn.a === name) result.add(conn.b);
    else if (conn.b === name) result.add(conn.a);
  }
  return [...result];
}

// 全437領地＋すべてのカスタム接続線（有効・無効を問わない）を経由する隣接一覧。
// HQのConnections/Externalsのカウント、Treasuryバフの距離計算にのみ使用する。
export function getAllNeighbors(name, territories, customConnections) {
  const result = new Set((territories[name] && territories[name]['Trading Routes']) || []);
  for (const conn of customConnections) {
    if (conn.a === name) result.add(conn.b);
    else if (conn.b === name) result.add(conn.a);
  }
  return [...result];
}

// rootNameからの距離を全437領地対象でBFS（getAllNeighbors経由）。rootNameが存在しない場合は{}を返す。
// Liveモード（Phase 4）ではHQ以外（各ギルドのHQ領地）を起点に呼び出すため、起点を引数で受け取る形にしている。
export function bfsDistancesFrom(rootName, territories, customConnections) {
  if (!rootName || !territories[rootName]) return {};

  const dist = { [rootName]: 0 };
  const queue = [rootName];
  let qi = 0;
  while (qi < queue.length) {
    const curr = queue[qi++];
    for (const nb of getAllNeighbors(curr, territories, customConnections)) {
      if (dist[nb] === undefined) { dist[nb] = dist[curr] + 1; queue.push(nb); }
    }
  }
  return dist;
}

// HQからの距離を全437領地対象でBFS。HQ未設定時は{}を返す。
export function getFullGraphDistances(territories, addedTerritories, customConnections) {
  const hqName = Object.keys(addedTerritories).find(n => addedTerritories[n].hq);
  if (!hqName) return {};
  return bfsDistancesFrom(hqName, territories, customConnections);
}

// 比較は素のコードユニット比較（`>` / `<`）で行う。localeCompareはロケールによって
// アポストロフィ等の記号の扱いが変わるため、決定的な挙動にするために使わない。
export function comparePaths(a, b) {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] > b[i]) return 1;
    if (a[i] < b[i]) return -1;
  }
  return a.length - b.length;
}

// HQからの距離＋最短経路を返す（登録済み領地のみ経由）。
export function getHQPaths(territories, addedTerritories, customConnections) {
  const hqName = Object.keys(addedTerritories).find(n => addedTerritories[n].hq);
  if (!hqName) return { dist: {}, path: {} };

  // 1. BFS（登録済み領地のみ経由）で距離を確定
  const dist = { [hqName]: 0 };
  const queue = [hqName];
  let qi = 0;
  while (qi < queue.length) {
    const curr = queue[qi++];
    for (const nb of getNeighbors(curr, territories, addedTerritories, customConnections)) {
      if (!addedTerritories[nb]) continue;
      if (dist[nb] === undefined) { dist[nb] = dist[curr] + 1; queue.push(nb); }
    }
  }

  // 2. 距離昇順で経路を決定（同距離の親候補は path が辞書順最大＝アルファベット降順のものを採用）
  // この規則はゲーム内挙動からの推定であり、公式仕様ではない（13分岐中12分岐で一致）。
  // 「後続の領地によって経由ルートが分岐する」「送る側と送られる側で経由ルートが異なる」といった、
  // 単一の最短経路ルールでは原理的に説明できない挙動もゲーム内には存在する。
  // 本シミュレーターは1本の経路で近似する。将来反例が見つかった場合は変更する可能性がある。
  const path = { [hqName]: [hqName] };
  const byDist = Object.keys(dist).sort((a, b) => dist[a] - dist[b]);
  for (const v of byDist) {
    if (v === hqName) continue;
    const d = dist[v];
    const neighbors = getNeighbors(v, territories, addedTerritories, customConnections);
    let bestParent = null;
    for (const u of neighbors) {
      if (dist[u] !== d - 1) continue;
      if (bestParent === null || comparePaths(path[u], path[bestParent]) > 0) bestParent = u;
    }
    path[v] = [...path[bestParent], v];
  }

  return { dist, path };
}

export function isConnectedToHQ(name, addedTerritories, hqPaths) {
  if (!addedTerritories[name]) return false;
  const hasHQ = Object.keys(addedTerritories).some(n => addedTerritories[n].hq);
  if (!hasHQ) return true;
  return hqPaths.dist[name] !== undefined;
}

// ═══════════════════════════════════════════════════════════
//  DEFENSE STATS（HP・DPS・EHP・difficulty・rating）
// ═══════════════════════════════════════════════════════════
export const RATING_ORDER = ["Very Low", "Low", "Medium", "High", "Very High"];

// HQは算出後のレーティングを1段階上げる（Very Highで頭打ち）。
export function bumpRatingForHQ(rating) {
  const idx = RATING_ORDER.indexOf(rating);
  return RATING_ORDER[Math.min(idx + 1, RATING_ORDER.length - 1)];
}

export function difficultyToRating(difficulty) {
  if (difficulty >= 49) return "Very High";
  if (difficulty >= 31) return "High";
  if (difficulty >= 19) return "Medium";
  if (difficulty >= 6) return "Low";
  return "Very Low";
}

export function calcDifficulty(hLevel, dLevel, aLevel, defLevel, auraLevel, volleyLevel) {
  let difficulty = hLevel + dLevel + aLevel + defLevel;
  difficulty += auraLevel > 0 ? auraLevel + 5 : 0;
  difficulty += volleyLevel > 0 ? volleyLevel + 3 : 0;
  return difficulty;
}

// HP/DPS/EHP等の算出のみを行う共通部分。mult（Connections/Externals由来の倍率）は呼び出し側で算出して渡す。
// calcTerritoryDefenseStats（シミュレーション）とestimateDefenseStats（Liveモードの推定、Phase 5）で共有する。
export function computeStatsFromLevels(hLevel, dLevel, aLevel, defLevel, mult) {
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

  return { finalHp, dps, defPct, mult, boostedHp, atkSpd, finalDmgMin, finalDmgMax };
}

export function calcTerritoryDefenseStats(name, territories, addedTerritories, customConnections) {
  const st = addedTerritories[name];
  if (!st || !st.defense) return null;
  const t = territories[name];
  if (!t) return null;

  let connections = 0;
  let externals = 0;
  let mult = 1.0;

  if (st.hq) {
    // HQのConnections/Externalsは全437領地グラフ（getFullGraphDistances）で数える。
    // 途中の領地を他ギルドに奪われていても、3ホップ以内に自ギルドの領地があればExternalにカウントされる。
    const dist = getFullGraphDistances(territories, addedTerritories, customConnections);
    for (const [n, d] of Object.entries(dist)) {
      if (n === name || !addedTerritories[n]) continue;
      if (d === 1) connections++;
      if (d >= 1 && d <= 3) externals++;
    }
    mult = (1.5 + (0.25 * externals)) * (1.0 + (0.30 * connections));
  } else {
    for (const route of getNeighbors(name, territories, addedTerritories, customConnections)) {
      if (addedTerritories[route]) connections++;
    }
    mult = 1.0 + (0.3 * connections);
  }

  const hLevel = st.defense.health || 0;
  const dLevel = st.defense.damage || 0;
  const aLevel = st.defense.attack || 0;
  const defLevel = st.defense.defense || 0;
  const auraLevel = (st.bonuses || {})["Tower Aura"] || 0;
  const volleyLevel = (st.bonuses || {})["Tower Volley"] || 0;

  const stats = computeStatsFromLevels(hLevel, dLevel, aLevel, defLevel, mult);
  let rating = difficultyToRating(calcDifficulty(hLevel, dLevel, aLevel, defLevel, auraLevel, volleyLevel));
  if (st.hq) rating = bumpRatingForHQ(rating);

  return { ...stats, rating, connections };
}

// ═══════════════════════════════════════════════════════════
//  LIVE DEFENSE MULT（Phase 4/5: Liveモードでの Connections/Externals 由来の倍率）
//  ownedNamesは同一ギルドが所有する領地名のSet。addedTerritoriesの代わりに使う。
//  customConnections（ユーザー追加の接続線）は実データには反映しないため常に[]を渡す想定。
// ═══════════════════════════════════════════════════════════
export function calcLiveDefenseMult(name, territories, ownedNames, isHQ, customConnections) {
  let connections = 0;
  let externals = 0;
  let mult = 1.0;

  if (isHQ) {
    const dist = bfsDistancesFrom(name, territories, customConnections);
    for (const [n, d] of Object.entries(dist)) {
      if (n === name || !ownedNames.has(n)) continue;
      if (d === 1) connections++;
      if (d >= 1 && d <= 3) externals++;
    }
    mult = (1.5 + (0.25 * externals)) * (1.0 + (0.30 * connections));
  } else {
    for (const route of getAllNeighbors(name, territories, customConnections)) {
      if (ownedNames.has(route)) connections++;
    }
    mult = 1.0 + (0.3 * connections);
  }

  return { mult, connections, externals };
}

// ═══════════════════════════════════════════════════════════
//  DEFENSE STAT ESTIMATION（Phase 5: Liveモード専用）
//  レーティングだけでは個別レベルが一切絞れない（CLAUDE.md「守備ステータス推定の既知の限界」参照）ため、
//  資源消費量の観測（ローリングバッファのΔstored）を「除外」ではなく「スコアリング」の制約として使い、
//  候補群からレベルの範囲を出す近似モデル。個別レベルは確定しない。
// ═══════════════════════════════════════════════════════════
function bonusCost(name, level) {
  const cfg = BONUS_CONFIG.find(b => b.name === name);
  return (cfg && cfg.costs && cfg.costs[level]) || 0;
}

// 候補1件の資源消費量（ore/crops/wood/fish）を算出する。
// confirmedExtraはPhase 4で確定したボーナス（Efficient Emeralds→ore, Emerald Rate→crops,
// Larger Emerald Storage→wood）の消費分。fishを消費する確定可能なボーナスは存在しない。
function candidateConsumption(damage, attack, health, defense, aura, volley, confirmedExtra) {
  return {
    ore:   DEFENSE_COST_TABLE[damage] + (volley > 0 ? bonusCost('Tower Volley', volley) : 0) + (confirmedExtra.ore || 0),
    crops: DEFENSE_COST_TABLE[attack] + (aura > 0 ? bonusCost('Tower Aura', aura) : 0) + (confirmedExtra.crops || 0),
    wood:  DEFENSE_COST_TABLE[health] + (confirmedExtra.wood || 0),
    fish:  DEFENSE_COST_TABLE[defense] + (confirmedExtra.fish || 0)
  };
}

// 観測（resourceSnapshotのstored/limit比、transitionsのΔstored）との整合性をスコアリングする。
// 除外ではなく減点方式にする（観測にノイズがある場合に候補が全滅するのを防ぐため）。
function scoreCandidate(consumption, resourceSnapshot, transitions) {
  let score = 0;
  for (const r of ['ore', 'crops', 'wood', 'fish']) {
    const snap = resourceSnapshot[r];
    if (!snap || !snap.limit) continue;
    const ratio = snap.stored / snap.limit;
    const generationPerMinute = (snap.generation || 0) / 60;

    if (ratio >= 0.95) {
      // stored が limit に張り付いている → 消費量は供給を下回っている。消費が高い候補ほど不自然。
      score -= consumption[r] / 100;
    } else if (ratio <= 0.05) {
      // stored がほぼ0 → 消費が供給を上回っている可能性。消費が生産量より大幅に低い候補ほど不自然。
      score -= Math.max(0, generationPerMinute * 60 - consumption[r]) / 100;
    }

    const trans = transitions[r];
    if (trans && ratio < 0.9) {
      // stored が上限に張り付いていない場合のみ、Δstoredから消費量の下限を見積もる。
      // HQからの供給・上流への送出は観測できないため、この下限は完全ではない近似値として扱う
      // （下回る候補を完全に除外せず、重い減点にとどめる）。
      const minConsumptionPerMinute = Math.max(0, generationPerMinute - trans.deltaPerMinute);
      const consumptionPerMinute = consumption[r] / 60;
      if (consumptionPerMinute < minConsumptionPerMinute) {
        score -= (minConsumptionPerMinute - consumptionPerMinute) * 10;
      }
    }
  }
  return score;
}

function minMax(arr) {
  return { min: Math.min(...arr), max: Math.max(...arr) };
}

// params:
//   observedRating: API defences（HQなら既にHQ調整済みのラベル。例 "High"）
//   isHQ: boolean
//   mult: calcLiveDefenseMult()で算出済みの倍率
//   confirmedExtra: { ore, crops, wood, fish }（Phase 4で確定した分の消費量）
//   resourceSnapshot: { ore: {stored,limit,generation}, crops: {...}, wood: {...}, fish: {...} }
//   transitions: { ore: {deltaPerMinute}|null, crops, wood, fish }
//   sampleCount: liveHistory内でこの領地のデータが存在したサンプル数
export function estimateDefenseStats({ observedRating, isHQ, mult, confirmedExtra, resourceSnapshot, transitions, sampleCount }) {
  if (sampleCount < 3) {
    return { insufficientSamples: true, samples: sampleCount, candidates: 0, levels: null, ehp: null, dps: null };
  }

  const scored = [];
  for (let damage = 0; damage <= 11; damage++) {
    for (let attack = 0; attack <= 11; attack++) {
      for (let health = 0; health <= 11; health++) {
        for (let defense = 0; defense <= 11; defense++) {
          for (let aura = 0; aura <= 3; aura++) {
            for (let volley = 0; volley <= 3; volley++) {
              const difficulty = calcDifficulty(health, damage, attack, defense, aura, volley);
              let rating = difficultyToRating(difficulty);
              if (isHQ) rating = bumpRatingForHQ(rating);
              if (rating !== observedRating) continue;

              const consumption = candidateConsumption(damage, attack, health, defense, aura, volley, confirmedExtra);
              const score = scoreCandidate(consumption, resourceSnapshot, transitions);
              scored.push({ damage, attack, health, defense, aura, volley, score });
            }
          }
        }
      }
    }
  }

  if (scored.length === 0) {
    return { insufficientSamples: false, samples: sampleCount, candidates: 0, levels: null, ehp: null, dps: null };
  }

  // 上位候補（スコア上位30%、最低50件）を残して範囲を出す。
  scored.sort((a, b) => b.score - a.score);
  const keepCount = Math.max(50, Math.ceil(scored.length * 0.3));
  const top = scored.slice(0, Math.min(keepCount, scored.length));

  const levels = {
    damage: minMax(top.map(c => c.damage)),
    attack: minMax(top.map(c => c.attack)),
    health: minMax(top.map(c => c.health)),
    defense: minMax(top.map(c => c.defense))
  };

  let ehpMin = Infinity, ehpMax = -Infinity, dpsMin = Infinity, dpsMax = -Infinity;
  for (const c of top) {
    const stats = computeStatsFromLevels(c.health, c.damage, c.attack, c.defense, mult);
    if (stats.finalHp < ehpMin) ehpMin = stats.finalHp;
    if (stats.finalHp > ehpMax) ehpMax = stats.finalHp;
    if (stats.dps < dpsMin) dpsMin = stats.dps;
    if (stats.dps > dpsMax) dpsMax = stats.dps;
  }

  return {
    insufficientSamples: false,
    samples: sampleCount,
    candidates: scored.length,
    levels,
    ehp: { min: ehpMin, max: ehpMax },
    dps: { min: dpsMin, max: dpsMax }
  };
}
