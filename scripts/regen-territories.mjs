// territories.json の Trading Routes / Location を、APIレスポンスの links / location で上書きする。
// 使い方: node scripts/regen-territories.mjs <api-response.json> [--dry-run]
// 詳細仕様: CLAUDE.md「Trading Route探索アルゴリズム」参照

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TERRITORIES_PATH = path.join(__dirname, '..', 'territories.json');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const apiPathArg = args.find(a => !a.startsWith('--'));
if (!apiPathArg) {
  fail('使い方: node scripts/regen-territories.mjs <api-response.json> [--dry-run]');
}

const apiRaw = fs.readFileSync(apiPathArg, 'utf8');
const apiData = JSON.parse(apiRaw);

const territoriesRawBuf = fs.readFileSync(TERRITORIES_PATH);
const hasBOM = territoriesRawBuf[0] === 0xEF && territoriesRawBuf[1] === 0xBB && territoriesRawBuf[2] === 0xBF;
const territoriesRawText = territoriesRawBuf.toString('utf8');
const hasCRLF = territoriesRawText.includes('\r\n');
const territoriesText = territoriesRawText.replace(/^﻿/, '');
const territoriesData = JSON.parse(territoriesText);

const apiKeys = Object.keys(apiData);
const localKeys = Object.keys(territoriesData);

if (apiKeys.length !== 437) fail(`APIレスポンスの領地数が437ではありません: ${apiKeys.length}`);
if (localKeys.length !== 437) fail(`territories.jsonの領地数が437ではありません: ${localKeys.length}`);

const apiSet = new Set(apiKeys);
const localSet = new Set(localKeys);

const onlyInLocal = localKeys.filter(k => !apiSet.has(k));
const onlyInApi = apiKeys.filter(k => !localSet.has(k));

if (onlyInLocal.length > 0) {
  console.warn(`警告: territories.jsonにのみ存在する領地 (${onlyInLocal.length}件):`, onlyInLocal);
}
if (onlyInApi.length > 0) {
  console.warn(`警告: APIにのみ存在する領地 (${onlyInApi.length}件):`, onlyInApi);
}

const commonKeys = localKeys.filter(k => apiSet.has(k));

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const as = new Set(a);
  for (const x of b) if (!as.has(x)) return false;
  return true;
}

function sameOrder(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function sameLocation(a, b) {
  if (!a || !b) return a === b;
  return JSON.stringify(a) === JSON.stringify(b);
}

const orderOnlyDiffs = [];
const setChangedDiffs = [];
const locationDiffs = [];

for (const name of commonKeys) {
  const local = territoriesData[name];
  const api = apiData[name];

  const localRoutes = local['Trading Routes'] || [];
  const apiLinks = api.links || [];

  if (!sameOrder(localRoutes, apiLinks)) {
    if (sameSet(localRoutes, apiLinks)) {
      orderOnlyDiffs.push({ name, before: localRoutes, after: apiLinks });
    } else {
      setChangedDiffs.push({ name, before: localRoutes, after: apiLinks });
    }
  }

  if (!sameLocation(local.Location, api.location)) {
    locationDiffs.push({ name, before: local.Location, after: api.location });
  }

  local['Trading Routes'] = apiLinks;
  local.Location = api.location;
}

console.log('=== 差分サマリ ===');
console.log(`順序のみ変更: ${orderOnlyDiffs.length}件`);
console.log(`隣接集合が変化: ${setChangedDiffs.length}件`);
console.log(`座標が変化: ${locationDiffs.length}件`);

if (setChangedDiffs.length > 0) {
  console.log('\n--- 隣接集合が変化した領地 ---');
  for (const d of setChangedDiffs) {
    console.log(`${d.name}`);
    console.log(`  変更前: ${JSON.stringify(d.before)}`);
    console.log(`  変更後: ${JSON.stringify(d.after)}`);
  }
}

if (locationDiffs.length > 0) {
  console.log('\n--- 座標が変化した領地 ---');
  for (const d of locationDiffs) {
    console.log(`${d.name}`);
    console.log(`  変更前: ${JSON.stringify(d.before)}`);
    console.log(`  変更後: ${JSON.stringify(d.after)}`);
  }
}

if (dryRun) {
  console.log('\n--dry-run のため territories.json は書き換えていません。');
  process.exit(0);
}

let output = JSON.stringify(territoriesData, null, 2);
// 元ファイルの慣習に合わせ、座標ペア（Location.start/end等の数値2要素配列）はインライン表記に戻す。
// JSON.stringify(..., 2) は配列を必ず複数行に展開するため、そのままでは差分が無駄に膨らむ。
output = output.replace(/\[\r?\n\s*(-?\d+),\r?\n\s*(-?\d+)\r?\n\s*\]/g, '[$1, $2]');
if (hasCRLF) output = output.replace(/\n/g, '\r\n');
if (hasBOM) output = '﻿' + output;

fs.writeFileSync(TERRITORIES_PATH, output, 'utf8');
console.log('\nterritories.json を上書き保存しました。');
