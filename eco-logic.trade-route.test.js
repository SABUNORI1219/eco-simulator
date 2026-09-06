// Trading Route探索アルゴリズム（computeTradeRoute/getHQPaths/JavaBinaryHeap/getNeighborsOrdered）の
// 単体テスト・回帰テスト。実行方法: node --test eco-logic.trade-route.test.js
//
// 回帰テストの期待値は docs/Trading Routes.txt（Kander/Corkus/Canyon/Swamp/Ragniセクション）
// から実行時にパースする。手で転記した固定値を使わないのは、転記ミスのリスクを避けるため
// （実測データは唯一の正解の出どころであり、必ずファイルから読む）。
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  JavaBinaryHeap,
  getNeighborsOrdered,
  computeTradeRoute,
  getHQPaths
} from './eco-logic.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const territories = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'territories.json'), 'utf8').replace(/^﻿/, '')
);

// ═══════════════════════════════════════════════════════════
//  §6.2 JavaBinaryHeap 単体テスト
// ═══════════════════════════════════════════════════════════
describe('JavaBinaryHeap', () => {
  test('空のヒープに対するpoll()はundefinedを返す', () => {
    const heap = new JavaBinaryHeap();
    assert.equal(heap.poll(), undefined);
  });

  test('sizeがoffer/pollに応じて正しく増減する', () => {
    const heap = new JavaBinaryHeap();
    assert.equal(heap.size, 0);
    heap.offer([1, 'A']);
    heap.offer([2, 'B']);
    assert.equal(heap.size, 2);
    heap.poll();
    assert.equal(heap.size, 1);
    heap.poll();
    assert.equal(heap.size, 0);
  });

  test('小さい値から順に取り出される', () => {
    const heap = new JavaBinaryHeap();
    for (const [v, k] of [[5, 'e'], [3, 'c'], [1, 'a'], [4, 'd'], [2, 'b']]) heap.offer([v, k]);
    const order = [];
    while (heap.size > 0) order.push(heap.poll()[1]);
    assert.deepEqual(order, ['a', 'b', 'c', 'd', 'e']);
  });

  test('同値要素の取り出し順は挿入順（FIFO）とは異なるケースが存在する（java.util.PriorityQueue準拠）', () => {
    // §3.1のシーケンス例。offer([1,"A"]) offer([1,"B"]) offer([1,"C"]) offer([0,"D"]) offer([1,"E"])
    // の取り出し順を、疑似コードのsiftUp/siftDownをPythonで独立実装した結果と突き合わせて確認済み
    // （このテストとは別言語・別実装のシミュレーションであり、循環検証ではない）: D, E, B, C, A
    const heap = new JavaBinaryHeap();
    heap.offer([1, 'A']);
    heap.offer([1, 'B']);
    heap.offer([1, 'C']);
    heap.offer([0, 'D']);
    heap.offer([1, 'E']);
    const order = [];
    while (heap.size > 0) order.push(heap.poll()[1]);
    assert.deepEqual(order, ['D', 'E', 'B', 'C', 'A']);
    // 挿入順（FIFO、0が来た時点で先頭に出るだけ）とは異なることを明示的に確認する
    assert.notDeepEqual(order, ['D', 'A', 'B', 'C', 'E']);
  });
});

// ═══════════════════════════════════════════════════════════
//  getNeighborsOrdered / computeTradeRoute の基本仕様
// ═══════════════════════════════════════════════════════════
describe('getNeighborsOrdered', () => {
  test('territories.jsonのTrading Routes配列順をソートせずそのまま返す', () => {
    const result = getNeighborsOrdered('Owl Tribe', territories, []);
    assert.deepEqual(result, territories['Owl Tribe']['Trading Routes']);
  });

  test('有効なcustomConnectionsを登録順で基本ルートの後ろに追加し、重複は除去する', () => {
    const base = territories['Owl Tribe']['Trading Routes'];
    const dup = base[0];
    const conns = [{ a: 'Owl Tribe', b: dup }, { a: 'Owl Tribe', b: 'Detlas' }, { a: 'Ragni', b: 'Owl Tribe' }];
    const result = getNeighborsOrdered('Owl Tribe', territories, conns);
    assert.deepEqual(result, [...base, 'Detlas', 'Ragni']);
  });
});

