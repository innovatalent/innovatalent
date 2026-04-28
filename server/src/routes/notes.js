const { Router } = require('express');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = Router();

// Get notes for entity
router.get('/:entityType/:entityId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT n.*, u.email as author_email FROM notes n LEFT JOIN users u ON n.user_id = u.id
       WHERE n.entity_type = $1 AND n.entity_id = $2 ORDER BY n.pinned DESC, n.created_at DESC`,
      [req.params.entityType, req.params.entityId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Add note
router.post('/:entityType/:entityId', authenticate, authorize('admin'), validateBody({
  body: { required: true, maxLength: 5000 },
}), async (req, res) => {
  try {
    const { rows } = await db.query(
      `INSERT INTO notes (entity_type, entity_id, user_id, body, pinned) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.entityType, req.params.entityId, req.user.id, req.body.body, req.body.pinned || false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Delete note
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM notes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Nota eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
