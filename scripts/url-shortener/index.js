const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DATA_DIR = path.join(__dirname);
const STORE_FILE = path.join(DATA_DIR, 'store.json');

let store = new Map();

function loadStore() {
  if (fs.existsSync(STORE_FILE)) {
    try {
      const obj = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
      store = new Map(Object.entries(obj));
    } catch (e) {
      console.error('Failed to load store:', e);
    }
  }
}

function saveStore() {
  try {
    const obj = Object.fromEntries(store);
    fs.writeFileSync(STORE_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save store:', e);
  }
}

loadStore();

function genId() {
  return crypto.randomBytes(4).toString('hex');
}

app.post('/shorten', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  const id = genId();
  store.set(id, url);
  saveStore();

  const short = `${req.protocol}://${req.get('host')}/${id}`;
  res.json({ id, short });
});

app.get('/:id', (req, res) => {
  const id = req.params.id;
  const dest = store.get(id);
  if (dest) return res.redirect(dest);
  return res.status(404).send('Not found');
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
