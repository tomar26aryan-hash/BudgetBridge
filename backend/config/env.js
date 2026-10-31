// Loads .env (local development only) and validates settings that must be
// correct before the server is allowed to start.
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

let jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  if (isProd) {
    throw new Error(
      'JWT_SECRET is not set. Generate one with:\n' +
      '  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    );
  }
  jwtSecret = 'dev-only-insecure-secret-do-not-use-in-production';
  console.warn('[warn] JWT_SECRET not set - using an insecure development secret.');
} else if (isProd && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET is too short. Use at least 32 characters in production.');
}

module.exports = {
  isProd,
  JWT_SECRET: jwtSecret,
  PORT: Number(process.env.PORT) || 5000,
  // Comma-separated list of browser origins allowed to call the API cross-origin.
  // Only needed if the frontend is hosted on a different domain than the backend.
  CLIENT_URLS: (process.env.CLIENT_URL || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean),
};