describe('computeTradeRoute エッジケース', () => {
  test('source === hq のとき [hq] を返す', () => {
    const added = new Set(['Ragni']);
    assert.deepEqual(computeTradeRoute('Ragni', 'Ragni', added, 'cheapest', territories, []), ['Ragni']);
  });

  test('sourceがaddedに無ければnullを返す', () => {
    const added = new Set(['Ragni']);
    assert.equal(computeTradeRoute('Detlas', 'Ragni', added, 'cheapest', territories, []), null);
  });

  test('hqがaddedに無ければnullを返す', () => {
    const added = new Set(['Detlas']);
    assert.equal(computeTradeRoute('Detlas', 'Ragni', added, 'cheapest', territories, []), null);
  });

  test('未知のstyleはcheapestとして扱い、例外を投げない', () => {
    const added = new Set(['Ragni', 'Ragni Main Entrance', 'Emerald Trail']);
    assert.doesNotThrow(() => computeTradeRoute('Emerald Trail', 'Ragni', added, 'unknown-style', territories, []));
  });
});

// 2026-09追加: cheapestの探索が全437領地グラフを走査する（未登録領地をUNOWNED_COSTで
// 踏み台にできる）ようにした変更の単体テスト。合成データで検証する。
describe('computeTradeRoute: 未登録領地の扱い（cheapestのみUNOWNED_COSTで踏み台にできる）', () => {
  // A(登録) - B(未登録) - C(未登録) - HQ(登録) という一本道のみのグラフ。
  // 登録領地だけではAからHQに到達できない。
  const synthTerritories = {
    A: { 'Trading Routes': ['B'] },
    B: { 'Trading Routes': ['A', 'C'] },
    C: { 'Trading Routes': ['B', 'HQ'] },
    HQ: { 'Trading Routes': ['C'] }
  };

  test('cheapest: 未登録領地を踏み台にして「到達」しても、経路に未登録領地が含まれる場合はnullを返す（非接続のまま）', () => {
    const added = new Set(['A', 'HQ']); // B, Cは未登録
    const result = computeTradeRoute('A', 'HQ', added, 'cheapest', synthTerritories, []);
    assert.equal(result, null);
  });

  test('fastest: 未登録領地は従来通りスキップし続ける（挙動を変えない）', () => {
    const added = new Set(['A', 'HQ']);
    const result = computeTradeRoute('A', 'HQ', added, 'fastest', synthTerritories, []);
    assert.equal(result, null);
  });

  test('cheapest: 登録領地だけで繋がっている場合は従来通り経路が求まる', () => {
    const added = new Set(['A', 'B', 'C', 'HQ']);
    const result = computeTradeRoute('A', 'HQ', added, 'cheapest', synthTerritories, []);
    assert.deepEqual(result, ['A', 'B', 'C', 'HQ']);
  });

  test('cheapest: データに存在しない領地名（territoriesに無い）は踏み台にもできずスキップされる', () => {
    const territoriesWithGhost = {
      A: { 'Trading Routes': ['Ghost'] }, // GhostはTrading Routesに載っているがterritoriesには存在しない
      HQ: { 'Trading Routes': [] }
    };
    const added = new Set(['A', 'HQ']);
    const result = computeTradeRoute('A', 'HQ', added, 'cheapest', territoriesWithGhost, []);
    assert.equal(result, null);
  });
});

// ═══════════════════════════════════════════════════════════
//  §6.1 回帰テスト（実測データ: docs/Trading Routes.txt）
// ═══════════════════════════════════════════════════════════
function extractSection(lines, startMarker, endMarker = null) {
  const startIdx = lines.findIndex(l => l.includes(startMarker));
  if (startIdx === -1) throw new Error(`セクション開始行が見つかりません: ${startMarker}`);
  const endIdx = endMarker ? lines.findIndex((l, i) => i > startIdx && l.includes(endMarker)) : -1;
  return lines.slice(startIdx, endIdx === -1 ? lines.length : endIdx);
}

