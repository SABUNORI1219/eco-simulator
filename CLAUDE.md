# Wynncraft Guild War Economy Simulator

WynncraftのGuild Warにおける領地管理（Economy/Eco）をブラウザ上でシミュレートするツール。

## ファイル構成

```
eco-simulator/
├── index.html          # HTML構造のみ
├── style.css           # スタイル
├── script.js           # ロジック全体
├── territories.json    # 全437領地のデータ（Location, Trading Routes, resources）
├── main-map.png        # マップ画像（4608×6644px）※手動配置が必要
└── CLAUDE.md
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

## 設定の変更場所

ゲームデータの定数はすべて `script.js` の先頭にまとめてある。

| 定数 | 内容 |
|---|---|
| `MAP_CONFIG` | マップ画像サイズ・ゲーム座標範囲 |
| `DEFENSE_CONFIG` | DefenseレベルごとのHP/DPS/コスト |
| `BONUS_CONFIG` | ボーナス15種のリソース・基本コスト・生産ボーナス率 |

## 座標系

- ゲーム座標 → 画像ピクセル → キャンバス画面座標 の2段変換
- Y軸反転あり（ゲームのY負の大きい値 = 南 = 画像の下）
- `gameMinX=-2350, gameMaxX=1600, gameMinY=-6600, gameMaxY=-200`

## 主要な関数（script.js）

| 関数 | 役割 |
|---|---|
| `init()` | territories.json読み込み・マップ画像ロード・初期描画 |
| `draw()` | キャンバス全体の再描画（マップ→接続線→領地） |
| `hitTest(cx, cy)` | 登録済み領地のクリック/ホバー判定 |
| `calcTerritoryProduction(name)` | Rateボーナス適用後の生産量を計算 |
| `calcTerritoryConsumption(name)` | Defense + ボーナスコストの合計を計算 |
| `calcOverallBalance()` | Overview表示用の全体収支を集計 |
| `loadGuilds()` | Wynncraft APIからリアルタイムのギルド一覧を取得 |
| `openModal(name)` | 領地設定モーダルを開く |
| `saveModal()` | モーダルの設定を保存してUIを更新 |

## 外部API

- `https://api.wynncraft.com/v3/guild/list/territory`
  - レスポンス形式: `{ [territoryName]: { guild: { name, prefix, uuid } } }`
  - APIが使えない場合は「— API unavailable —」を表示してグレースフルデグラデーション

## ゲームメカニクスの参考

- https://wynncraft.wiki.gg/wiki/Guild_War
- ボーナスコストはレベルNで `baseCost × 2^(N-1)` /hr（累積加算）
- Rateボーナスは各レベルで基本生産量の +20% ずつ増加
