"""Загрузка RVT в APS Model Derivative (stdlib only).
Использование:  py tools/aps/aps-upload.py projects/mars/model.rvt
Прочитает .env рядом с portfolio-site (APS_CLIENT_ID / APS_CLIENT_SECRET),
создаст bucket aldrarch-aps-models (при необходимости), зальёт файл,
запустит перевод SVF2 и напечатает URN для js/aps/aps-models.json.
"""
import base64, json, os, sys, time, urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUCKET = 'aldrarch-aps-models'
API = 'https://developer.api.autodesk.com'

def env(k):
    p = os.path.join(ROOT, '.env')
    if os.path.exists(p):
        for line in open(p, encoding='utf-8'):
            if line.strip().startswith(k + '='):
                return line.strip().split('=', 1)[1].strip()
    return os.environ.get(k, '')

def api(method, path, token=None, data=None, ctype='application/json'):
    req = urllib.request.Request(API + path, method=method,
        data=data.encode() if isinstance(data, str) else data)
    if token: req.add_header('Authorization', 'Bearer ' + token)
    if ctype: req.add_header('Content-Type', ctype)
    with urllib.request.urlopen(req, timeout=60) as r:
        body = r.read().decode()
        return json.loads(body) if body else {}

def main():
    rvt = sys.argv[1] if len(sys.argv) > 1 else ''
    if not os.path.exists(rvt):
        sys.exit('Файл не найден: ' + rvt)
    cid, sec = env('APS_CLIENT_ID'), env('APS_CLIENT_SECRET')
    if not cid or not sec:
        sys.exit('Создайте portfolio-site/.env: APS_CLIENT_ID=... / APS_CLIENT_SECRET=...')
    tok = api('POST', '/authentication/v1/authenticate',
        data=urllib.parse.urlencode({'client_id': cid, 'client_secret': sec,
            'grant_type': 'client_credentials', 'scope': 'data:write data:read viewables:read bucket:create bucket:read'}))
    t = tok['access_token']
    try:
        api('POST', '/oss/v2/buckets', t, json.dumps({
            'bucketKey': BUCKET, 'policyKey': 'persistent'}))
        print('bucket создан')
    except Exception as e:
        print('bucket существует (ок)')
    key = os.path.basename(rvt)
    with open(rvt, 'rb') as f:
        api('PUT', '/oss/v2/buckets/' + base64.urlsafe_b64encode(BUCKET.encode()).decode() + '/objects/' + key,
            t, f.read(), 'application/octet-stream')
    print('загружено:', key)
    urn_raw = 'urn:adsk.objects:os.object:' + BUCKET + '/' + key
    urn = base64.b64encode(urn_raw.encode()).decode()
    api('POST', '/modelderivative/v2/designdata/job', t, json.dumps({
        'input': {'urn': urn_raw},
        'output': {'formats': [{'type': 'SVF2', 'views': ['3D']}]}}))
    print('перевод запущен, urn (base64):', urn)
    for i in range(60):
        time.sleep(10)
        man = api('GET', '/modelderivative/v2/designdata/' + urn + '/manifest', t)
        st = man.get('status')
        print(i * 10, 'сек:', st)
        if st in ('complete', 'failed', 'error'): break
    if st == 'complete':
        print('\nГотово. Впишите в js/aps/aps-models.json: "urn": "' + urn + '"')
    else:
        print('\nПеревод не завершён — проверьте статус позже тем же запросом manifest.')

if __name__ == '__main__':
    main()
