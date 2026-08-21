"""ローカル開発用サーバー。全レスポンスにキャッシュ無効化ヘッダーを付与する。

python -m http.server はキャッシュ制御ヘッダーを一切送らないため、ブラウザが
script.js/eco-logic.js/index.html 等を古いまま使い続けることがある
（CLAUDE.md「守備ステータスの推定」内、問題1調査時にも疑われた要因）。

使い方: python dev-server.py [ポート番号（省略時8080）]
"""
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class NoCacheHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = HTTPServer(('0.0.0.0', port), NoCacheHTTPRequestHandler)
    print(f'Serving on http://localhost:{port} (Cache-Control: no-store)')
    server.serve_forever()
