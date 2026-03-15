const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const query = async (sql, params) => {
  const result = await pool.query(sql, params);
  return result;
};

const getAll = async () => {
  const result = await pool.query('SELECT * FROM orders');
  return result.rows;
};

module.exports = { query, getAll };