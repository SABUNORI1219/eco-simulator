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
├── dev-server.py        # ローカル開発用サーバー（キャッシュ無効化ヘッダー付与。詳細は「起動方法」参照）
├── main-map.png        # マップ画像（4608×6644px）※手動配置が必要
├── assets/icons/others/disconnected.png  # 非接続❌アイコン（16px四方）※手動配置が必要
└── CLAUDE.md           # このファイル（.gitignore対象）
```

**今後、計算式（Treasury バフ・生産量・守備ステータス・BFSグラフ探索）を変更する場合は`eco-logic.js`側を編集すること。`script.js`はUIと状態管理のみを担う。** `eco-logic.js`はグローバル変数を持たず、必要な状態（`territories`/`addedTerritories`/`customConnections`/`resourceOverrides`）はすべて引数で受け取る純関数のみで構成されている。DOM・`fetch`・`localStorage`は一切参照しない。`script.js`側は同名の関数（`getNeighbors`/`getFullGraphDistances`/`getHQPaths`/`calcTreasuryBuff`/`getTerritoryResources`/`calcTerritoryProduction`/`calcTerritoryConsumption`/`calcTerritoryDefenseStats`等）を薄いラッパーとして保持し、グローバル状態の受け渡しとキャッシュ（`_hqPathCache`/`_fullDistCache`）のみを担当する。

**`index.html`の`<script>`タグは`type="module"`で読み込んでいる。** そのため`script.js`内のトップレベル関数はグローバルスコープに自動で出ない。`index.html`の`onclick`属性および`script.js`が生成する動的HTMLの`onclick`/`onchange`属性から呼ばれる関数は、`script.js`末尾の`Object.assign(window, {...})`で明示的にグローバル公開している。新しくonclick等から呼ぶ関数を追加した場合は、この公開リストにも追加すること。

**マップ画像のタイル分割は意図的に実装していない。** iPhone Safariでは`main-map.png`が約3060万ピクセルあり、ブラウザのデコード上限を超えるため間引きされて画質が落ちることがある（読み込みのたびに結果が変わる）。根本対応にはタイル分割＋低解像度の全体画像＋LRU管理が必要でコストが見合わないため、スマホ版はPC版の下位互換という割り切りで対応していない。

## 起動方法

**ローカルサーバーが必須**（`fetch()` でJSONと画像を読み込むため、`file://` では動かない）。

**`python -m http.server` は使わないこと。** キャッシュ制御ヘッダーを一切送らないため、ブラウザが`script.js`等を古いまま使い続け、修正の動作確認結果を誤らせることがある（2026-08、ホバー関連の調査時に古いキャッシュを見ていた疑いが生じたため`dev-server.py`を追加した）。

```bash
python dev-server.py 8080
```

`dev-server.py`は`http.server`をラップし、全レスポンスに`Cache-Control: no-store`等を付与するローカル開発専用サーバー。ブラウザで `http://localhost:8080` を開く。

## 修正完了報告時のルール（2026-08追加）

**「直したはず」でコードを読んだだけの報告をしないこと。** バグ修正・機能追加を完了報告する前に、必ず以下を自分で実行してから報告すること。

1. ローカルサーバーをbashツール経由でバックグラウンド起動する（`python dev-server.py 8080`等。`python -m http.server`は使わないこと、理由は「起動方法」参照）。「再起動してください」で終わらせず、自分で起動すること。
2. `curl http://localhost:8080/index.html` 等で実際に200が返ることを確認する。
3. 修正内容がホバー・クリック等のブラウザ操作に関わる場合、コードを読んだだけで済ませず、実際に操作して確認する。Playwright等のヘッドレスブラウザが利用可能ならそれを使い、実際のDOMイベント（`page.mouse.move`等）を発火させて例外が出ないこと・期待した表示になることを確認する（`window.<関数名>`を直接呼ぶだけでは、`Object.assign(window, {...})`で公開されていないモジュールスコープ関数・変数の挙動は検証できないため不十分）。
4. **確認後もローカルサーバーは停止せず、起動したままにしておくこと（2026-08変更）。** 以前は確認後に自分で停止していたが、ユーザー自身が同じサーバーで手動確認・Liveモードでのログ収集等を続けて行うことがあるため、勝手に落とさない。片付けるのは自分が作業用に生成した一時ファイル（スクラッチパッド上のテストスクリプト等）のみとする。

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
| `_phaseSourceLiveData` | `{}\|null` | `_globalTransferPhase`の計算元になった`liveData`のスナップショット参照。`_globalTransferPhase`と必ず同時に更新する（2026-08導入）。守備ステータス推定は常に最新の`liveData`ではなくこちらを参照する（詳細は「守備ステータスの推定」内「Res Tickと表示されている資源量が噛み合わない」参照） |
| `_qualityCache` | `{}` | 推定結果の品質付きキャッシュ（Item 9、2026-08導入）。`name → CachedEstimate`。メモリ内・Liveモードのセッションスコープのみ（OFFでクリア）。詳細は「推定結果の品質付きキャッシュ保持」参照 |

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
| `fetchLiveTerritoryData()` | `/v3/guild/list/territory`を取得し`liveData`を更新、`computeGlobalTransferPhase()`を`await`した後`updateQualityCache()`→`refreshLiveTooltipIfOpen()`を呼ぶ。失敗時は直前のデータを保持したままエラー表示（`updateLiveBadge()`） |
| `fetchGuildColors()` | ギルドカラーを取得して`guildColorMap`を更新（Liveモード ON 時の1回のみ呼ばれる） |
| `getGuildColor(prefix)` | `guildColorMap`からカラーコードを返す（未取得/不明時は`#FFFFFF`） |
| `startLivePolling()` / `stopLivePollingTimer()` | 30秒間隔のポーリングを開始/停止（`_livePollTimer`） |
| `renderLiveDataScreen()` | Custom SettingsのLive Data画面の`Enable Live Mode`チェックボックスの状態を同期する |
| `drawTerritoriesLive()` | Liveモード時のマップ描画（`draw()`から`drawTerritories()`の代わりに呼ばれる） |
| `getFilterCategoriesLive(name)` | Liveモード時のMap Filter判定（全437領地が対象、実データの`defences`/`treasury`/`resources`を使う） |
| `showLiveTooltip(mx, my, name, above)` | Liveモード時のツールチップ内容を構築（実データ＋確定できるボーナス＋推定値を表示）。推定値は`_qualityCache`にTier A/Bのエントリがあればそれを優先表示し、無ければ現在ポーリングの生の推定（確定/簡易）を表示する。呼ばれるたびに引数を`_lastLiveTooltipArgs`に保持する |
| `refreshLiveTooltipIfOpen()` | 表示中のLiveツールチップ（`_lastLiveTooltipArgs`が非nullかつ`tooltip.style.display==='block'`）があれば、同じ引数で`showLiveTooltip()`を再実行し内容を現在のf/liveDataで再計算する。`fetchLiveTerritoryData()`が毎ポーリング呼ぶ（2026-08追加。マウスを動かさず同じ領地にホバーし続けた場合に表示が固定される問題の修正、詳細は「守備ステータスの推定」参照） |
| `isTooltipTarget(name)` | ホバー/長押しでツールチップを表示すべき対象かを判定（通常時は登録済み領地、Liveモード時は`liveData`を持つ領地） |
| `ratingColor(rating)` | Very Low〜Very Highの難易度ラベルに対応する文字色を返す（showTooltip/showLiveTooltipで共有） |
| `detectStorageLevel(limit, isHQ, isEmerald)` | `resources[].limit`からLarger Emerald/Resource Storageのレベルを一意に確定する |
| `detectRateBonusCombo(generation, baseGeneration, treasuryBuff, isEmerald)` | 生産量の倍率からEfficient×Rate系ボーナスの組み合わせを逆算する（複数候補が残る場合はその旨を返す） |
| `getDefenseEstimate(name)` | Liveモードの守備ステータス推定のオーケストレーション。**`liveData`ではなく`_phaseSourceLiveData`（`_globalTransferPhase`と同じラウンドのスナップショット）から`name`の情報を読み、内部で`computeLiveConfirmedInfo()`/`buildConfirmedExtraFromLiveInfo()`を呼び直す**（2026-08、fとstored/generationの由来ラウンドを一致させるための変更。詳細は「守備ステータスの推定」内「Res Tickと表示されている資源量が噛み合わない」参照）。`EcoLogic.estimateDefenseStats()`を呼び出し、領地ごとにキャッシュする（キャッシュキーは`_globalTransferPhase`の値、`_phaseSourceLiveData`と必ず同時に更新されるため）。対象領地が`_phaseSourceLiveData`に無い場合（Liveモード開始直後・直近捕獲でf探索対象外等）は`levels: null`の`EMPTY_ESTIMATE`を返す。戻り値には表示用に`mult`（`calcLiveDefenseMult`の倍率）も含める |
| `getDefenseEstimateApproximate(name)` | `getDefenseEstimate()`が`levels: null`を返したときのみ呼ばれるフォールバック。`getDefenseEstimate()`と同様に`_phaseSourceLiveData`からのみ算出する（2026-08）。`EcoLogic.estimateDefenseStatsApproximate()`を呼び出す。O(1)で軽量なためキャッシュしない。戻り値には表示用に`mult`も含める |
| `computeGlobalTransferPhase()` | 全437領地のstoredから、グローバル転送位相fを求める。`phase-worker.js`（Web Worker）に処理を委譲し、結果を`_globalTransferPhase`にキャッシュする非同期関数。関数冒頭で`liveDataForThisRound = liveData`をローカルに捕捉し、探索成功時（`finish()`内）に`_globalTransferPhase`と**同時に**`_phaseSourceLiveData = liveDataForThisRound`を更新する（2026-08追加。`setInterval`は前回呼び出しの完了を待たずに次のポーリングを開始しうるため、`liveData`はf探索中にも上書きされる。両者を同時更新することで、推定計算が常に同じラウンドのf・stored・generationを参照することを保証する）。**前回の探索が完了していない間（`_phaseWorkerBusy`）は新しいリクエストを投げずそのポーリング回をスキップする**（リクエストのキュー詰まり対策。このときは`_globalTransferPhase`・`_phaseSourceLiveData`とも前回値を保持する）。**失敗（Worker生成失敗・Worker内エラー・90秒タイムアウト）が5回連続するまでは`_globalTransferPhase`（および`_phaseSourceLiveData`）を前回値のまま保持する**（`_phaseFailureStreak`）。タイムアウト時は`stopPhaseWorker()`でWorkerを作り直す。調査用に取得時刻・f・転送残り秒数・カバレッジ・exactlyOneを`diagLog()`（後述「調査用診断ログの出力制御」参照）で出力し、固定10領地（`SAMPLE_TERRITORY_NAMES`）の推定値も`logSampleTerritoryEstimates()`で毎ポーリング出力する（いずれもUIには出さない・診断ログ有効時のみ・調査後削除予定） |
| `getPhaseWorker()` / `stopPhaseWorker()` | `phase-worker.js`のWeb Workerインスタンスを使い回す/破棄する（Liveモード ON中は1つだけ生成し、OFFで終了する）。**`getPhaseWorker()`は生成に失敗した場合`null`を返す**（module worker非対応環境等）。`stopPhaseWorker()`は`_phaseWorkerBusy`もfalseに戻す |
| `getOwnedNamesForGuild(guildUuid, dataset = liveData)` | 指定ギルドが所有する全領地名のSetを返す（`addedTerritories`の代わりに使う）。`dataset`省略時は常に最新の`liveData`（Import This Guild等リアルタイム性が必要な用途向け）。守備推定（`getDefenseEstimate()`等）は`_phaseSourceLiveData`を明示的に渡し、fと同じスナップショットで揃える（2026-08） |
| `defenseStatLine(icon, text, lv)` | Estimated Defence の1行分のHTMLを組み立てる共通ヘルパー（アイコン画像 + テキスト + 括弧内Lv数字）。`renderDefenseEstimateHTML`/`renderDefenseEstimateApproximateHTML`で共有する |
| `renderDefenseEstimateHTML(estimate, cacheMeta?)` | 推定結果（Damage/Attack Speed/HP/Defence%をアイコン付き1行ずつ・EHP/DPS単一値・転送までの残り秒数）のHTMLを構築する。`levels`が`null`の場合は空文字列を返す。`cacheMeta`（`{observedAt, tier}`、Item 9）を渡すと観測時刻とTier Aの旨を見出し直下に1行追加する |
| `updateQualityCache()` | 推定結果の品質付きキャッシュ（Item 9、`_qualityCache`）を更新する。`fetchLiveTerritoryData()`から`computeGlobalTransferPhase()`の直後に呼ばれる。まず既存エントリに`EcoLogic.shouldDiscardCache()`を適用して破棄する（**この破棄判定のみ最新の`liveData`を使う**。領地喪失・defences変化等を鮮度優先で検知するため）。次に`_phaseSourceLiveData`（fと同じスナップショット、2026-08）の全所有領地（直近10分以内に取得した領地は除く）について`EcoLogic.estimateDefenseStats()`・`EcoLogic.computeTerritoryEmeraldAdmissible()`・`EcoLogic.determineTier()`でTierを判定、Tier A/Bのみ`EcoLogic.computeQualityScore()`で品質を計算し`EcoLogic.shouldUpdateCache()`が`true`のときだけ`_qualityCache`を更新する。`cachedBefore.tier==='B'`から`tier==='A'`へ変わりかつ新しい品質のほうが低い更新は`[cache-diag]`として`diagLog()`に記録する（調査用・診断ログ有効時のみ、詳細は「低品質キャッシュがTier Bを上書きする件」「調査用診断ログの出力制御」参照） |
| `renderDefenseEstimateApproximateHTML(estimate)` | 簡易推定（フォールバック）のHTMLを構築する。見出し・箇条書きの色を確定推定（マゼンタ`#FF55FF`）とは異なるグレー系（`#8B96A3`）にして視覚的に区別し、末尾に英語の注記を付す。4スタッツとも決定不能な場合は空文字列を返し、個別に決定不能なスタッツは`?`で表示する |
| `fmtHeldDuration(acquiredStr)` | `acquired`からの経過時間を、桁に応じて段階的な形式（1分未満`XXs`／1時間未満`XXm XXs`／1日未満`XXh XXm`／それ以上`XXd XXh`）で返す |
| `recentlyCapturedElapsedMs(info)` | `acquired`から10分（`RECENTLY_CAPTURED_MS`）以内なら経過msを返す、それ以外は`null`。Liveモードのマップハイライトと`computeGlobalTransferPhase()`のグローバルf探索対象除外の両方で共有する |
| `getLiveResourceFlags(info)` | マップ上の資源アイコン描画用。`resources[].generation`（emeraldsは`baseGeneration`）から産出中の資源・Cityを判定する |
| `handleLiveTap(cx, cy, hit)` | Liveモード・スマホのタップ処理。`liveTooltipPinnedName`をトグルしてツールチップの固定表示を切り替える |
| `updateLiveBadge()` | `#live-badge`の表示切り替え。データ取得に失敗している間だけエラー色（`.error`クラス）にする |
| `computeLiveConfirmedInfo(name, info, bfsCache?)` | 実データから確定できるボーナス（ストレージレベル・Efficient/Rate系の組み合わせ）を算出する共通処理。showLiveTooltip/getDefenseEstimate/importLiveGuild/computeGlobalTransferPhaseで共有する。`bfsCache`を渡すと同じギルドHQからのBFS距離を使い回す。`resourceSnapshot[r]`（r=ore/crops/wood/fish）には`baseGeneration`も保持する（グローバルf探索のエメラルドveto判定＝Trio A検出に使う。2026-08追加） |
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

