const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { isProd, PORT, CLIENT_URLS } = require('./config/env');
const db = require('./config/db');

const app = express();

// Render/Railway/Heroku put a reverse proxy in front of the app. Trusting it
// lets rate limiting and logs see the real client IP.
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        // Keeps `npm start` working over plain http://localhost; hosting
        // platforms already force HTTPS.
        'upgrade-insecure-requests': null,
      },
    },
  })
);

// CORS is only relevant when the frontend lives on a DIFFERENT domain than this
// server. When Express serves the React build itself (default), nothing to do.
app.use(cors({ origin: CLIENT_URLS.length ? CLIENT_URLS : !isProd }));
app.use(express.json({ limit: '100kb' }));

// ---- Rate limiting -------------------------------------------------------
const limiterOptions = { standardHeaders: 'draft-7', legacyHeaders: false };
const authLimiter = rateLimit({
  ...limiterOptions,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
});
const apiLimiter = rateLimit({
  ...limiterOptions,
  windowMs: 15 * 60 * 1000,
  limit: 600,
  message: { message: 'Too many requests. Please slow down.' },
});

// ---- Health check (used by the hosting platform) ---------------------------
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Health check failed:', err.message);
    res.status(503).json({ status: 'database unavailable' });
  }
});

// ---- API routes --------------------------------------------------------------
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

// ---- Serve the React build (single-service deployment) -----------------------
const buildDir = path.join(__dirname, '..', 'frontend', 'build');
const indexHtml = path.join(buildDir, 'index.html');

if (fs.existsSync(indexHtml)) {
  app.use(
    express.static(buildDir, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        } else if (filePath.includes(`${path.sep}static${path.sep}`)) {
          // CRA fingerprints these filenames, so they can be cached "forever".
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );
  // React Router: any other GET returns the app shell (but missing files 404).
  app.get('*', (req, res) => {
    if (path.extname(req.path)) return res.status(404).end();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexHtml);
  });
} else {
  console.log('No frontend build found - running as API only.');
}

// ---- Error handler -----------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 ? 'Server error' : err.message });
});

// ---- Start + graceful shutdown ---------------------------------------------
const server = app.listen(PORT, () => {
  console.log(`BudgetBridge server running on port ${PORT} (${isProd ? 'production' : 'development'})`);
  db.query('SELECT 1').then(
    () => console.log('Database connection OK'),
    (err) => console.error(`Database connection FAILED: ${err.message}\n  -> check your DB_* / DATABASE_URL settings`)
  );
});

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down...`);
  server.close(() => db.end().finally(() => process.exit(0)));
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
