const { Router } = require('express');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = Router();

// List workflows
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM workflows ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Get workflow
router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM workflows WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });

    const { rows: runs } = await db.query(
      'SELECT * FROM workflow_runs WHERE workflow_id = $1 ORDER BY started_at DESC LIMIT 20',
      [req.params.id]
    );

    res.json({ ...rows[0], recent_runs: runs });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Create workflow
router.post('/', authenticate, authorize('admin'), validateBody({
  name: { required: true, maxLength: 255 },
  trigger: { required: true },
}), async (req, res) => {
  try {
    const { name, description, trigger, trigger_conditions, steps } = req.body;
    const { rows } = await db.query(
      `INSERT INTO workflows (name, description, trigger, trigger_conditions, steps)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description, trigger, JSON.stringify(trigger_conditions || {}), JSON.stringify(steps || [])]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Update workflow
router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, trigger, trigger_conditions, steps, active } = req.body;
    const { rows } = await db.query(
      `UPDATE workflows SET name = COALESCE($1, name), description = COALESCE($2, description),
       trigger = COALESCE($3, trigger), trigger_conditions = COALESCE($4, trigger_conditions),
       steps = COALESCE($5, steps), active = COALESCE($6, active)
       WHERE id = $7 RETURNING *`,
      [name, description, trigger, trigger_conditions ? JSON.stringify(trigger_conditions) : null,
       steps ? JSON.stringify(steps) : null, active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, description, trigger, trigger_conditions, steps, active } = req.body;
    const { rows } = await db.query(
      `UPDATE workflows SET name = COALESCE($1, name), description = COALESCE($2, description),
       trigger = COALESCE($3, trigger), trigger_conditions = COALESCE($4, trigger_conditions),
       steps = COALESCE($5, steps), active = COALESCE($6, active)
       WHERE id = $7 RETURNING *`,
      [name, description, trigger, trigger_conditions ? JSON.stringify(trigger_conditions) : null,
       steps ? JSON.stringify(steps) : null, active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Delete workflow
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM workflows WHERE id = $1', [req.params.id]);
    res.json({ message: 'Workflow eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
