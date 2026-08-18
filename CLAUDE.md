# Wynncraft Guild War Economy Simulator

WynncraftのGuild Warにおける領地管理（Economy/Eco）をブラウザ上でシミュレートするツール。

## ファイル構成

```
eco-simulator/
├── index.html          # HTML構造
├── style.css           # スタイル
├── script.js           # UIと状態管理（eco-logic.jsをimportして使う）
├── eco-logic.js         # DOM非依存の純粋ロジック（定数・Treasury/生産/守備ステータス計算・BFSグラフ探索）
├── phase-worker.js      # Liveモードのグローバル転送位相f探索をメインスレッドから切り離すWeb Worker
├── territories.json    # 全437領地のデータ（Location, Trading Routes, resources）
├── territory-ids.json  # 共有リンク用の固定領地ID配列（末尾追記のみ・詳細は下記警告参照）
├── main-map.png        # マップ画像（4608×6644px）※手動配置が必要
├── assets/icons/others/disconnected.png  # 非接続❌アイコン（16px四方）※手動配置が必要
└── CLAUDE.md           # このファイル（.gitignore対象）
```

**今後、計算式（Treasury バフ・生産量・守備ステータス・BFSグラフ探索）を変更する場合は`eco-logic.js`側を編集すること。`script.js`はUIと状態管理のみを担う。** `eco-logic.js`はグローバル変数を持たず、必要な状態（`territories`/`addedTerritories`/`customConnections`/`resourceOverrides`）はすべて引数で受け取る純関数のみで構成されている。DOM・`fetch`・`localStorage`は一切参照しない。`script.js`側は同名の関数（`getNeighbors`/`getFullGraphDistances`/`getHQPaths`/`calcTreasuryBuff`/`getTerritoryResources`/`calcTerritoryProduction`/`calcTerritoryConsumption`/`calcTerritoryDefenseStats`等）を薄いラッパーとして保持し、グローバル状態の受け渡しとキャッシュ（`_hqPathCache`/`_fullDistCache`）のみを担当する。

**`index.html`の`<script>`タグは`type="module"`で読み込んでいる。** そのため`script.js`内のトップレベル関数はグローバルスコープに自動で出ない。`index.html`の`onclick`属性および`script.js`が生成する動的HTMLの`onclick`/`onchange`属性から呼ばれる関数は、`script.js`末尾の`Object.assign(window, {...})`で明示的にグローバル公開している。新しくonclick等から呼ぶ関数を追加した場合は、この公開リストにも追加すること。

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

## 定数

`script.js`先頭で`eco-logic.js`からimportして使う。`MAP_CONFIG`のみ`script.js`固有（マップ描画専用のためeco-logic.jsには置いていない）。

| 定数 | 定義場所 | 内容 |
|---|---|---|
| `MAP_CONFIG` | script.js | マップ画像サイズ・ゲーム座標範囲 |
| `DEFENSE_LEVEL_STATS` | eco-logic.js | Defenseレベル0〜11ごとのHP/DPS/攻撃速度 |
| `DEFENSE_COST_TABLE` | eco-logic.js | Defenseレベルごとのコスト（/hr） |
| `DEFENSE_TYPES` | eco-logic.js | damage / attack / health / defense の4種とそれぞれの消費リソース |
| `BONUS_CONFIG` | eco-logic.js | ボーナス17種のリソース・最大レベル・コスト・効果テキスト |
| `TREASURY_BASE_PCTS` | eco-logic.js | Treasuryバフの距離別基本パーセンテージ |
| `TREASURY_LEVEL_MULT` | eco-logic.js | TreasuryレベルごとのBAFED乗数 |
| `RESOURCES` | eco-logic.js | リソースID一覧（`emeralds`/`ore`/`crops`/`fish`/`wood`） |

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
| `liveMode` | `boolean` | LiveモードのON/OFF。共有リンクには含めない（ページを開き直せばOFFに戻る） |
| `liveData` | `{}\|null` | 直近取得した`/v3/guild/list/territory`のレスポンス（生の形のまま） |
| `guildColorMap` | `{}` | `prefix → "#RRGGBB"`。Liveモードを ON にした時の1回のみ取得 |
| `liveTooltipPinnedName` | `string\|null` | Liveモード・スマホでタップにより固定表示中の領地名。次のタップ（別の場所 or 同じ領地）まで表示し続ける |
| `_globalTransferPhase` | `number\|null` | 守備ステータス推定のグローバル転送位相f。Liveデータ取得のたびに`phase-worker.js`（Web Worker）で再計算する |

