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
//  DEFENSE STAT ESTIMATION（Liveモード専用）
//
//  ゲーム内では毎分1回、資源が隣接領地へ1ホップ移動する。territoryは転送時に1分ぶんの
//  維持費を受け取り、次の転送までの60秒で消費する。同時に、自前の生産分は毎秒たまり続け、
//  次の転送でまとめて送出される（余剰も次の転送でHQ方向へ返送されるため蓄積しない）。
//  転送からの経過秒をt（0≤t<60）、f = (1 − t/60) / 60 と置くと、資源rについて次が成り立つ
//  （実データで相対誤差0.05%を確認済み）。
//
//    stored[r] = consumption[r] × f + generation[r] × (1/60 − f)
//                 ← 維持費の残り        ← 自前の生産でたまった分
//
//  generation === 0（その資源を生産していない）の場合は補正項が0になり、単純な比例関係
//  stored[r] = consumption[r] × f に一致する。generation[r] は API の値をそのまま使う
//  （Treasuryバフ適用後の実際の生産速度のため、別途バフを掛け直さない）。
//
//  fはゲーム全体で共通の「転送位相」であり、レーティング制約と比例モデルの両方を許容誤差内で
//  同時に満たす候補が存在する領地数（カバレッジ）を最大化するfを探索したうえで
//  （estimateGlobalTransferPhase）、領地ごとに残差最小の候補を選ぶ（estimateDefenseStats）ことで、
//  個別レベルを単一値として確定できる。推定は単一スナップショットで完結し、履歴を必要としない。
//
//  守備ステータス推定の既知の限界: storedは整数であるため、1単位が表す消費量は1/fになる。
//  fは転送位相によって決まり、転送直後は1/60（1単位=消費量60）だが、転送直前には0に近づいて
//  分解能が発散する。DEFENSE_COST_TABLEの低レベル側の間隔は100/200/300と小さいため、fが小さい
//  スナップショットではLv.0とLv.1がどちらもstored=0になり、原理的に区別できない。Lv.2〜4も
//  1・2・4としか差が出ないため、±1の誤差で1〜2段ずれる。APIはresourcesを60秒ごとに更新し、
//  ゲームの転送周期も60秒であるため、原則として毎回同じ位相のデータしか得られない。
//  低守備領地の推定精度は、観測できる位相に完全に依存する。
// ═══════════════════════════════════════════════════════════
function bonusCost(name, level) {
  const cfg = BONUS_CONFIG.find(b => b.name === name);
  return (cfg && cfg.costs && cfg.costs[level]) || 0;
}

// 候補1件の資源消費量（ore/crops/wood/fish）を算出する。
// confirmedExtraは確定したボーナス（Efficient Emeralds→ore, Emerald Rate→crops,
// Larger Emerald Storage→wood）の消費分。fishを消費する確定可能なボーナスは存在しない。
function candidateConsumption(damage, attack, health, defense, aura, volley, confirmedExtra) {
  return {
    ore:   DEFENSE_COST_TABLE[damage] + (volley > 0 ? bonusCost('Tower Volley', volley) : 0) + (confirmedExtra.ore || 0),
    crops: DEFENSE_COST_TABLE[attack] + (aura > 0 ? bonusCost('Tower Aura', aura) : 0) + (confirmedExtra.crops || 0),
    wood:  DEFENSE_COST_TABLE[health] + (confirmedExtra.wood || 0),
    fish:  DEFENSE_COST_TABLE[defense] + (confirmedExtra.fish || 0)
  };
}

const NON_EMERALD_RESOURCES = ['ore', 'crops', 'wood', 'fish'];

// Step 1・Step 2共通: 資源ごとに、生産分を補正したconsumption目標値（stored[r]から逆算した値）と、
// 拘束（levelsNearTargetによる絞り込み）に使えるかどうかを求める。
// 補正後の値が負になる資源、またはstoredデータ自体が無い資源は「除外」とし、その系統は無拘束
// （0〜11の全域）として扱う。除外された資源は残差計算・妥当性チェックからも除く
// （負の値を無理に拘束・検算に使うと、他の資源から得られた候補まで巻き添えで無効化されてしまうため）。
function computeResourceModel(stored, generation, f) {
  const model = {};
  for (const r of NON_EMERALD_RESOURCES) {
    const s = stored[r];
    if (s === undefined) { model[r] = { excluded: true, target: null }; continue; }
    const target = (s - (generation[r] || 0) * (F_MAX - f)) / f;
    model[r] = { excluded: target < 0, target };
  }
  return model;
}

