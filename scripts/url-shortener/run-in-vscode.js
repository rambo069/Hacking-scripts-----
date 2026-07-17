const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const urlModule = require('url');

const PORT = process.env.PORT || 3000;
const STORE_FILE = path.join(__dirname, 'store.json');

let store = {};
try {
  if (fs.existsSync(STORE_FILE)) store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')) || {};
} catch (e) {
  console.error('Failed to load store:', e.message);
}

function saveStore() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save store:', e.message);
  }
}

function genId() {
  return crypto.randomBytes(4).toString('hex');
}

const INDEX_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>URL Shortener</title>
<style>body{font-family:Arial;margin:40px auto;max-width:700px;padding:0 16px}input{width:100%;padding:8px;margin:8px 0}button{padding:8px 12px}.result{margin-top:12px}</style>
</head><body>
<h1>Simple URL Shortener (single file)</h1>
<form id="form"><label for="url">URL</label><input id="url" type="url" required placeholder="https://example.com"><button type="submit">Shorten</button></form>
<div id="result" class="result"></div>
<script>
document.getElementById('form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const url = document.getElementById('url').value;
  document.getElementById('result').textContent='Shortening...';
  try{
    const res=await fetch('/shorten',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})});
    const data=await res.json();
    if(res.ok) document.getElementById('result').innerHTML=`Short URL: <a href="${data.short}" target="_blank">${data.short}</a>`;
    else document.getElementById('result').textContent=data.error||'Error';
  }catch(e){document.getElementById('result').textContent='Network error'}
});
</script>
</body></html>`;

const server = http.createServer((req, res) => {
  const parsed = urlModule.parse(req.url, true);
  if (req.method === 'GET' && parsed.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(INDEX_HTML);
  }

  if (req.method === 'POST' && parsed.pathname === '/shorten') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const obj = JSON.parse(body);
        const { url } = obj;
        if (!url || !(url.startsWith('http://') || url.startsWith('https://'))) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Invalid or missing url (must start with http:// or https://)' }));
        }
        const id = genId();
        store[id] = url;
        saveStore();
        const short = `http://${req.headers.host}/${id}`;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ id, short }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // try redirect by id
  if (req.method === 'GET') {
    const id = parsed.pathname.replace(/^\//, '');
    if (id && store[id]) {
      res.writeHead(302, { Location: store[id] });
      return res.end();
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Single-file server listening on http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop');
});