difficulty/ratingの一致はfを両側から拘束できる唯一の絶対的制約である（消費量テーブルは100〜22800と228倍の幅があり、残差の最小化だけではfを1つに定められない。どんなfでも「たまたま比が近い」候補がどこかに見つかってしまうため）。

**目的関数に「カバレッジ（候補が1件以上存在する領地数）の最大化」を使ってはならない。** 許容誤差はstored単位で固定（`PHASE_TOLERANCE_PER_RESOURCE`）だが、`DEFENSE_COST_TABLE`の候補間隔をconsumption空間に戻すとfに反比例して縮むため、fが小さいほど許容誤差window（`PHASE_TOLERANCE_PER_RESOURCE/f`）が広がり、無関係な候補まで大量に飲み込んでカバレッジを底上げしてしまう。カバレッジ最大化は「どのfがデータを最もよく説明するか」ではなく「どのfが緩いか」を測ってしまう（2026-08実施のPhase 5調査G・Hで実測確認済み。437領地の実データ・tol=1.5時点で、f=0.001111ではカバレッジが321と最大になる一方、候補数の平均は1,945件・「候補が正確に1件に絞れた領地数」= exactlyOneは0件だった。f=0.007500ではカバレッジは288に下がるが、候補数の平均は5〜15件・exactlyOneは70件と、実際の絞り込み度合いはこちらが大きく上回っていた）。

そこで目的関数は**「レーティング制約と比例モデルの両方を許容誤差内（資源ごとstored±`PHASE_TOLERANCE_PER_RESOURCE`相当）で同時に満たす候補が正確に1件に絞れる領地の数（exactlyOne）を最大化するf」**を採用する（同数の場合は残差合計が小さいほうを採る）。exactlyOneは候補0件の領地を自動的に除外するためfが大きすぎる場合は自然に不利になるが、念のため**カバレッジが全領地数の1/3を下回るfは候補から除外する**（ごく少数の領地だけでexactlyOneが偶然高くなるケースを避けるため）。該当するfが1つも無い場合はガード無しの全結果にフォールバックする。stored の大小によるフィルタ・重み付け・対象領地数の上限は設けない（該当する全領地を使う）。exactlyOneが0（＝候補が正確に1件に絞れる領地が1つも無い場合）でもfをnullにはせず、評価した中で残差合計が最小のfにフォールバックする。

**`PHASE_TOLERANCE_PER_RESOURCE`は3（2026-08実測により1.5から変更）。** storedは整数なので丸めだけで±0.5が生じ、さらにAPIの更新周期とゲームの転送周期の位相ずれ、および検出不能な非防衛ボーナスの未計上分が加わるため、1.5では狭すぎた。tolを1.5/3/5/10/20で比較した結果、**exactlyOneは102→120→53→9→7と3で明確なピークを持ち、3を超えると単調に崩壊する。** tol=3ではThesead/Rodorocの推定値が候補1件（Damage5/Attack4/Health5/Defense4）にクリーンに収束し、これは別途の実機観測（36分間のポーリング）で繰り返し得られた値と完全一致した。

候補の列挙は「全列挙してフィルタ」ではなく**「fから逆算」**で行う。生産分を補正した `consumption[r] ≈ ( stored[r] − generation[r]×(1/60−f) ) / f` が直接求まり、`DEFENSE_COST_TABLE`から近い値を引けばレベルが絞れる（wood→Health+Stronger Minions、fish→Defense+Tower Multi-Attacks、ore→Damage+Tower Volley、crops→Attack+Tower Aura）。**Stronger Minions・Tower Multi-Attacksはdifficultyに寄与しないためrating判定には使わないが、候補として列挙しないとwood/fishのconsumptionを過小評価し、confirmedExtraが支配的な領地で解決に失敗する（2026-08判明。詳細は「守備ステータス推定の既知の限界」参照）。** 4系統は互いに独立なので、系統ごとに許容誤差内のレベル（の組）を求めてから直積を取り、最後にrating一致でフィルタする。fの探索自体も、粗探索（60分割）→その近傍を細探索（40分割）の2段グリッドで完結させる（600分割の全域探索はしない）。