// Step 1: グローバル位相fの探索。
//
// difficulty/ratingの一致はfを両側から拘束できる唯一の絶対的制約である（消費量テーブルは
// 100〜22800（228倍）と幅が広く、残差の最小化だけではfの値を1つに定められない。どんなfでも
// 「たまたま比が近い」候補がどこかに見つかってしまうため）。
//
// 【重要】目的関数に「カバレッジ（候補が1件以上存在する領地数）の最大化」を使ってはならない。
// 許容誤差はstored単位で固定（PHASE_TOLERANCE_PER_RESOURCE）だが、DEFENSE_COST_TABLEの
// 候補間隔をconsumption空間に戻すとfに反比例して縮むため、fが小さいほど許容誤差window
// （PHASE_TOLERANCE_PER_RESOURCE/f）が広がり、無関係な候補まで大量に飲み込んでカバレッジを
// 底上げしてしまう。つまりカバレッジ最大化は「どのfがデータを最もよく説明するか」ではなく
// 「どのfが緩いか」を測ってしまう（Phase 5 調査G・Hで実測確認済み）。
// 実測（2026-08-18時点、437領地）: f=0.001111ではカバレッジが321と最大になる一方、候補数の
// 平均は1,945件・「候補が正確に1件に絞れた領地数」（exactlyOne）は0件だった。f=0.007500では
// カバレッジは288に下がるが、候補数の平均は5〜15件・exactlyOneは70件と、実際に「絞り込めて
// いる」度合いはこちらのほうが大きく上回っていた。
//
// そこで目的関数は「exactlyOneを最大化するf」を採用する（同数の場合は残差合計が小さいほうを
// 採る）。exactlyOneは候補0件の領地を自動的に除外するため、fが大きすぎてほぼ誰も説明できなく
// なる場合は自然に不利になるが、念のためカバレッジが全領地数の1/3を下回るfは候補から除外する
// （ごく少数の領地だけでexactlyOneが偶然高くなるケースを避けるため）。該当するfが1つも無い
// 場合はガード無しの全結果にフォールバックする（fをnullにしない方針は維持する）。
// stored の大小によるフィルタ・重み付け・対象領地数の上限は設けない（該当する全領地を使う）。
//
// 候補の列挙は「全列挙してフィルタ」ではなく「fから逆算」で行う。生産分を補正した
// consumption[r] ≈ (stored[r] − generation[r]×(1/60−f)) / f が直接求まり、DEFENSE_COST_TABLEから
// 近い値を引けばレベルが絞れる（wood→Health、fish→Defense、ore→Damage+Tower Volley、
// crops→Attack+Tower Aura）。生産している資源も同じ式で扱える（generation===0なら補正項が0になり
// 従来の式と一致する）。4系統は互いに独立なので、系統ごとに許容誤差内のレベル（の組）を求めてから
// 直積を取り、最後にrating一致でフィルタする。これにより1領地あたりの候補数が12^4×16=331,776通り
// から数十〜数百通りに減る。fの探索自体も、粗探索（60分割）→その近傍を細探索（40分割）の
// 2段グリッドにし、全体で約100回のf評価で完結させる（600分割の全域探索はしない）。
//
// 1回のLiveデータ取得につき1回だけ呼び出すこと。
const F_MAX = 1 / 60;
const PHASE_TOLERANCE_PER_RESOURCE = 1.5; // storedは整数（丸め誤差±0.5相当）+ 観測ノイズの余裕
const PHASE_COARSE_STEPS = 60;
const PHASE_FINE_STEPS = 40;
const ALL_LEVELS_0_11 = [0,1,2,3,4,5,6,7,8,9,10,11];

// DEFENSE_COST_TABLE[lv] + extra が target の consTolerance 以内に収まるレベル一覧。
function levelsNearTarget(target, extra, consTolerance) {
  const result = [];
  for (let lv = 0; lv <= 11; lv++) {
    if (Math.abs(DEFENSE_COST_TABLE[lv] + extra - target) <= consTolerance) result.push(lv);
  }
  return result;
}

