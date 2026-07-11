const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const pool = require('./db/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const clientPath = path.join(__dirname, '../../client');
app.use(express.static(clientPath));

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      ok: true,
      serverTime: result.rows[0].now
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      error: 'Database connection failed'
    });
  }
});

app.get('/api/test-user', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      error: 'Query failed'
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Pacemaker server running on http://localhost:${PORT}`);
});
