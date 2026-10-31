const mysql = require('mysql2');
const dbConfig = require('./dbConfig');

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE) || 10,
  queueLimit: 0,
  // Managed databases drop idle connections; keep-alive prevents "ECONNRESET" errors.
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

module.exports = pool.promise();