**Live モードは「表示レイヤー」であり、シミュレーションの状態（`addedTerritories`等）は一切書き換えない。** 書き換えるのは「Import This Guild」によるギルド取り込み操作のみ。

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
| `handleClick(cx, cy, isTouch?)` | 登録済み→モーダル、未登録→選択トグル。Liveモード中はこれらを行わず、`isTouch`のときのみ`handleLiveTap()`に委譲する |
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
| `onLiveModeToggle()` | Live Modeチェックボックスのon/offを処理。ONでギルドカラー取得＋ポーリング開始＋マップ選択クリア、OFFでポーリング停止＋`liveData`クリア＋Web Worker終了 |
| `fetchLiveTerritoryData()` | `/v3/guild/list/territory`を取得し`liveData`を更新、`computeGlobalTransferPhase()`を`await`する。失敗時は直前のデータを保持したままエラー表示（`updateLiveBadge()`） |
| `fetchGuildColors()` | ギルドカラーを取得して`guildColorMap`を更新（Liveモード ON 時の1回のみ呼ばれる） |
| `getGuildColor(prefix)` | `guildColorMap`からカラーコードを返す（未取得/不明時は`#FFFFFF`） |
| `startLivePolling()` / `stopLivePollingTimer()` | 30秒間隔のポーリングを開始/停止（`_livePollTimer`） |
| `renderLiveDataScreen()` | Custom SettingsのLive Data画面の`Enable Live Mode`チェックボックスの状態を同期する |
| `drawTerritoriesLive()` | Liveモード時のマップ描画（`draw()`から`drawTerritories()`の代わりに呼ばれる） |
| `getFilterCategoriesLive(name)` | Liveモード時のMap Filter判定（全437領地が対象、実データの`defences`/`treasury`/`resources`を使う） |
| `showLiveTooltip(mx, my, name, above)` | Liveモード時のツールチップ内容を構築（実データ＋確定できるボーナス＋推定値を表示） |
| `isTooltipTarget(name)` | ホバー/長押しでツールチップを表示すべき対象かを判定（通常時は登録済み領地、Liveモード時は`liveData`を持つ領地） |
| `ratingColor(rating)` | Very Low〜Very Highの難易度ラベルに対応する文字色を返す（showTooltip/showLiveTooltipで共有） |
| `detectStorageLevel(limit, isHQ, isEmerald)` | `resources[].limit`からLarger Emerald/Resource Storageのレベルを一意に確定する |
| `detectRateBonusCombo(generation, baseGeneration, treasuryBuff, isEmerald)` | 生産量の倍率からEfficient×Rate系ボーナスの組み合わせを逆算する（複数候補が残る場合はその旨を返す） |
| `getDefenseEstimate(name, info, defenceLabel, confirmedExtra, resourceSnapshot)` | Liveモードの守備ステータス推定のオーケストレーション。`EcoLogic.estimateDefenseStats()`を呼び出し、領地ごとにキャッシュする（キャッシュキーには`_globalTransferPhase`を含む） |
| `computeGlobalTransferPhase()` | 全437領地のstoredから、グローバル転送位相fを求める。`phase-worker.js`（Web Worker）に処理を委譲し、結果を`_globalTransferPhase`にキャッシュする非同期関数。**Worker生成失敗・Worker内エラー・10秒タイムアウトのいずれの場合も`_globalTransferPhase`を`null`にしてresolveする**（推定セクションのみ非表示になり、Liveモード自体は継続する）。調査用に取得時刻・f・転送残り秒数・カバレッジを`console.log`で出力する（UIには出さない） |
| `getPhaseWorker()` / `stopPhaseWorker()` | `phase-worker.js`のWeb Workerインスタンスを使い回す/破棄する（Liveモード ON中は1つだけ生成し、OFFで終了する）。**`getPhaseWorker()`は生成に失敗した場合`null`を返す**（module worker非対応環境等） |
| `getOwnedNamesForGuild(guildUuid)` | `liveData`から指定ギルドが所有する全領地名のSetを返す（`addedTerritories`の代わりに使う） |
| `renderDefenseEstimateHTML(estimate)` | 推定結果（Damage/Attack/Health/Defense単一値・EHP/DPS単一値・転送までの残り秒数）のHTMLを構築する。`levels`が`null`の場合は空文字列を返す |
| `fmtHeldDuration(acquiredStr)` | `acquired`からの経過時間を`3d 14h`形式で返す |
| `getLiveResourceFlags(info)` | マップ上の資源アイコン描画用。`resources[].generation`（emeraldsは`baseGeneration`）から産出中の資源・Cityを判定する |
| `handleLiveTap(cx, cy, hit)` | Liveモード・スマホのタップ処理。`liveTooltipPinnedName`をトグルしてツールチップの固定表示を切り替える |
| `updateLiveBadge()` | `#live-badge`の表示切り替え。データ取得に失敗している間だけエラー色（`.error`クラス）にする |
| `computeLiveConfirmedInfo(name, info, bfsCache?)` | 実データから確定できるボーナス（ストレージレベル・Efficient/Rate系の組み合わせ）を算出する共通処理。showLiveTooltip/getDefenseEstimate/importLiveGuild/computeGlobalTransferPhaseで共有する。`bfsCache`を渡すと同じギルドHQからのBFS距離を使い回す |
| `updateLiveGuildOptions()` | `liveData`からギルド一覧を再構築し、Import This Guild用のdatalistを更新する |
| `importLiveGuild()` | Liveデータを使って指定ギルドの全領地を`addedTerritories`へ取り込む。取り込み後はLiveモードを自動OFFにする |

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

