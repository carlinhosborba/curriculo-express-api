// src/db.js
require('dotenv').config();
const { Pool } = require('pg');

let pool; // cria só quando precisar

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      connectionTimeoutMillis: 5000
      // (sslmode=require já vem na URL do Neon)
    });
    pool.on('error', (err) => {
      console.error('Erro no pool PG:', err);
    });
  }
  return pool;
}

module.exports = {
  query: (text, params) => getPool().query(text, params),
  pool: () => getPool(),
};