// docs/Trading Routes.txtの明確な誤字を補正する。「Bantisu Approarch」はCanyonセクションの
// 「Bantisu Air Temple」行にのみ現れる表記で、同ファイル内に別行として存在する正しい領地名
// 「Bantisu Approach」の誤字と判断した（1文字の誤挿入、他に「Approarch」という領地は存在しない）。
// 補正しないとこの1行だけaddedに存在しない領地名を参照し、Canyonの登録数が61ではなく62になる。
const CANYON_NAME_FIX = { 'Bantisu Approarch': 'Bantisu Approach' };

// hqAbbrevはTrading Routes.txt内の略称（例: "CO"）、hqNameは領地のフルネーム。
// nameFixは表記ゆれ・誤字の補正マップ（省略可）。
// 出発地名が"*"で始まる行（ファイル内の注記: 「間違ってる可能性のあるルート」＝うろ覚え）は
// uncertainマップに分離し、cheapestのアサーション対象からは除外する。ただしグラフの連結性を
// 保つため、addedへは含める（buildAdded()がcheapest/uncertain両方から集める）。
function parseRegion(sectionLines, hqAbbrev, hqName, nameFix = {}) {
  const cheapest = new Map();         // source -> [source, ..., hqName]（アサーション対象）
  const uncertain = new Map();        // "*"付きのsource -> path（addedには含めるがアサーションしない）
  const fastestOverrides = new Map(); // source -> [source, ..., hqName]（fastestで経路が変わったもののみ）
  let mode = 'cheapest';
  for (const raw of sectionLines) {
    const line = raw.trim();
    if (line.startsWith('※ 以下fastest')) { mode = 'fastest'; continue; }
    if (!line.startsWith('- ')) continue;
    const content = line.slice(2);
    const rawTokens = content.split(' -> ').map(s => s.trim());
    const isUncertain = rawTokens[0].startsWith('*');
    const tokens = rawTokens.map(t => {
      let name = t.startsWith('*') ? t.slice(1) : t;
      name = name === hqAbbrev ? hqName : name;
      return nameFix[name] || name;
    });
    const source = tokens[0];
    if (mode === 'cheapest') {
      if (isUncertain) uncertain.set(source, tokens);
      else cheapest.set(source, tokens);
    } else {
      fastestOverrides.set(source, tokens);
    }
  }
  return { cheapest, uncertain, fastestOverrides };
}

const routesText = fs.readFileSync(path.join(__dirname, 'docs', 'Trading Routes.txt'), 'utf8');
const routesLines = routesText.split(/\r?\n/);

const kanderSection = extractSection(routesLines, '### Kander', '### Corkus');
const corkusSection = extractSection(routesLines, '### Corkus', '### Canyon');
const canyonSection = extractSection(routesLines, '### Canyon', '### Swamp');
const swampSection = extractSection(routesLines, '### Swamp', '### Ragni');
const ragniSection = extractSection(routesLines, '### Ragni'); // ファイル末尾のセクションのため終端マーカー無し

const kander = { ...parseRegion(kanderSection, 'CO', 'Cinfras Outskirts'), hq: 'Cinfras Outskirts' };
const corkus = { ...parseRegion(corkusSection, 'CC', 'Corkus City'), hq: 'Corkus City' };
const canyon = { ...parseRegion(canyonSection, 'BT', "Bandit's Toll", CANYON_NAME_FIX), hq: "Bandit's Toll" };
const swamp = { ...parseRegion(swampSection, 'BT', 'Bloody Trail'), hq: 'Bloody Trail' };
const ragni = { ...parseRegion(ragniSection, 'NR', "Nomads' Refuge"), hq: "Nomads' Refuge" };

// 実測データの前提を自己検証する（transcriptionミスやファイル改変で母数がズレていないことを保証する）。
test('実測データの母数がテスト対象と一致する', () => {
  assert.equal(kander.cheapest.size, 58, 'Kander cheapest');
  assert.equal(corkus.cheapest.size, 24, 'Corkus cheapest');
  assert.equal(canyon.cheapest.size, 51, 'Canyon cheapest（"*"付き9件を除く）');
  assert.equal(canyon.uncertain.size, 9, 'Canyonの"*"付き（うろ覚え）行');
  assert.equal(swamp.cheapest.size, 7, 'Swamp cheapest');
  assert.equal(ragni.cheapest.size, 8, 'Ragni cheapest（"*"付き1件を除く）');
  assert.equal(ragni.uncertain.size, 1, 'Ragniの"*"付き（うろ覚え）行（Maltic）');
});

