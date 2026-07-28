# Wynncraft Guild War Economy Simulator

WynncraftのGuild Warにおける領地管理（Economy/Eco）をブラウザ上でシミュレートするツール。

## ファイル構成

```
eco-simulator/
├── index.html          # HTML構造
├── style.css           # スタイル
├── script.js           # ロジック全体
├── territories.json    # 全437領地のデータ（Location, Trading Routes, resources）
├── territory-ids.json  # 共有リンク用の固定領地ID配列（末尾追記のみ・詳細は下記警告参照）
├── main-map.png        # マップ画像（4608×6644px）※手動配置が必要
├── assets/icons/others/disconnected.png  # 非接続❌アイコン（16px四方）※手動配置が必要
└── CLAUDE.md           # このファイル（.gitignore対象）
```

**マップ画像のタイル分割は意図的に実装していない。** iPhone Safariでは`main-map.png`が約3060万ピクセルあり、ブラウザのデコード上限を超えるため間引きされて画質が落ちることがある（読み込みのたびに結果が変わる）。根本対応にはタイル分割＋低解像度の全体画像＋LRU管理が必要でコストが見合わないため、スマホ版はPC版の下位互換という割り切りで対応していない。

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
- canvasは`devicePixelRatio`対応済み。`draw()`冒頭で`setTransform(dpr,...)`を行い、以降はCSSピクセル座標系で描画する。`clampPan()`は`window.innerWidth/innerHeight`を基準にする。
- `draw()`でマップ画像を描画する際、`scale >= 1`では`imageSmoothingEnabled = false`、`scale < 1`では`true`に切り替える。

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
| `_hqPathCache` | `{}|null` | HQからの距離と経路のキャッシュ（refreshUI時に無効化） |
| `_fullDistCache` | `{}|null` | HQからの距離を全437領地対象でBFSした結果のキャッシュ（refreshUI時に無効化） |
| `currentModalMode` | `string` | `'single'` または `'bulk'` |
| `currentBulkTerritories` | `[]` | 一括編集対象の領地名配列 |
| `customConnections` | `[]` | ユーザー追加の接続線 `{a, b}` の配列。両端とも登録済みのときのみ有効 |
| `TERRITORY_IDS` | `[]` | 共有リンク用の固定領地ID配列（index → name、`territory-ids.json`読み込み） |
| `TERRITORY_ID_MAP` | `{}` | `TERRITORY_IDS`の逆引き（name → index） |
| `resourceOverrides` | `{}` | 領地ごとの生産資源オーバーライド `name → { tier, resources, double }`。登録済み（`addedTerritories`に存在）のときのみ有効。無効でも保持し、再登録で自動復活 |
| `filterMode` | `string` | マップオーバーレイのモード（`'none'\|'defense'\|'treasury'\|'resource'`）。表示状態にすぎないため共有リンクには含めない |
| `filterToggles` | `{}` | モードごとのカテゴリON/OFF状態。初期値はすべて`true`。モード切替時も保持される。共有リンクには含めない |

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
| `getHQPaths()` | HQからの距離＋最短経路を返す（登録済み領地のみ経由・キャッシュ付き） |
| `isConnectedToHQ(name)` | 領地がHQから到達可能かを判定（HQ未設定時は登録済み全領地でtrue） |
| `getAllNeighbors(name)` | 全接続を返す（基本ルート＋`customConnections`の全要素、無効なカスタム接続線も含む）。HQのConnections/Externalsのカウント、Treasuryバフの距離計算にのみ使用する |
| `getFullGraphDistances()` | HQからの距離を全437領地対象でBFS（`getAllNeighbors()`経由）。HQ未設定時は`{}`を返す。`_fullDistCache`にキャッシュ |
| `autoAssignHQ()` | 登録領地が0件の状態から追加された場合のみ、仮HQ時のEHPが最大の領地をHQに自動設定 |
| `getNeighbors(name)` | 基本ルート＋有効な追加接続線を合わせた隣接領地一覧を返す |
| `openCustomSettings()` | Custom Settingsモーダルを開く（画面1: 項目一覧） |
| `addCustomConnection()` | 入力された2領地の接続線をバリデーション後`customConnections`に追加 |
| `removeCustomConnection(a, b)` | 指定した接続線を`customConnections`から削除 |
| `clearAllCustomConnections()` | 確認ダイアログの上で`customConnections`を全削除 |
| `calcTraversingResources()` | 各領地を通過する資源量（HQと自領地分を除く中間ノード通過量）を返す（キャッシュ付き） |
| `switchModalTab(tab)` | モーダルのSettings/Dataタブを切り替える |
| `toggleMobileSheet(panelId)` | 幅640px以下でOutput/Managerパネルをボトムシートとして開閉する |
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
| `copyShareLink()` | 現在の設定を`#p=`形式（不可なら`#s=`）でURLハッシュにエンコードしてクリップボードにコピー |
| `loadFromHash()` | URLハッシュから設定を復元（`#p=`/`#s=`/`#c=`の全形式に対応、init内で呼ばれる） |
| `buildShareBits()` / `parseShareBits(bytes)` | `#p=`形式のビット列を組み立て／解析する（`BitWriter`/`BitReader`使用） |
| `loadGuilds()` | Wynncraft APIからギルド一覧を取得してdatalistに反映 |
| `addSelectedTerritories()` | マップ選択中の未登録領地を一括登録 |
| `getTerritoryResources(name)` | オーバーライド適用後の実効資源を返す。**資源を読む処理はすべてこれを経由すること** |
| `addResourceOverride()` | 入力内容をバリデーション後`resourceOverrides`に追加・上書き |
| `removeResourceOverride(name)` | 指定した領地のオーバーライドを`resourceOverrides`から削除 |
| `clearAllResourceOverrides()` | 確認ダイアログの上で`resourceOverrides`を全削除 |
| `getFilterCategories(name)` | 登録済み領地のカテゴリ一覧を返す（判定対象は登録済みのみ、未登録は常に`[]`）。defenseはrating、treasuryは設定値、resourceはCity/Ore/Wood/Fish/Crops/Rainbowを判定 |
| `openFilterModal()` / `closeFilterModal()` | Filterモーダルの開閉 |
| `setFilterMode(mode)` | `filterMode`を切り替えて`refreshUI()` |
| `toggleFilterValue(mode, key)` | 指定モードの指定カテゴリのON/OFFをトグルして`refreshUI()` |
| `clearFilter()` | `filterMode`を`'none'`に戻す（トグル状態はリセットしない） |

