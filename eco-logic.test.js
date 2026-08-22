// eco-logic.js の純関数に対する単体テスト。
// 実行方法: node --test eco-logic.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldDiscardCache } from './eco-logic.js';

const F_MAX = 1 / 60;

// consumption 6000/hr の資源4種すべて（f=F_MAX・generation=0のとき predicted = 6000/60 = 100）。
const CONSUMPTION = { ore: 6000, crops: 6000, wood: 6000, fish: 6000 };

function baseCached(overrides = {}) {
  return {
    acquired: '2026-01-01T00:00:00.000Z',
    defences: 'MEDIUM',
    guild: 'TestGuild',
    observedAt: new Date().toISOString(), // 直近観測（2時間経過による破棄には引っかからない）
    resourceMismatchStreak: 0,
    estimate: { consumption: CONSUMPTION },
    ...overrides
  };
}

// stored=100/generation=0が全チャンネルで「一致」（predicted=100との差0）になるベース。
function plausibleResourceSnapshot() {
  return {
    ore: { stored: 100, generation: 0 },
    crops: { stored: 100, generation: 0 },
    wood: { stored: 100, generation: 0 },
    fish: { stored: 100, generation: 0 }
  };
}

// 全チャンネルをpredicted(100)から大きく外す（許容誤差PHASE_TOLERANCE_PER_RESOURCE=3を大幅超過）。
function mismatchedResourceSnapshot() {
  return {
    ore: { stored: 500, generation: 0 },
    crops: { stored: 500, generation: 0 },
    wood: { stored: 500, generation: 0 },
    fish: { stored: 500, generation: 0 }
  };
}

function currentInfo(resourceSnapshot, overrides = {}) {
  return {
    acquired: '2026-01-01T00:00:00.000Z',
    defences: 'MEDIUM',
    guild: 'TestGuild',
    resourceSnapshot,
    f: F_MAX,
    ...overrides
  };
}

test('1回だけ資源量不一致: 破棄されず、resourceMismatchStreakが1になる', () => {
  const cached = baseCached({ resourceMismatchStreak: 0 });
  const result = shouldDiscardCache(cached, currentInfo(mismatchedResourceSnapshot()), Date.now());
  assert.equal(result.discard, false, '1回目の不一致では破棄されないはず');
  assert.equal(result.resourceMismatchStreak, 1);
});

test('2回連続で資源量不一致: 破棄される', () => {
  // 1回目の不一致がcached.resourceMismatchStreakへ書き戻された状態を模す
  // （script.jsのupdateQualityCache()が行う `cached.resourceMismatchStreak = result.resourceMismatchStreak` に相当）。
  const cached = baseCached({ resourceMismatchStreak: 1 });
  const result = shouldDiscardCache(cached, currentInfo(mismatchedResourceSnapshot()), Date.now());
  assert.equal(result.discard, true, '2回連続の不一致では破棄されるはず');
  assert.equal(result.resourceMismatchStreak, 2);
});

test('不一致の後に整合する観測が来たら、resourceMismatchStreakは0にリセットされる', () => {
  const cached = baseCached({ resourceMismatchStreak: 1 });
  const result = shouldDiscardCache(cached, currentInfo(plausibleResourceSnapshot()), Date.now());
  assert.equal(result.discard, false);
  assert.equal(result.resourceMismatchStreak, 0);
});

test('資源量ベースの判定が不能（fが無い）場合も、resourceMismatchStreakは0にリセットされる', () => {
  const cached = baseCached({ resourceMismatchStreak: 1 });
  const info = currentInfo(plausibleResourceSnapshot(), { f: null });
  const result = shouldDiscardCache(cached, info, Date.now());
  assert.equal(result.discard, false);
  assert.equal(result.resourceMismatchStreak, 0);
});

test('acquired変化は資源量ベースの判定を経由せず即座に破棄する（resourceMismatchStreakは0）', () => {
  const cached = baseCached({ resourceMismatchStreak: 1 });
  const info = currentInfo(mismatchedResourceSnapshot(), { acquired: '2026-02-01T00:00:00.000Z' });
  const result = shouldDiscardCache(cached, info, Date.now());
  assert.equal(result.discard, true);
  assert.equal(result.resourceMismatchStreak, 0);
});
