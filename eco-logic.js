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

/**
 * java.util.PriorityQueue と同一挙動の二分ヒープ。
 * 同値要素の取り出し順はヒープ配列の内部状態に依存する（これが仕様であり、バグではない）。
 * 汎用ヒープライブラリやsortベースの実装に置き換えてはいけない（同値時の順序が変わり、
 * Trading Routesのcheapest経路の実測一致率が下がることを確認済み。詳細はCLAUDE.md参照）。
 */
export class JavaBinaryHeap {
  constructor() {
    this._a = [];
  }

  get size() {
    return this._a.length;
  }

  /** @param {[number, string]} item */
  offer(item) {
    const a = this._a;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!(item[0] < a[p][0])) break;
      a[i] = a[p];
      i = p;
    }
    a[i] = item;
  }

  /** @returns {[number, string] | undefined} */
  poll() {
    const a = this._a;
    if (a.length === 0) return undefined;
    const result = a[0];
    const last = a.pop();
    if (a.length > 0) {
      let i = 0;
      const n = a.length;
      const half = n >> 1;
      while (i < half) {
        let c = 2 * i + 1;
        const r = c + 1;
        if (r < n && a[c][0] > a[r][0]) c = r; // 同値なら左の子を選ぶ
        if (last[0] <= a[c][0]) break;
        a[i] = a[c];
        i = c;
      }
      a[i] = last;
    }
    return result;
  }
}

/**
 * 隣接領地をlinks順（＝territories.jsonのTrading Routesの配列順）で返す。ソートしないこと。
 * この並び順は公式APIのlinks配列と一致する静的な順序であり、Cheapest/Fastestの経路計算が
 * 依存する（アルファベット順・座標順等に並び替えると実測との一致率が大きく下がる）。
 * customConnectionsの順序についてはゲーム内の正解データが存在しない。ここでは決定的な
 * 挙動を保証するための取り決めとして、その配列の登録順で基本ルートの後ろに追加する。
 * 有効性（両端が登録済みか）はここでは判定しない。呼び出し側（computeTradeRoute）が
 * `added`集合でのフィルタを行うことで、両端登録済みの接続のみが実際に経路に使われる。
 * @param {string} name
 * @param {Object} territories
 * @param {Array} customConnections
 * @returns {string[]}
 */
export function getNeighborsOrdered(name, territories, customConnections) {
  const base = (territories[name] && territories[name]['Trading Routes']) || [];
  const seen = new Set(base);
  const result = [...base];
  for (const conn of customConnections) {
    let other = null;
    if (conn.a === name) other = conn.b;
    else if (conn.b === name) other = conn.a;
    if (other === null || seen.has(other)) continue;
    seen.add(other);
    result.push(other);
  }
  return result;
}

// Cheapestの探索で、未登録（他ギルド/無所属）領地を経由する際の疑似コスト。1ホップ（=1）より
// 十分大きければ値そのものに意味は無い（実際のtaxコストを表すものではなく、優先度キューへの
// 投入自体がヒープの内部状態に影響することを再現するための踏み石）。
const UNOWNED_COST = 1e6;

/**
 * 単一領地のTrading Routeを計算する（source起点・hq終点の探索）。経路は領地ごとに
 * 独立して計算され、木構造ではない（同じ分岐点でも出発地によって選ぶ方向が変わりうる）。
 * Cheapestは二分ヒープ（JavaBinaryHeap）によるDijkstra、Fastestは配列によるBFS。
 * 辺コストは常に1（自ギルド領地のみを扱うためtaxの概念は実装しない）。
 *
 * **Cheapestのみ、探索自体は登録領地に限定せず全437領地グラフを走査する**（2026-09追加）。
 * ゲーム側の探索は登録領地だけのグラフではなく全領地グラフに対して行われており、未登録領地の
 * 優先度キューへの投入自体がヒープ配列の内部状態を変え、実測との一致に影響することが判明した。
 * 未登録領地は`UNOWNED_COST`（1ホップより十分大きい値）のコストで踏み台にできるが、実際に
 * 選ばれた経路に未登録領地が1つでも含まれていた場合は、登録領地だけではHQに到達できない
 * （＝従来通りの「非接続」）とみなしnullを返す。Fastest（FIFOキュー）はコストの概念が無いため
 * 未登録領地を投入すると経路として使われてしまう。安全側に倒し、従来通り登録領地のみを走査する。
 * @param {string} source
 * @param {string} hq
 * @param {Set<string>} added 登録済み領地名の集合
 * @param {'cheapest'|'fastest'} style
 * @param {Object} territories
 * @param {Array} customConnections
 * @returns {string[] | null} [source, ..., hq] の経路。到達不能ならnull。source===hqなら[hq]
 */
export function computeTradeRoute(source, hq, added, style, territories, customConnections) {
  if (source === hq) return [hq];
  if (!added.has(source) || !added.has(hq)) return null;

  if (style !== 'cheapest' && style !== 'fastest') {
    console.warn(`computeTradeRoute: 未知のstyle "${style}"。'cheapest'として扱います。`);
    style = 'cheapest';
  }

  const parent = new Map();
  const visited = new Set([source]);
  parent.set(source, null);

  if (style === 'fastest') {
    const queue = [source];
    let qi = 0;
    while (qi < queue.length) {
      const u = queue[qi++];
      if (u === hq) break;
      for (const v of getNeighborsOrdered(u, territories, customConnections)) {
        if (!added.has(v) || visited.has(v)) continue;
        visited.add(v);
        parent.set(v, u);
        queue.push(v);
      }
    }
  } else {
    const heap = new JavaBinaryHeap();
    heap.offer([0, source]);
    while (heap.size > 0) {
      const [du, u] = heap.poll();
      if (u === hq) break;
      for (const v of getNeighborsOrdered(u, territories, customConnections)) {
        if (!territories[v] || visited.has(v)) continue;
        const cost = added.has(v) ? 1 : UNOWNED_COST;
        visited.add(v);
        parent.set(v, u);
        heap.offer([du + cost, v]);
      }
    }
  }

  if (!parent.has(hq)) return null;
  const path = [];
  let cur = hq;
  while (cur !== null) { path.push(cur); cur = parent.get(cur); }
  path.reverse();

  // Cheapestで未登録領地を踏み台に「到達」してしまった場合は非接続として扱う
  // （登録領地だけのグラフではHQに繋がっていない、という従来の意味を保つ）。
  if (style === 'cheapest' && path.some(n => !added.has(n))) return null;

  return path;
}

/**
 * HQからの距離＋最短経路を返す。addedの全領地についてcomputeTradeRoute()を1回ずつ呼び、
 * 結果を集約する（経路は領地ごとに独立、木構造ではない）。
 * @param {string|null} hq
 * @param {Set<string>} added
 * @param {Object} territories
 * @param {Array} customConnections
 * @param {(name: string) => 'cheapest'|'fastest'} [styleResolver] 省略時は全領地'cheapest'
 * @returns {{ dist: Record<string, number>, paths: Record<string, string[]> }}
 */
