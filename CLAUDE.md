# Wynncraft Guild War Economy Simulator

WynncraftのGuild Warにおける領地管理（Economy/Eco）をブラウザ上でシミュレートするツール。

## ファイル構成

```
eco-simulator/
├── index.html          # HTML構造
├── style.css           # スタイル
├── script.js           # ロジック全体
├── territories.json    # 全437領地のデータ（Location, Trading Routes, resources）
├── main-map.png        # マップ画像（4608×6644px）※手動配置が必要
└── CLAUDE.md           # このファイル（.gitignore対象）
```

## 起動方法

**ローカルサーバーが必須**（`fetch()` でJSONと画像を読み込むため、`file://` では動かない）。

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```

ブラウザで `http://localhost:8080` を開く。

---

## 定数（script.js 先頭）

| 定数 | 内容 |
|---|---|
| `MAP_CONFIG` | マップ画像サイズ・ゲーム座標範囲 |
| `DEFENSE_LEVEL_STATS` | Defenseレベル0〜11ごとのHP/DPS/攻撃速度 |
| `DEFENSE_COST_TABLE` | Defenseレベルごとのコスト（/hr） |
| `DEFENSE_TYPES` | damage / attack / health / defense の4種とそれぞれの消費リソース |
| `BONUS_CONFIG` | ボーナス17種のリソース・最大レベル・コスト・効果テキスト |
| `TREASURY_BASE_PCTS` | Treasuryバフの距離別基本パーセンテージ |
| `TREASURY_LEVEL_MULT` | TreasuryレベルごとのBAFED乗数 |

## 座標系

- ゲーム座標 → 画像ピクセル → キャンバス画面座標 の2段変換
- Y軸反転あり（ゲームのY負の大きい値 = 南 = 画像の下）
- 変換式: `pixel = game + offset`（offset X=+2560, Y=+6632）

---

## 主要な状態変数（script.js）

| 変数 | 型 | 内容 |
|---|---|---|
| `territories` | `{}` | territories.jsonの全437領地データ |
| `addedTerritories` | `{}` | 登録済み領地 `name → { defense, bonuses, hq }` |
| `selectedTerritories` | `Set` | マップ上でクリック選択された未登録領地 |
| `listSelectedTerritories` | `Set` | Managerリストで選択された登録済み領地（一括編集用） |
| `tributeValues` | `{}` | 外部資源流入/流出量 `{ emeralds, ore, crops, fish, wood }` |
| `treasuryLevel` | `string` | Guild Treasuryレベル（Very Low〜Very High） |
| `_hqDistanceCache` | `{}|null` | HQからの距離BFSキャッシュ（refreshUI時に無効化） |
| `currentModalMode` | `string` | `'single'` または `'bulk'` |
| `currentBulkTerritories` | `[]` | 一括編集対象の領地名配列 |

---

## 主要な関数（script.js）

| 関数 | 役割 |
|---|---|
| `init()` | territories.json読み込み・マップ画像ロード・URLハッシュ復元・初期描画 |
| `draw()` | キャンバス全体の再描画（マップ→接続線→領地） |
| `drawConnections()` | 全Trading Route接続線を描画（黒・高不透明度） |
| `drawTerritories()` | 全領地の矩形・アウトライン・名前を描画 |
| `hitTest(cx, cy)` | 登録済み領地のみのクリック判定 |
| `hitTestAll(cx, cy)` | 全領地（登録済み優先）のクリック/ホバー判定 |
| `handleClick(cx, cy)` | 登録済み→モーダル、未登録→選択トグル |
| `calcTerritoryProduction(name)` | Rate・Efficient・Treasuryバフ適用後の生産量 |
| `calcTerritoryConsumption(name)` | Defense + ボーナスコストの合計 |
| `calcOverallBalance()` | 全領地の生産/消費合計（Tribute含まず） |
| `calcTerritoryDefenseStats(name)` | HP・DPS・Rating等の防衛スタッツ計算 |
| `getHQDistances()` | HQからの全領地BFS距離（キャッシュ付き） |
| `calcTreasuryBuff(name, hqDist)` | 距離とTreasuryレベルから生産バフ率を返す |
| `updateOverview()` | Overviewパネル更新（Tribute込みのNet表示） |
| `updateTerritoryList()` | Managerリスト更新（list-selected状態を反映） |
| `refreshUI()` | `_hqDistanceCache`無効化 → Overview/リスト/描画を更新 |
| `openModal(name, bulkNames?)` | 領地設定モーダルを開く（bulkNames指定で一括編集モード） |
| `saveModal()` | single/bulkモードを判定して保存 |
| `closeModal()` | モーダルを閉じてモードをsingleにリセット |
| `updateModalStats()` | モーダルのプレビュー統計を更新（bulkは簡易表示） |
| `openTributeModal()` | Tributeモーダルを開いて入力フォームを生成 |
| `saveTributes()` | tributeValuesを保存してOverviewを更新 |
| `toggleListSelection(name)` | Managerリストの領地選択をトグル |
| `selectAll()` | 登録済み全領地をlistSelectedに追加 |
| `selectNone()` | listSelectedをクリア |
| `editSelected()` | 1つなら`openModal(name)`、複数なら`openModal(name, bulkNames)` |
| `copyShareLink()` | 現在の設定をURLハッシュにエンコードしてクリップボードにコピー |
| `loadFromHash()` | URLハッシュから設定を復元（init内で呼ばれる） |
| `loadGuilds()` | Wynncraft APIからギルド一覧を取得してdatalistに反映 |
| `addSelectedTerritories()` | マップ選択中の未登録領地を一括登録 |

