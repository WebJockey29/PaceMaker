const express = require('express');
const router = express.Router();
const pool = require('../db/db');

// Temporary fixed user for development
const DEV_USER_ID = 1;

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        user_id,
        name,
        date,
        type,
        distance_type,
        distance_km,
        goal_seconds,
        priority,
        notes,
        status,
        created_at,
        updated_at
       FROM events
       WHERE user_id = $1
       ORDER BY date ASC`,
      [DEV_USER_ID]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/events failed:', err);
    res.status(500).json({ ok: false, error: 'Failed to fetch events' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      name,
      date,
      type,
      distanceType,
      distanceKm,
      goalSeconds,
      priority,
      notes,
      status
    } = req.body;

    if (!name || !date || !distanceType) {
      return res.status(400).json({
        ok: false,
        error: 'name, date, and distanceType are required'
      });
    }

    const result = await pool.query(
      `INSERT INTO events (
        user_id,
        name,
        date,
        type,
        distance_type,
        distance_km,
        goal_seconds,
        priority,
        notes,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING
        id,
        user_id,
        name,
        date,
        type,
        distance_type,
        distance_km,
        goal_seconds,
        priority,
        notes,
        status,
        created_at,
        updated_at`,
      [
        DEV_USER_ID,
        name,
        date,
        type || 'race',
        distanceType,
        distanceKm || null,
        goalSeconds || null,
        priority || 'C',
        notes || '',
        status || 'planned'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /api/events failed:', err);
    res.status(500).json({ ok: false, error: 'Failed to create event' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const eventId = Number(req.params.id);

    if (!Number.isFinite(eventId)) {
      return res.status(400).json({ ok: false, error: 'Invalid event id' });
    }

    const {
      name,
      date,
      type,
      distanceType,
      distanceKm,
      goalSeconds,
      priority,
      notes,
      status
    } = req.body;

    if (!name || !date || !distanceType) {
      return res.status(400).json({
        ok: false,
        error: 'name, date, and distanceType are required'
      });
    }

    const result = await pool.query(
      `UPDATE events
       SET
         name = $1,
         date = $2,
         type = $3,
         distance_type = $4,
         distance_km = $5,
         goal_seconds = $6,
         priority = $7,
         notes = $8,
         status = $9,
         updated_at = NOW()
       WHERE id = $10 AND user_id = $11
       RETURNING
         id,
         user_id,
         name,
         date,
         type,
         distance_type,
         distance_km,
         goal_seconds,
         priority,
         notes,
         status,
         created_at,
         updated_at`,
      [
        name,
        date,
        type || 'race',
        distanceType,
        distanceKm || null,
        goalSeconds || null,
        priority || 'C',
        notes || '',
        status || 'planned',
        eventId,
        DEV_USER_ID
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ ok: false, error: 'Event not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /api/events/:id failed:', err);
    res.status(500).json({ ok: false, error: 'Failed to update event' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const eventId = Number(req.params.id);

    if (!Number.isFinite(eventId)) {
      return res.status(400).json({ ok: false, error: 'Invalid event id' });
    }

    console.log('DELETE /api/events hit with id:', eventId, 'for user:', DEV_USER_ID);

    const result = await pool.query(
      `DELETE FROM events
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [eventId, DEV_USER_ID]
    );

    console.log('DELETE result rows:', result.rows);

    if (!result.rows.length) {
      return res.status(404).json({ ok: false, error: 'Event not found' });
    }

    res.json({
      ok: true,
      deletedId: result.rows[0].id
    });
  } catch (err) {
    console.error('DELETE /api/events/:id failed:', err);
    res.status(500).json({ ok: false, error: 'Failed to delete event' });
  }
});

module.exports = router;
