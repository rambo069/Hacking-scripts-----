# Simple URL Shortener

Minimal Node.js + Express URL shortener.

Setup

1. Install dependencies

```bash
cd url-shortener
npm install
```

2. Run

```bash
npm start
```

Open http://localhost:3000 in your browser.

Notes

- This uses an on-disk `store.json` file for persistence and a simple random hex id generator. Not suitable for production.
- To reset stored URLs delete `store.json`.