---

## ゲームメカニクス

### Defense
- 4種（Damage / Attack Speed / Health / Defense）それぞれ独立してLv0〜11
- 各種の消費リソース: Damage=ore, Attack=crops, Health=wood, Defense=fish
- コストは `DEFENSE_COST_TABLE[level]` /hr（累積ではなく現レベルのコストのみ）
- **HQの難易度表示は通常領地の一段階上（Very Highで頭打ち）。表示ラベルのみ変化し、ステータス計算は変わらない**
- **HQのConnections / Externalsのカウントも、全437領地を経由するBFSで行う。** 途中の領地を他ギルドに奪われていても、3ホップ以内に自ギルドの領地があればExternalにカウントされる（ゲーム内の挙動に準拠）。通常領地のConnectionsは直接隣接のみなので影響を受けない。

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
- **Treasuryバフの距離は、全437領地（＋すべてのカスタム接続線）を経由するBFSで算出する。** 途中の領地を保有していなくてもバフは維持される（ゲーム内の挙動に準拠）。したがってHQが設定されていれば、非接続領地であってもTreasuryバフは付く。
- HQ未設定時は0を返す

### 経由範囲の使い分け

| 用途 | 経由できる領地 |
|---|---|
| HQのConnections / Externals、Treasuryバフの距離 | 全437領地 ＋ すべてのカスタム接続線 |
| Trading Routes / Trade Time / traversing / 非接続判定 / Overviewの集計 | 登録済み領地のみ |

### Connections
- 接続線は `territories.json` の基本ルートに加え、ユーザーが追加した接続線（有効なもののみ）を含む。取得は必ず `getNeighbors(name)` 経由で統一する。
- 描画色は基本ルート＝黒、有効な追加線＝マゼンタ、無効な追加線＝薄いマゼンタ。**すべての接続線と領地矩形には、本体より2px太い縁取りを本体の下に描く（接続線は白系`rgba(255,255,255,0.5)`、領地矩形は黒系`rgba(0,0,0,0.6)`。縁取りは常に実線）。**

### Traversing Resources
- 各領地を通過する資源量。HQと自領地分を除いた、経路上の中間ノードとしての通過量（生産分＋消費分）。HQは常に0。
- Trade Timeは1ホップ＝1分。**最短経路が複数ある場合は、経路全体の辞書順が最大のもの（アルファベット降順・Z→A）を採用する。比較は素のコードユニット比較で行い、`localeCompare`は使わない。** それ以外の表示順（リスト・datalist・自動HQの同値判定）は従来どおり`localeCompare('en')`の昇順を使う。この同着処理の妥当性・限界については後述の「経路計算の既知の限界」を参照。