**1回のLiveデータ取得につき1回だけ、Web Worker（`phase-worker.js`）で実行する。** Stronger Minions/Tower Multi-Attacksの列挙追加により候補空間が増え、実測で約10〜40秒かかる（スナップショットの状態次第で変動。除外時にminions/multiをダミー値0に畳んで最適化済み）。

**Worker のリクエスト詰まり（2026-08判明・修正済み）。** ポーリング間隔は30秒だが探索時間が15〜40秒かかるため、前回の探索が終わる前に次のポーリングが新しいリクエストを投げると、Workerがリクエストを処理しきれずキューに溜まり、後続のリクエストのタイムアウトが次々に満了して`_globalTransferPhase`が`null`のまま復帰しなくなる（一度詰まると雪だるま式に悪化する）不具合があった。対策として `_phaseWorkerBusy` フラグを持ち、**前回の探索が完了していない間は新しいリクエストを投げず、そのポーリング回はスキップして前回の`f`をそのまま使い続ける**（`computeGlobalTransferPhase()`）。あわせて `PHASE_WORKER_TIMEOUT_MS` をポーリング間隔の3倍の**90秒**に延長し、タイムアウト発生時はキューに溜まった古いリクエストを破棄するため**Workerをterminateして作り直す**（`stopPhaseWorker()`を呼ぶ）。

**失敗時に`_globalTransferPhase`を即座に`null`にしない（2026-08修正済み）。** `f`はゲーム全体で共通の値であり数分単位でしか大きく変化しないため、1回の取得失敗・タイムアウトだけで推定を全領地から消すのは過剰だった。連続失敗回数（`_phaseFailureStreak`）をカウントし、**5回連続（約2.5分）失敗して初めて`null`にする**。1〜4回の失敗では前回の`f`を保持し続ける。Live モードを OFF にしたとき（`onLiveModeToggle()`）は連続失敗カウントも即座に0にリセットする。

Worker生成失敗（module worker非対応環境等）・Worker内エラー・タイムアウトはいずれもこの失敗カウントの対象とする。推定は付加機能であるため、これが（連続5回）失敗してもLiveモードのマップ表示・ツールチップの実データ部分は通常どおり動作する（推定セクションのみ非表示になる）。戻り値は`{ f, coverage, exactlyOne, histogram, refinement }`（`histogram`は候補数の分布`{zero, one, twoToThree, fourToTen, elevenPlus}`、`refinement`はfの2パス精密化の内訳、いずれも調査用）。

**取得直後（10分以内）の領地はf探索の入力から除外する（2026-08追加）。** 領地は捕獲された瞬間に資源の`stored`がリセットされ、その後の値は「捕獲からの経過時間」を反映するのであって「グローバルな転送位相からの経過時間」を反映しない（両者は同期していない）。ギルド戦が活発な時間帯は捕獲直後の領地が多数存在しうるため、`computeGlobalTransferPhase()`は`recentlyCapturedElapsedMs(info)`が非nullの領地（`RECENTLY_CAPTURED_MS`=10分）をf探索の入力から除外する。マップの赤破線ハイライト（後述）と同じ閾値・同じヘルパー関数を共有する。

**エメラルドから直接fを逆算する方式は検証したが不採用（2026-08）。** 全437領地がエメラルドを生産しており、その消費もLarger Resource Storage・Efficient Resources・Resource Rate（いずれもemeralds消費）の3ボーナスから確定できる場合が多いため、`stored_em = cons_em×f + gen_em×(1/60−f)`を`f`について直接解く方式（グリッド探索・exactlyOne最大化を丸ごと廃止し、領地ごとに求めたfの中央値を採用）を実装・検証した。**しかし実データ2件（437領地中389/380件が有効）でいずれもfの中央値がF_MAX付近に張り付き（stored_em=0の領地が単独最大クラスタとして約半数を占めた）、既知の正解と食い違う結果になった。** Troms（live3.json）のore/wood/fish/crops実測を独立に検算したところ、旧グリッド探索の`f=0.016389`は残差最大3.4（ore実測603 vs 予測606.4等、crops実測688 vs 予測688.3）とほぼ完全に一致する一方、エメラルド方式の中央値`F_MAX=0.016667`はcrops予測700で実測688との差が拡大した。**原因はXP Seeking（emeralds消費・difficultyに寄与せず観測不能）が候補生成に未計上だったためと推測されるが、Stronger Minions/Tower Multi-Attacksのように「候補として列挙する」対処が効かない**（rating制約が無いため列挙候補を絞り込む手段が無く、列挙してもfの逆算に使えない）。したがって**グリッド探索＋exactlyOne最大化方式を維持する。** 検証に使ったコードはeco-logic.js/script.jsには残していない（グリッド探索方式に完全復元済み）。将来再度検討する場合は、XP Seekingレベルを何らかの方法で確定または安全に除外できる見込みが立ってからにすること。

**エメラルドチャンネルによるexactlyOneの拘束（veto、2026-08導入）。** 上記の「エメラルドから直接fを解く」方式とは別に、**fの探索は置き換えず、exactlyOneのカウント条件にエメラルド側との整合性チェックを追加する**方式を採用した。根拠: あるスナップショットでf=32s(0.008889)とf=35s(0.009736)を比較したところ、35sで新たに「候補1件」になった領地22〜26件のうち、独立したエメラルドチャンネルの検証で「35sのみ支持」は**0件**、「32sのみ支持」は**7〜10件**だった（k32/k35クロスチェック、2026-08実測）。これはexactlyOneが許容誤差窓（`PHASE_TOLERANCE_PER_RESOURCE/f`）のたまたまの狭まりで「見せかけの一意化」を起こす実例であり、対策を要すると判断した。

エメラルドチャンネル（`stored_emeralds = cons_emeralds×f + generation_emeralds×(1/60−f)`）はdefenseレベルの知識を一切必要とせずにfを独立検証できる。`cons_emeralds`は**Trio A確定分**（`Efficient Resources`/`Resource Rate`/`Larger Resource Storage`、いずれもemeralds消費でcrops/ore/wood/fish側の生成量倍率・保管上限から検出可能。confirmedExtraが検出する既存のTrio B＝`Efficient Emeralds`/`Emerald Rate`/`Larger Emerald Storage`——ore/crops/wood消費——とは資源の向きが逆の別物）+ **XP Seeking**（emeralds消費、レベル観測不能、`BONUS_CONFIG`の costs から取得する0〜9の離散未知数）で構成される。XP Seekingは0〜9の各レベルについて「その領地のemeraldsデータと矛盾しないfの区間」を個別に求め、それらの区間の和集合のいずれかに評価対象のfが入っていれば「支持される」とする（fを一意に解くのではなく、既存のfを検証するだけ）。

新規関数（いずれもeco-logic.js内部、非export）:
- `deriveTrioAConfirmedEmeraldCost(resourceSnapshot, treasuryBuff, isHQ)`: Trio Aの確定コスト合計（emeralds建て）を返す。確定不能なら`null`。**`isHQ`は`Larger Resource Storage`のlimitテーブルがHQ/非HQで異なるため引数に追加している（ドキュメントの関数シグネチャには無いが省略できない。Experiment Cの同名関数でも同じ理由で追加済み）。** Efficient Resourcesの倍率は`BONUS_CONFIG`の`levels`文字列（"+0%"〜"+300%"）をパースして動的生成する（決め打ち配列は書き起こさない）。4資源（ore/crops/wood/fish）間で検出結果が矛盾する場合は`null`（安全側）。
- `computeEmeraldAdmissibleF(generationEmeralds, storedEmeralds, trioAConfirmedCost, xpSeekingCosts, tolerance, fMax)`: XP Seekingレベルごとの許容f区間の配列を返す。
- `isFSupportedByAnyLevel(fGrid, admissibleIntervals)`: いずれかの区間に入っていれば`true`。

`estimateGlobalTransferPhase()`の`prepared`構築時（f探索ループの前）に領地ごと1回だけ`emeraldAdmissible`（区間配列 or `null`）を計算する。`null`は「判定不能」（`generationEmeralds`が0/欠損、またはTrio A確定不能）を表し、**veto対象外（従来通りカウントする）**。`evaluatePhase()`は、候補が1件に絞れても`emeraldAdmissible`が非`null`かつそのfを支持していない場合はexactlyOneにカウントしない（`emeraldAdmissible`が空配列＝XP Seeking 0〜9のどのレベルでもどのfでも辻褄が合わない領地は、**常にveto**される）。`coverage`・rating（difficulty）フィルタ・候補列挙ロジック（`deriveTerritoryCandidates`）は変更していない。

**script.js側の変更**: `computeLiveConfirmedInfo()`の`resourceSnapshot[r]`（r=ore/crops/wood/fish）に`baseGeneration`を追加保持し（従来はemeralds行の判定にしか使っておらず破棄していた）、`computeGlobalTransferPhase()`が`estimateGlobalTransferPhase()`に渡す各領地の入力に`treasuryBuff`・`emGeneration`（EMERALDのgeneration）・`emStored`（EMERALDのstored）を追加した。

**回帰テスト結果（2026-08実施）**: Elkurn実測値での単体テスト2件PASS。live3.json（Troms/Thesead/Rodoroc）・live5.json（Skien's Island）は修正後も全て正しい候補に絞り込めた（`f`はほぼ変化なし、`exactlyOne`はvetoにより143→86・117→69に減少）。healthy寄りのhighfスナップショット（f≈0.014444、Experiment Cで94.1%支持）は修正前後で`f`・`coverage`・`exactlyOne`とも完全に同一——過剰vetoは起きていない。k32/k35クロスチェックに使った2スナップショットは、`exactlyOne`が20→14・22→18に減少し（見せかけの一意化が実際に除去された）、うち1件は選ばれる`f`が35sから34sへ変化した（32sまでは届かなかったが、方向としては改善）。

