const { Router } = require('express');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = Router();

// List conversations (unified inbox)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status = 'open', channel, search, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status !== 'all') { conditions.push(`c.status = $${idx++}`); params.push(status); }
    if (channel) { conditions.push(`c.channel = $${idx++}`); params.push(channel); }
    if (search) {
      conditions.push(`(cl.company_name ILIKE $${idx} OR cl.contact_name ILIKE $${idx} OR cl.email ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows: countRows } = await db.query(`SELECT COUNT(*) FROM conversations c LEFT JOIN clients cl ON c.contact_id = cl.id ${where}`, params);

    const { rows } = await db.query(
      `SELECT c.*, cl.company_name, cl.contact_name, cl.email as contact_email, cl.whatsapp as contact_phone,
              (SELECT body FROM conversation_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
       FROM conversations c
       LEFT JOIN clients cl ON c.contact_id = cl.id
       ${where}
       ORDER BY c.last_message_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      data: rows,
      unread_total: rows.reduce((sum, r) => sum + (r.unread_count || 0), 0),
      pagination: { total: parseInt(countRows[0].count), page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    console.error('[CONVERSATIONS] List error:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Get single conversation with messages
router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows: convRows } = await db.query(
      `SELECT c.*, cl.company_name, cl.contact_name, cl.email as contact_email, cl.whatsapp as contact_phone, cl.pipeline_status, cl.lead_score
       FROM conversations c LEFT JOIN clients cl ON c.contact_id = cl.id WHERE c.id = $1`,
      [req.params.id]
    );
    if (!convRows.length) return res.status(404).json({ error: 'Conversación no encontrada' });

    const { rows: messages } = await db.query(
      `SELECT * FROM conversation_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [req.params.id]
    );

    // Mark as read
    await db.query('UPDATE conversations SET unread_count = 0 WHERE id = $1', [req.params.id]);
    await db.query(`UPDATE conversation_messages SET read_at = NOW() WHERE conversation_id = $1 AND read_at IS NULL AND direction = 'inbound'`, [req.params.id]);

    res.json({ ...convRows[0], messages });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Send message in conversation
router.post('/:id/messages', authenticate, authorize('admin'), validateBody({
  body: { required: true, maxLength: 5000 },
  channel: { required: false, enum: ['email', 'whatsapp', 'internal'] },
}), async (req, res) => {
  try {
    const { body, channel } = req.body;
    const convId = req.params.id;

    const { rows: convRows } = await db.query(
      `SELECT c.*, cl.email, cl.whatsapp, cl.contact_name FROM conversations c LEFT JOIN clients cl ON c.contact_id = cl.id WHERE c.id = $1`,
      [convId]
    );
    if (!convRows.length) return res.status(404).json({ error: 'Conversación no encontrada' });

    const conv = convRows[0];
    const msgChannel = channel || conv.channel;

    const { rows } = await db.query(
      `INSERT INTO conversation_messages (conversation_id, direction, sender_type, sender_name, body, channel)
       VALUES ($1, 'outbound', 'admin', 'Innova Talent', $2, $3) RETURNING *`,
      [convId, body, msgChannel]
    );

    await db.query('UPDATE conversations SET last_message_at = NOW(), status = $2 WHERE id = $1', [convId, 'open']);

    // Actually send via email/whatsapp
    if (msgChannel === 'email' && conv.email) {
      const { sendEmail } = require('../services/email');
      sendEmail({ to: conv.email, subject: conv.subject || 'Mensaje de Innova Talent', body, recipientId: conv.contact_id, recipientType: 'client', template: 'conversation' }).catch(() => {});
    } else if (msgChannel === 'whatsapp' && conv.whatsapp) {
      const { sendWhatsApp } = require('../services/whatsapp');
      sendWhatsApp({ to: conv.whatsapp, body, recipientId: conv.contact_id, recipientType: 'client', template: 'conversation' }).catch(() => {});
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[CONVERSATIONS] Send error:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Create new conversation
router.post('/', authenticate, authorize('admin'), validateBody({
  contact_id: { required: true },
  channel: { required: true, enum: ['email', 'whatsapp', 'web_chat', 'internal'] },
  subject: { required: false, maxLength: 500 },
  message: { required: true, maxLength: 5000 },
}), async (req, res) => {
  try {
    const { contact_id, channel, subject, message } = req.body;

    const { rows: convRows } = await db.query(
      `INSERT INTO conversations (contact_id, channel, subject) VALUES ($1, $2, $3) RETURNING *`,
      [contact_id, channel, subject]
    );

    await db.query(
      `INSERT INTO conversation_messages (conversation_id, direction, sender_type, sender_name, body, channel)
       VALUES ($1, 'outbound', 'admin', 'Innova Talent', $2, $3)`,
      [convRows[0].id, message, channel]
    );

    res.status(201).json(convRows[0]);
  } catch (err) {
    console.error('[CONVERSATIONS] Create error:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Update conversation status
router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, assigned_to, tags } = req.body;
    const updates = []; const params = []; let idx = 1;
    if (status) { updates.push(`status = $${idx++}`); params.push(status); }
    if (assigned_to !== undefined) { updates.push(`assigned_to = $${idx++}`); params.push(assigned_to); }
    if (tags) { updates.push(`tags = $${idx++}`); params.push(tags); }
    if (!updates.length) return res.status(400).json({ error: 'Nada que actualizar' });

    params.push(req.params.id);
    const { rows } = await db.query(`UPDATE conversations SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, params);
    if (!rows.length) return res.status(404).json({ error: 'No encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
