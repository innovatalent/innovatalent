const { Router } = require('express');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = Router();

// List tasks
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, priority, assigned_to, client_id } = req.query;
    const conditions = []; const params = []; let idx = 1;

    if (status) { conditions.push(`t.status = $${idx++}`); params.push(status); }
    if (priority) { conditions.push(`t.priority = $${idx++}`); params.push(priority); }
    if (assigned_to) { conditions.push(`t.assigned_to = $${idx++}`); params.push(assigned_to); }
    if (client_id) { conditions.push(`t.client_id = $${idx++}`); params.push(client_id); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT t.*, c.company_name, ca.name as candidate_name
       FROM tasks t
       LEFT JOIN clients c ON t.client_id = c.id
       LEFT JOIN candidates ca ON t.candidate_id = ca.id
       ${where} ORDER BY
         CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         t.due_date ASC NULLS LAST, t.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Create task
router.post('/', authenticate, authorize('admin'), validateBody({
  title: { required: true, maxLength: 500 },
  priority: { required: false, enum: ['low', 'medium', 'high', 'urgent'] },
  status: { required: false, enum: ['todo', 'in_progress', 'done', 'canceled'] },
}), async (req, res) => {
  try {
    const { title, description, assigned_to, client_id, candidate_id, priority, due_date } = req.body;
    const { rows } = await db.query(
      `INSERT INTO tasks (title, description, assigned_to, client_id, candidate_id, priority, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, description, assigned_to, client_id, candidate_id, priority || 'medium', due_date]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Update task
router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title, description, priority, status, due_date, assigned_to } = req.body;
    const updates = []; const params = []; let idx = 1;

    if (title) { updates.push(`title = $${idx++}`); params.push(title); }
    if (description !== undefined) { updates.push(`description = $${idx++}`); params.push(description); }
    if (priority) { updates.push(`priority = $${idx++}`); params.push(priority); }
    if (status) {
      updates.push(`status = $${idx++}`); params.push(status);
      if (status === 'done') { updates.push(`completed_at = NOW()`); }
    }
    if (due_date !== undefined) { updates.push(`due_date = $${idx++}`); params.push(due_date); }
    if (assigned_to !== undefined) { updates.push(`assigned_to = $${idx++}`); params.push(assigned_to); }

    if (!updates.length) return res.status(400).json({ error: 'Nada que actualizar' });

    params.push(req.params.id);
    const { rows } = await db.query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, params);
    if (!rows.length) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Delete task
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Tarea eliminada' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