**未解決課題（今後の確認事項）**: Trio Aが資源間で矛盾し`null`になる頻度は未計測。`emeraldAdmissible`が常にveto（空配列）になる領地が「emeraldsモデル自体の破綻」なのか「Trio A検出ロジックのバグ」なのかは個別の目視確認をしていない。実装後、本番ログでの頻度確認と該当領地の手動検算を推奨する。また、`refineGlobalPhase()`のアンカー選定（`candidates.length === 1`によるexactlyOne相当の判定）には今回のveto条件を適用していない（対象範囲を`evaluatePhase()`に限定する指示だったため）。

**XP Seekingが影響するのは「エメラルドからfを求める」用途のみであり、守備ステータス推定そのもの（ore/wood/fish/crops、Damage/Attack/Health/Defense）には一切関係しない。** XP Seekingはemeraldsのみを消費するボーナスであり、`candidateConsumption()`が算出する4系統（ore/crops/wood/fish）のいずれにも登場しない。上記のエメラルド方式不採用は「fの求め方」の話であり、fが（グリッド探索によって）正しく求まった後のStep 2（`estimateDefenseStats()`）の精度には影響しない。

**secondsToTransferの向き（2026-08、実データで再検証・現行のまま正しいことを確認）。** `secondsToTransfer = 3600 × f` は「次の転送までの残り秒数」であり、**fが大きい（F_MAXに近い）ほど残り秒数は大きい＝転送直後**という向きで正しい。根拠: Elkurn（VERY_HIGH、`f=0.013617`、`secondsToTransfer=49s`）のore/wood/fish/crops実測を、確定推定の結果（Damage7/Attack11/Health9/Defense8）から逆算した消費量で検算したところ、正規化残差`2.1×10⁻⁶`とほぼ完全に一致した（ore実測125 vs 予測114.4、wood実測234 vs 予測212.4、fish実測228 vs 予測163.4、crops実測475 vs 予測431.2）。**fが大きい（残り秒数が大きい）ときにstoredの絶対値も大きくなるのは、その領地のconsumption（Defenseレベルの合計コスト）自体が大きいためであり、fの大小と直接対応するものではない**（`stored[r] = consumption[r]×f + generation[r]×(1/60−f)`はconsumptionにも比例するため、低Defense領地は高fでもstoredが小さくなりうる。「Res Tickが50〜60sのとき精度が良い」という観察自体は正しく、fが大きいほど`1/f`（stored 1単位の丸め誤差が表す消費量誤差）が小さくなるため精度が上がる——詳細は次項のRESOLUTION_LIMIT参照）。

**Step 2: 領地ごとの候補決定（`EcoLogic.estimateDefenseStats()`）**

**Step 1と同じ`deriveTerritoryCandidates()`（fから逆算する候補生成）を使う。候補の生成方法を2箇所に持たない。** 得られた候補に対して妥当性チェック（個別に係数を当てはめた場合の「転送までの残り時間」が0〜60秒の範囲外になる候補、消費量と補正後storedの符号が一致しない候補を除外）を適用し、正規化残差（`Σ(stored[r]−predicted[r])² / Σstored[r]²`、`predicted[r] = consumption[r]×f + generation[r]×(1/60−f)`）が最小の1件を選ぶ。**範囲ではなく単一値を返す。** 候補が0件なら`levels: null`を返す。**Step 1がexactlyOneを最大化するようになった後も、Step 2自体は「残差最小の1件」を選ぶ従来の方式のまま**（候補が複数残る場合、選ばれた1件は依然として推測であることに注意。UIでの扱いは検討中）。

**転送までの残り秒数は `3600 × f`。** `f = (1 − t/60) / 60` の定義上、`t = 60 × (1 − 60f)` は転送からの**経過**秒であり、残り時間ではない（転送直後 `t=0, f=1/60` のとき経過秒の式は0を返すが、正しい残り時間は60秒）。

**推定はホバー/長押し/タップでツールチップを表示した領地についてのみオンデマンドで実行し、結果を領地ごとにキャッシュする（`_defenseEstimateCache`）。** キャッシュキーは`defences`・確定済みボーナス構成（`confirmedExtra`）・グローバル位相`f`の組み合わせで、いずれかが変化したときのみ再計算する。全437領地に対して定期実行はしない。

**（2026-08、修正済み）過去の「実データでの検証結果」は誤りだった**: 当初「8回・約5分間の実ポーリングで推定値・fが完全に安定した」ことを「正しい挙動」と記載していたが、これは`corsproxy.io`が応答に独自の1時間キャッシュ（`Cache-Control: public, max-age=3600`）を付与しており、`fetch()`側にキャッシュ無効化オプションが無かったために同一レスポンスを取得し続けていただけと判明した（`fetch()`に`{ cache: 'no-store' }`を追加して修正済み）。修正後に改めて実機で約168分観測したところ、fは36種類の値の間を数十秒おきに頻繁に変動しており、「安定」は見かけ上のものだった。

**守備ステータス推定の既知の限界**: `stored`は整数であるため、1単位が表す消費量は`1/f`になる。`f`は転送位相によって決まり、転送直後は`1/60`（1単位=消費量60）だが、転送直前には0に近づいて分解能が発散する。`DEFENSE_COST_TABLE`の低レベル側の間隔は100/200/300と小さいため、`f`が小さいスナップショットでは**Lv.0とLv.1がどちらも`stored=0`になり、原理的に区別できない。** Lv.2〜4も1・2・4としか差が出ないため、±1の誤差で1〜2段ずれる。

実測例（`f = 0.003556`）: Lv.0→0 / Lv.1→0 / Lv.2→1 / Lv.3→2 / Lv.4→4 / Lv.10→68 / Lv.11→81

**「資源量がほぼ同じなのに結果が違う」のは正常な挙動である（2026-08実測、バグではない）。** Ragni Main Entrance（Emeralds 9,494・Treasury Low +5.5%・Crops stored 61）とEmerald Trail（Emeralds 9,630・Treasury Low +7%・Crops stored 66）を比較した事例。Treasuryバフが5.5%と7%で異なるため生産量が異なり、Crops storedも61/66と異なる（両者は本当は同じ資源量ではない）。加えてOre 4〜Wood 6〜Fish 6程度の小さいstoredが決定的で、`f≈0.0164`のとき整数1つの差が消費量約`1/f≈61`に相当する。`DEFENSE_COST_TABLE`の下位は`0/100/300/600`と間隔が狭いため、storedが4か5かだけでLv.1とLv.3が入れ替わりうる。これは分解能の限界であり、次項のRESOLUTION_LIMITで「信頼できない場合は確定推定を諦める」形で対処する。