test('登録数（HQ込み）が既知の値と一致する', () => {
  assert.equal(buildAdded(canyon).size, 61, 'Canyon registered');
  assert.equal(buildAdded(swamp).size, 8, 'Swamp registered');
  assert.equal(buildAdded(ragni).size, 16, 'Ragni registered');
});

// §6.1に明記された「Twisted Housing（非所有の同盟領地）を経由する1ルート」を除外する。
// 本シミュレータは同盟領地を扱わないため、このルートは登録済み集合(added)で再現不可能であり、
// テスト対象から除外するのが正しい（実装バグではない）。
const EXCLUDED_FASTEST_SOURCES = new Set(['Efilim']); // Kander、Twisted Housing経由のため除外

// cheapestモードでの既知の不一致3件（実装バグではなく許容する。2026-09、未登録領地を
// UNOWNED_COSTで踏み台にできるよう修正した後の値。修正前は5件で、Entrance to Kanderと
// Bloody Beachが含まれていたが、修正後はいずれも一致するようになった。
//
// 【依頼元の予測との相違点】修正依頼の指示では「Entrance to Kanderは一致するが、
// 同じ分岐点でGelibordが新たに不一致になり、Kanderの一致数は53/58になるはず」とされていたが、
// 実際にコードを実装して実測データ（docs/Trading Routes.txt）と突き合わせたところ、
// Gelibordも一致し、Kanderは55/58だった（不一致はJitak's Farm/Kitrios Barracks/
// Colourful Mountaintopの3件のみ）。他の4地域（Corkus 24/24・Canyon 51/51・Swamp 7/7・
// Ragni 8/8、および登録数61/8/16・Nemractの経路）は依頼元の予測と完全に一致しており、
// この実装が指示された疑似コード通りであることの傍証としている。Gelibordの食い違いのみ
// 依頼元に報告済み（実測データ・実装のどちらにも手を加えず、実際の計算結果をそのまま採用した）。
const KNOWN_CHEAPEST_MISMATCHES = new Set([
  "Jitak's Farm",
  'Kitrios Barracks',
  'Colourful Mountaintop'
]);

function buildAdded(region) {
  const names = new Set();
  for (const p of region.cheapest.values()) for (const n of p) names.add(n);
  if (region.uncertain) for (const p of region.uncertain.values()) for (const n of p) names.add(n);
  return names;
}

function runRegion(region, style) {
  const added = buildAdded(region);
  const result = getHQPaths(region.hq, added, territories, [], () => style);
  return { added, result };
}

describe('§6.1 回帰テスト: Cheapest（Kander 55/58・Corkus 24/24・Canyon 51/51・Swamp 7/7・Ragni 8/8）', () => {
  const regions = [
    [kander, 'Kander', 58, 55],
    [corkus, 'Corkus', 24, 24],
    [canyon, 'Canyon', 51, 51],
    [swamp, 'Swamp', 7, 7],
    [ragni, 'Ragni', 8, 8]
  ];

  let totalMatches = 0;
  let totalCount = 0;
  const unexpectedMismatches = [];
  const perRegionMatches = {};

  for (const [region, label, expectedTotal, expectedMatches] of regions) {
    const run = runRegion(region, 'cheapest');
    let regionMatches = 0;
    for (const [source, expectedPath] of region.cheapest) {
      totalCount++;
      const actualPath = run.result.paths[source];
      const matched = actualPath && JSON.stringify(actualPath) === JSON.stringify(expectedPath);
      if (matched) { totalMatches++; regionMatches++; }
      else if (!KNOWN_CHEAPEST_MISMATCHES.has(source)) {
        unexpectedMismatches.push({ region: label, source, expectedPath, actualPath });
      }
    }
    perRegionMatches[label] = { matches: regionMatches, total: region.cheapest.size, expectedTotal, expectedMatches };
  }

  test('既知の不一致3件以外はすべて完全一致する', () => {
    assert.deepEqual(unexpectedMismatches, []);
  });

  test('地域ごとの母数・一致数が既知の値と一致する', () => {
    for (const [label, r] of Object.entries(perRegionMatches)) {
      assert.equal(r.total, r.expectedTotal, `${label} 母数`);
      assert.equal(r.matches, r.expectedMatches, `${label} 一致数`);
    }
  });

  test('全地域合計の母数が148件である', () => {
    assert.equal(totalCount, 148);
  });

  test('全地域合計の一致数が145件である（148 - 既知の不一致3件）', () => {
    assert.equal(totalMatches, 145);
  });
});