### 守備ステータスの推定（Liveモード専用）

**`defences`レーティングだけでは個別のDefenseレベルが一切絞れない。** difficultyは4レベルの単純な合計（`difficulty = Damage + Attack + Health + Defense + (TowerAura>0 ? TowerAura+5 : 0) + (TowerVolley>0 ? TowerVolley+3 : 0)`、HQはレーティングを算出後に1段階上げる）であるため、全組み合わせ331,776通り（12⁴ × Aura 4 × Volley 4）中、**VERY_LOW=132、LOW=19,808、MEDIUM=136,058、HIGH=172,476、VERY_HIGH=3,302通り**が該当し、各レベルは0〜11の全域を取りうる。レーティング単独では絞り込みの主役にならない。

**正しいモデル: ゲーム内では毎分1回、資源が隣接領地へ1ホップ移動する。** territoryは転送時に1分ぶんの維持費を受け取り、次の転送までの60秒で消費する。同時に、自前の生産分は毎秒たまり続け、次の転送でまとめて送出される（余剰も次の転送でHQ方向へ返送されるため蓄積しない）。転送からの経過秒をt（0≤t<60）、`f = (1 − t/60) / 60` と置くと、資源rについて次が成り立つ（実データで相対誤差0.05%を確認済み）。

```
stored[r] = consumption[r] × f + generation[r] × (1/60 − f)
             ← 維持費の残り        ← 自前の生産でたまった分
```

**fはゲーム全体で共通の「転送位相」であり、推定は単一スナップショットで完結し、履歴を必要としない。**

**生産している資源も同じ式で拘束に使える。** 上の式を`consumption[r]`について解くと `consumption[r] = ( stored[r] − generation[r] × (1/60 − f) ) / f` となり、生産の有無にかかわらず消費量が逆算できる。`generation === 0`（その資源を生産していない）の場合は補正項が0になり、単純な比例関係 `stored[r] = consumption[r] × f` に一致する（後方互換）。以前の実装は`generation===0`の資源だけを拘束に使い、生産している資源を丸ごと無拘束（0〜11の全域）として捨てていた。特にRainbow領地（4資源すべてを生産）ではこの制限で実質まったく推定できていなかったため、この修正で拘束に使える情報量が大きく増えている。

**APIの`generation`はTreasuryバフ適用後の実際の生産速度である。別途バフを掛け直さないこと**（検証済み: Apprentice Hutsの`generation 9720 ÷ 基礎9000 = 1.08`はTreasury Medium・HQ距離6以上の8%と一致する）。

**補正後の値が負になる資源は拘束に使わない。** その資源だけを除外し（無拘束＝0〜11の全域として扱う）、残りの資源で推定を続ける。残差計算・妥当性チェックからも除外する（負の値を無理に拘束・検算に使うと、他の資源から得られた候補まで巻き添えで無効化されてしまうため）。全資源が除外された領地のみ、推定不可（`levels: null`）として扱う。

**Step 1: グローバル位相fの探索（`EcoLogic.estimateGlobalTransferPhase()`）**

difficulty/ratingの一致はfを両側から拘束できる唯一の絶対的制約である（消費量テーブルは100〜22800と228倍の幅があり、残差の最小化だけではfを1つに定められない。どんなfでも「たまたま比が近い」候補がどこかに見つかってしまうため）。そこで目的関数は**「レーティング制約と比例モデルの両方を許容誤差内（資源ごとstored±1.5相当）で同時に満たす候補が1件以上存在する領地の数（カバレッジ）を最大化するf」**を採用する（同カバレッジの場合は残差合計が小さいほうを採る）。stored の大小によるフィルタ・重み付け・対象領地数の上限は設けない（該当する全領地を使う）。カバレッジが0（＝許容誤差内の候補が1件も無い場合）でもfをnullにはせず、評価した中で残差合計が最小のfにフォールバックする。