**分解能ガード（`RESOLUTION_LIMIT`、2026-08導入）。** `stored`の丸め誤差±1が表す消費量誤差は`1/f`（前項参照）。これが`DEFENSE_COST_TABLE`の最小刻み（`Lv0→Lv1=100`）の`RESOLUTION_LIMIT`倍を超える場合（`1/f > 100×RESOLUTION_LIMIT`）、その領地は分解能不足と判定し、除外されていない（`model[r].excluded`でない）チャンネルが1つも無ければ確定推定自体を諦める（`levels: null`を返し、呼び出し側は簡易推定にフォールバックする）。`fは領地に依らずスナップショット全体で共通のため、この分解能判定自体は同一ポーリング内の全領地で同じ結果になる。ただし「除外」される資源の組み合わせは領地ごとに異なるため、両者を組み合わせた「信頼できるチャンネルが1つも無い」領地の判定は領地ごとに変わる。** `RESOLUTION_LIMIT`の初期値は2（`estimateDefenseStats()`内の`RESOLUTION_LIMIT`定数）。感度分析（1/2/3/5、live3.json `f=0.016389`・live5.json同値）では、いずれの値でも確定推定到達数（live3.json 335/433、live5.json 298/416）・既知領地（Troms/Thesead/Rodoroc/Skien's Island）の正解率とも**変化しなかった**（`1/f≈61`がRESOLUTION_LIMIT=1の閾値100を常に下回っていたため）。**このガードは`f`が小さい（Res Tickが短い）スナップショットで初めて効き始める設計であり、今回検証した高f（≈0.0164）のスナップショットでは効果を測定できなかった。** 低f（Res Tickが短い）実データが得られた際に改めて感度を確認すること。

APIは`resources`を60秒ごとに更新し、ゲームの転送周期も60秒であるため、原則として毎回同じ位相のデータしか得られない。**低守備領地の推定精度は、観測できる位相に完全に依存する。**

**都市領地は解決率が低い（2026-08実測、Stronger Minions/Tower Multi-Attacks列挙導入前の観測）。** 目的関数をexactlyOne最大化に修正した直後、10領地（都市6件: Detlas/Ragni/Nemract/Cinfras/Llevigar/Olux、非都市3件: Thesead/Rodoroc/Troms、+Elkurn）を36分間・約58ポーリング観測したところ、**都市6件は1回も`levels`が解決せず**、非都市3件はfが合うポーリングでのみ解決したが**解決した値は毎回完全に同一**だった（Thesead: Damage5/Attack4/Health5/Defense4、Rodoroc: 同、Troms: Damage6/Attack7/Health6/Defense6を58回中33回・全て`residual=0.0000`で再現し、他の値は一度も出なかった。Tromsの実構成——Damage6/AttackSpeed7/Health6/Defence6/StrongerMinions2/Aura2/Volley1/LargerResStorage2/LargerEmeStorage1/EfficientEmeralds3/EmeraldRate3——から手計算した消費量で、別スナップショットのstoredを検算したところ4資源すべてが単一のfで最大誤差1.6と一致し、モデルの正しさが確認できている）。同じ領地が異なる時刻・異なる`f`で繰り返し同一の値に収束する現象自体は、目的関数修正が正しく機能している証拠でもある。

**根本原因は許容誤差の狭さではなく、Stronger Minions/Tower Multi-Attacksの未計上だった（2026-08判明・解決済み）。** confirmedExtraが支配的な資源チャンネル（例: Tromsのore消費37,000/hrのうち32,000がEfficient Emeralds Lv3）では、`f`のわずかな誤差でも`predicted`の絶対誤差が大きくなりやすい。当初はこれを「許容誤差が絶対値固定であること」が原因と考え、相対誤差（`TOL_ABS + TOL_REL×predicted[r]`）への変更を検証したが、**600点のfを全スキャンして正解率を測ったところ、TOL_RELを大きくするほど不正解が正解を上回るペースで増え、精度（正解÷解決数）はTOL_REL=0（絶対誤差のみ）が最良という結果になった。** この評価方法自体、正しいfは1点だけで残り599点は誤ったfなので「窓を広げると誤ったfでの偽陽性が増える」ことを測っているに過ぎない、という指摘を踏まえてもなお、「窓を広げると誤ったfが選ばれやすくなる」という結論自体は妥当なため、**相対誤差の追加は不採用とした。**

真因は`deriveTerritoryCandidates()`が**Stronger Minions（wood）・Tower Multi-Attacks（fish）を消費量計算からまるごと欠落させていた**ことだった。この2つはdifficultyに寄与しないためrating判定には使わないが、消費量には効くため、Tower Aura/Volleyと同じ要領で候補として列挙する必要があった（未列挙だとwood/fishのconsumptionを過小評価し、confirmedExtraが支配的な領地で解決に失敗する）。列挙を追加したところ、Tromsが`f0`のみで即座にDamage6/Attack7/Health6/Defense6に解決し、都市4件（Detlas/Ragni/Nemract/Llevigar）も新たに解決した（残り2件Cinfras/Oluxは未解決のまま。Tome Seeking/Emerald Seeking関連の可能性、後述）。

**Stronger Minions/Tower Multi-Attacksの列挙は候補空間を膨らませるため、除外時（`model.wood.excluded`/`model.fish.excluded`）の扱いに注意が必要。** これらはdifficultyに寄与せず、除外時は残差計算からも外れる（`candidateResidual`が除外資源をスキップするため）ので、除外時にminions/multiの値がどれであっても結果に一切影響しない。したがって除外時はダミー値0の1通りだけで足り、0〜4/0〜1を総当たりする必要はない（総当たりすると候補空間が5倍/2倍に膨れ、探索が15.5秒に悪化した実測がある。ダミー値化で10.6秒まで改善）。

**fの2パス精密化（`estimateGlobalTransferPhase()`内、2026-08導入）。** Step 1のグリッド探索で得た`f0`を、候補が正確に1件に絞れた領地（アンカー）から個別に最小二乗で逆算した`f`の中央値（`fRefined`）で置き換えられないか検証する仕組み。アンカー領地1件について、消費量が既知（候補確定済み）なら`stored[r] = consumption[r]×f + generation[r]×(1/60−f)`は`f`の1次式になり、閉形式で最小二乗解が求まる。**安全装置**: `fRefined`が必ず良いとは限らない（アンカー数が少ないスナップショットで`fRefined`が真値から外れ、exactlyOneが41→7に激減した実測がある）ため、判定は「絞り込めた領地数」ではなく**アンカー群の正規化残差の中央値**で行う（`f0`と`fRefined`それぞれで計算し、小さいほうを採用）。アンカー数が50件未満なら中央値が不安定なため精密化自体を行わない（`MIN_ANCHORS_FOR_REFINEMENT`）。**実測では検証した2スナップショットのいずれでも`f0`が採用され、精密化は発動しなかった**（1件はアンカー数不足でガード発動、もう1件はアンカー143件で両方計算した上で`f0`のほうが残差中央値が小さかった）。都市が解決するようになったのはStronger Minions/Tower Multi-Attacks列挙の効果であり、2パス精密化の効果ではないことが分かっている。戻り値の`refinement`フィールド（`{f, anchorCount, refined, f0?, fRefined?, medianAtF0?, medianAtFRefined?}`）は調査用でUIには出さない。

**生産分に比例した許容誤差（TOL_PROD）は検証済み・不採用（2026-08）。** 生産している資源では消費量が「生産分（`generation[r]×(1/60−f)`）を差し引いた残り」として求まるため、生産量が大きい領地では引き算の誤差（`f`のわずかなずれ等）が消費量側に増幅され、その資源に対応するDefenseレベルが系統的に低く見積もられる懸念があった（WynnExtrasでも同様の傾向が報告されている）。対策として許容誤差を`TOL_ABS + TOL_PROD×generation[r]×(1/60−f)`（生産分に比例して広げる）に変更する案を、TOL_PROD=0.01/0.02/0.03/0.05で検証した。**結果、既知3領地（Troms 6/7/6/6・Thesead 5/4/5/4・Rodoroc 5/4/5/4）はいずれのTOL_PRODでも変化せず、資源ブースト領地の実例（Skien's Island、ORE生産12倍）も全条件でDamage5/Attack5/Health5/Defense5のまま変化しなかった。** 一方exactlyOneはTOL_PRODを大きくするほど改善するどころか同等〜悪化する傾向だった（live3.jsonで143→139/141/142/132、live5.jsonで117→114/115/116/109、いずれもTOL_PROD=0＝現状維持が最良かタイ）。**懸念していた系統的過小評価は現状のデータでは確認できず、許容誤差を広げると無関係な候補を巻き込んでexactlyOneを悪化させるだけだった**（許容誤差を広げるほど不利になるという、TOL_REL不採用時と同じ傾向）。以上によりTOL_PRODの採用は見送り、`PHASE_TOLERANCE_PER_RESOURCE = 3`の固定値を維持する。

**Tome Seeking/Emerald Seekingは未実装（検証済み・見送り）。** Olux・CinfrasはギルドHQに極めて近く、Tome Seeking（fish、costs`[0,400,3200,6400]`）・Emerald Seeking（wood、costs`[0,200,800,1600,3200,6400]`）が敷かれている可能性がある。Stronger Minions/Tower Multi-Attacksと同様に候補へ追加実装し検証したところ、**Cinfrasは新規解決したが探索時間が38.5秒→6分45秒に悪化し、exactlyOneも全体で悪化した（41→36）。** 全437領地に適用するのは実用的でないため不採用。

**「HQから2ホップ以内に限定」も検証したが不採用（2026-08、Phase 5D）。** 上記の「将来の改善案」（対象をHQ近接領地に絞れば実用的かもしれない）を実際に`deriveTerritoryCandidates()`に`hqDistance`引数を追加する形で実装・検証した（`hqDistance<=2`の領地のみwood/fish候補にEmerald Seeking(0〜5)/Tome Seeking(0〜3)を直積で追加、それ以外は従来通りレベル0固定）。**「HQ近接領地は全体のごく一部のはず」という前提が実データで崩れていた**: 実際のスナップショット2件で、HQから2ホップ以内の領地は437領地中153〜161件（約35〜37%）に達した（複数ギルドがそれぞれ自分のHQを基準に2ホップ以内の領地を持つため、ギルド数が多いほど対象が増える）。結果、探索時間は約4倍に悪化し（highfスナップショットで14.8秒→61.4秒、midfスナップショットで72.7秒→286.8秒——後者は`PHASE_WORKER_TIMEOUT_MS`=90秒を大幅に超え、実運用では毎回タイムアウトしてfが更新されなくなる）、**exactlyOneも両スナップショットで悪化した（91→78、24→21）。** Seekingレベルという自由変数が増えたことで、従来一意に絞れていた(health, minions)や(defense, multi)の組み合わせが、複数の(health, minions, seeking)/(defense, multi, tome)の組み合わせでも許容誤差窓に収まるようになり、新規に解決した領地数（3件・2件）を上回る数の領地が逆に「候補複数」で未解決化した。全領地適用時（Cinfrasの事例）と同じ失敗パターンが、対象を2ホップに絞っても解消しないことを確認したため、**この方向性自体を不採用とした。** 検証に使ったコードはeco-logic.js/script.jsには残していない（Phase 5D veto機構までの状態に完全復元済み）。1ホップ限定であれば対象領地数はさらに絞れるが（今回の検証ではhop0+hop1で72〜78件）、性能問題は残る見込みが高く、根本的な解決（Seekingレベルの検出精度そのものを上げる、または対象をさらに厳しく絞る基準を別途考案する）が無い限り再検討しない。

**許容誤差の片側化（`levelsNearTarget`、2026-08導入）。** APIから検出できないボーナス（PvP Damage・Mob Damage・Gathering Experience・Mob Experience・Tome Seeking・Emerald Seeking）は消費量を増やす方向にしか効かないため、理論上「候補の消費コスト（`DEFENSE_COST_TABLE[lv]+extra`） ≤ 逆算した目標値（target）+ 丸め分」が必ず成り立つはずで、従来の対称`±PHASE_TOLERANCE_PER_RESOURCE(3)`の許容誤差はあり得ない「候補コストがtargetを上回る」側にも同じ幅の窓を開けていた。`levelsNearTarget(target, extra, consTolerance, consRoundingSlack)`を非対称化し、`target - candidateCost <= consTolerance`（未検出ボーナスの分を吸収する側、従来どおり`PHASE_TOLERANCE_PER_RESOURCE`のまま変更なし）と`candidateCost - target <= consRoundingSlack`（新規の`ROUNDING_SLACK_PER_RESOURCE`、丸め誤差・位相ずれのみを吸収する側）に分離した。Step1（`evaluatePhase`）・Step2（`estimateDefenseStats`）は共通の`deriveTerritoryCandidates()`経由でいずれも新シグネチャを使う（候補生成ロジックを2箇所に持たない方針を維持）。

**`ROUNDING_SLACK_PER_RESOURCE`の感度分析（2026-08実測、live3/live5/live7.json + Phase 5Dスナップショット3件の計6件）。** 暫定値1では既知の正解4領地（Troms/Thesead/Rodoroc/Skien's Island）が**全て`levels: null`に壊れた**（グリッド探索が選ぶf自体が対称版と異なる値にシフトし、その結果候補が0件になる領地が出たため）。1/1.2/1.5/1.8/2/3で比較したところ、1.8で既知領地が復旧し始め、**2で6件中4件のexactlyOneが改善しつつ既知の正解4領地が全て一致した**（live3.json: exactlyOne 86→92、live-midf系: 14→70・18→81、highf: 90→101）。1.5以下では既知領地が壊れるため不採用。3は従来の対称許容誤差`|candidateCost-target|<=3`と数式的に同一（無変更）。**live7.jsonのみexactlyOneが25→16に悪化した**（この1件はground truthが無いため悪化の是非は判断できないが、既知の正解4領地を優先し**`ROUNDING_SLACK_PER_RESOURCE = 2`を採用**した）。

**フォールバック表示（簡易推定、2026-08導入）。** `estimateDefenseStats()`が`levels: null`を返した場合のみ、`estimateDefenseStatsApproximate()`が別ユーティリティMOD「WynnExtras」のレーティング段階別決め打ち方式を移植したフォールバックを提供する。Efficient Emeralds/Emerald Rateは（WynnExtrasと異なり）当方が`generation`から正確に検出できるため決め打ちせず`confirmedExtra`をそのまま使い、それ以外の検出不能な非防衛ボーナス（Tower Aura/Volley・Stronger Minions・Tower Multi-Attacks相当）をレーティング段階から一括で仮定した上で、資源ごとに独立して最寄りの`DEFENSE_COST_TABLE`段を選ぶ（レーティング照合なし、常に単一値）。確定推定より精度は大きく劣るため、UI上は`renderDefenseEstimateApproximateHTML()`で見出し・色を確定推定（マゼンタ）と区別（グレー系）し、末尾に英語の注記（`Approximate: hidden bonuses inferred from defence rating`）を付ける。4スタッツとも決定不能な場合のみセクションごと非表示。

**Estimated Defence の表示形式（2026-08変更）。** `showLiveTooltip()`から確定ボーナス一覧（Storage・資源ブースト・エメラルドブーストの`Upgrades:`セクション）を削除した。確定ボーナス自体は推定の内部計算（`confirmedExtra`）では引き続き使うが、UI上はEstimated Defence/Estimated Defence (approximate)の推定4スタッツのみを表示する。表示は`defenseStatLine()`（script.js）が共通で組み立て、アイコン（`./assets/icons/upgrades/damage.png`等、`.res-icon-img`クラス）+ テキスト + 括弧内Lv数字のみ（`Lv.`は付けない）の1行形式。**Damage・HPは`calcLiveDefenseMult`由来の倍率（Connections/Externals補正）を反映し、Attacks per second・Defence%には倍率を掛けない**（`computeStatsFromLevels()`の仕様どおり。倍率はDamageMin/Max・HPにのみ内部で乗算されている）。HPは`k`単位（`fmtHp()`）で表示する。簡易推定でスタッツが個別に決定不能な場合は数値部分を省略しLvを`?`で表示する。DPS/EHPの表示（`fmt()`によるM/K表記）は変更していない。

**推定結果の品質付きキャッシュ保持（Item 9、2026-08導入）。** 守備構成は数時間〜数日単位でしか変わらない一方、fは毎ポーリング変動し、fが大きい（転送までの残り秒数が大きい）ときほど推定精度が高い。従来はスナップショットごとに独立して推定するのみで、過去の「良いf」での観測を捨てていた。本機能は表示層に品質付きキャッシュを追加し、構成が変わっていない間は良い観測を保持し続ける。**Step2（`estimateDefenseStats`）の候補選択ロジックそのものは変更していない**（`candidateCount`・`consumption`という戻り値フィールドを追加しただけ）。

Tierは3段階。**Tier A**: 候補が1件に絞れており（`candidateCount===1`）、`EcoLogic.computeTerritoryEmeraldAdmissible()`（Phase 5Dのエメラルドveto判定の事前計算を公開ラッパー化したもの。内部は`deriveTrioAConfirmedEmeraldCost`/`computeEmeraldAdmissibleF`を再利用し、`estimateGlobalTransferPhase()`側もこのラッパー経由に統一した）による独立検証も通っている。**Tier B**: `candidateCount===1`だが`emeraldAdmissible`が判定不能（`null`）で裏取りができない。**Tier C**: 候補が1件に絞れていない。**キャッシュ対象外**であり、常に現在ポーリングの生の推定（確定または簡易フォールバック）をそのまま表示する。

**品質スコア（`EcoLogic.computeQualityScore(storedValues, f, producingChannels)`）**: `rawQuality = min(storedValues) × f`（storedの丸め誤差1単位が表す消費量誤差`1/f`の逆数に相当し、大きいほど信頼できる。「守備ステータス推定の既知の限界」参照）に、生産チャンネルの感度によるペナルティ`penalty = 1/(1+maxSensitivity/SENSITIVITY_NORMALIZER)`（`maxSensitivity = max(|generation[r]−consumption[r]|)`、生産チャンネルが無ければ`penalty=1`）を掛けたもの。生産量が防衛消費を大幅に上回る資源ブースト領地では、`f`のわずかな誤差が消費量側に拡大されやすい（前掲の資源ブースト領地の系統誤差の懸念と同種の問題）ため、この補正で品質を下げる。**`SENSITIVITY_NORMALIZER=5000`は暫定値。** ドキュメント記載の実測値（Elkurn: crops generation=36000・候補消費量=10000、Troms等の非生産領地）で検証し、非生産領地はpenalty=1（rawQualityと完全一致）、Elkurnはpenalty≈0.161（quality≈raw×0.161）と明確な差が出ることを確認済み。同Tier内のタイブレークにのみ使う値であり、Tierをまたいだ比較には使わない。

**更新・破棄（`EcoLogic.shouldUpdateCache` / `EcoLogic.shouldDiscardCache`）**: 新規観測のTierが既存キャッシュのTierより高ければ無条件で置き換え（A>B）、同Tierなら品質が上回った場合のみ置き換える。破棄は「現在のAPIレスポンスに存在しない（領地喪失）」「`acquired`/`defences`/`guild`のいずれかが変化」「観測から2時間（既定、`shouldDiscardCache`の第4引数でテスト用に短縮可能）経過」「資源量ベースの追加判定（後述）が不成立」のいずれかで発火する。

**`MIN_CACHE_QUALITY`品質フロアは2026-08に撤廃した。** 一時期、「候補が正確に1件に絞れた（Tier A/B）」というだけでは低品質な偶然の一致を排除できず、一度キャッシュされるとそれを上回る品質の新規観測が来るまで半永久的に表示され続ける問題（実例: Twain Mansion・Tower of Ascensionが観測期間中1回しか候補1件に絞れず、そのときの品質0.0546でキャッシュされたまま表示され続けた）への対策として、`shouldUpdateCache`の先頭に品質フロア判定（`newQuality < MIN_CACHE_QUALITY`、暫定値0.1）を追加し、下回るTier A/B観測はキャッシュしないようにしていた。**しかしその後の検証（実データ1098件・8スナップショット×全所有領地）で、確定推定に付随するrating整合フィルタに矛盾が一件も見つからなかった。** 品質（`min(stored) × f`）はfが低い時間帯には正しい答えでも低い値になりやすく、品質フロアは低品質な偶然の一致だけでなく正しい確定推定まで巻き込んで弾いていた可能性が高いと判断し、Krolton's Cave・Bantisu Approach等で「以前正しい確定推定が出ていたのにキャッシュされない」という報告が繰り返されていたことも踏まえ、**`shouldUpdateCache`から品質フロア判定を削除し、Tier A/Bの確定推定は品質の値によらず即座にキャッシュする設計に戻した。** Twain Mansionのような極端な低品質値が再びキャッシュされる可能性は残るが、それは正しさをrating整合フィルタ・veto・片側化という既存の安全策と、次項の資源量ベースの追加破棄判定に委ねる、という判断である。

**資源量ベースの追加破棄判定（2026-08導入）。** 従来の破棄条件（`acquired`/`defences`/`guild`変化・2時間経過）は、「difficultyラベルは変わらないまま、War中に内部の防衛レベル配分だけが変わる」ケースを検知できなかった。`shouldDiscardCache`に、キャッシュ済み推定の消費量（`cached.estimate.consumption`、`confirmedExtra`込みの実消費量）が**現在の**生の資源スナップショット（`stored`/`generation`）に対してまだ成立するかを確認する判定を追加した（`isCachedConsumptionStillPlausible()`、非export）。判定は`stored[r] ≈ consumption[r]×f + generation[r]×(1/60−f)`が、既存の候補マッチングと同じ許容誤差（`PHASE_TOLERANCE_PER_RESOURCE`、stored単位）内に収まるかで行う。**exactlyOneのような厳しい判定（`ROUNDING_SLACK_PER_RESOURCE`の片側化）はあえて使わず、coverage相当の緩い判定に留めている**（新しい定数は追加せず既存の許容誤差計算を再利用する方針のため）。ore/crops/wood/fishのうち1つでも許容誤差を超えれば破棄する。生の資源データが取得できない・`f`が未確定等で判定に必要な値が欠けている場合はこの判定だけをスキップし（`null`を返す）、他の条件のみで判定する（安全側に倒す。新しい破棄が増える方向にはしない）。`shouldDiscardCache`の`currentInfo`引数に`resourceSnapshot`（ore/crops/wood/fish→`{stored, generation}`の生値）・`f`（`_globalTransferPhase`）を追加した（`updateQualityCache()`の破棄判定ループ、script.js）。この2値は鮮度優先で常に最新の`liveData`/`_globalTransferPhase`から作る（BFSを要する`computeLiveConfirmedInfo()`は使わず、`info.resources`から直接組み立てる）。

**更新タイミング（`updateQualityCache()`、script.js）**: `fetchLiveTerritoryData()`が`computeGlobalTransferPhase()`を`await`した直後にポーリングごと呼ぶ。まず既存キャッシュ全件に`shouldDiscardCache`を適用し、次に全所有領地（直近10分以内に取得した領地は`recentlyCapturedElapsedMs`で除外。捕獲直後はstoredが転送位相モデルに従わずStep2自体が信頼できないため）について`estimateDefenseStats`→`determineTier`→（Tier A/Bのみ）`computeQualityScore`→`shouldUpdateCache`の順に評価する。`_globalTransferPhase`が`null`（f未確定）のときは破棄判定のみ行い、新規のキャッシュ更新はスキップする。**破棄判定・更新判定のいずれも領地単位でtry/catchを分離している**（2026-08修正。従来はループ全体が無条件で例外を送出しており、1領地のデータ異常が起きるとその回のポーリングで以降の全領地の判定がスキップされ、当該領地以降が恒久的に古いキャッシュのまま取り残される経路があった。1領地分の例外はログのみに留め、残りの領地の処理は継続する）。実機ログで検証したところ例外発生は0件、`acquired`/`defences`/`guild`変化によるDISCARDは正しいタイミングで発火していることを確認済み（同一ログで55件）。

**表示（`showLiveTooltip()`）**: 領地の`_qualityCache`にエントリがあれば、キャッシュされた推定（`renderDefenseEstimateHTML(cachedEntry.estimate, {observedAt, tier})`）を優先表示する。無ければ従来どおり現在ポーリングの生の推定（確定失敗時のみ簡易推定にフォールバック）を表示する。キャッシュ表示時は見出し直下に観測時刻（`fmtHeldDuration()`を再利用した`(observed Xm Ys ago)`形式）を薄いグレーで追加し、Tier Aの場合のみ`· verified`を付す。

**表示中ツールチップのポーリング連動更新（2026-08修正）。** 従来`showTooltip()`はマウスが別の領地に移った瞬間（`hoveredTerritory`の変化）にしか呼ばれず、同じ領地にカーソルを置いたまま30秒間隔のポーリングが進んでも、ツールチップの内容（Estimated Defence・`Resources move in Xs`・観測時刻等）は最初に表示した瞬間の値のまま固定されていた。特にTier C（簡易推定）は`Resources move in Xs`が「直近の転送直後」を示しているように見えるにもかかわらず、実際には古いfの値のままという紛らわしい表示になっていた。対策として、表示中のツールチップの引数（`{mx, my, name, above}`）を`_lastLiveTooltipArgs`に保持し、`hideTooltip()`で`null`に戻す。`fetchLiveTerritoryData()`が`updateQualityCache()`の直後に呼ぶ`refreshLiveTooltipIfOpen()`が、ツールチップが表示中（`tooltip.style.display === 'block'`）であれば同じ引数で`showLiveTooltip()`を再実行し、現在の`f`/`liveData`で内容を再計算する。表示層のみの変更であり、Step1・Step2の推定ロジックには触れていない。

**保存場所はメモリ内・Liveモードのセッションスコープ（`_qualityCache`）。** ページリロード・Liveモード OFF で消える。永続化はしない。

**未解決課題**: `SENSITIVITY_NORMALIZER=5000`は暫定値のため、本番ログでの分布を見て調整が必要になる可能性がある。「攻められたギルドの領地全部を疑う（1領地が奪われたら、そのギルドの他の領地のキャッシュも構成変更の疑いありとして早めに破棄する）」というアイデアは、判定ルールが固まっていないため未実装で、将来的な検討課題として残す。Tier A/Bの表示（バッジ・観測時刻表示）は簡易的なテキスト表示にとどめており、より視認性の高いデザインは今後検討の余地がある。資源量ベースの追加破棄判定は、判定に使う許容誤差（`PHASE_TOLERANCE_PER_RESOURCE`）が緩いため、丸め誤差・位相ずれの範囲に収まる程度の小さな構成変更（Lv1違い等）は検知できない可能性がある。本番ログでの発火頻度は未計測。

**調査用診断ログの出力制御（2026-08導入）。** `[phase]`・`[sample]`・`[cache-diag]`はいずれも調査用の一時ログであり、従来は`console.log`で常時出力していたが、実運用テスト時にブラウザの負荷（毎ポーリング・全領地分の文字列組み立て）が無視できなくなってきたため、**デフォルトでは出力しない**ように変更した（判定ロジック自体は一切変更していない。出力の有無のみを制御する）。`console.log`の代わりに`diagLog(...)`を呼ぶよう統一し、`diagLog`は`_diagLoggingEnabled`が`true`のときのみ`console.log`へ委譲する。有効化は2通り: URLに`?diag=1`を付けて開く（`location.search`を見る。共有リンクの`#p=`/`#s=`ハッシュとは独立）、またはブラウザのコンソールから`enableDiagLogging()`を呼ぶ（`localStorage`に保存されるため、リロード後もURLパラメータなしで有効なままになる。無効化は`disableDiagLogging()`）。`console.error`によるtry/catch内の例外ログ（`Failed to build phase input for...`等）は診断ログではなく実際の異常を示すため、このゲートの対象外とし常時出力のまま維持した。