// 未登録領地をUNOWNED_COSTで踏み台にできるようにした修正（2026-09）の再発防止テスト。
// 修正前はRagni全域のグラフ探索が登録領地だけに限定されており、Nemractの経路が
// 期待値と異なっていた（詳細はcomputeTradeRoute()のコメント参照）。
test('Ragni: Nemractの経路がMount Wynn Inn・Nested Cliffside経由になる（再発防止）', () => {
  const added = buildAdded(ragni);
  const result = getHQPaths(ragni.hq, added, territories, [], () => 'cheapest');
  assert.deepEqual(result.paths['Nemract'], [
    'Nemract', 'Mount Wynn Inn', 'Nested Cliffside', 'Webbed Fracture', "Nomads' Refuge"
  ]);
});

describe('§6.1 回帰テスト: Fastest（82/82が完全一致。Efilim→Twisted Housingの1件は除外し実質81件）', () => {
  const kanderRun = runRegion(kander, 'fastest');
  const corkusRun = runRegion(corkus, 'fastest');

  const mismatches = [];
  let totalCount = 0;

  for (const [region, run, label] of [[kander, kanderRun, 'Kander'], [corkus, corkusRun, 'Corkus']]) {
    for (const [source, cheapestPath] of region.cheapest) {
      if (EXCLUDED_FASTEST_SOURCES.has(source)) continue;
      totalCount++;
      const expectedPath = region.fastestOverrides.get(source) || cheapestPath;
      const actualPath = run.result.paths[source];
      const matched = actualPath && JSON.stringify(actualPath) === JSON.stringify(expectedPath);
      if (!matched) mismatches.push({ region: label, source, expectedPath, actualPath });
    }
  }

  test('母数が81件である（Efilimの1件を除外）', () => {
    assert.equal(totalCount, 81);
  });

  test('1件も外れず100%一致する', () => {
    assert.deepEqual(mismatches, []);
  });
});

// ═══════════════════════════════════════════════════════════
//  §6.3 非木構造の再現テスト
// ═══════════════════════════════════════════════════════════
describe('§6.3 非木構造の再現テスト', () => {
  // 期待値は実データ（docs/Trading Routes.txt）から直接引く。要件定義書§6.3本文の具体例は
  // Chasm OverlookとMyconid Descentの記載が実データと逆転していた（ドキュメント側の転記ミスと
  // 判断し、実データを正とする。実データ: Mantis Nest -> Myconid Descent -> ...、
  // Aldorei Springs -> Mantis Nest -> Chasm Overlook -> ...）。
  test('同じMantis Nestを通るのに、出発地によって次のホップが異なる', () => {
    const added = buildAdded(kander);
    const result = getHQPaths(kander.hq, added, territories, [], () => 'cheapest');

    const mantisNestPath = result.paths['Mantis Nest'];
    const aldoreiSpringsPath = result.paths['Aldorei Springs'];
    const expectedMantisNestPath = kander.cheapest.get('Mantis Nest');
    const expectedAldoreiSpringsPath = kander.cheapest.get('Aldorei Springs');
    assert.ok(mantisNestPath, 'Mantis Nestの経路が見つかりません');
    assert.ok(aldoreiSpringsPath, 'Aldorei Springsの経路が見つかりません');

    assert.deepEqual(mantisNestPath, expectedMantisNestPath);
    assert.deepEqual(aldoreiSpringsPath, expectedAldoreiSpringsPath);

    assert.equal(aldoreiSpringsPath[1], 'Mantis Nest');
    // Aldorei SpringsのパスもMantis Nestを経由するが、そこから先のホップは
    // Mantis Nest自身のパスにおける次のホップとは異なる。
    // これは木構造（単一の最短経路木）では原理的に再現できない挙動である。
    assert.notEqual(aldoreiSpringsPath[2], mantisNestPath[1]);
  });
});
