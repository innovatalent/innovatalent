const { Router } = require('express');
const db = require('../config/db');
const env = require('../config/env');

const router = Router();

const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || 'innova-n8n-secret-2026';

function verifyWebhook(req, res, next) {
  const secret = req.headers['x-webhook-secret'];
  if (secret !== WEBHOOK_SECRET) return res.status(401).json({ error: 'Invalid webhook secret' });
  next();
}

// n8n → App: Send email/WhatsApp follow-up result
router.post('/n8n/follow-up-sent', verifyWebhook, async (req, res) => {
  try {
    const { client_id, channel, message, status } = req.body;
    await db.query(
      `INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES ('client', $1, 'auto_follow_up', $2)`,
      [client_id, JSON.stringify({ channel, message, status })]
    );
    if (status === 'sent') {
      await db.query(`UPDATE clients SET status = CASE WHEN status = 'new' THEN 'contacted' ELSE status END WHERE id = $1`, [client_id]);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// n8n → App: Update lead score from AI analysis
router.post('/n8n/lead-scored', verifyWebhook, async (req, res) => {
  try {
    const { client_id, score, analysis, recommended_action } = req.body;
    await db.query(
      `UPDATE clients SET notes = COALESCE(notes, '') || $1 WHERE id = $2`,
      ['\n\n[AI Score: ' + score + '] ' + (analysis || '') + ' → ' + (recommended_action || ''), client_id]
    );
    await db.query(
      `INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES ('client', $1, 'ai_scored', $2)`,
      [client_id, JSON.stringify({ score, analysis, recommended_action })]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// n8n → App: Meeting prep briefing ready
router.post('/n8n/meeting-briefing', verifyWebhook, async (req, res) => {
  try {
    const { meeting_id, briefing } = req.body;
    await db.query(`UPDATE meetings SET notes = $1 WHERE id = $2`, [briefing, meeting_id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// n8n → App: Create task automatically
router.post('/n8n/create-task', verifyWebhook, async (req, res) => {
  try {
    const { title, description, priority, due_date, related_to } = req.body;
    const { rows } = await db.query(
      `INSERT INTO tasks (title, description, priority, due_date, status) VALUES ($1, $2, $3, $4, 'todo') RETURNING id`,
      [title, description || '', priority || 'medium', due_date || null]
    );
    res.json({ ok: true, task_id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// n8n → App: Send notification/alert
router.post('/n8n/notify', verifyWebhook, async (req, res) => {
  try {
    const { type, title, message, data } = req.body;
    await db.query(
      `INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES ('system', 'n8n', $1, $2)`,
      [type || 'notification', JSON.stringify({ title, message, ...data })]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// App → n8n: Get recent leads for processing (n8n polls this)
router.get('/n8n/new-leads', verifyWebhook, async (req, res) => {
  try {
    const since = req.query.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { rows } = await db.query(
      `SELECT id, company_name, contact_name, email, whatsapp, services, urgency, status, description, created_at
       FROM clients WHERE created_at > $1 ORDER BY created_at DESC`,
      [since]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// App → n8n: Get upcoming meetings for prep
router.get('/n8n/upcoming-meetings', verifyWebhook, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT m.*, c.company_name, c.contact_name, c.email, c.services, c.description as client_needs
       FROM meetings m LEFT JOIN clients c ON m.client_id = c.id
       WHERE m.date >= NOW() AND m.date <= NOW() + interval '48 hours'
       ORDER BY m.date ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// App → n8n: Get pipeline summary for reporting
router.get('/n8n/pipeline-summary', verifyWebhook, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT status, COUNT(*) as count,
              json_agg(json_build_object('id', id, 'company', company_name, 'urgency', urgency, 'services', services) ORDER BY created_at DESC) as leads
       FROM clients GROUP BY status`
    );
    const total = rows.reduce((s, r) => s + parseInt(r.count), 0);
    res.json({ total, by_status: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// App → n8n: Get AI conversation for analysis
router.get('/n8n/ai-conversations', verifyWebhook, async (req, res) => {
  try {
    const since = req.query.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { rows } = await db.query(
      `SELECT id, visitor_name, visitor_email, messages, detected_service, detected_urgency, lead_score, created_at
       FROM ai_conversations WHERE created_at > $1 AND lead_score IS NULL ORDER BY created_at DESC LIMIT 50`,
      [since]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