**HQ2ホップ近接領地をf探索の投票から除外する案は検証したが不採用（2026-08）。** 一部領地（Res Tickが常に52s＝直近転送直後を指すにもかかわらず、実際の資源量とは辻褄が合わない）について、「HQ近接領地はSeeking系ボーナスの影響で`emeraldAdmissible`が`null`（判定不能・veto対象外）になりやすく、偽の一意化を伴ったままf探索の投票に混入しているのではないか」という仮説を立てて調査した。40分間のLiveモードログを集計した結果、**HQ2ホップ以内の領地のveto判定不能率（20〜28.6%、複数スナップショットの実測では9.1〜28.6%）は全領地平均（32%前後）より低く**、仮説とは逆の結果だった。HQ近接であることがRes Tick不一致の原因という仮説は棄却し、この方向の対応は見送った。

**上記「この症状自体の実際の原因は表示層のバグだった」という当時の結論は不完全だった（2026-08訂正）。** 同じ症状（Res Tickの表示と実際の資源量が噛み合わない）がその後も再発したため再調査したところ、**`setInterval`によるポーリング（30秒間隔）は、直前の`fetchLiveTerritoryData()`呼び出しがまだ完了していなくても次の呼び出しを開始する**ことが判明した。Web Workerでのグローバル位相f探索は実測10〜40秒かかるため、ポーリング間隔を超えることが日常的にある。`_phaseWorkerBusy`によるスキップ（前掲）はWorkerへのリクエスト詰まりを防ぐためのものだが、**スキップされた回もモジュール変数`liveData`自体は新しいレスポンスで即座に上書きされる。** 一方`_globalTransferPhase`（f）は、それを計算したWorkerの探索が完了した時点でしか更新されない。この結果、`getDefenseEstimate()`・`updateQualityCache()`等が常に「最新の`liveData`」から`stored`/`generation`を読みつつ、`f`は「1つ前、あるいはさらに古いラウンドで確定した値」という**由来ラウンドが異なる組み合わせ**で推定計算をしてしまうことがあった。`stored[r] = consumption[r]×f + generation[r]×(1/60−f)`は同一スナップショットのstored/generation/fを前提とするモデルであるため、この不一致が「Res Tickの表示と実際の資源量が噛み合わない」症状の真因だった。

