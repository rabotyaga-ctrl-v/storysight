from flask import Flask, request, abort
import subprocess
import hmac
import hashlib

app = Flask(__name__)

# Секрет, который ты укажешь в настройках webhook GitHub (чтобы проверить подлинность)
SECRET = b'my_very_secret_key_123'

def verify_signature(data, signature):
    mac = hmac.new(SECRET, data, hashlib.sha256)
    expected = 'sha256=' + mac.hexdigest()
    return hmac.compare_digest(expected, signature)

@app.route('/update', methods=['POST'])
def update():
    signature = request.headers.get('X-Hub-Signature-256')
    print('Received signature:', signature)
    print('Request data:', request.data)

    if signature is None or not verify_signature(request.data, signature):
        print('Signature verification failed')
        abort(403)
    print('Signature verification succeeded')

    subprocess.Popen(['/var/www/storysight/update.sh'])
    return 'Update started', 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9000)

