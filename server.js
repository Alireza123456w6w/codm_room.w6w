import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const WORKER_ORIGIN = process.env.WORKER_ORIGIN || 'https://codm-room.4-k5bbin1ys6uuriq0ud2nrhdph4-p.workers.dev';

app.use(cors());
app.use(express.json());

// Proxy or fallback for API routes
app.all('/api/*', async (req, res) => {
  const targetUrl = `${WORKER_ORIGIN}${req.url}`;
  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {})
      }
    };
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && Object.keys(req.body || {}).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return res.status(response.status).json(data);
    }
    const text = await response.text();
    return res.status(response.status).send(text);
  } catch (err) {
    console.warn(`[Proxy] Worker unreachable at ${targetUrl}:`, err.message);
    if (req.path === '/api/health') {
      return res.json({ ok: true, service: 'CODM Rooms Platform (Worker Proxy)', version: '2.2.0' });
    }
    if (req.path === '/api/public/stats') {
      return res.json({ ok: true, users: 0, rooms: 0, openRooms: 0, entries: 0, prizesPaid: 0 });
    }
    if (req.path === '/api/rooms') {
      return res.json({ ok: true, rooms: [] });
    }
    return res.status(503).json({ ok: false, error: 'Worker is currently connecting' });
  }
});

import fs from 'fs';

// Serve static frontend assets (prefer dist/ from vite build)
const staticDir = fs.existsSync(path.join(__dirname, 'dist'))
  ? path.join(__dirname, 'dist')
  : path.join(__dirname, 'docs');

app.use(express.static(staticDir));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[CODM ROOMS] Server running at http://0.0.0.0:${PORT}`);
});