**対策として`_phaseSourceLiveData`を導入した（2026-08）。** `_globalTransferPhase`の計算に使った`liveData`のスナップショット参照を保持する変数で、`computeGlobalTransferPhase()`が探索成功時にのみ`_globalTransferPhase`と**同時に**更新する（`computeGlobalTransferPhase()`関数冒頭で`liveDataForThisRound = liveData`をローカル変数として捕捉し、`finish()`の成功分岐で両方に代入する）。守備ステータス推定に関わる箇所（`getDefenseEstimate()`・`getDefenseEstimateApproximate()`・`updateQualityCache()`・`logSampleTerritoryEstimates()`、および`getOwnedNamesForGuild()`のConnections/Externals集計）は、常に最新の`liveData`ではなく**必ず`_phaseSourceLiveData`から**`stored`/`generation`/`confirmedExtra`等を読み直すように変更し、fとその計算元データが常に同じラウンドになることを保証した。**Held時間・取得直後の赤破線ハイライト・資源生産量の表示等、リアルタイム性が要件の項目は引き続き最新の`liveData`を参照する**（表示中ツールチップのポーリング連動更新の要件とは独立のため）。`_qualityCache`の破棄判定（`shouldDiscardCache`、領地喪失・defences変化等の検知）も鮮度優先で最新の`liveData`を使い続ける。Playwrightでポーリング間隔を人為的に3秒へ短縮し、実際のWeb Worker計算（437領地・10秒前後）と競合させて100秒間観測したところ、`[phase] skipped`（ラウンドの追い越し）が22回発生する条件下でも例外・コンソールエラー・LIVEバッジのエラー状態は一切発生せず、表示は常に自己整合的な組み合わせのままだった。

**Live モード中のホバー時の表示固定（問題提起されたが未再現、2026-08）。** 「領地にホバーしてツールチップを表示している間、赤破線ハイライトや保持期間の表示が更新されなくなる」という報告があったが、単純なホバー（1回のマウス移動→静止）・実際のマウスの微振動を模した連続ジッター（80ms間隔・36秒間）・**カーソルを一切動かさない真の静止ホバー**（`page.mouse.move`を最初の1回のみ呼び、以後65秒間一切呼ばない）の3パターンをPlaywrightで検証した結果、**いずれも再現しなかった。** ポーリング間隔は30秒周期のまま安定し、`Held`表示・`Estimated Defense`の内容は毎回正しく更新され、例外・コンソールエラー・LIVEバッジのエラー状態も発生しなかった。コード上にもホバー状態を理由に描画やポーリングを止める分岐は見つからなかった。