export function getHQPaths(hq, added, territories, customConnections, styleResolver) {
  if (!hq || !added || added.size === 0) return { dist: {}, paths: {} };
  if (!added.has(hq)) {
    console.warn(`getHQPaths: HQ "${hq}" is not in added territories`);
    return { dist: {}, paths: {} };
  }

  const resolveStyle = styleResolver || (() => 'cheapest');
  const dist = {};
  const paths = {};

  for (const name of added) {
    if (!territories[name]) {
      console.warn(`getHQPaths: "${name}" は territories に存在しません。スキップします。`);
      continue;
    }
    const path = computeTradeRoute(name, hq, added, resolveStyle(name), territories, customConnections);
    if (!path) continue;
    paths[name] = path;
    dist[name] = path.length - 1;
  }

  return { dist, paths };
}

export function isConnectedToHQ(name, addedTerritories, hqPaths) {
  if (!addedTerritories[name]) return false;
  const hasHQ = Object.keys(addedTerritories).some(n => addedTerritories[n].hq);
  if (!hasHQ) return true;
  return hqPaths.dist[name] !== undefined;
}

// ライブの実所有領地に対するHQ接続判定用の距離を返す（Liveモード専用）。getHQPaths()と同じ
// 「経由可能な領地を制限したBFS」だが、addedTerritories（シミュレーション状態）ではなく
// ownedNames（getOwnedNamesForGuildで得たライブの実所有領地名のSet）を対象にする。
// customConnectionsはシミュレーター専用機能のため対象外とし、静的なterritories隣接関係
// （Trading Routes）のみを使う。hqNameがownedNamesに含まれない場合（HQ自体が不明/未所有）は{}を返す。
export function getLiveHQDistances(territories, ownedNames, hqName) {
  if (!hqName || !ownedNames.has(hqName)) return {};
  const dist = { [hqName]: 0 };
  const queue = [hqName];
  let qi = 0;
  while (qi < queue.length) {
    const curr = queue[qi++];
    const neighbors = (territories[curr] && territories[curr]['Trading Routes']) || [];
    for (const nb of neighbors) {
      if (!ownedNames.has(nb)) continue;
      if (dist[nb] === undefined) { dist[nb] = dist[curr] + 1; queue.push(nb); }
    }
  }
  return dist;
}

