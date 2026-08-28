# AWB統合後の推定Tier低下疑惑 調査報告（暫定版・データ収集待ち）

## 調査の背景

AWB共有バックエンド統合後、Liveモードの守備推定で「Tier C相当（簡易推定・低信頼度）」が
表示される体感頻度が増えた、という報告があった。仮説は2つ:

1. **ローカル計算の飢餓化**: `fetchLiveTerritoryData()`はAWBが成功した回、
   `computeGlobalTransferPhase()`・`updateQualityCache()`を一切実行しない。そのため
   AWBがカバーしきれていない領地は、AWB統合前なら30〜60秒おきに得られていたローカル
   Tier A/Bキャッシュ更新のチャンスを失い、古いローカル結果を使い回し続ける。
2. **優先順位ロジックの盲点**: `showLiveTooltip()`はAWBの応答に1項目でも非nullがあれば
   無条件で最優先表示する。AWB自身の`tier`/`approximate`と、ローカル`_qualityCache`の
   Tier A/Bを比較しないため、AWBが低品質（Tier C・approximate）でもローカルにもっと良い
   キャッシュがあれば無視して低品質側を表示してしまう可能性がある。

## 今回実施したこと（実装はここまで。修正は行っていない）

### 1. 診断ログの拡張（`script.js`、本番ロジックは無変更）

- **監視対象を固定8領地→自ギルド所有全領地に拡張**（`getWatchTargetGuildUuid()`を追加）。
  `WATCH_TERRITORY_BASE_NAMES`（従来の固定8領地）のうち、その回の`liveData`で所有者が
  確認できた最初の領地の所有ギルドを「監視対象ギルド」とし、`getOwnedNamesForGuild()`で
  その回の全所有領地を対象にする。
- **`buildWatchEntry(name)`を拡張**し、各領地について以下を追加で記録する:
  - `awb`: `_awbEstimates`にこの領地のエントリがあるか（`hasEntry`）、あれば`tier`・
    `approximate`・`levels`のうち非null数（`nonNullLevelsCount`）
  - `displayedSource`/`displayedTier`: `showLiveTooltip()`と全く同じ優先順位判定
    （1: AWB採用可 2: ローカル`_qualityCache` 3: 現在ポーリングの生の確定推定
    4: 簡易推定）を複製し、実際にどの経路が表示に使われるかを判定した結果
  - `localCache`: AWBが採用された場合でも参考として記録する、ローカル`_qualityCache`の
    有無・tier・品質・観測時刻からの経過時間（`ageMs`）・`resourceMismatchStreak`
- **`logWatchSnapshot()`のレコードに`awbActiveThisRound`を追加**（`_awbEstimates !== null`、
  すなわちその回`computeGlobalTransferPhase()`/`updateQualityCache()`がスキップされたか
  どうかと同義）と、`guildUuid`/`ownedCount`を追加した。

`showLiveTooltip()`・`fetchLiveTerritoryData()`本体のロジックは一切変更していない。

### 2. 動作確認（Playwrightで実施）

`?watch=1`を付けたページでLiveモードをONにし、実際の自前Cloudflare Worker経由の
Wynncraft API・AWB共有バックエンドに対して疎通確認した（`WATCH_LOG_INTERVAL_MS`を
一時的に5秒に短縮したテスト用コピーで検証、検証後は削除し本番の`script.js`は無変更）。

- コンソールエラー・ページ例外は0件。
- 実際に自ギルド（Kingdom Foxes、観測時点で50領地所有）の全所有領地に対して
  `[watch]`ログが正しい形式で出力されることを確認した。
- **この20秒間・50領地×2回分のごく短いサンプルでも、96件（100%）が
  `displayedSource==='awb'`かつ`awb.tier==='C'`かつ`approximate===true`だった。**
  同時に`localCache.exists`は全件`false`（観測期間が短すぎてローカル`_qualityCache`が
  一度も構築されていないため）。これは「仮説1（ローカル計算の飢餓化）」を示唆する一例では
  あるが、20秒・1スナップショットのみのデータであり、母数として不十分なため結論扱いはしない。

### 3. 分析スクリプトを用意

`scratchpad/awb-tier-investigation/analyze.mjs`（gitignore対象、リポジトリには含まれない）。
`exportWatchLog()`が出力するJSON（複数ファイル可）を読み込み、以下を集計する:

- AWBカバレッジ率（エントリ無し／levels全null／実際に採用された、の内訳）
- AWBの品質分布（Tier A/B/C・approximateの内訳）
- 「AWBが低品質(Tier C/approximate)で採用されたが、ローカルにTier A/Bキャッシュが
  存在した」ケースの発生率
- ローカル計算スキップ率（`awbActiveThisRound`の割合）
- ローカルキャッシュの陳腐化（AWB不採用時の`localCache.ageMs`が観測期間を通じて
  単調増加し続けているか＝更新されず古いままか）

使い方:
```bash
node scratchpad/awb-tier-investigation/analyze.mjs watch-log-2026-08-28T....json
```

## まだ出来ていないこと（次のステップ）

**実際のギルド運用中の数時間規模のデータ収集は、ブラウザ操作を伴うためこちらでは代行できない。**
ユーザー側で以下を実施する必要がある。

1. 通常のURL（`?watch=1`を付ける、`?diag=1`は不要）でLiveモードをONにし、実際のギルド運用中に
   数時間（過去の検証実績である36分〜168分規模を目安に、可能ならもう少し長く）放置する。
2. 観測が終わったらブラウザのコンソールで`exportWatchLog()`を実行し、JSONファイルを取得する
   （自動でダウンロードされる）。
3. 取得したJSONを渡してもらえれば、上記`analyze.mjs`で集計し、この報告書を実データに基づく
   結論付きで更新する。

複数回に分けて収集したJSONファイルはそのまま`analyze.mjs`に複数渡せば結合して集計できる。

## 注意事項

- 今回追加した診断ログはCLAUDE.mdの既存の`[phase]`/`[sample]`/`[cache-diag]`と同様、
  調査後に削除予定の一時コードという位置づけ。`WATCH_LOGGING_ENABLED`（`?watch=1`）が
  falseの通常利用時は一切コストが増えない。
- 本ファイルは調査報告であり、修正の実装はまだ行っていない。データが揃い次第、
  対策案（表示優先順位にAWBのtier/approximateとローカルキャッシュの品質を比較するロジックを
  加える等）を検討する。
