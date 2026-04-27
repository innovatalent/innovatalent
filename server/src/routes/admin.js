const { Router } = require('express');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { stringify } = require('csv-stringify/sync');

const router = Router();

// Dashboard stats
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [clients, candidates, subs, payments, meetings, messages] = await Promise.all([
      db.query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE pipeline_status = 'new') as new,
        COUNT(*) FILTER (WHERE pipeline_status = 'contacted') as contacted,
        COUNT(*) FILTER (WHERE pipeline_status = 'qualified') as qualified,
        COUNT(*) FILTER (WHERE pipeline_status = 'proposal') as proposal,
        COUNT(*) FILTER (WHERE pipeline_status = 'negotiation') as negotiation,
        COUNT(*) FILTER (WHERE pipeline_status = 'won') as won,
        COUNT(*) FILTER (WHERE pipeline_status = 'lost') as lost,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7_days,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as last_30_days
        FROM clients`),
      db.query('SELECT COUNT(*) as total FROM candidates'),
      db.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'active') as active FROM subscriptions`),
      db.query(`SELECT
        COUNT(*) as total,
        COALESCE(SUM(amount) FILTER (WHERE status = 'succeeded'), 0) as revenue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'succeeded' AND created_at >= NOW() - INTERVAL '30 days'), 0) as revenue_30d
        FROM payments`),
      db.query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'scheduled') as upcoming,
        COUNT(*) FILTER (WHERE date >= CURRENT_DATE) as future
        FROM meetings`),
      db.query(`SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'sent') as sent,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
        FROM messages`),
    ]);

    res.json({
      clients: clients.rows[0],
      candidates: candidates.rows[0],
      subscriptions: subs.rows[0],
      payments: {
        ...payments.rows[0],
        revenue: parseInt(payments.rows[0].revenue) / 100,
        revenue_30d: parseInt(payments.rows[0].revenue_30d) / 100,
      },
      meetings: meetings.rows[0],
      messages: messages.rows[0],
    });
  } catch (err) {
    console.error('[ADMIN] Stats error:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Pipeline Kanban data
router.get('/pipeline', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, company_name, contact_name, email, services, urgency, lead_score, pipeline_status, tags, created_at
       FROM clients ORDER BY lead_score DESC, created_at DESC`
    );

    const pipeline = {
      new: [], contacted: [], qualified: [], proposal: [], negotiation: [], won: [], lost: [],
    };

    for (const client of rows) {
      if (pipeline[client.pipeline_status]) {
        pipeline[client.pipeline_status].push(client);
      }
    }

    res.json(pipeline);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Recent activity
router.get('/activity', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT al.*, u.email as user_email
       FROM activity_log al LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Export clients CSV
router.get('/export/clients', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT company_name, contact_name, email, whatsapp, country, industry, employee_count,
              array_to_string(services, ', ') as services, urgency, budget, pipeline_status, lead_score, created_at
       FROM clients ORDER BY created_at DESC`
    );

    const csv = stringify(rows, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=clients.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Error al exportar' });
  }
});

// Export candidates CSV
router.get('/export/candidates', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT name, email, whatsapp, country, city, linkedin, desired_role, seniority,
              array_to_string(skills, ', ') as skills, english, salary_expectation, availability, work_mode, created_at
       FROM candidates ORDER BY created_at DESC`
    );

    const csv = stringify(rows, { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=candidates.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Error al exportar' });
  }
});

// Automation sequences management
router.get('/sequences', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT s.*, json_agg(st ORDER BY st.step_order) as steps
       FROM automation_sequences s
       LEFT JOIN automation_steps st ON s.id = st.sequence_id
       GROUP BY s.id ORDER BY s.created_at`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Update automation sequence steps
router.put('/sequences/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, active, steps } = req.body;
    const { id } = req.params;

    await db.transaction(async (client) => {
      if (name !== undefined || active !== undefined) {
        const updates = [];
        const params = [];
        let idx = 1;
        if (name) { updates.push(`name = $${idx++}`); params.push(name); }
        if (active !== undefined) { updates.push(`active = $${idx++}`); params.push(active); }
        params.push(id);
        await client.query(`UPDATE automation_sequences SET ${updates.join(', ')} WHERE id = $${idx}`, params);
      }

      if (steps && Array.isArray(steps)) {
        await client.query('DELETE FROM automation_steps WHERE sequence_id = $1', [id]);
        for (const step of steps) {
          await client.query(
            `INSERT INTO automation_steps (sequence_id, step_order, delay_days, channel, subject, body)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, step.step_order, step.delay_days, step.channel, step.subject, step.body]
          );
        }
      }
    });

    res.json({ message: 'Secuencia actualizada' });
  } catch (err) {
    console.error('[ADMIN] Sequence update error:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Interview requests
router.get('/interviews', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT ir.*, c.company_name, c.contact_name, ca.name as candidate_name, ca.desired_role
       FROM interview_requests ir
       JOIN clients c ON ir.client_id = c.id
       JOIN candidates ca ON ir.candidate_id = ca.id
       ORDER BY ir.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