**検証手法自体の落とし穴（2026-08判明）**: 真の静止ホバーの最初の試行では、デフォルトのビューポート（地図全体がフィットする程度のscale≈0.12）で検証したところ赤破線ハイライト・保持期間テキストとも変化が一切観測されず、一見「凍結」を裏付ける結果に見えた。しかし`drawTerritoriesLive()`の名前・保持期間テキスト描画は`scale > 0.25`のときしか実行されない分岐に入っており、**このscaleではそもそも該当テキストが描画されていなかっただけ**（`ctx.fillText`呼び出し回数を計測したところ65秒間で0回）と判明した。ズームインしてscale>0.25にした状態で再検証したところ、`fillText`呼び出しは65秒間で876回増加し、地図クロップのスクリーンショットもバイト単位で変化し（赤文字の経過時間が実際に描画更新されている）、`Held`表示も正しく更新された。**この経緯から、Liveモードの描画系を検証する際は必ずscale>0.25までズームインした状態で行うこと**（地図全体表示のズームレベルでは領地名・資源アイコン・保持期間テキストの類がそもそも描画されないため、「変化しない」ことが即座に「更新が止まっている」ことを意味しない）。

ブラウザのスクリプトキャッシュ（更新前の`script.js`を読み込んだまま）等、コード外の要因だった可能性がある。再現条件が具体的に分かった場合は再調査する。

**確定推定がAPIの難易度と矛盾するように見える件（問題提起されたが実装バグではないと判明、2026-08）。** Wanderer's Wayで確定推定`Damage3/Attack2/Health2/Defense2`がAPIの`defences: Medium`と矛盾しているように見えるという報告があったが、8件の実スナップショット×全所有領地（延べ1098件）で`estimateDefenseStats()`の出力を検証した結果、**rating整合フィルタ（`deriveTerritoryCandidates()`内の`if (rating !== observedRating) continue`）に矛盾は一件も無かった。** Wanderer's Wayの実例を検算すると、確定推定には`Tower Aura Lv1`（crops+800）・`Tower Volley Lv1`（ore+200）が消費量に含まれており、これを含めて`calcDifficulty()`すると`19`（Medium境界）で一致する。**しかしTower Aura/Volley/Stronger Minions/Tower Multi-Attacksのレベルは、`Upgrades:`セクション廃止（前掲）以降ツールチップのどこにも表示されない**ため、表示されている4スタッツ（D/A/H/F）だけで手計算すると必ず難易度が食い違って見える（この4値だけならWanderer's Wayの例は`9`＝Lowになる）。**これはコードのバグではなく、非表示の確定済みボーナスが原因の見た目上の不一致と判断し、対応は行わなかった。** 必要になれば、確定した非防衛ボーナス（Aura/Volley/Minions/Multi）をツールチップに補助表示する案を再検討する。

**低品質キャッシュがTier Bを上書きする件（KC/BA/Nemractについては別原因と判明、一般的な発生は未観測、2026-08）。** `shouldUpdateCache()`はTierを主キーとするため（Tier Aは品質を問わずTier Bに勝つ）、質の低いTier Aの観測が、それより高品質なTier Bの観測を問答無用で上書きしてしまう可能性が指摘されていた。

まず**メカニズム自体は実在することを合成データで確認済み**: 実スナップショット（`scratchpad/phase5d/live-highf-*.json`）中の実在するTier B領地（Lake Gitephe、`candidateCount=1`・quality≈1.05）について、difficulty・damage/attack/health/defenseレベル・rating整合を保ったまま`fish`/`emeralds`チャンネルの値だけを組み替え、同一の`f`・同一レベルでTier A（quality≈0.53、Bより低品質）になるスナップショットを作成。これをPlaywrightで2ラウンドポーリングさせたところ、`[cache-diag] Lake Gitephe: B(quality=1.0500...) -> A(quality=0.5317...)`が実際にコンソールへ出力され、上書きが起こることを確認した。

一方、**Krolton's Cave・Bantisu Approach・Nemractの3領地については、実際のLiveセッションのフルログ（`docs/console-nemusugi-log.txt`、約1万行、より詳細な検証用ロギングを一時的に仕込んで取得したもの）を精査した結果、様相が異なっていた**。

- **Krolton's Cave・Bantisu Approachは、ログ全体を通じて一度も`candidateCount===1`にならず（`skip-tier-c`のみ）、Tier A/Bの観測自体が一度も発生していない。** つまりこの2領地の「精度の低い推定しか出ない」症状は、Tier Bの上書きではなく**そもそも候補が1件に絞れないこと自体が原因**であり、別の問題（分解能・許容誤差・確定できないボーナスの多さ等）に起因すると考えられる。
- **Nemractは複数回Tier Aで観測されており（`D6/A8/H8/F7`等）、品質が下がった回もTier Aのまま`keep`（更新スキップ）と正しく判定されていた。defences変化による正当な`DISCARD`は1回発生していたが、Tier B→Tier Aの上書きは一度も発生していない。**
- **ログ全体（約1万行）を`newTier=A.*prevTier=B`で検索しても該当は0件。** 437領地・実運用セッションの中で、Tier B→Tier Aの遷移自体が（少なくともこのセッションでは）一度も起きていない。

**結論**: 上書きの仕組み自体は合成データで実証済みだが、実データでは今回確認した範囲でまだ一度も発生していない（Tier Bで観測された領地がその後Tier Aに遷移すること自体が実際には稀と見られる）。KC/BAの症状はこの問題とは無関係（候補未確定が真因）と判断し、この3領地を診断対象から外す。一般ケースでの再発生を捉えるため、`updateQualityCache()`内の**診断用ログ`[cache-diag]`は残す**（`cachedBefore.tier === 'B'`かつ新規観測が`tier === 'A'`かつ新しい品質が既存より低い場合にのみ出力、挙動は変更しない）。今後この条件が実データで発火した場合に、対策案（Tier B超えに必要な最低品質を別途設ける／Tierによる絶対優先をやめ正規化した品質で単純比較する）を検討する。

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

が成り立ち、`f`は**ゲーム全体で共通の位相**である。**生産している資源も同じ式で拘束に使える**（`generation===0`なら補正項が0になり従来の比例式と一致）。**目的関数はカバレッジ（候補が1件以上ある領地数）ではなく、候補が正確に1件に絞れる領地数（exactlyOne）の最大化を採用する**（カバレッジ最大化は許容誤差windowがfに反比例して広がる分だけ緩いfを選んでしまうバイアスがあることが実測で確認されたため。詳細は「守備ステータスの推定（Liveモード専用）」参照）。これにより、領地ごとに残差最小の候補を選ぶことで**個別レベルが単一値として確定する。** Step 1（f探索）・Step 2（領地ごとの候補決定）は同じ候補生成ロジック（`deriveTerritoryCandidates()`）を使う。

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

- マップ描画（`drawTerritoriesLive()`）: 所有ギルドのカラー（`guildColorMap`、`getGuildColor(prefix)`）で塗り・枠線を描く。無所属は白。`hq: true` の領地には既存のHQアイコンを表示する。マップ選択（`selectedTerritories`）のハイライトは維持する。**HQ以外の所有領地にも、領地名の上に生産資源のアイコンを表示する**（`getLiveResourceFlags(info)`。判定は`resources[].generation`（0より大きいものを産出していると判定）、Cityのみ`EMERALD`の`baseGeneration`（18,000以上）を使う。アイコンの種類・配置（Rainbow時の2x2グリッド等）は既存のシミュレーションモードと同じ）。**取られてから10分以内（`recentlyCapturedElapsedMs(info)`）の領地は、既存の非接続領地と同じ赤破線アウトライン（`#ef4444`）でハイライトし、領地名の上に経過時間（`Xm Ys`形式）を赤文字で表示する（2026-08追加）。** 優先順位は選択（`isSelected`）の次・HQ/所有色の前（非接続ハイライトと同じ位置）。10分を超えると通常表示に戻る。
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

- ギルド名の下に保持期間（`acquired`からの経過時間、`fmtHeldDuration()`の段階形式）を表示する。**文字色はその領地の現在のTreasury段階から動的に決める**（`HELD_TIME_COLORS`: VERY_LOW `#FF5555` / LOW `#FFAA00` / MEDIUM `#FFFF55` / HIGH `#55FF55` / VERY_HIGH `#55FFFF`）。
- 資源の`stored`表示は、`stored > limit`（limitを超過した場合のみ）を赤文字にする。**`stored === limit`（満杯）は正常な状態のため赤にしない**（2026-08修正。以前は`>=`だったため満杯ちょうどのときも誤って警告色になっていた）。
- **確定できるボーナス（ストレージレベル・Efficient/Rate系の組み合わせ）の一覧（`Upgrades:`）は表示しない（2026-08廃止）。** 推定の内部計算（`confirmedExtra`）では引き続き使う。ユーザーが必要としているのはEstimated Defenceのみであるため。
- 守備ステータスの推定値は`Estimated Defense:` / `Estimated Stats:`の見出しの下に表示する。Damage/Attack Speed/HP/Defence%の4行は`defenseStatLine()`が組み立てる共通形式（アイコン画像 + テキスト + 括弧内Lv数字のみ、`Lv.`は付けない）。**Damage・HPは`mult`（Connections/Externals由来の倍率）を反映し、Attack Speed・Defence%には反映しない。** HPは`k`単位。EHP/DPSの表示（`fmt()`によるM/K表記）は従来どおり変更していない。**候補数・サンプル数などの内部指標は一切表示しない。** 推定できない場合（`levels`が`null`）はセクションごと表示しない。
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
  - **`corsproxy.io`は元のAPIが返す`Cache-Control: max-age=10`を、独自の`Cache-Control: public, max-age=3600, s-maxage=3600`（1時間）に上書きして転送する（2026-08時点で確認済み）。** `fetch()`には`{ cache: 'no-store' }`を必ず付けること（`loadGuilds()`・`fetchLiveTerritoryData()`の両方で対応済み）。付けないと30秒間隔のポーリングでもブラウザがこのキャッシュを使い、最大1時間近く同じレスポンスを返し続けることがある（実測: 40〜45分間、全437領地の`resources`・`_globalTransferPhase`が完全に不変のまま推移する事例を確認）。
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