候補の列挙は「全列挙してフィルタ」ではなく**「fから逆算」**で行う。生産分を補正した `consumption[r] ≈ ( stored[r] − generation[r]×(1/60−f) ) / f` が直接求まり、`DEFENSE_COST_TABLE`から近い値を引けばレベルが絞れる（wood→Health、fish→Defense、ore→Damage+Tower Volley、crops→Attack+Tower Aura）。4系統は互いに独立なので、系統ごとに許容誤差内のレベル（の組）を求めてから直積を取り、最後にrating一致でフィルタする。これにより1領地あたりの候補数が331,776通りから数十〜数百通りに減る。fの探索自体も、粗探索（60分割）→その近傍を細探索（40分割）の2段グリッドで完結させる（600分割の全域探索はしない）。

**1回のLiveデータ取得につき1回だけ、Web Worker（`phase-worker.js`）で実行する。** 実測で437領地・約400件の所有領地に対し約650〜780ms（メインスレッドをブロックしない設計にした上での処理時間）。全列挙ベースの素朴な実装では15秒以上かかっていたため、上記の逆算方式と2段グリッドで約20倍高速化した。**Worker生成失敗・Worker内エラー・10秒タイムアウトのいずれの場合も`_globalTransferPhase`を`null`にする。** 推定は付加機能であるため、これが失敗してもLiveモードのマップ表示・ツールチップの実データ部分は通常どおり動作する（推定セクションのみ非表示になる）。

**Step 2: 領地ごとの候補決定（`EcoLogic.estimateDefenseStats()`）**

**Step 1と同じ`deriveTerritoryCandidates()`（fから逆算する候補生成）を使う。候補の生成方法を2箇所に持たない。** 得られた候補に対して妥当性チェック（個別に係数を当てはめた場合の「転送までの残り時間」が0〜60秒の範囲外になる候補、消費量と補正後storedの符号が一致しない候補を除外）を適用し、正規化残差（`Σ(stored[r]−predicted[r])² / Σstored[r]²`、`predicted[r] = consumption[r]×f + generation[r]×(1/60−f)`）が最小の1件を選ぶ。**範囲ではなく単一値を返す。** 候補が0件なら`levels: null`を返す。

**転送までの残り秒数は `3600 × f`。** `f = (1 − t/60) / 60` の定義上、`t = 60 × (1 − 60f)` は転送からの**経過**秒であり、残り時間ではない（転送直後 `t=0, f=1/60` のとき経過秒の式は0を返すが、正しい残り時間は60秒）。

**推定はホバー/長押し/タップでツールチップを表示した領地についてのみオンデマンドで実行し、結果を領地ごとにキャッシュする（`_defenseEstimateCache`）。** キャッシュキーは`defences`・確定済みボーナス構成（`confirmedExtra`）・グローバル位相`f`の組み合わせで、いずれかが変化したときのみ再計算する。全437領地に対して定期実行はしない。

**実データでの検証結果（2026-08時点）**: 8回・約5分間の実ポーリングで、レーティングが分散する5領地（VERY_HIGH/HIGH/MEDIUM）すべてでDamage/Attack/Health/Defenseの推定値が全ポーリングを通じて完全に収束（1つの値に固定）することを確認した。fそのものも同期間で完全に安定していた（**資源の更新間隔が転送周期と同じ60秒であるため、30秒間隔のポーリングでは同じデータを2回ずつ読むことになり、fが一定値になるのが正しい挙動である**）。

**守備ステータス推定の既知の限界**: `stored`は整数であるため、1単位が表す消費量は`1/f`になる。`f`は転送位相によって決まり、転送直後は`1/60`（1単位=消費量60）だが、転送直前には0に近づいて分解能が発散する。`DEFENSE_COST_TABLE`の低レベル側の間隔は100/200/300と小さいため、`f`が小さいスナップショットでは**Lv.0とLv.1がどちらも`stored=0`になり、原理的に区別できない。** Lv.2〜4も1・2・4としか差が出ないため、±1の誤差で1〜2段ずれる。

実測例（`f = 0.003556`）: Lv.0→0 / Lv.1→0 / Lv.2→1 / Lv.3→2 / Lv.4→4 / Lv.10→68 / Lv.11→81

APIは`resources`を60秒ごとに更新し、ゲームの転送周期も60秒であるため、原則として毎回同じ位相のデータしか得られない。**低守備領地の推定精度は、観測できる位相に完全に依存する。**

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

### 守備ステータス推定

`defences`レーティングは4つのDefenseレベルの単純な合計から決まるため、レーティング単独では個別レベルが絞れない（HIGHの場合172,476通り）。