// 1領地・1つのfについて、4系統（wood→Health, fish→Defense, ore→Damage+Volley,
// crops→Attack+Aura）を逆算し、直積 × rating一致で候補一覧を求める。
// modelで除外された系統は無拘束（全域）として扱う。Step 1（evaluatePhase）・Step 2
// （estimateDefenseStats）の両方から呼ばれる（候補生成のロジックを2箇所に持たないため）。
function deriveTerritoryCandidates(input, f, model) {
  const { observedRating, isHQ, confirmedExtra } = input;
  const extra = confirmedExtra || {};
  const consTolerance = PHASE_TOLERANCE_PER_RESOURCE / f;

  // 全資源が除外された領地は推定不可（無拘束の全域探索に落ちるのを防ぐ）。
  if (model.wood.excluded && model.fish.excluded && model.ore.excluded && model.crops.excluded) return [];

  const healthSet = model.wood.excluded
    ? ALL_LEVELS_0_11
    : levelsNearTarget(model.wood.target, extra.wood || 0, consTolerance);
  if (healthSet.length === 0) return [];

  const defenseSet = model.fish.excluded
    ? ALL_LEVELS_0_11
    : levelsNearTarget(model.fish.target, extra.fish || 0, consTolerance);
  if (defenseSet.length === 0) return [];

  const dmgVolleyPairs = [];
  if (model.ore.excluded) {
    for (const dmg of ALL_LEVELS_0_11) for (let volley = 0; volley <= 3; volley++) dmgVolleyPairs.push([dmg, volley]);
  } else {
    for (let volley = 0; volley <= 3; volley++) {
      const volleyExtra = volley > 0 ? bonusCost('Tower Volley', volley) : 0;
      for (const dmg of levelsNearTarget(model.ore.target - volleyExtra, extra.ore || 0, consTolerance)) dmgVolleyPairs.push([dmg, volley]);
    }
  }
  if (dmgVolleyPairs.length === 0) return [];

  const atkAuraPairs = [];
  if (model.crops.excluded) {
    for (const atk of ALL_LEVELS_0_11) for (let aura = 0; aura <= 3; aura++) atkAuraPairs.push([atk, aura]);
  } else {
    for (let aura = 0; aura <= 3; aura++) {
      const auraExtra = aura > 0 ? bonusCost('Tower Aura', aura) : 0;
      for (const atk of levelsNearTarget(model.crops.target - auraExtra, extra.crops || 0, consTolerance)) atkAuraPairs.push([atk, aura]);
    }
  }
  if (atkAuraPairs.length === 0) return [];

  const candidates = [];
  for (const health of healthSet) {
    for (const defense of defenseSet) {
      for (const [damage, volley] of dmgVolleyPairs) {
        for (const [attack, aura] of atkAuraPairs) {
          const difficulty = calcDifficulty(health, damage, attack, defense, aura, volley);
          let rating = difficultyToRating(difficulty);
          if (isHQ) rating = bumpRatingForHQ(rating);
          if (rating !== observedRating) continue;
          candidates.push({ damage, attack, health, defense, aura, volley });
        }
      }
    }
  }
  return candidates;
}

// 候補1件の残差（除外された資源は除く）。
function candidateResidual(c, confirmedExtra, model, stored, generation, f) {
  const consumption = candidateConsumption(c.damage, c.attack, c.health, c.defense, c.aura, c.volley, confirmedExtra || {});
  let residual = 0;
  for (const r of NON_EMERALD_RESOURCES) {
    if (model[r].excluded) continue;
    const predicted = consumption[r] * f + (generation[r] || 0) * (F_MAX - f);
    const diff = stored[r] - predicted;
    residual += diff * diff;
  }
  return residual;
}

// あるfについて、全領地のカバレッジ数（rating一致かつ許容誤差内の候補を持つ領地数）、
// 候補が正確に1件に絞れた領地数（exactlyOne）、残差合計・平均（カバー領地のみ、各領地の
// 最小残差を集計）を求める。
// 合計残差はカバー領地数に比例して増えるため、そのまま比較すると低カバレッジのfが
// 不当に有利になる。必ず平均（meanResidual）で比較すること。カバレッジ0のときは
// 比較対象から自動的に外れるようInfinityにする。
// collectCountsをtrueにすると、領地ごとの候補数（prepared順）をcountsとして返す
// （調査用のヒストグラム集計にのみ使用。グリッド探索中の大量呼び出しでは常にfalseにし、
// 探索で選ばれたf1点についてだけ再評価して集計する）。
function evaluatePhase(prepared, f, collectCounts) {
  let coverage = 0;
  let exactlyOne = 0;
  let totalResidual = 0;
  const counts = collectCounts ? [] : null;
  for (const { input, stored, generation } of prepared) {
    const model = computeResourceModel(stored, generation, f);
    const candidates = deriveTerritoryCandidates(input, f, model);
    if (collectCounts) counts.push(candidates.length);
    if (candidates.length === 0) continue;
    coverage++;
    if (candidates.length === 1) exactlyOne++;
    let minResidual = Infinity;
    for (const c of candidates) {
      const residual = candidateResidual(c, input.confirmedExtra, model, stored, generation, f);
      if (residual < minResidual) minResidual = residual;
    }
    totalResidual += minResidual;
  }
  const meanResidual = coverage > 0 ? totalResidual / coverage : Infinity;
  return { f, coverage, exactlyOne, totalResidual, meanResidual, counts };
}

