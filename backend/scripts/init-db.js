// Creates the tables defined in schema.sql using the same environment
// variables as the app, so it works for local MySQL and for remote/managed
// databases (including SSL) without needing the mysql command-line client.
//
//   npm run db:init
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dbConfig = require('../config/dbConfig');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  let conn;
  try {
    console.log(`Connecting to ${dbConfig.host}:${dbConfig.port}/${dbConfig.database} ...`);
    conn = await mysql.createConnection({ ...dbConfig, multipleStatements: true });
    await conn.query(sql);
    const [tables] = await conn.query('SHOW TABLES');
    console.log('Done. Tables present:', tables.map((r) => Object.values(r)[0]).join(', '));
  } catch (err) {
    console.error('Database setup failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (conn) await conn.end();
  }
})();
