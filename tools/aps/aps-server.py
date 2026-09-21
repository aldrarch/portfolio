"""Локальный токен-сервер APS (stdlib only): GET /api/aps/token
Читает APS_CLIENT_ID / APS_CLIENT_SECRET из файла .env рядом с portfolio-site.
Запуск:  py tools/aps/aps-server.py 8643
"""
import base64, json, os, sys, urllib.request, urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8643

def read_env():
    p = os.path.join(ROOT, '.env')
    if os.path.exists(p):
        for line in open(p, encoding='utf-8'):
            if '=' in line and not line.strip().startswith('#'):
                k, v = line.strip().split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

class H(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store')
    def do_GET(self):
        if self.path.startswith('/api/aps/token'):
            cid = os.environ.get('APS_CLIENT_ID', '')
            sec = os.environ.get('APS_CLIENT_SECRET', '')
            if not cid or not sec:
                self._json(500, {'error': 'нет APS_CLIENT_ID/APS_CLIENT_SECRET в .env'})
                return
            data = urllib.parse.urlencode({
                'client_id': cid, 'client_secret': sec,
                'grant_type': 'client_credentials',
                'scope': 'data:read viewables:read bucket:read',
            }).encode()
            req = urllib.request.Request(
                'https://developer.api.autodesk.com/authentication/v1/authenticate',
                data=data, method='POST')
            try:
                with urllib.request.urlopen(req, timeout=15) as r:
                    tok = json.loads(r.read())
                self._json(200, {'access_token': tok['access_token'],
                                 'expires_in': tok.get('expires_in', 0)})
            except Exception as e:
                self._json(502, {'error': str(e)})
        else:
            self._json(404, {'error': 'not found'})
    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self._cors(); self.end_headers()
        self.wfile.write(body)
    def log_message(self, *a): pass

if __name__ == '__main__':
    read_env()
    print(f'APS token server on http://127.0.0.1:{PORT}/api/aps/token')
    ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