// getLiveHQDistances()の結果からHQ接続判定を行う。HQ自身（isHQ）は常にtrue。
export function isLiveConnectedToHQ(name, isHQ, ownedNames, dist) {
  if (isHQ) return true;
  if (!ownedNames.has(name)) return false;
  return dist[name] !== undefined;
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
// Larger Emerald Storage→wood）の消費分。Stronger Minions（wood）・Tower Multi-Attacks（fish）は
// difficultyに寄与しないため候補として列挙するが、rating判定には使わない。
function candidateConsumption(damage, attack, health, defense, aura, volley, minions, multi, confirmedExtra) {
  return {
    ore:   DEFENSE_COST_TABLE[damage] + (volley > 0 ? bonusCost('Tower Volley', volley) : 0) + (confirmedExtra.ore || 0),
    crops: DEFENSE_COST_TABLE[attack] + (aura > 0 ? bonusCost('Tower Aura', aura) : 0) + (confirmedExtra.crops || 0),
    wood:  DEFENSE_COST_TABLE[health] + (minions > 0 ? bonusCost('Stronger Minions', minions) : 0) + (confirmedExtra.wood || 0),
    fish:  DEFENSE_COST_TABLE[defense] + (multi > 0 ? bonusCost('Tower Multi-Attacks', multi) : 0) + (confirmedExtra.fish || 0)
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

// ═══════════════════════════════════════════════════════════
//  エメラルドチャンネルによるexactlyOneの拘束（2026-08導入、Phase 5D）
//
//  exactlyOne（候補が1件に絞れた領地数）を目的関数とするf探索は、許容誤差窓
//  （PHASE_TOLERANCE_PER_RESOURCE/f）がたまたま狭まったfで、本来複数候補があるはずの領地が
//  偶然1件に絞れてしまう「見せかけの一意化」を起こすことがある（2026-08実測: あるスナップショットで
//  f=32s(0.008889)とf=35s(0.009736)を比較したところ、35sで新たに「候補1件」になった領地
//  22〜26件のうち、独立したエメラルドチャンネルの検証で「35sのみ支持」は0件、
//  「32sのみ支持」は7〜10件だった）。
//
//  エメラルドチャンネル（stored_emeralds = cons_emeralds×f + generation_emeralds×(1/60−f)）は
//  defenseレベルの知識を一切必要とせずにfを独立検証できる。cons_emeraldsはTrio A確定分
//  （Efficient Resources / Resource Rate / Larger Resource Storage、いずれもemeralds消費で
//  crops/ore/wood/fish側の生成量倍率・保管上限から検出可能）+ XP Seeking（emeralds消費、
//  レベル観測不能、0〜9の離散未知数）で構成される。Trio B（Efficient Emeralds/Emerald Rate/
//  Larger Emerald Storage、confirmedExtraが検出するもの）とは資源の向きが逆の別物であり、
//  ここでは扱わない。
//
//  【2026-08、エメラルドから直接fを解く方式は不採用済み（上記コメント参照）だが、今回はそれとは
//  別のアプローチ】fを置き換えるのではなく、evaluatePhase()でexactlyOneをカウントする際に
//  「エメラルド側と矛盾しない」という条件を追加する（＝veto）。XP Seekingは0〜9の離散未知数として
//  扱い、レベルごとに「その領地のemeraldsデータと矛盾しないfの区間」を求め、その区間のいずれかに
//  評価対象のfが入っているかだけを判定する。既存のexactlyOneが持つ実績（Thesead/Rodorocなど
//  実機一致の前例）を壊さないよう、最小限の修正に留める。
// ═══════════════════════════════════════════════════════════

// Larger Resource Storageのlimitテーブル（script.jsのLIVE_STORAGE_LEVELS.resourceと同じ値）。
// eco-logic.jsはscript.jsに依存できない設計のため、値を複製している。
const TRIO_A_STORAGE_LEVELS = {
  normal: [300, 600, 1200, 2400, 4500, 10200, 24000],
  hq: [1500, 3000, 6000, 12000, 22500, 51000, 120000]
};
function detectTrioAStorageLevel(limit, isHQ) {
  const arr = isHQ ? TRIO_A_STORAGE_LEVELS.hq : TRIO_A_STORAGE_LEVELS.normal;
  const idx = arr.indexOf(limit);
  return idx === -1 ? null : idx;
}

// Resource Rateの倍率（4s/3s/2s/1s→×1, ×4/3, ×2, ×4）。levels文字列はEmerald Rateと同一の
// 意味のためこの配列をそのまま使う。Efficient Resourcesの倍率はBONUS_CONFIGのlevels文字列
// （"+0%"〜"+300%"）をパースして動的生成する（決め打ち配列を新規に書き起こさない）。
const TRIO_A_RATE_MULTS = [1, 4 / 3, 2, 4];
const TRIO_A_EFF_RESOURCES_MULTS = BONUS_CONFIG.find(b => b.name === 'Efficient Resources').levels.map(s => 1 + parseFloat(s) / 100);
const XP_SEEKING_COSTS = BONUS_CONFIG.find(b => b.name === 'XP Seeking').costs;

// resourceSnapshot: { ore, crops, wood, fish }、各要素は { stored, limit, generation, baseGeneration }。
// isHQはLarger Resource Storageのlimitテーブル選択（HQ/非HQで別テーブル）に必要なため引数に
// 加えている。戻り値: emeralds建ての確定コスト合計（number）。確定不能ならnull。
function deriveTrioAConfirmedEmeraldCost(resourceSnapshot, treasuryBuff, isHQ) {
  const RESOURCE_KEYS = ['ore', 'crops', 'wood', 'fish'];
  const comboResults = [];   // { key, effResources, resourceRate }
  const storageResults = []; // { key, level }

  for (const key of RESOURCE_KEYS) {
    const d = resourceSnapshot[key];
    if (!d) continue;

    // Efficient Resources × Resource Rateコンボの検出。generation>0の資源のみ判定可能。
    if (d.generation > 0 && d.baseGeneration) {
      const denom = d.baseGeneration * (1 + treasuryBuff);
      if (denom > 0) {
        const observedMult = d.generation / denom;
        const matches = [];
        for (let e = 0; e < TRIO_A_EFF_RESOURCES_MULTS.length; e++) {
          for (let r = 0; r < TRIO_A_RATE_MULTS.length; r++) {
            const combo = TRIO_A_EFF_RESOURCES_MULTS[e] * TRIO_A_RATE_MULTS[r];
            if (Math.abs(combo - observedMult) / Math.max(combo, observedMult) < 0.005) {
              matches.push({ effResources: e, resourceRate: r });
            }
          }
        }
        // 一致候補が複数ある資源はその資源の結果を採用しない（不確定なため除外）。
        if (matches.length === 1) comboResults.push({ key, ...matches[0] });
      }
    }

    // Larger Resource Storageレベルの検出。limitがある資源はすべて判定可能（生産の有無を問わない）。
    if (d.limit !== undefined) {
      const lv = detectTrioAStorageLevel(d.limit, isHQ);
      if (lv !== null) storageResults.push({ key, level: lv });
    }
  }

  let comboFinal = null;
  if (comboResults.length > 0) {
    const first = comboResults[0];
    const consistent = comboResults.every(c => c.effResources === first.effResources && c.resourceRate === first.resourceRate);
    if (!consistent) return null; // 資源間で不一致（ギルド単位の設定なので本来一致するはず）
    comboFinal = { effResources: first.effResources, resourceRate: first.resourceRate };
  }

  let storageFinal = null;
  if (storageResults.length > 0) {
    const first = storageResults[0];
    const consistent = storageResults.every(s => s.level === first.level);
    if (!consistent) return null;
    storageFinal = first.level;
  }

  // comboかstorageのどちらか一方でも確定できなければ、3コストの合計を返せないためnull。
  if (comboFinal === null || storageFinal === null) return null;

  const effResourcesCost = BONUS_CONFIG.find(b => b.name === 'Efficient Resources').costs[comboFinal.effResources];
  const resourceRateCost = BONUS_CONFIG.find(b => b.name === 'Resource Rate').costs[comboFinal.resourceRate];
  const storageCost = BONUS_CONFIG.find(b => b.name === 'Larger Resource Storage').costs[storageFinal];
  return effResourcesCost + resourceRateCost + storageCost;
}

// XP Seeking（0〜9）ごとに、その領地のemeraldsデータ（generation/stored）と矛盾しないfの区間を求める。
// 戻り値: Array<{level, fMin, fMax}>（該当なしなら空配列＝どのXP Seekingレベルでも辻褄が合わない）。
function computeEmeraldAdmissibleF(generationEmeralds, storedEmeralds, trioAConfirmedCost, xpSeekingCosts, tolerance, fMax) {
  const result = [];
  for (let level = 0; level < xpSeekingCosts.length; level++) {
    const cost = trioAConfirmedCost + xpSeekingCosts[level];
    if (cost === generationEmeralds) {
      // 縮退ケース: costとgenerationが一致すると、storedはfに依存せず常にgenerationEmeralds×fMaxになる。
      const predicted = generationEmeralds * fMax;
      if (Math.abs(storedEmeralds - predicted) <= tolerance) result.push({ level, fMin: 0, fMax });
      continue;
    }
    const fCenter = (storedEmeralds - generationEmeralds * fMax) / (cost - generationEmeralds);
    const fHalfWidth = tolerance / Math.abs(cost - generationEmeralds);
    const lo = Math.max(0, fCenter - fHalfWidth);
    const hi = Math.min(fMax, fCenter + fHalfWidth);
    if (lo > hi) continue;
    result.push({ level, fMin: lo, fMax: hi });
  }
  return result;
}

function isFSupportedByAnyLevel(fGrid, admissibleIntervals) {
  return admissibleIntervals.some(iv => fGrid >= iv.fMin && fGrid <= iv.fMax);
}

// f探索（estimateGlobalTransferPhase）とStep2の品質キャッシュ判定（determineTier）の両方が
// 同じ「領地1件分のemeraldAdmissible事前計算」を必要とするため、公開ラッパーとして共有する。
// 判定不能（emGeneration欠損・Trio A確定不能）ならnull（＝veto対象外）。
export function computeTerritoryEmeraldAdmissible(resourceSnapshot, treasuryBuff, isHQ, emGeneration, emStored) {
  if (!emGeneration || emGeneration <= 0 || emStored === undefined) return null;
  const trioACost = deriveTrioAConfirmedEmeraldCost(resourceSnapshot, treasuryBuff || 0, isHQ);
  if (trioACost === null) return null;
  return computeEmeraldAdmissibleF(emGeneration, emStored, trioACost, XP_SEEKING_COSTS, PHASE_TOLERANCE_PER_RESOURCE, F_MAX);
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
// 【2026-08、エメラルド直接逆算方式への置き換えを検証したが不採用】全437領地のエメラルドから
// f = (stored_em − gen_em/60) / (cons_em − gen_em) で直接fを求める方式（Larger Resource
// Storage・Efficient Resources・Resource Rateから逆算したcons_emを使う）を試したが、
// XP Seeking（emeralds消費・レベル不明・観測不能）が未計上のまま多数の領地に効いているらしく、
// 実データ2件（437領地中389/380件が有効）でいずれもfの中央値がF_MAX付近（stored_em=0の
// 領地が単独最大クラスタとして約半数を占める）に偏り、Tromsの実測検算（下記）と食い違う結果に
// なったため不採用とした。Troms（live3.json）はore/wood/fish/crops実測から
// f=0.016389で残差最大3.4（ore603実測 vs 予測606.4等）とほぼ完全に一致する一方、
// エメラルド方式の中央値はF_MAX=0.016667に張り付き、crops実測688に対し予測700と
// 悪化した。したがって本方式（rating一致グリッド探索）を維持する。
//
// 1回のLiveデータ取得につき1回だけ呼び出すこと。
const F_MAX = 1 / 60;
// storedは整数なので丸めだけで±0.5が生じ、さらにAPIの更新周期とゲームの転送周期の位相ずれ、
// および検出不能な非防衛ボーナスの未計上分が加わる。±1.5では狭すぎる。3を超えると候補が
// 急増してexactlyOneが崩壊するため、3が最適点である（2026-08実測: tol=1.5でexactlyOne=102、
// tol=3で120（最大）、tol=5以降は53→9→7と単調に崩壊。tol=3ではThesead/Rodorocが候補1件に
// クリーンに収束し、別途の実機観測（Damage5/Attack4/Health5/Defense4）と完全一致した）。
const PHASE_TOLERANCE_PER_RESOURCE = 3;
// APIから検出不能なボーナス（PvP Damage・Mob Damage・Gathering/Mob Experience・Tome/Emerald
// Seeking）は消費量を増やす方向にしか効かないため、「候補コスト（DEFENSE_COST_TABLE[lv]+extra）が
// targetを上回る」側は物理的にあり得ず、丸め誤差・位相ずれのみが原因になる。この側だけ
// PHASE_TOLERANCE_PER_RESOURCEより狭いroundingSlackで絞る（2026-08導入、片側化）。
// target側（候補コスト < target）は未検出ボーナスの分を吸収する必要があるため従来どおり
// PHASE_TOLERANCE_PER_RESOURCEのまま変更しない。
// 暫定値1で検証したところ既知の正解4領地（Troms/Thesead/Rodoroc/Skien's Island）が
// いずれもlevels=nullに壊れたため、1/1.2/1.5/1.8/2/3で感度分析した（live3.json等6スナップショット）。
// 1.8で既知領地が復旧し始め、2で安定して全4領地が一致（3は従来の対称許容誤差と同一＝無変更）。
// 2は6スナップショット中4件でexactlyOneが改善した一方、live7.jsonのみ25→16に悪化した
// （ground truthが無く判断不能だが、既知領地を優先し2を採用）。1.5以下は既知領地が壊れるため不採用。
const ROUNDING_SLACK_PER_RESOURCE = 2;
const PHASE_COARSE_STEPS = 60;
const PHASE_FINE_STEPS = 40;
const ALL_LEVELS_0_11 = [0,1,2,3,4,5,6,7,8,9,10,11];

// DEFENSE_COST_TABLE[lv] + extra（候補コスト）が target 以下側は consTolerance 以内、
// target を上回る側は consRoundingSlack 以内に収まるレベル一覧（非対称、2026-08片側化）。
function levelsNearTarget(target, extra, consTolerance, consRoundingSlack) {
  const result = [];
  for (let lv = 0; lv <= 11; lv++) {
    const diff = target - (DEFENSE_COST_TABLE[lv] + extra);
    if (diff <= consTolerance && diff >= -consRoundingSlack) result.push(lv);
  }
  return result;
}

// 1領地・1つのfについて、4系統（wood→Health+Stronger Minions, fish→Defense+Tower Multi-Attacks,
// ore→Damage+Tower Volley, crops→Attack+Tower Aura）を逆算し、直積 × rating一致で候補一覧を求める。
// Stronger Minions・Tower Multi-Attacksはdifficultyに寄与しないため、rating判定には使わない
// （加味しないとwood/fishのconsumptionを過小評価し、confirmedExtraが支配的な領地で解決に失敗する）。
// modelで除外された系統は無拘束（全域）として扱う。Step 1（evaluatePhase）・Step 2
// （estimateDefenseStats）の両方から呼ばれる（候補生成のロジックを2箇所に持たないため）。
function deriveTerritoryCandidates(input, f, model) {
  const { observedRating, isHQ, confirmedExtra } = input;
  const extra = confirmedExtra || {};
  const consTolerance = PHASE_TOLERANCE_PER_RESOURCE / f;
  const consRoundingSlack = ROUNDING_SLACK_PER_RESOURCE / f;

  // 全資源が除外された領地は推定不可（無拘束の全域探索に落ちるのを防ぐ）。
  if (model.wood.excluded && model.fish.excluded && model.ore.excluded && model.crops.excluded) return [];

  // minions/multiはdifficultyに寄与せず、woodExcluded/fishExcluded時は残差計算からも
  // 除外される（candidateResidualがexcludedな資源をスキップするため）ため、除外時は
  // ダミー値0の1通りだけで足りる（0〜4/0〜1を総当たりすると候補空間が5倍/2倍に膨れる）。
  const healthMinionsPairs = [];
  if (model.wood.excluded) {
    for (const health of ALL_LEVELS_0_11) healthMinionsPairs.push([health, 0]);
  } else {
    for (let minions = 0; minions <= 4; minions++) {
      const minionsExtra = minions > 0 ? bonusCost('Stronger Minions', minions) : 0;
      for (const health of levelsNearTarget(model.wood.target - minionsExtra, extra.wood || 0, consTolerance, consRoundingSlack)) healthMinionsPairs.push([health, minions]);
    }
  }
  if (healthMinionsPairs.length === 0) return [];

  const defenseMultiPairs = [];
  if (model.fish.excluded) {
    for (const defense of ALL_LEVELS_0_11) defenseMultiPairs.push([defense, 0]);
  } else {
    for (let multi = 0; multi <= 1; multi++) {
      const multiExtra = multi > 0 ? bonusCost('Tower Multi-Attacks', multi) : 0;
      for (const defense of levelsNearTarget(model.fish.target - multiExtra, extra.fish || 0, consTolerance, consRoundingSlack)) defenseMultiPairs.push([defense, multi]);
    }
  }
  if (defenseMultiPairs.length === 0) return [];

  const dmgVolleyPairs = [];
  if (model.ore.excluded) {
    for (const dmg of ALL_LEVELS_0_11) for (let volley = 0; volley <= 3; volley++) dmgVolleyPairs.push([dmg, volley]);
  } else {
    for (let volley = 0; volley <= 3; volley++) {
      const volleyExtra = volley > 0 ? bonusCost('Tower Volley', volley) : 0;
      for (const dmg of levelsNearTarget(model.ore.target - volleyExtra, extra.ore || 0, consTolerance, consRoundingSlack)) dmgVolleyPairs.push([dmg, volley]);
    }
  }
  if (dmgVolleyPairs.length === 0) return [];

  const atkAuraPairs = [];
  if (model.crops.excluded) {
    for (const atk of ALL_LEVELS_0_11) for (let aura = 0; aura <= 3; aura++) atkAuraPairs.push([atk, aura]);
  } else {
    for (let aura = 0; aura <= 3; aura++) {
      const auraExtra = aura > 0 ? bonusCost('Tower Aura', aura) : 0;
      for (const atk of levelsNearTarget(model.crops.target - auraExtra, extra.crops || 0, consTolerance, consRoundingSlack)) atkAuraPairs.push([atk, aura]);
    }
  }
  if (atkAuraPairs.length === 0) return [];

  const candidates = [];
  for (const [health, minions] of healthMinionsPairs) {
    for (const [defense, multi] of defenseMultiPairs) {
      for (const [damage, volley] of dmgVolleyPairs) {
        for (const [attack, aura] of atkAuraPairs) {
          const difficulty = calcDifficulty(health, damage, attack, defense, aura, volley);
          let rating = difficultyToRating(difficulty);
          if (isHQ) rating = bumpRatingForHQ(rating);
          if (rating !== observedRating) continue;
          candidates.push({ damage, attack, health, defense, aura, volley, minions, multi });
        }
      }
    }
  }
  return candidates;
}

// 候補1件の残差（除外された資源は除く）。
function candidateResidual(c, confirmedExtra, model, stored, generation, f) {
  const consumption = candidateConsumption(c.damage, c.attack, c.health, c.defense, c.aura, c.volley, c.minions, c.multi, confirmedExtra || {});
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
// 候補が1件に絞れても、prepared[i].emeraldAdmissibleが非nullかつそのfを支持していない場合は
// 「見せかけの一意化」としてexactlyOneにカウントしない（veto、2026-08導入）。coverageと
// 残差計算は対象外（veto対象でも候補自体は存在するため）。
function evaluatePhase(prepared, f, collectCounts) {
  let coverage = 0;
  let exactlyOne = 0;
  let totalResidual = 0;
  const counts = collectCounts ? [] : null;
  for (const { input, stored, generation, emeraldAdmissible } of prepared) {
    const model = computeResourceModel(stored, generation, f);
    const candidates = deriveTerritoryCandidates(input, f, model);
    if (collectCounts) counts.push(candidates.length);
    if (candidates.length === 0) continue;
    coverage++;
    if (candidates.length === 1 && (emeraldAdmissible === null || isFSupportedByAnyLevel(f, emeraldAdmissible))) {
      exactlyOne++;
    }
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

// Step 1のグリッド探索（粗い格子上の探索）で得たf0を、候補が正確に1件に絞れた領地
// （＝結果を鵜呑みにできる「アンカー」）から個別に逆算したfで精密化する。
// アンカー領地1件について、consumption[r]が既知（候補が確定済み）なら
// stored[r] = consumption[r]×f + generation[r]×(1/60−f) は f についての1次式になり、
// 複数資源の最小二乗解が閉形式で求まる（predicted(f) = b[r] + a[r]×f、
// a[r] = consumption[r]−generation[r]、b[r] = generation[r]/60 と置いた重み付き最小二乗）。
// 全アンカーのfの中央値をfRefinedとする。
//
// 【安全装置】fRefinedのほうが必ず良いとは限らない（2026-08実測: アンカー数が少ない
// スナップショットでfRefinedが真値から外れ、exactlyOneが41→7に激減した事例を確認）。
// 判定にexactlyOne（絞り込めた領地数）を使うと「絞り込みが単に緩んだだけ」のケースと
// 区別できないため、アンカー群の正規化残差の中央値をf0とfRefinedの両方で計算し、
// 小さいほう（＝アンカーの実測storedをより正確に説明できるほう）を採用する。
// またアンカー数が少なすぎる場合（50件未満）は中央値が不安定なため精密化自体を行わない。
const MIN_ANCHORS_FOR_REFINEMENT = 50;
function anchorNormResidual(anchor, f) {
  const c = anchor.candidate;
  const consumption = candidateConsumption(c.damage, c.attack, c.health, c.defense, c.aura, c.volley, c.minions, c.multi, anchor.input.confirmedExtra || {});
  let residual = 0, sumSq = 0;
  for (const r of NON_EMERALD_RESOURCES) {
    if (anchor.model[r].excluded) continue;
    const predicted = consumption[r] * f + (anchor.generation[r] || 0) * (F_MAX - f);
    const diff = anchor.stored[r] - predicted;
    residual += diff * diff;
    sumSq += anchor.stored[r] ** 2;
  }
  return sumSq > 0 ? residual / sumSq : 0;
}
function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}
function refineGlobalPhase(prepared, f0) {
  const anchors = [];
  for (const p of prepared) {
    const model = computeResourceModel(p.stored, p.generation, f0);
    const candidates = deriveTerritoryCandidates(p.input, f0, model);
    if (candidates.length === 1) anchors.push({ ...p, model, candidate: candidates[0] });
  }
  if (anchors.length < MIN_ANCHORS_FOR_REFINEMENT) {
    return { f: f0, anchorCount: anchors.length, refined: false };
  }

  const perAnchorF = [];
  for (const a of anchors) {
    const c = a.candidate;
    const consumption = candidateConsumption(c.damage, c.attack, c.health, c.defense, c.aura, c.volley, c.minions, c.multi, a.input.confirmedExtra || {});
    let num = 0, den = 0;
    for (const r of NON_EMERALD_RESOURCES) {
      if (a.model[r].excluded) continue;
      const gen = a.generation[r] || 0;
      const coef = consumption[r] - gen;
      num += coef * (a.stored[r] - gen / 60);
      den += coef * coef;
    }
    if (den <= 0) continue;
    const fSolved = num / den;
    if (fSolved > 0 && fSolved <= F_MAX) perAnchorF.push(fSolved);
  }
  if (perAnchorF.length === 0) {
    return { f: f0, anchorCount: anchors.length, refined: false };
  }

  const fRefined = median(perAnchorF);
  const medianAtF0 = median(anchors.map(a => anchorNormResidual(a, f0)));
  const medianAtFRefined = median(anchors.map(a => anchorNormResidual(a, fRefined)));
  const useRefined = medianAtFRefined < medianAtF0;

  return {
    f: useRefined ? fRefined : f0,
    anchorCount: anchors.length,
    refined: useRefined,
    f0, fRefined, medianAtF0, medianAtFRefined
  };
}

// territoryInputs: [{ observedRating, isHQ, confirmedExtra, resourceSnapshot, treasuryBuff,
//   emGeneration, emStored }, ...]
//   treasuryBuff/emGeneration/emStoredとresourceSnapshot[r].baseGeneration（r=ore/crops/wood/fish）は
//   エメラルドチャンネルのveto判定にのみ使う（2026-08追加）。いずれか欠けている場合はその領地の
//   emeraldAdmissibleがnullになり、vetoは発動しない（従来通りカウントする）。
// 戻り値: { f, coverage, exactlyOne } | null（1件も評価できなかった場合のみnull）
export function estimateGlobalTransferPhase(territoryInputs) {
  const prepared = [];
  // try/catch: 1領地分のinputが不整合（resourceSnapshot欠損等）で例外を投げると、prepared構築
  // 全体が中断しf探索そのものが失敗する（Worker内で未捕捉のままthrowし、呼び出し側は
  // タイムアウト経由でしか失敗を検知できない）。updateQualityCache()/computeGlobalTransferPhase()
  // （script.js）と同じ理由で、1領地分の例外はログのみに留めprepared構築を継続する。
  for (const input of territoryInputs) {
    try {
      const stored = {}, generation = {};
      for (const r of NON_EMERALD_RESOURCES) {
        const d = input.resourceSnapshot[r];
        if (d) { stored[r] = d.stored; generation[r] = d.generation || 0; }
      }

      // エメラルドチャンネルによるexactlyOneのveto判定用の事前計算（f探索ループの前に1回だけ）。
      // 判定不能（emGeneration欠損・Trio A確定不能）の場合はnull（＝veto対象外、従来通りカウントする）。
      const emeraldAdmissible = computeTerritoryEmeraldAdmissible(input.resourceSnapshot, input.treasuryBuff, input.isHQ, input.emGeneration, input.emStored);

      prepared.push({ input, stored, generation, emeraldAdmissible });
    } catch (err) {
      console.error('[phase] EXCEPTION preparing territory input, skipping:', err);
    }
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

  // グリッド探索で得たf0を、一意に解けたアンカー領地から精密化する
  // （安全装置付き。詳細はrefineGlobalPhase()のコメント参照）。
  const refinement = refineGlobalPhase(prepared, best.f);
  const finalF = refinement.f;

  // 選ばれたfについてのみ、領地ごとの候補数を再集計してヒストグラムを作る
  // （調査用。表示方式の検討材料。グリッド探索中は毎回集計しない）。
  const finalEval = evaluatePhase(prepared, finalF, true);
  const histogram = { zero: 0, one: 0, twoToThree: 0, fourToTen: 0, elevenPlus: 0 };
  for (const n of finalEval.counts) {
    if (n === 0) histogram.zero++;
    else if (n === 1) histogram.one++;
    else if (n <= 3) histogram.twoToThree++;
    else if (n <= 10) histogram.fourToTen++;
    else histogram.elevenPlus++;
  }

  // fをnullにしない方針は維持。refinementは調査用の内訳（UIには出さない）。
  return { f: finalF, coverage: finalEval.coverage, exactlyOne: finalEval.exactlyOne, histogram, refinement };
}

// stored単位の丸め誤差1が表す消費量誤差は1/f（CLAUDE.md「守備ステータス推定の既知の限界」参照）。
// DEFENSE_COST_TABLEの最小刻み（Lv0→Lv1=100）に対してこの誤差がRESOLUTION_LIMIT倍を超える場合、
// stored±1の違いだけでレベルが入れ替わりうるほど分解能が粗いと判断し、その領地の確定推定は
// 諦めて簡易推定（フォールバック）に回す（2026-08導入）。fは領地に依らずスナップショット全体で
// 共通のため、この判定自体はポーリングごとに全領地で同じ結果になる
// （ただし「除外」される資源の組み合わせは領地ごとに異なるため、両者を組み合わせた
// 「信頼できるチャンネルが1つも無い」領地の判定は領地ごとに変わる）。
const RESOLUTION_STEP = 100;
const RESOLUTION_LIMIT = 2; // 要調整。感度分析はCLAUDE.md「守備ステータスの推定」参照
function isResolutionReliable(f) {
  return (1 / f) <= RESOLUTION_STEP * RESOLUTION_LIMIT;
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
    return { levels: null, subBonuses: null, ehp: null, dps: null, secondsToTransfer: null, residual: null, candidateCount: 0, consumption: null };
  }

  const stored = {}, generation = {};
  for (const r of NON_EMERALD_RESOURCES) {
    const d = resourceSnapshot[r];
    if (d) { stored[r] = d.stored; generation[r] = d.generation || 0; }
  }

  const model = computeResourceModel(stored, generation, f);

  // 除外されていないチャンネルが1つも無い、または分解能が粗すぎる場合は確定推定を諦める。
  const hasReliableChannel = NON_EMERALD_RESOURCES.some(r => !model[r].excluded) && isResolutionReliable(f);
  if (!hasReliableChannel) {
    return { levels: null, subBonuses: null, ehp: null, dps: null, secondsToTransfer: null, residual: null, candidateCount: 0, consumption: null };
  }

  const candidates = deriveTerritoryCandidates({ observedRating, isHQ, confirmedExtra }, f, model);
  if (candidates.length === 0) {
    return { levels: null, subBonuses: null, ehp: null, dps: null, secondsToTransfer: null, residual: null, candidateCount: 0, consumption: null };
  }

  const includedResources = NON_EMERALD_RESOURCES.filter(r => !model[r].excluded);
  const sumSq = includedResources.reduce((s, r) => s + stored[r] ** 2, 0);
  if (sumSq <= 0) {
    return { levels: null, subBonuses: null, ehp: null, dps: null, secondsToTransfer: null, residual: null, candidateCount: 0, consumption: null };
  }

  let best = null;
  let validCount = 0;
  for (const c of candidates) {
    const consumption = candidateConsumption(c.damage, c.attack, c.health, c.defense, c.aura, c.volley, c.minions, c.multi, confirmedExtra || {});

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

    validCount++;
    const normResidual = residual / sumSq;
    if (best === null || normResidual < best.residual) {
      best = { damage: c.damage, attack: c.attack, health: c.health, defense: c.defense,
               aura: c.aura, volley: c.volley, minions: c.minions, multi: c.multi,
               residual: normResidual, consumption };
    }
  }

  if (best === null) {
    return { levels: null, subBonuses: null, ehp: null, dps: null, secondsToTransfer: null, residual: null, candidateCount: 0, consumption: null };
  }

  const stats = computeStatsFromLevels(best.health, best.damage, best.attack, best.defense, mult);
  // f = (1 − t/60) / 60 なので、転送までの残り時間 = 3600×f（60×(1−60f) は転送からの経過秒であり、残り時間ではない）。
  const secondsToTransfer = Math.round(3600 * f);

  return {
    levels: { damage: best.damage, attack: best.attack, health: best.health, defense: best.defense },
    subBonuses: { aura: best.aura, volley: best.volley, minions: best.minions, multi: best.multi },
    ehp: stats.finalHp,
    dps: stats.dps,
    secondsToTransfer,
    residual: best.residual,
    // candidateCount===1のときのみ「候補が1件に絞れた」＝品質キャッシュ（Item 9）のTier A/B対象。
    // consumptionは選ばれた候補（bestの元になったc）の資源別消費量（品質スコアのセンシティビティ算出用）。
    candidateCount: validCount,
    consumption: best.consumption
  };
}

// ═══════════════════════════════════════════════════════════
//  簡易推定（Liveモード専用フォールバック）
//
//  estimateDefenseStats()がlevels: nullを返した場合（許容誤差内に候補が1件も無い）の
//  フォールバック。WynnExtras（別ユーティリティMOD）のレーティング段階別決め打ち方式を
//  移植したもの。Efficient Emeralds/Emerald Rateは、WynnExtrasと異なりこちらは
//  generationから正確に検出できる（confirmedExtra）ため決め打ちしない。それ以外の
//  検出不能な非防衛ボーナス（Tower Aura/Volley・Stronger Minions・Tower Multi-Attacks相当）を
//  レーティング段階から一括で仮定し、資源ごとに独立して最寄りのDEFENSE_COST_TABLE段を選ぶ。
//  レーティング照合・複数候補の絞り込みは一切行わないため、確定推定（estimateDefenseStats）
//  より精度が大きく劣る。呼び出し側は必ず「簡易推定」であることが分かる形で表示すること。
// ═══════════════════════════════════════════════════════════

// レーティング段階から仮定する非防衛ボーナスの決め打ちオフセット（累積・WynnExtras方式）。
// rating>=Medium: Tower Aura Lv1(crops+800) + Tower Volley Lv1(ore+200)
// rating>=High:   Tower Volley Lv2相当への追加(ore+200) + Stronger Minions Lv2相当(wood+400)
// rating>=VeryHigh: Tower Multi-Attacks Lv1(fish+4800)
function assumedTierOffsets(observedRating) {
  const idx = RATING_ORDER.indexOf(observedRating);
  const idxMedium = RATING_ORDER.indexOf('Medium');
  const idxHigh = RATING_ORDER.indexOf('High');
  const idxVeryHigh = RATING_ORDER.indexOf('Very High');
  const off = { ore: 0, crops: 0, wood: 0, fish: 0 };
  if (idx >= idxMedium) { off.crops += 800; off.ore += 200; }
  if (idx >= idxHigh) { off.ore += 200; off.wood += 400; }
  if (idx >= idxVeryHigh) { off.fish += 4800; }
  return off;
}

function nearestDefenseLevel(target) {
  let best = 0, bestDiff = Infinity;
  for (let lv = 0; lv <= 11; lv++) {
    const diff = Math.abs(DEFENSE_COST_TABLE[lv] - target);
    if (diff < bestDiff) { bestDiff = diff; best = lv; }
  }
  return best;
}

// params: estimateDefenseStats()と同じ（residualは返さない。常に単一値だが精度は劣る）。
// 戻り値: { levels: {damage,attack,health,defense}（各値はnumber|null）, ehp, dps, secondsToTransfer }
// 4つとも決定不能な場合のみ全フィールドがnullになる。
export function estimateDefenseStatsApproximate({ observedRating, isHQ, mult, confirmedExtra, resourceSnapshot, f }) {
  if (f === null || f === undefined) {
    return { levels: { damage: null, attack: null, health: null, defense: null }, ehp: null, dps: null, secondsToTransfer: null };
  }
  const tierOffsets = assumedTierOffsets(observedRating);
  const extra = confirmedExtra || {};
  const mapping = [['damage', 'ore'], ['attack', 'crops'], ['health', 'wood'], ['defense', 'fish']];
  const levels = {};
  for (const [levelKey, resKey] of mapping) {
    const d = resourceSnapshot[resKey];
    if (!d) { levels[levelKey] = null; continue; }
    const target = (d.stored - (d.generation || 0) * (F_MAX - f)) / f;
    const corrected = target - (extra[resKey] || 0) - (tierOffsets[resKey] || 0);
    levels[levelKey] = corrected < 0 ? null : nearestDefenseLevel(corrected);
  }

  if (levels.damage === null && levels.attack === null && levels.health === null && levels.defense === null) {
    return { levels, ehp: null, dps: null, secondsToTransfer: null };
  }

  let ehp = null, dps = null;
  if (levels.health !== null && levels.defense !== null) {
    ehp = computeStatsFromLevels(levels.health, levels.damage ?? 0, levels.attack ?? 0, levels.defense, mult).finalHp;
  }
  if (levels.damage !== null && levels.attack !== null) {
    dps = computeStatsFromLevels(levels.health ?? 0, levels.damage, levels.attack, levels.defense ?? 0, mult).dps;
  }
  const secondsToTransfer = Math.round(3600 * f);
  return { levels, ehp, dps, secondsToTransfer };
}

// ═══════════════════════════════════════════════════════════
//  推定結果の品質付きキャッシュ保持（Item 9、2026-08導入）
//
//  守備構成は数時間〜数日単位でしか変わらない一方、fは毎ポーリング変動し、fが大きい
//  （転送までの残り秒数が大きい）ときほど推定精度が高い。過去に観測できた「良いf」での
//  確定推定を、構成が変わっていない間は保持し続けるための表示層キャッシュ。
//  Step2（estimateDefenseStats）の候補選択ロジックそのものは変更しない。
//
//  Tier A: 候補1件に絞れており（candidateCount===1）、emeraldAdmissibleによる独立検証も通っている
//  Tier B: candidateCount===1だが、emeraldAdmissibleが判定不能（null）で裏取りができない
//  Tier C: 候補が1件に絞れていない（キャッシュ対象外、常に生の推定/簡易推定をそのまま表示）
// ═══════════════════════════════════════════════════════════

// producingChannelsの生成量と消費量の差が大きいほど、fのわずかな誤差が消費量側に増幅されやすい
// （資源ブースト領地の系統的なズレ、CLAUDE.md「守備ステータスの推定」参照）ため品質を下げる。
// 要調整。Elkurn実測（crops generation=36000, 候補消費量10000）でpenalty≒1/6.2まで下がることを
// 確認済み。非生産チャンネルのみの領地（Troms等）ではproducingChannelsが空になりpenalty=1のまま。
const SENSITIVITY_NORMALIZER = 5000;

// storedValues: 推定に使ったore/crops/wood/fishのstored値の配列（emeraldsは含まない）。
// producingChannels: generation>0の資源チャンネルのみ { resource, generation, consumption }[]（無ければ空配列）。
// 戻り値: 補正後の品質スコア（同Tier内の比較にのみ使う）。
export function computeQualityScore(storedValues, f, producingChannels) {
  const rawQuality = Math.min(...storedValues) * f;
  const maxSensitivity = producingChannels.length === 0
    ? 0
    : Math.max(...producingChannels.map(c => Math.abs(c.generation - c.consumption)));
  const penalty = 1 / (1 + maxSensitivity / SENSITIVITY_NORMALIZER);
  return rawQuality * penalty;
}

// candidateCount: Step2（estimateDefenseStats）が返すcandidateCount。
// emeraldAdmissible: computeTerritoryEmeraldAdmissible()の戻り値（null=判定不能、[]=常にveto、Array=区間集合）。
// fGrid: 選ばれたグローバル位相f。
export function determineTier(candidateCount, emeraldAdmissible, fGrid) {
  if (candidateCount !== 1) return 'C';
  if (emeraldAdmissible === null) return 'B';
  if (isFSupportedByAnyLevel(fGrid, emeraldAdmissible)) return 'A';
  return 'C'; // emeraldAdmissibleはveto済みのはずなのでここには来ないはずだが、念のため
}

// determineTier()と同じ判定を共有し、「候補が1件に絞れなかった（candidateCount!==1）」のか
// 「候補は1件だがエメラルドvetoで除外された」のかを呼び出し側（定点観測ロガー等）が区別できる
// ようにするための公開ヘルパー。determineTier()が'C'を返すケースのうち後者のみtrueになる。
export function isVetoed(candidateCount, emeraldAdmissible, fGrid) {
  if (candidateCount !== 1) return false;
  if (emeraldAdmissible === null) return false;
  return !isFSupportedByAnyLevel(fGrid, emeraldAdmissible);
}

// MIN_CACHE_QUALITYフロア（品質が閾値未満のTier A/B観測をキャッシュしない対策）は2026-08に撤廃した。
// 実データ検証（1098件・8スナップショット）でrating整合フィルタに矛盾が一件も無かったことから、
// 品質フロアは低品質な偶然の一致だけでなく正しい確定推定まで巻き込んで弾いていた可能性が高いと
// 判断し、Tier A/Bの確定推定は品質の値によらず即座にキャッシュする設計に戻した（Krolton's Cave・
// Bantisu Approach等で「以前正しい確定推定が出ていたのにキャッシュされない」報告が繰り返された
// 一因と考えられる）。Twain Mansionのような極端な低品質値がキャッシュされる可能性は残るが、
// それは正しさをrating整合フィルタ・veto・片側化という既存の安全策に委ねる、という判断である。

// cached: 既存のCachedEstimate | null。newTier/newQualityは今回の観測。
// Tierが主キー（A>B）、同Tier内は品質の高いほうを採用する。
export function shouldUpdateCache(cached, newTier, newQuality) {
  if (cached === null) return true;
  if (newTier === 'A' && cached.tier === 'B') return true;
  if (newTier === 'B' && cached.tier === 'A') return false;
  return newQuality > cached.quality;
}

// キャッシュの既定の破棄しきい値（2時間）。テストで短縮したしきい値を注入できるよう第4引数にした。
const CACHE_DISCARD_MS = 2 * 60 * 60 * 1000;

// 資源量ベースの不一致が何回連続したら破棄するか（2026-08、resourceMismatchStreak導入時に追加）。
// 1回だけの不一致は即破棄せず様子見する。1回の不一致だけで破棄→即キャッシュ更新を繰り返す
// パターンが実ログ（watch-log）で頻発していたため、observedAtが必要以上に頻繁に更新されて
// しまっていた（詳細はCLAUDE.md「低品質キャッシュがTier Bを上書きする件」に続く追記参照）。
const RESOURCE_MISMATCH_DISCARD_STREAK = 2;

// 資源量ベースの追加破棄判定（2026-08導入）。acquired/defences/guildが変わらないまま、
// War中に内部の防衛レベル配分だけが変わるケースを検知するため、キャッシュ済み推定の消費量
// （cached.estimate.consumption、confirmedExtra込みの実消費量）が現在の生スナップショット
// （stored/generation）に対してまだ成立するかを確認する。判定は既存の候補マッチングと同じ
// 許容誤差（PHASE_TOLERANCE_PER_RESOURCE、stored単位）を再利用する。exactlyOneのような厳しい
// 判定（ROUNDING_SLACK_PER_RESOURCEの片側化）は適用しない（coverage相当の緩い判定でよいため）。
// 生の資源データが取得できない・fが確定していない等で判定に必要な値が欠けている場合はnullを返し、
// 呼び出し側は他の条件のみで判定する（安全側に倒す。新しい破棄が増える方向にはしない）。
function isCachedConsumptionStillPlausible(consumption, resourceSnapshot, f) {
  if (!consumption || !resourceSnapshot || f === null || f === undefined) return null;
  let checked = 0;
  for (const r of NON_EMERALD_RESOURCES) {
    const d = resourceSnapshot[r];
    const cons = consumption[r];
    if (!d || d.stored === undefined || cons === undefined) continue;
    checked++;
    const predicted = cons * f + (d.generation || 0) * (F_MAX - f);
    if (Math.abs(d.stored - predicted) > PHASE_TOLERANCE_PER_RESOURCE) return false;
  }
  return checked > 0 ? true : null;
}

// currentInfo: { acquired, defences, guild, resourceSnapshot?, f? } | null
//   （nullは「現在のAPIレスポンスに存在しない＝領地を失った」）。resourceSnapshot/fは
//   資源量ベースの追加判定用（省略可・省略時はこの判定をスキップする）。
// acquired/defences/guild変化、観測から2時間（既定）経過では即座に破棄する。資源量ベースの
// 判定（isCachedConsumptionStillPlausible）は、fのわずかな誤差・丸め等による偶発的な単発の
// 不一致だけでキャッシュを破棄してしまわないよう、RESOURCE_MISMATCH_DISCARD_STREAK回
// （既定2回）連続で不一致が観測された場合のみ破棄する（2026-08、resourceMismatchStreak導入）。
// 戻り値: { discard, resourceMismatchStreak }。discard=trueのとき呼び出し側はキャッシュを削除する。
// discard=falseのときはresourceMismatchStreakの新しい値をcached.resourceMismatchStreakへ
// 書き戻す（判定不能/整合だった場合は0にリセット、単発の不一致ならcached.resourceMismatchStreak+1）。
// acquired/defences/guild変化・2時間経過による即時破棄ではresourceMismatchStreakは意味を持たず0を返す。
export function shouldDiscardCache(cached, currentInfo, nowMs, discardMs = CACHE_DISCARD_MS) {
  if (currentInfo === null) return { discard: true, resourceMismatchStreak: 0 };
  if (currentInfo.acquired !== cached.acquired) return { discard: true, resourceMismatchStreak: 0 };
  if (currentInfo.defences !== cached.defences) return { discard: true, resourceMismatchStreak: 0 };
  if (currentInfo.guild !== cached.guild) return { discard: true, resourceMismatchStreak: 0 };
  if (nowMs - Date.parse(cached.observedAt) > discardMs) return { discard: true, resourceMismatchStreak: 0 };

  const stillPlausible = isCachedConsumptionStillPlausible(
    cached.estimate && cached.estimate.consumption, currentInfo.resourceSnapshot, currentInfo.f
  );
  if (stillPlausible === false) {
    const streak = (cached.resourceMismatchStreak || 0) + 1;
    return { discard: streak >= RESOURCE_MISMATCH_DISCARD_STREAK, resourceMismatchStreak: streak };
  }
  return { discard: false, resourceMismatchStreak: 0 };
}