### 経路計算の既知の限界

本シミュレーターは「HQからの最短経路木」で経路を表現している。同着時はアルファベット降順で1本に決めるため、ある分岐点で選ばれた側に、その先の全領地の資源が流れる。

一方、ゲーム内の実挙動を検証した結果、以下が確認されている。

- **同じ分岐点でも、行き先によって経由する側が異なる**（例: HQ = Nodguj Nation で、Regular Island は Icy Island 経由、Ahmsord は Dujgon Nation 経由）。これは木構造では原理的に再現できない。
- 単一のアルファベット順ルールでは一致しないケースが複数あり、法則は特定できていない。名前の昇順・降順、`territories.json` の並び順、接続数、座標、面積、産出資源、名前の長さ、単語数、およびそれらを第1キーとする二段階ルールを総当たりで検証したが、観測された分岐の一部としか一致しなかった。
- 行き先ごとの割り当ては均等ではなく、**偏りの度合いはケースによって大きく異なる**（ほぼ半々の例もあれば、20:1 程度の例もある）。このため「全ての最短経路に均等配分する」モデルも採用できない。
- 生産物をHQへ送る経路と、HQから供給を受ける経路が異なる場合も確認されている（例外的で、常にそうなるわけではない）。
- **traversingの誤差は、都市領地がどちらの分岐を経由するかでほぼ決まる。** 都市の返送分（分単位で概算6,000 Emerald相当）が、他の生産ブースト消費（数百〜1,300 Emerald相当）を大きく上回るため。都市以外の領地による誤差は相対的に軽微。

法則を特定するには各分岐について後続の全領地の経路を個別に観測する必要があり、検証コストが見合わないため、**現状は未解明のまま木モデルで近似している。**

対応案として、都市領地のみ経由先を手動指定できる機能（誤差の主要因が都市に集中しているため、都市だけ直せば十分に精度が上がる）を検討したが、指定すべき正解を観測できる状況が現状では無いため、**実装は見送っている。** 将来ゲーム内で都市領地のtraversingを再度観測できた場合に着手する。

### Tributes
- 外部（他ギルドからの献上等）の資源流入/流出を `/hr` 単位で設定
- Overviewの Net = 生産 - 消費 + Tribute として計算・表示
- `tributeValues` に保存し、Share Linkにも含まれる

### 生産資源のプリセット

`territories.json` の全437領地を集計した結果、実在するパターンは以下の5種類のみ。

| パターン | 内容 | 実在件数 |
|---|---|---|
| 通常 | emeralds 9,000 ＋ 資源1種 3,600 | 379 |
| ダブル | emeralds 9,000 ＋ 資源1種 7,200 | 13 |
| 2種同時 | emeralds 9,000 ＋ 資源2種 各3,600 | 1（Maltic Coast） |
| City | emeralds 18,000 ＋ 資源1種 3,600 | 22 |
| Rainbow | emeralds 1,800 ＋ 全5資源 各900 | 22 |

**City は資源タイプではなく「エメラルドの段」である。** Resource Editor の UI は「エメラルド段」と「資源」の2軸で構成する。資源は最大2種まで選択可能。**Rainbow は他の設定（資源・Double）と併用不可**（選択すると資源・Amountが無効化される）。

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
  - Select All / Select None / Edit Selected / Reset Selected / Clear All ボタン
  - 並び順は`HQ`→`到達可能な領地`→`到達不能な領地`の3グループ。各グループ内では**Defense と Bonus のレベル値の総和（重み付けなしの単純な合計）の降順**、同値の場合は領地名の`localeCompare('en')`昇順。到達不能な領地は❌アイコンのみを表示し、生産資源のアイコンは表示しない。
  - `Select All`: 登録済み領地をすべてリスト選択する（Map Filter中は**表示中の領地のみ**）
  - **`Select None`: リスト選択とマップ上の青ハイライトの両方を解除する**
  - **`Reset Selected`: リスト選択中の領地のアップグレードをリセットする（確認ダイアログあり）。選択状態には干渉しない**
  - `Clear All`: 登録済み領地をすべて削除する（確認ダイアログあり）。**Map Filter中は表示中の領地のみを削除する（HQは対象外）。確認ダイアログの文言も`Remove N filtered territories?`に変わる**
  - Edit Selected: 1つなら通常モーダル、複数なら一括編集モーダル（HQなし）
  - **Map Filter中はリストが該当領地のみになる（HQは常に表示）。カウント表示は`表示中 / 総数`の形式（例: `Added Territories (12 / 47)`）**