絞り込みには**`stored`の比**を使う。資源は毎分1回転送され、維持費は1分ぶんが一括で届いて次の転送までに消費される。同時に自前の生産分も次の転送でまとめて送出されるため、資源rについて

```
stored[r] = consumption[r] × f + generation[r] × (1/60 − f)       f = (1 − t/60) / 60
```

が成り立ち、`f`は**ゲーム全体で共通の位相**である。**生産している資源も同じ式で拘束に使える**（`generation===0`なら補正項が0になり従来の比例式と一致）。レーティング制約と比例モデルを同時に満たす候補が存在する領地数（カバレッジ）が最大になる`f`を探索したうえで、領地ごとに残差最小の候補を選ぶことで、**個別レベルが単一値として確定する。** Step 1（f探索）・Step 2（領地ごとの候補決定）は同じ候補生成ロジック（`deriveTerritoryCandidates()`）を使う。

**推定は単一スナップショットで完結し、履歴を必要としない。** グローバル位相の探索はメインスレッドをブロックしないよう`phase-worker.js`（Web Worker）で実行する。Worker生成失敗・例外・タイムアウト時は`_globalTransferPhase`を`null`にして推定セクションのみ非表示にする（Liveモード自体は継続する）。

転送までの残り秒数は`3600 × f`。詳細（既知の限界を含む）は「守備ステータスの推定（Liveモード専用）」の節を参照。

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

### Live モード

**Live モード中はマップ・Map Filter・ツールチップが実データに切り替わる。`addedTerritories` ベースの描画は一切行わない。** Liveモードは表示レイヤーであり、シミュレーション状態を触る操作（領地の選択・モーダル編集）はすべて無効化する。

- マップ描画（`drawTerritoriesLive()`）: 所有ギルドのカラー（`guildColorMap`、`getGuildColor(prefix)`）で塗り・枠線を描く。無所属は白。`hq: true` の領地には既存のHQアイコンを表示する。マップ選択（`selectedTerritories`）のハイライトは維持する。**HQ以外の所有領地にも、領地名の上に生産資源のアイコンを表示する**（`getLiveResourceFlags(info)`。判定は`resources[].generation`（0より大きいものを産出していると判定）、Cityのみ`EMERALD`の`baseGeneration`（18,000以上）を使う。アイコンの種類・配置（Rainbow時の2x2グリッド等）は既存のシミュレーションモードと同じ）。
- Map Filter（`getFilterCategoriesLive(name)`）: 判定対象は全437領地。`defense`は実データの`defences`、`treasury`は実データの`treasury`、`resource`は`resources[].generation`（0より大きいものを産出していると判定）と`EMERALD`の`baseGeneration`（18,000以上をCityと判定）を使う。配色・斜め分割塗り・非該当領地の不透明度0.35は既存仕様のまま。判定対象外（無所属）の領地は暗くしない。
- ツールチップ（`showLiveTooltip()`）: 実データ（所有ギルド・生産量・貯蔵量・Treasury・Defence）を表示する。`(Conn)`/`(Ext)`の判定は、そのギルドの`guild.hq`領地を起点に全437領地グラフをBFSした距離を使う（`EcoLogic.bfsDistancesFrom(guildHqName, territories, [])`。**customConnectionsは含めない**——ユーザーが追加した接続線はシミュレーション専用の設定であり、実データの表示には反映しないため）。無所属の領地は`Unclaimed`とだけ表示する。ホバー/長押しでのツールチップ表示対象も、Liveモード中は「`liveData`を持つ領地すべて」に切り替わる（`isTooltipTarget(name)`）。表示内容の詳細は「ツールチップ」節を参照。
- **操作の無効化**: Liveモード ON のとき、領地のクリック／タップによる選択・モーダル表示（`handleClick()`）はすべて無効化する。`selectedTerritories`はLiveモードに入った時点でクリアし、`Add Selected Territories`ボタンも無効化する（`disabled`）。OFFに戻すとすべて従来どおりに復帰する。`addedTerritories`自体はLiveモード中も保持する。
- **スマホでのツールチップ表示**: Liveモード ON のときのみ、領地を**タップ（短押し）**しただけでツールチップを表示する（`handleLiveTap()`、`liveTooltipPinnedName`で固定表示中の領地を管理）。Liveモードでは領地をタップして設定を編集する機能が無いため、タップをツールチップ表示に割り当てても問題ない。**表示されたツールチップは、次にマップの別の場所をタップするか、同じ領地を再度タップするまで表示し続ける**（指を離しても消えない。パン中も維持する）。表示位置は既存の長押しツールチップと同じロジック。Liveモード OFF のときは従来どおり（500ms長押しで表示、指を離すと消える）。