---

## ゲームメカニクス

### Defense
- 4種（Damage / Attack Speed / Health / Defense）それぞれ独立してLv0〜11
- 各種の消費リソース: Damage=ore, Attack=crops, Health=wood, Defense=fish
- コストは `DEFENSE_COST_TABLE[level]` /hr（累積ではなく現レベルのコストのみ）

### Bonus
- 17種、各種ごとに最大レベルが異なる
- コストはレベルNに設定されたコスト（`/hr`）のみを消費（累積加算ではない）

### 生産計算
- 基本生産量は `territories.json` の `resources` フィールド
- Efficient Emeralds・Emerald Rate・Efficient Resources・Resource RateのボーナスLvに応じて乗算
- さらに **Treasuryバフ** を乗算（全リソース共通）

### Treasury
- HQからのBFS距離に応じてバフ率が変わる
- 距離0〜2: 10%, 距離3: 8.5%, 距離4: 7%, 距離5: 5.5%, 距離6+: 4%（Lowの場合）
- Medium = Low×2, High = Low×2.5, Very High = Low×3

### Tributes
- 外部（他ギルドからの献上等）の資源流入/流出を `/hr` 単位で設定
- Overviewの Net = 生産 - 消費 + Tribute として計算・表示
- `tributeValues` に保存し、Share Linkにも含まれる

---

## UI構成

### OVERVIEWパネル（左上）
- 各リソースの生産/消費/Tribute込みのNet収支をプログレスバーつきで表示
- 💰ボタン → Tributeモーダル
- 🔗ボタン → Share Link生成・クリップボードコピー

### TERRITORY MANAGERパネル（右上）
- **Add Specified Territory**: テキスト入力+datalistで検索して単体登録
- **Add from Guild**: Guild名入力+datalistで選択してAPIから一括登録
- **Selected on Map**: マップ上でクリック選択した未登録領地の数を表示。"Add Selected Territories"ボタンで一括登録
- **Guild Treasury**: Very Low〜Very Highのセレクト
- **Added Territories**: 登録済み領地リスト
  - クリックで青ハイライト選択（複数可）
  - Select All / Select None / Edit Selected / Clear All ボタン
  - Edit Selected: 1つなら通常モーダル、複数なら一括編集モーダル（HQなし）

### モーダル
- **単体モード**: Defense(4種×Lv0〜11) + HQ設定 + Bonus(17種) + リアルタイムプレビュー
- **一括モード**: 選択領地数を表示、Defense + Bonus のみ編集、保存で全選択領地に適用

### マップ操作
- 未登録領地クリック → 選択トグル（青アウトライン）
- 登録済み領地クリック → モーダルを開く
- ドラッグ: パン、ホイール: ズーム、タッチ: ピンチズーム対応

---

## Share Link仕様

- URLハッシュ形式: `http://localhost:8080/#s=<base64>`
- エンコード内容: `{ v:1, tl:treasuryLevel, tr:tributeValues, t:[{n,hq,d,b},...] }`
  - ゼロ値のDefense/Bonusは省略してコンパクト化
- 読み込みは `init()` 内の `loadFromHash()` で実行

---

## 外部API

- `https://corsproxy.io/?https://api.wynncraft.com/v3/guild/list/territory`
  - レスポンス形式: `{ [territoryName]: { guild: { name, prefix, uuid } } }`
  - APIが使えない場合はプレースホルダーにエラー表示してグレースフルデグラデーション

---

## コミュニケーションガイドライン
- 日本語で回答すること。
- 必ず使用者の指示に従うこと。指示外の行動はしない、ないしは必ず確認を取る。
- 断片的にコードを出すのではなく、修正が必要な箇所が入っている関数あるいはファイル全体を常に提示すること。
- 使用者の言っていることの意図がわかりにくい場合、必ず確認を取ること。
- 常に軽量化を意識したコードを書くこと。
- できないことはできないと正直に答えること。
- 推論は避け、必ず事実に基づいて回答すること。
- 適当なことを言わないこと。
- 回答に自信がない場合は、その旨を明記すること。
- コードの整合性を必ず保つこと。