### モーダル
- 右上にSettings/Dataのタブ切り替えボタンを持つ（表示条件: `currentModalMode === 'single'` かつ HQ設定済みの場合のみ。それ以外はボタン自体を非表示にしSettingsタブ固定）。開くときは常にSettingsタブから開始する。
- **Settingsタブ（単体モード）**: Defense(4種×Lv0〜11) + HQ設定 + Bonus(17種) + リアルタイムプレビュー
- **Settingsタブ（一括モード）**: 選択領地数を表示、Defense + Bonus のみ編集、保存で全選択領地に適用
- **Dataタブ**: Trading Routes（HQからの経路・Trade Time）とResources（生産量・stored・traversing）を表示する読み取り専用タブ。Settingsタブと同系統の見た目に揃えている。**Minecraftiaは使わない**（body既定のSegoe UI）。**マップ上の領地名描画のMinecraftiaは維持している。** セクション見出しは箱の外に置き、`.data-section-label`（`.modal-section label`と同スタイル。`text-transform: uppercase`により大文字表示になる）。Trading Routesの箱は`#modal-stats`と同じ（`#0f172a`／枠線なし）、Resourcesの箱はツールチップと同じ（`#000000`／`2px solid #2C075F`）。**2つの箱でスタイルが異なるのは意図的。**
- `.upgrade-container` には `user-select: none` / `-webkit-touch-callout: none` を指定している。指定しないとiOS Safariで長押し時にネイティブのテキスト選択UIが割り込み、自前のツールチップが表示されなくなるため。**モーダル全体には指定しないこと**（他の箇所のテキストがコピーできなくなるため）。

### CUSTOM SETTINGSモーダル（左下ボタン）
- 画面左下固定の `⚙ Custom Settings` ボタンから開く。
- 名称の由来: Tributesはゲーム内に存在する機能、接続線の追加・生産資源の変更はゲーム内に存在しない機能であるため、両者を混ぜず、**ゲーム内に存在しない設定であることが名前から分かるようにしている**。Tributesは Guild Output パネルの 💰 ボタンに残している。
- 画面1（項目一覧）: `Connection Editor` と `Resource Editor` の2項目。将来項目追加を想定しループで生成。
- 画面2（Connection Editor）: `+ Add New Line` でインライン入力フォームを展開し、2領地間の接続線を追加。追加済み接続線は `a ↔ b` 形式でリスト表示し、無効な接続（片方未登録）はグレーアウト。`Clear All Lines` で全削除（確認ダイアログあり）。接続リストの各項目は`#0f172a`背景＋`1px solid #334155`の枠線を持つ箱として表示する（モーダル背景と同色になって項目の境界が見えなくなるのを避けるため）。
- Connection Editorの2つの入力欄は、クリック時に`showPicker()`で候補を表示する。ただし「登録済み領地が0件」「datalistが空」「画面幅640px以下」のいずれかに該当する場合は呼ばない。未対応ブラウザでの例外は`try`/`catch`で握りつぶし、`<datalist>`の標準挙動にフォールバックする。
- 画面3（Resource Editor）: Connection Editorと同じ構造・スタイルで実装。`+ Add Override` でインライン入力フォームを展開し、領地名（登録済みのみ、input+datalist）・エメラルド段（Normal/City/Rainbowのラジオ）・資源（Ore/Wood/Fish/Cropsのチェックボックス、最大2つ）・Amount（Normal/Doubleのラジオ）を設定して追加する。Rainbow選択時は資源・Amountを無効化し、資源を2つ選択している間はAmountをNormal固定で無効化・残りのチェックボックスも無効化する。追加済みオーバーライドは `Detlas → City + Ore 3,600` の形式でリスト表示し、対象領地が未登録のものはグレーアウト。`Clear All Overrides` で全削除（確認ダイアログあり）。領地名入力欄もConnection Editorと同じ`showPicker()`仕様。

### FILTERモーダル（右下ボタン／モバイルはタブバー）
- 画面右下固定の `Filter` ボタン（`#custom-settings-btn`と同スタイル）から開く。**`filterMode !== 'none'`のときは背景を`#334155`にしてハイライトする。** 幅640px以下では非表示になり、モバイルタブバーの`Filter`タブから開く（ボトムシートではなくモーダル）。
- モードは `None` / `Defense` / `Treasury` / `Resource` の4択（ラジオ）。`None`のときはカテゴリのチェックボックス群を非表示にする。
- 各モードのカテゴリトグル（初期値すべてON、モード切替後も保持）:
  - Defense / Treasury: Very Low〜Very Highの5段階
  - Resource: Ore / Wood / Fish / Crops / Rainbow / City の6種