**確定できるアップグレード（一意に確定するもの。個別レベルの範囲推定は別節「守備ステータスの推定」を参照）**

- ストレージ系（`Larger Emerald/Resource Storage`）: `resources[].limit`から一意に確定する（`detectStorageLevel()`）。

  | レベル | エメラルド（非HQ） | 資源（非HQ） | エメラルド（HQ） | 資源（HQ） |
  |---|---|---|---|---|
  | 0 | 3,000 | 300 | 5,000 | 1,500 |
  | 1 | 6,000 | 600 | 10,000 | 3,000 |
  | 2 | 12,000 | 1,200 | 20,000 | 6,000 |
  | 3 | 24,000 | 2,400 | 40,000 | 12,000 |
  | 4 | 45,000 | 4,500 | 75,000 | 22,500 |
  | 5 | 102,000 | 10,200 | 170,000 | 51,000 |
  | 6 | 240,000 | 24,000 | 400,000 | 120,000 |

- 生産系ボーナス（`Efficient Emeralds`×`Emerald Rate`、`Efficient Resources`×`Resource Rate`）: `倍率 = generation ÷ (baseGeneration × (1 + Treasuryバフ))`から逆算する（`detectRateBonusCombo()`）。**倍率から組み合わせが一意に決まる場合と、複数候補が残る場合がある**（`×2.0`/`×3.0`/`×4.0`等のキリのいい倍率は複数候補）。一意なら`Efficient Emeralds Lv.n` / `Emerald Rate Lv.n`のように組み合わせを表示し、複数候補なら`Resources ×4.0 (multiple combinations)`のように倍率のみを表示する。
- **基礎生成量は`resources[].baseGeneration`を使う。** 実測（2026-08時点）でAPIレスポンスに存在することを確認済み。値が欠けている場合のみ`territories.json`の基礎生成量にフォールバックする。

---

## UI構成

デスクトップ表示では、両パネル（Overview / Territory Manager）の`max-height`は下部固定ボタン（Custom Settings / Filter）との衝突を避けるため`calc(100vh - 88px)`にしている（内訳: 上余白12px + 下部ボタン約40px + 余白24px + 下余白12px）。`@media (max-width: 640px)`内のボトムシートには適用しない（`bottom: 48px`でタブバーの上に出るため衝突しない）。

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
- 画面1（項目一覧）: `Connection Editor` / `Resource Editor` / `Live Data` の3項目。将来項目追加を想定しループで生成。
- 画面2（Connection Editor）: `+ Add New Line` でインライン入力フォームを展開し、2領地間の接続線を追加。追加済み接続線は `a ↔ b` 形式でリスト表示し、無効な接続（片方未登録）はグレーアウト。`Clear All Lines` で全削除（確認ダイアログあり）。接続リストの各項目は`#0f172a`背景＋`1px solid #334155`の枠線を持つ箱として表示する（モーダル背景と同色になって項目の境界が見えなくなるのを避けるため）。
- Connection Editorの2つの入力欄は、クリック時に`showPicker()`で候補を表示する。ただし「登録済み領地が0件」「datalistが空」「画面幅640px以下」のいずれかに該当する場合は呼ばない。未対応ブラウザでの例外は`try`/`catch`で握りつぶし、`<datalist>`の標準挙動にフォールバックする。
- 画面3（Resource Editor）: Connection Editorと同じ構造・スタイルで実装。`+ Add Override` でインライン入力フォームを展開し、領地名（登録済みのみ、input+datalist）・エメラルド段（Normal/City/Rainbowのラジオ）・資源（Ore/Wood/Fish/Cropsのチェックボックス、最大2つ）・Amount（Normal/Doubleのラジオ）を設定して追加する。Rainbow選択時は資源・Amountを無効化し、資源を2つ選択している間はAmountをNormal固定で無効化・残りのチェックボックスも無効化する。追加済みオーバーライドは `Detlas → City + Ore 3,600` の形式でリスト表示し、対象領地が未登録のものはグレーアウト。`Clear All Overrides` で全削除（確認ダイアログあり）。領地名入力欄もConnection Editorと同じ`showPicker()`仕様。
- 画面4（Live Data）: `Enable Live Mode`チェックボックスと、ギルド取り込み（下記）の**2項目のみ**で構成する（`renderLiveDataScreen()`はチェックボックスの状態同期のみを行う）。**手動更新ボタン（Refresh Now）は設けない。** APIのキャッシュは10秒、`resources`の更新は1分間隔であり、30秒ごとの自動ポーリングが動いている以上、手動更新を押しても同じ内容が返るだけで意味がないため。**候補数・サンプル数などの内部指標もUIには表示しない**（仕組みを知らない利用者には意味が通じない、ゲーム内に存在しない概念であるため）。ONにするとギルドカラーを1回だけ取得し、30秒間隔のポーリングを開始する（`onLiveModeToggle()`）。**Liveモードが ON のときは、マップ上に常時「LIVE」バッジを表示する**（`#live-badge`、右下のFilterボタンの上・`position: fixed`）。モードに気づかず「自分の設定と違う」と混乱するのを防ぐため。バッジは通常時は緑、**データ取得に失敗している間だけ赤（`.error`クラス）に切り替える**（`updateLiveBadge()`）。ステータス欄は設けない。
  - **ギルド取り込み**: Guild名検索欄（input+datalist、`liveData`から取得できたギルド一覧を`updateLiveGuildOptions()`が都度再構築、`[prefix] name (領地数)`形式で表示）と`Import This Guild`ボタン（`importLiveGuild()`）を持つ。実行すると確認ダイアログ（`現在の登録済み領地をすべて置き換えます。よろしいですか？`）の上で`addedTerritories`を全置換し、そのギルドの全領地を登録する。`treasury`と`hq`は実データをそのまま設定するが、**`defense`は常にすべて0のまま登録し、推定値は一切入れない。** ユーザーが自分でDefenseを設定する方針とする（守備ステータスの推定値は単一値まで確定するようになったが、それでも「実測」ではなく「推定」であるため、シミュレーション状態には混ぜない）。生産ボーナス（Efficient Emeralds/Emerald Rate/Efficient Resources/Resource Rate/Larger Emerald Storage/Larger Resource Storage）は**一意に確定したものだけ**を設定し、複数候補が残るものは0のままとする（`computeLiveConfirmedInfo()`を再利用）。取り込み後はLiveモードを自動的にOFFにし（表示がLiveデータのままだと取り込んだ内容が確認できないため）、Custom Settingsモーダルを閉じて`refreshUI()`する。カスタム接続線・資源オーバーライドはクリアしない。共有リンクへの影響は無い（取り込み結果は通常の登録状態として扱われる）。

