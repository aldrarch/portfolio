"""Мини-сервер для локального просмотра портфолио.
Отдаёт файлы с Cache-Control: no-store, чтобы браузер всегда брал свежие версии.
Запуск:  py tools/serve.py [порт]
"""
import http.server
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8642
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    os.chdir(ROOT)
    server = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), NoCacheHandler)
    print(f"Serving {ROOT} at http://127.0.0.1:{PORT}/index.html")
    server.serve_forever()