// カバレッジが全領地数の1/3を下回るfを除外する（該当が1件も無ければガード無しにフォールバック）。
const MIN_COVERAGE_FRACTION = 1 / 3;
function eligibleResults(results, minCoverage) {
  const eligible = results.filter(r => r.coverage >= minCoverage);
  return eligible.length > 0 ? eligible : results;
}

// poolの中からexactlyOne最大・同数ならmeanResidual最小の1件を選ぶ。
function pickBestByExactlyOne(pool) {
  const maxExactlyOne = Math.max(...pool.map(r => r.exactlyOne));
  let best = null;
  for (const r of pool) {
    if (r.exactlyOne !== maxExactlyOne) continue;
    if (best === null || r.meanResidual < best.meanResidual) best = r;
  }
  return best;
}

// territoryInputs: [{ observedRating, isHQ, confirmedExtra, resourceSnapshot }, ...]
// 戻り値: { f, coverage, exactlyOne } | null（1件も評価できなかった場合のみnull）
export function estimateGlobalTransferPhase(territoryInputs) {
  const prepared = [];
  for (const input of territoryInputs) {
    const stored = {}, generation = {};
    for (const r of NON_EMERALD_RESOURCES) {
      const d = input.resourceSnapshot[r];
      if (d) { stored[r] = d.stored; generation[r] = d.generation || 0; }
    }
    prepared.push({ input, stored, generation });
  }
  if (prepared.length === 0) return null;
  const minCoverage = Math.ceil(prepared.length * MIN_COVERAGE_FRACTION);

  // 粗探索（60分割）。kも保持し、同着した粗ステップの隣接判定に使う。
  const coarseResults = [];
  for (let k = 1; k <= PHASE_COARSE_STEPS; k++) {
    coarseResults.push({ k, ...evaluatePhase(prepared, (F_MAX * k) / PHASE_COARSE_STEPS) });
  }
  const coarsePool = eligibleResults(coarseResults, minCoverage);
  const maxCoarseExactlyOne = Math.max(...coarsePool.map(r => r.exactlyOne));
  const tiedKs = coarsePool.filter(r => r.exactlyOne === maxCoarseExactlyOne).map(r => r.k).sort((a, b) => a - b);

  // 同着した粗ステップが離れた位置に複数ある場合（例: k=8とk=44）、両端を単純に
  // ±1粗ステップして細探索すると範囲が広がりすぎ、PHASE_FINE_STEPS=40で割ったときの
  // 1ステップが粗探索とほぼ同じ粒度になってしまい細探索の意味が消える。
  // そこで同着kを隣接するもの同士でグループ化し、グループごとに独立して
  // ±1粗ステップの範囲をPHASE_FINE_STEPSで細探索する。
  const groups = [];
  let currentGroup = [tiedKs[0]];
  for (let i = 1; i < tiedKs.length; i++) {
    if (tiedKs[i] - tiedKs[i - 1] <= 1) currentGroup.push(tiedKs[i]);
    else { groups.push(currentGroup); currentGroup = [tiedKs[i]]; }
  }
  groups.push(currentGroup);

  const coarseStep = F_MAX / PHASE_COARSE_STEPS;
  const fineResults = [];
  for (const group of groups) {
    const loBound = Math.max(0, (F_MAX * Math.min(...group)) / PHASE_COARSE_STEPS - coarseStep);
    const hiBound = Math.min(F_MAX, (F_MAX * Math.max(...group)) / PHASE_COARSE_STEPS + coarseStep);
    for (let k = 0; k <= PHASE_FINE_STEPS; k++) {
      const f = loBound + (hiBound - loBound) * (k / PHASE_FINE_STEPS);
      if (f > 0) fineResults.push(evaluatePhase(prepared, f));
    }
  }

  const allResults = coarseResults.concat(fineResults);
  const pool = eligibleResults(allResults, minCoverage);
  const best = pickBestByExactlyOne(pool);

  // 選ばれたfについてのみ、領地ごとの候補数を再集計してヒストグラムを作る
  // （調査用。表示方式の検討材料。グリッド探索中は毎回集計しない）。
  const { counts } = evaluatePhase(prepared, best.f, true);
  const histogram = { zero: 0, one: 0, twoToThree: 0, fourToTen: 0, elevenPlus: 0 };
  for (const n of counts) {
    if (n === 0) histogram.zero++;
    else if (n === 1) histogram.one++;
    else if (n <= 3) histogram.twoToThree++;
    else if (n <= 10) histogram.fourToTen++;
    else histogram.elevenPlus++;
  }

  return { f: best.f, coverage: best.coverage, exactlyOne: best.exactlyOne, histogram }; // fをnullにしない方針は維持
}