- `Clear Filter` は `filterMode` を `'none'` に戻す（トグルの状態はリセットしない）。モード・トグルの変更は即座にマップとリストへ反映する（`refreshUI()`）。
- **配色**（`showTooltip()`の`ratingColor`と同じ値をDefenseで流用）:
  | モード | 配色 |
  |---|---|
  | Defense | Very Low `#00AA00` / Low `#55FF55` / Medium `#FFFF55` / High `#FF5555` / Very High `#AA0000` |
  | Treasury | Very Low `#00AA00` / Low `#55FF55` / Medium `#FFFF55` / High `#00FF00` / Very High `#55FFFF`（LowとHighが近い色だがゲーム内の文字色に合わせた意図的な指定） |
  | Resource | City `#55FF55` / Ore `#FFFFFF` / Wood `#FFAA00` / Fish `#55FFFF` / Crops `#FFFF55` / Rainbow はOre→Wood→Fish→Cropsの4色で4分割 |
- **該当領地**: ONになっているカテゴリで矩形を斜め分割塗り（不透明度0.45、ホバー時0.6）。Rainbowトグルが有効かつ該当する場合は個別資源トグルの状態にかかわらず常に4色分割になる。アウトラインは通常時と同じ配色・線幅（オーバーレイの影響を受けない）。
- **非該当領地（登録済み）**: 通常時と同じ描画（塗り・アウトライン・縁取り）に`globalAlpha = 0.35`を掛けるのみ。色は変更しない。
- **未登録領地**: 通常どおり描画する（暗くしない。マップ選択中の未登録領地も同様）。
- 判定対象は登録済み領地のみ（`getFilterCategories(name)`）。ヒットテストはフィルターの影響を受けず、暗い領地もクリックすればモーダルが開く。
- 接続線の色もフィルター中は差し替える（縁取りは省略）: 基本ルート`rgba(0,0,0,0.35)` / 有効な追加線`rgba(236,72,153,0.35)` / 無効な追加線`rgba(236,72,153,0.15)`。

### datalistの共通仕様
入力値が候補と完全一致している場合、その入力欄のdatalistを空にする。`<datalist>`の標準挙動では完全一致していても候補が1件表示され続け、操作の邪魔になるため。対象はConnection Editorの2つの入力欄、Resource Editorの入力欄、Add Specified Territory、Add From On-map Guildの計5箇所。

### 資源オーバーライドの表示
- **有効な資源オーバーライド（`resourceOverrides`に存在し、かつ登録済み）を持つ領地は、名前の直後に`*`を付ける。** 対象はTerritory Managerのリスト、ツールチップのタイトル、領地モーダルのタイトルの3箇所。`*`は領地名の直後、括弧の前に置く（`Detlas(Conn)*`ではなく`Detlas*(Conn)`）。無効なオーバーライドしか持たない領地には付けない。マップ上の描画には何も追加しない。

### ツールチップ
- 領地ツールチップのタイトルにはHQからの関係を付記する（HQ自身＝`(HQ)`、距離1＝`(Conn)`、距離2〜3＝`(Ext)`、距離4以上・到達不能・HQ未設定＝付記なし）。距離1はExternalにも該当するが`(Conn)`のみを表示する。`Conn`と略記を統一するため`External`ではなく`Ext`を用いる。領地名と括弧の間にスペースは入れない。Territory Managerのリストとモーダルのタイトルには表示しない。
- Upgradeアイコンはホバー（PC）／長押し500ms（スマホ）で**アップグレード名のみ**のツールチップを表示する。ブラウザ標準の`title`は使わない。長押しでツールチップが出た場合、レベル変更の`<select>`は開かない。

### マップ操作
- **配色**: 登録済み＝シアン`#22d3ee`、HQ＝黄`#fbbf24`（線幅2倍）、非接続＝赤`#ef4444`の破線、未登録＝半透明の白。**地図に存在しない色を使うことと、色以外の手がかり（破線・線幅・縁取り）を併用することを原則とする**（赤緑色覚でも区別できるようにするため）。
- 未登録領地クリック → 選択トグル（青アウトライン）
- 登録済み領地クリック → モーダルを開く
- ドラッグ: パン、ホイール: ズーム
- タッチ: 1本指ドラッグ＝パン、2本指＝ピンチズーム、タップ＝クリック相当、長押し500ms＝ツールチップ（登録済み領地のみ・指を離すと消える）。ブラウザ標準のダブルタップズーム／ピンチズームは無効化済み。