### FILTERモーダル（右下ボタン／モバイルはタブバー）
- 画面右下固定の `Filter` ボタン（`#custom-settings-btn`と同スタイル）から開く。**`filterMode !== 'none'`のときは背景を`#334155`にしてハイライトする。** 幅640px以下では非表示になり、モバイルタブバーの`Filter`タブから開く（ボトムシートではなくモーダル）。
- モードは `None` / `Defense` / `Treasury` / `Resource` の4択（ラジオ）。`None`のときはカテゴリのチェックボックス群を非表示にする。
- 各モードのカテゴリトグル（初期値すべてON、モード切替後も保持）:
  - Defense / Treasury: Very Low〜Very Highの5段階
  - Resource: Ore / Wood / Fish / Crops / Rainbow / City の6種
- `Clear Filter` は `filterMode` を `'none'` に戻す（トグルの状態はリセットしない）。モード・トグルの変更は即座にマップとリストへ反映する（`refreshUI()`）。
- **配色（`FILTER_COLORS`）は、ツールチップの難易度文字色（`ratingColor`）とは独立した定数である。** Very Lowはフィルターでは`#006600`、ツールチップでは`#00AA00`を使う。両者を共有しないこと。
  | モード | 配色 |
  |---|---|
  | Defense | Very Low `#006600` / Low `#55FF55` / Medium `#FFFF55` / High `#FF5555` / Very High `#AA0000` |
  | Treasury | Very Low `#006600` / Low `#55FF55` / Medium `#FFFF55` / High `#FF5555` / Very High `#55FFFF` |
  | Resource | City `#55FF55` / Ore `#FFFFFF` / Wood `#FFAA00` / Fish `#55FFFF` / Crops `#FFFF55` / Rainbow はOre→Wood→Fish→Cropsの4色で4分割 |

  Treasury の High は Defense の High と同じ赤（`#FF5555`）。変更前の緑（`#00FF00`）は Low の黄緑と判別できなかったため。