// Step 2: 領地ごとに、Step 1と同じderiveTerritoryCandidates()で候補を絞り込み（全列挙はしない）、
// 妥当性チェック（転送残り時間0〜60秒の範囲・消費量と補正後storedの符号一致）を通過したもののうち
// 正規化残差が最小の1件を選ぶ。範囲ではなく単一値を返す。
// params:
//   observedRating: API defences（HQなら既にHQ調整済みのラベル。例 "High"）
//   isHQ: boolean
//   mult: calcLiveDefenseMult()で算出済みの倍率
//   confirmedExtra: { ore, crops, wood, fish }（確定済みボーナスの消費量）
//   resourceSnapshot: { ore: {stored,limit,generation}, crops: {...}, wood: {...}, fish: {...} }
//   f: estimateGlobalTransferPhase()で求めたグローバル位相
export function estimateDefenseStats({ observedRating, isHQ, mult, confirmedExtra, resourceSnapshot, f }) {
  if (f === null || f === undefined) {
    return { levels: null, ehp: null, dps: null, secondsToTransfer: null, residual: null };
  }

  const stored = {}, generation = {};
  for (const r of NON_EMERALD_RESOURCES) {
    const d = resourceSnapshot[r];
    if (d) { stored[r] = d.stored; generation[r] = d.generation || 0; }
  }

  const model = computeResourceModel(stored, generation, f);
  const candidates = deriveTerritoryCandidates({ observedRating, isHQ, confirmedExtra }, f, model);
  if (candidates.length === 0) {
    return { levels: null, ehp: null, dps: null, secondsToTransfer: null, residual: null };
  }

  const includedResources = NON_EMERALD_RESOURCES.filter(r => !model[r].excluded);
  const sumSq = includedResources.reduce((s, r) => s + stored[r] ** 2, 0);
  if (sumSq <= 0) {
    return { levels: null, ehp: null, dps: null, secondsToTransfer: null, residual: null };
  }

  let best = null;
  for (const c of candidates) {
    const consumption = candidateConsumption(c.damage, c.attack, c.health, c.defense, c.aura, c.volley, confirmedExtra || {});

    let valid = true;
    let residual = 0;
    for (const r of includedResources) {
      const cons = consumption[r];
      // 維持費由来の残り（stored[r]から生産でたまった分を除いたもの）。モデルが正しければ cons×f に一致する。
      const correctedStored = stored[r] - generation[r] * (F_MAX - f);
      const consZero = cons === 0;
      const correctedZero = Math.abs(correctedStored) <= PHASE_TOLERANCE_PER_RESOURCE;
      if (consZero !== correctedZero) { valid = false; break; }
      if (!consZero) {
        // fr（維持費由来の残りの比率）が0〜F_MAXの範囲外なら、個別に係数を当てはめた場合の
        // 「転送までの残り時間」が0〜60秒の範囲外であることを意味するため除外する。
        // 補正前はstored・consとも非負のためfr<0は原理的に起こらない死んだ条件だったが、
        // Phase 1の生産分補正によりcorrectedStoredが負になり得るため、fr<0も現在は意味を持つ。
        const fr = correctedStored / cons;
        if (fr < 0 || fr > F_MAX) { valid = false; break; }
      }
      residual += (stored[r] - (cons * f + generation[r] * (F_MAX - f))) ** 2;
    }
    if (!valid) continue;

    const normResidual = residual / sumSq;
    if (best === null || normResidual < best.residual) {
      best = { damage: c.damage, attack: c.attack, health: c.health, defense: c.defense, residual: normResidual };
    }
  }

  if (best === null) {
    return { levels: null, ehp: null, dps: null, secondsToTransfer: null, residual: null };
  }

  const stats = computeStatsFromLevels(best.health, best.damage, best.attack, best.defense, mult);
  // f = (1 − t/60) / 60 なので、転送までの残り時間 = 3600×f（60×(1−60f) は転送からの経過秒であり、残り時間ではない）。
  const secondsToTransfer = Math.round(3600 * f);

  return {
    levels: { damage: best.damage, attack: best.attack, health: best.health, defense: best.defense },
    ehp: stats.finalHp,
    dps: stats.dps,
    secondsToTransfer,
    residual: best.residual
  };
}
