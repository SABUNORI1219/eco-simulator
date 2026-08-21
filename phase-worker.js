// Liveモードのグローバル転送位相f探索（EcoLogic.estimateGlobalTransferPhase）を
// メインスレッドから切り離して実行するためのWeb Worker。
// 候補空間の増加により実測で15〜40秒程度かかるため、メインスレッド（マップ描画・操作）をブロックしないようにする。
// eco-logic.jsはDOM非依存の純粋関数のみで構成されているため、そのままworker内でimportできる。
import * as EcoLogic from './eco-logic.js';

self.onmessage = (e) => {
  const { requestId, inputs } = e.data;
  const result = EcoLogic.estimateGlobalTransferPhase(inputs); // { f, coverage, exactlyOne, histogram, refinement } | null
  self.postMessage({ requestId, result });
};