- **該当領地**: ONになっているカテゴリで矩形を斜め分割塗り（不透明度0.45、ホバー時0.6）。Rainbowトグルが有効かつ該当する場合は個別資源トグルの状態にかかわらず常に4色分割になる。アウトラインは通常時と同じ配色・線幅（オーバーレイの影響を受けない）。**分割塗りの各帯は面積が等しくなるように分割する。** x軸を等分してから斜めにずらす方式では、先頭の帯が`h·s/2`だけ大きく、末尾の帯が同じだけ小さくなり、正方形に近い領地の4分割では末尾の面積がゼロになる。累積面積が等しくなる位置を解析的に求めて境界とする（`drawSplitFill()`）。ずれ量の係数`0.5`は見た目の調整値。
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
- **`(Conn)` / `(Ext)` の判定には `getFullGraphDistances()`（全437領地グラフの距離）を使う。** HQのExternalカウントと同じ基準に揃えるため。したがって**HQから到達不能（`no pipeline`）な領地でも、全グラフ距離が2または3であれば`(Ext)`が表示される。**
- Upgradeアイコンはホバー（PC）／長押し500ms（スマホ）で**アップグレード名のみ**のツールチップを表示する。ブラウザ標準の`title`は使わない。長押しでツールチップが出た場合、レベル変更の`<select>`は開かない。
- Treasuryのバフ率は小数第1位まで表示するが、**小数第1位が0の場合は小数点以下を省略する**（`10.0%`ではなく`10%`）。ツールチップの`Treasury Bonus`と、領地モーダルSettingsタブの`Treasury Buff`の2箇所が対象（`fmtPct1()`を共有）。

**Liveモード時の表示（`showLiveTooltip()`）**

- ギルド名の下に保持期間（`acquired`からの経過時間、`3d 14h`形式、`fmtHeldDuration()`）を表示する。**文字色はその領地の現在のTreasury段階から動的に決める**（`HELD_TIME_COLORS`: VERY_LOW `#FF5555` / LOW `#FFAA00` / MEDIUM `#FFFF55` / HIGH `#55FF55` / VERY_HIGH `#55FFFF`）。
- 確定できるボーナス（ストレージレベル・Efficient/Rate系の組み合わせ）は、独立した見出しを設けず、**既存のシミュレーションモードと同じ`Upgrades:`の見出しの下**に表示する。表示形式も既存に合わせる（`- <名前> [Lv.<数値>]`）。**Lv.0のものは表示しない**（既存のシミュレーションモードのツールチップと同様）。複数候補が残る組み合わせ（`Resources ×4.0 (multiple combinations)`等）はLv表記なしのテキストのみで表示する。
- 守備ステータスの推定値は`Estimated Defense:` / `Estimated Stats:`の見出しの下に**単一値**で表示する（`- <名前> [Lv.<数値>]`形式。EHP/DPSは`fmt()`によるM/K表記）。**候補数・サンプル数などの内部指標は一切表示しない。** 推定できない場合（`levels`が`null`）はセクションごと表示しない。
- ツールチップの最下部に、灰色（`#555555`）で転送までの残り秒数を表示する（`Resources move in {n}s`）。他の項目とは1行空ける。推定できない場合は表示しない。

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
  - `loadGuilds()`（Add From On-map Guild用）と Live モード（`fetchLiveTerritoryData()`）の両方がこのURLを叩く。新しいエンドポイントではない。
  - レスポンス形式（実測、437領地全件）:
    ```json
    "Ragni": {
      "guild": { "uuid": "...", "name": "...", "prefix": "...", "hq": "<HQ領地名>" },
      "acquired": "2026-08-14T13:50:03.968000Z",
      "location": { "start": [x, y], "end": [x, y] },
      "hq": false,
      "resources": [
        { "type": "EMERALD", "generation": 9720, "baseGeneration": 9000, "stored": 64, "limit": 3000 },
        { "type": "ORE", "generation": 0, "baseGeneration": 3600, "stored": 5, "limit": 300 }
      ],
      "links": ["Monte's Village", "Iboju Village", "Troms Lake"],
      "treasury": "MEDIUM",
      "defences": "MEDIUM"
    }
    ```
  - `resources[].type`は`EMERALD`/`ORE`/`WOOD`/`FISH`/`CROP`。内部表現（`emeralds`/`ore`/`wood`/`fish`/`crops`）へは`LIVE_RESOURCE_TYPE_MAP`でマッピングする（特に`CROP`→`crops`に注意）。
  - **`resources[].baseGeneration`が実際のレスポンスに存在する（2026-08時点で確認済み）。** 領地固有の基礎生成量をこのフィールドから直接取得できる。
  - APIが使えない場合はプレースホルダー（`loadGuilds()`側）またはステータス表示（Liveモード側）にエラーを出し、グレースフルデグラデーションする。
- `https://corsproxy.io/?https://athena.wynntils.com/cache/get/guildList`
  - ギルドカラー取得用。Liveモードを ON にした時の1回のみ取得する（`fetchGuildColors()`。ポーリングのたびには叩かない）。
  - レスポンス形式: `[{ "_id": "...", "prefix": "SEQ", "color": "#RRGGBB" }, ...]`（配列、2700件超）。`color`が無い要素は`#FFFFFF`にフォールバックする（`getGuildColor()`）。
  - 取得に失敗した場合は全ギルドを`#FFFFFF`として続行する。

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
