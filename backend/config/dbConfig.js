// Builds the MySQL connection settings from environment variables.
//
// Two ways to configure (the first one found wins):
//   1. DATABASE_URL = mysql://user:password@host:port/database
//      (this is the "Service URI" that Aiven, Railway, etc. give you)
//   2. DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME
//
// SSL (required by most managed MySQL providers):
//   - DB_CA_CERT = contents of the provider's CA certificate  -> verified TLS (best)
//   - DB_SSL=true                                            -> encrypted TLS, certificate not verified
require('./env');

function fromUrl(urlString) {
  const u = new URL(urlString);
  const sslMode = (u.searchParams.get('ssl-mode') || u.searchParams.get('sslmode') || '').toUpperCase();
  return {
    host: u.hostname,
    port: Number(u.port) || 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.replace(/^\//, '')),
    urlRequestsSsl: ['REQUIRED', 'REQUIRE', 'VERIFY_CA', 'VERIFY_IDENTITY'].includes(sslMode),
  };
}

function buildSsl(urlRequestsSsl) {
  const ca = process.env.DB_CA_CERT;
  if (ca) {
    // Allow the PEM to be pasted as a single line with literal "\n" sequences.
    return { ca: ca.replace(/\\n/g, '\n'), rejectUnauthorized: true };
  }
  if (process.env.DB_SSL === 'true' || urlRequestsSsl) {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

const base = process.env.DATABASE_URL
  ? fromUrl(process.env.DATABASE_URL)
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'budgetbridge',
      urlRequestsSsl: false,
    };

const { urlRequestsSsl, ...connection } = base;

module.exports = {
  ...connection,
  ssl: buildSsl(urlRequestsSsl),
  connectTimeout: 15000,
  // Return DATE columns as 'YYYY-MM-DD' strings (avoids off-by-one-day timezone bugs)
  // and DECIMAL columns as real numbers instead of strings.
  dateStrings: true,
  decimalNumbers: true,
};
