// eco-simulator専用のCORSプロキシ。第三者の無料中継サービス（corsproxy.io）への
// 依存を解消するために導入した。api.wynncraft.com / athena.wynntils.comの2ドメイン
// のみを転送先ホワイトリストとして許可し、レスポンスにeco-simulator（GitHub Pages）
// 向けのCORSヘッダーを付与して返す。

const PRODUCTION_ORIGIN = 'https://sabunori1219.github.io';
// dev-server.py（CLAUDE.md記載のローカル開発用サーバー、ポート8080固定）で開いた
// ページからのアクセスも許可する。このOriginはブラウザがページのURLから自動生成する
// 値であり、他人が名乗るには実際にlocalhost:8080でページを開く必要がある＝この
// 開発者自身のマシン上でしか送信されえないため、許可しても第三者による悪用経路には
// ならない。
const LOCAL_DEV_ORIGINS = ['http://localhost:8080', 'http://127.0.0.1:8080'];
const ALLOWED_ORIGINS = [PRODUCTION_ORIGIN, ...LOCAL_DEV_ORIGINS];
const ALLOWED_HOSTS = ['api.wynncraft.com', 'athena.wynntils.com'];

function corsHeaders(matchedOrigin) {
  return {
    'Access-Control-Allow-Origin': matchedOrigin || PRODUCTION_ORIGIN,
    'Access-Control-Allow-Methods': 'GET',
  };
}

export default {
  async fetch(request) {
    const requestOrigin = request.headers.get('Origin');
    const corsOrigin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : PRODUCTION_ORIGIN;

    if (request.method === 'OPTIONS') {
      // プリフライトリクエスト。ボディ無しでCORSヘッダーのみ返す。
      return new Response(null, { status: 204, headers: corsHeaders(corsOrigin) });
    }

    const requestUrl = new URL(request.url);
    if (requestUrl.pathname !== '/proxy') {
      return new Response('Not Found', { status: 404 });
    }
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const targetParam = requestUrl.searchParams.get('url');
    if (!targetParam) {
      return new Response('Bad Request: missing url parameter', { status: 400 });
    }

    let targetUrl;
    try {
      targetUrl = new URL(targetParam);
    } catch {
      return new Response('Bad Request: invalid url parameter', { status: 400 });
    }

    // 転送先ドメインのホワイトリストチェック。一致しなければ転送せず403。
    if (targetUrl.protocol !== 'https:' || !ALLOWED_HOSTS.includes(targetUrl.hostname)) {
      return new Response('Forbidden: host not allowed', { status: 403 });
    }

    // Originチェック: eco-simulator（本番/ローカル開発）以外のOriginからのリクエストは
    // 拒否する。Originヘッダーが無いリクエスト（curl等の非ブラウザクライアント、直接
    // URLアクセス）は許可する。ブラウザ以外のクライアントはOriginヘッダー自体を任意に
    // 偽装できるため、ここで弾いても実質的な防御にはならない（このチェックが意味を持つ
    // のは、Originを自分で偽装できないブラウザ上のスクリプトが相手のときだけ）。転送先は
    // ホワイトリストで2ドメインの公開ゲームAPIに限定済みでもあるため、無Originを許可
    // しても秘匿情報の漏洩や書き込み操作にはつながらない。
    if (requestOrigin !== null && !ALLOWED_ORIGINS.includes(requestOrigin)) {
      return new Response('Forbidden: origin not allowed', { status: 403 });
    }

    let upstreamResponse;
    try {
      upstreamResponse = await fetch(targetUrl.toString());
    } catch (err) {
      // 転送先へのfetch自体が失敗した場合（DNS/タイムアウト等）。呼び出し元
      // （script.js）はres.okで判定するため、例外にせずレスポンスとして返す。
      return new Response(`Bad Gateway: ${err.message || 'fetch failed'}`, {
        status: 502,
        headers: corsHeaders(corsOrigin),
      });
    }

    // ステータス・ボディは転送先のものをそのまま返す（エラーの隠蔽をしない）。
    const response = new Response(upstreamResponse.body, upstreamResponse);
    for (const [key, value] of Object.entries(corsHeaders(corsOrigin))) {
      response.headers.set(key, value);
    }
    return response;
  },
};