### レスポンシブ
- 幅640px以下ではGuild Output / Territory Manager のパネルを画面下部のボトムシート、Custom SettingsとFilterはモーダルのまま、タブバー（`Output / Manager / Filter / ⚙` の4タブ）から開閉する。初期状態は閉じた状態でマップ全画面表示。

---

## Share Link仕様

- **生成は常に新形式 `#p=<base64url>`（ビットパック＋deflate-raw圧縮、現在version 5）で行う。** `CompressionStream`が使えない環境、または`territory-ids.json`が読み込めていない場合のみ、旧形式`#s=`（非圧縮base64 JSON、`getShareState()`のv3形式）にフォールバックする。
- 旧形式 `#s=`（v1/v2/v3）と `#c=`（v3, deflate圧縮JSON）の**読み込みは読み込み専用として維持**する（`loadFromHash()`内に分岐が残る）。
- **`#p=`のv4は読み込み専用として互換を維持する**（資源オーバーライドが空の状態として読む）。生成は常にv5。
- `#p=`形式のビットレイアウト（MSBファースト、8bit境界まで0パディング後にdeflate-raw圧縮）:
  - ヘッダ: version(4bit, 現在5固定) + territoryCount(12bit)
  - 領地ブロック×territoryCount: id(9bit, `TERRITORY_ID_MAP`参照) + hq(1bit) + treasury(3bit) + defenseFlag(1bit)[+damage/attack/health/defense各4bit] + bonusFlag(1bit)[+bonusBitmap 17bit + 該当ビット数分のbonusLevel各4bit]
  - 追加接続線ブロック: connCount(10bit) + (a: 9bit, b: 9bit) × connCount（有効・無効を問わず`customConnections`全件、IDが存在しないものはスキップ）
  - Tributeブロック: tributeBitmap(5bit, emeralds/ore/crops/fish/wood順) + (sign 1bit, magnitude 24bit) × 立っているビット数
  - 資源オーバーライドブロック（v5で追加）: overrideCount(10bit) + [id(9bit) + tier(2bit, 0=通常/1=City/2=Rainbow) + resourceMap(4bit, ore/wood/fish/cropsの順) + doubleFlag(1bit)] × overrideCount。1件16bit固定。**無効なオーバーライド（対象領地が未登録）も保存する。** `tier===2`（Rainbow）の場合`resourceMap`と`doubleFlag`は0を書き込み、復元時も無視する。生成時に`TERRITORY_ID_MAP`に存在しない領地はスキップし`console.warn`、復元時に`id`が範囲外またはterritoriesに存在しない場合はその要素をスキップする。
- 読み込みは `init()` 内の `loadFromHash()` で実行。`#p=`のデコードは `parseShareBits()`、エンコードは `buildShareBits()`（`BitWriter`/`BitReader`使用）。復元後は`_hqPathCache`・`_traversingCache`・`_fullDistCache`を無効化し`refreshUI()`を呼ぶ（`autoAssignHQ()`は呼ばない）。

### 警告（変更時は必ず確認すること）
- **`territory-ids.json` は末尾追記のみ。既存要素の並び替え・削除・挿入は禁止**（配列インデックスがそのまま共有リンクのIDになるため、順序を変えると過去の共有リンクが全て壊れる）。
- **`BONUS_CONFIG` の配列順序も共有リンクのIDとして使われる。今後の変更は末尾への追加のみとし、既存要素の並び替え・削除を行わないこと。**
- **資源オーバーライドの`tier`と`resourceMap`のビット割り当ても共有リンクの一部である。値の意味を変更する場合は`version`を上げること。**
- 領地IDは9bit固定のため、`territory-ids.json`が512件を超えると`#p=`形式は破綻する。その場合は`version`を上げ、IDのビット数を拡張した新形式を追加すること。

---

## アイコンの方針

**❌のみ画像化済み**（`assets/icons/others/disconnected.png`、16px四方、読み込み失敗時は`<img>`のみ非表示にし行は残す）。💰 / ⚙ / 🔗 / 💾はゲーム内に対応するアイコンが存在せず、画像化すると何のボタンか分からなくなりUXが下がるため、絵文字のまま維持する。

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
