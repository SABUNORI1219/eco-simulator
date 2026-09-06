// territories.json が API と整合しているかを検証する。
// 使い方: node scripts/verify-territories.mjs <api-response.json>
// 詳細仕様: CLAUDE.md「Trading Route探索アルゴリズム」参照

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TERRITORIES_PATH = path.join(__dirname, '..', 'territories.json');

const apiPathArg = process.argv[2];
if (!apiPathArg) {
  console.error('使い方: node scripts/verify-territories.mjs <api-response.json>');
  process.exit(1);
}

const apiData = JSON.parse(fs.readFileSync(apiPathArg, 'utf8'));
const territoriesText = fs.readFileSync(TERRITORIES_PATH, 'utf8').replace(/^﻿/, '');
const territoriesData = JSON.parse(territoriesText);

const apiKeys = Object.keys(apiData);
const localKeys = Object.keys(territoriesData);

let allOk = true;
function report(label, ok, diffs) {
  console.log(`[${ok ? 'OK' : 'NG'}] ${label}`);
  if (!ok) {
    allOk = false;
    for (const d of diffs.slice(0, 10)) console.log(`  - ${d}`);
    if (diffs.length > 10) console.log(`  ...ほか${diffs.length - 10}件`);
  }
}

// 1. 領地数が双方437である
report('領地数が双方437である', apiKeys.length === 437 && localKeys.length === 437,
  [`API: ${apiKeys.length}件, territories.json: ${localKeys.length}件`]);

// 2. キーの並び順が完全一致する
{
  const minLen = Math.min(apiKeys.length, localKeys.length);
  const diffs = [];
  for (let i = 0; i < minLen; i++) {
    if (apiKeys[i] !== localKeys[i]) diffs.push(`index ${i}: api="${apiKeys[i]}" local="${localKeys[i]}"`);
  }
  report('キーの並び順が完全一致する', diffs.length === 0, diffs);
}

// 3. 全437領地で Trading Routes === links（配列の順序を含む完全一致）
{
  const diffs = [];
  for (const name of localKeys) {
    if (!apiData[name]) continue;
    const local = territoriesData[name]['Trading Routes'] || [];
    const api = apiData[name].links || [];
    if (JSON.stringify(local) !== JSON.stringify(api)) {
      diffs.push(`${name}: local=${JSON.stringify(local)} api=${JSON.stringify(api)}`);
    }
  }
  report('全437領地で Trading Routes === links', diffs.length === 0, diffs);
}

// 4. 全437領地で Location === location
{
  const diffs = [];
  for (const name of localKeys) {
    if (!apiData[name]) continue;
    const local = territoriesData[name].Location;
    const api = apiData[name].location;
    if (JSON.stringify(local) !== JSON.stringify(api)) {
      diffs.push(`${name}: local=${JSON.stringify(local)} api=${JSON.stringify(api)}`);
    }
  }
  report('全437領地で Location === location', diffs.length === 0, diffs);
}

// 5. 隣接関係が対称である（A の links に B があれば B の links に A がある）
{
  const diffs = [];
  for (const name of localKeys) {
    const routes = territoriesData[name]['Trading Routes'] || [];
    for (const neighbor of routes) {
      const neighborRoutes = territoriesData[neighbor]?.['Trading Routes'];
      if (!neighborRoutes || !neighborRoutes.includes(name)) {
        diffs.push(`${name} -> ${neighbor} は非対称（${neighbor} の links に ${name} が無い）`);
      }
    }
  }
  report('隣接関係が対称である', diffs.length === 0, diffs);
}

console.log(allOk ? '\n全項目OK' : '\n一部NG項目あり');
process.exit(allOk ? 0 : 1);
