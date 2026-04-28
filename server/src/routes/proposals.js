const { Router } = require('express');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { sendEmail } = require('../services/email');
const env = require('../config/env');

const router = Router();

// List proposals
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, client_id, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = []; const params = []; let idx = 1;

    if (status) { conditions.push(`p.status = $${idx++}`); params.push(status); }
    if (client_id) { conditions.push(`p.client_id = $${idx++}`); params.push(client_id); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT p.*, c.company_name, c.contact_name, c.email
       FROM proposals p LEFT JOIN clients c ON p.client_id = c.id
       ${where} ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const { rows: countRows } = await db.query(`SELECT COUNT(*) FROM proposals p ${where}`, params);

    res.json({ data: rows, pagination: { total: parseInt(countRows[0].count), page: parseInt(page) } });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Get single proposal
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, c.company_name, c.contact_name, c.email
       FROM proposals p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Propuesta no encontrada' });

    // Mark as viewed if not admin request
    if (!req.headers.authorization && rows[0].status === 'sent') {
      await db.query(`UPDATE proposals SET status = 'viewed', viewed_at = NOW() WHERE id = $1`, [req.params.id]);
      rows[0].status = 'viewed';
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Create proposal
router.post('/', authenticate, authorize('admin'), validateBody({
  title: { required: true, maxLength: 500 },
  notes: { required: false, maxLength: 5000 },
}), async (req, res) => {
  try {
    const { client_id, title, items = [], notes, valid_until, currency = 'usd' } = req.body;

    const subtotal = items.reduce((sum, i) => sum + (i.quantity || 1) * (i.unit_price || 0), 0);
    const taxRate = req.body.tax_rate || 0;
    const taxAmount = Math.round(subtotal * taxRate / 100);
    const total = subtotal + taxAmount;

    const { rows } = await db.query(
      `INSERT INTO proposals (client_id, title, items, subtotal, tax_rate, tax_amount, total, currency, notes, valid_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [client_id, title, JSON.stringify(items), subtotal, taxRate, taxAmount, total, currency, notes, valid_until]
    );

    await db.query(`INSERT INTO activity_log (user_id, action, entity_type, entity_id, ip) VALUES ($1, 'proposal_created', 'proposal', $2, $3)`,
      [req.user.id, rows[0].id, req.ip]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[PROPOSALS] Create error:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Update proposal
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title, items, notes, valid_until, tax_rate } = req.body;
    const subtotal = items ? items.reduce((sum, i) => sum + (i.quantity || 1) * (i.unit_price || 0), 0) : undefined;
    const taxAmount = subtotal !== undefined && tax_rate !== undefined ? Math.round(subtotal * tax_rate / 100) : undefined;
    const total = subtotal !== undefined ? subtotal + (taxAmount || 0) : undefined;

    const updates = []; const params = []; let idx = 1;
    if (title) { updates.push(`title = $${idx++}`); params.push(title); }
    if (items) { updates.push(`items = $${idx++}`); params.push(JSON.stringify(items)); }
    if (notes !== undefined) { updates.push(`notes = $${idx++}`); params.push(notes); }
    if (valid_until) { updates.push(`valid_until = $${idx++}`); params.push(valid_until); }
    if (subtotal !== undefined) { updates.push(`subtotal = $${idx++}`); params.push(subtotal); }
    if (tax_rate !== undefined) { updates.push(`tax_rate = $${idx++}`); params.push(tax_rate); }
    if (taxAmount !== undefined) { updates.push(`tax_amount = $${idx++}`); params.push(taxAmount); }
    if (total !== undefined) { updates.push(`total = $${idx++}`); params.push(total); }

    params.push(req.params.id);
    const { rows } = await db.query(`UPDATE proposals SET ${updates.join(', ')} WHERE id = $${idx} AND status = 'draft' RETURNING *`, params);
    if (!rows.length) return res.status(404).json({ error: 'No encontrada o no editable' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Send proposal
router.post('/:id/send', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, c.email, c.contact_name, c.company_name FROM proposals p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No encontrada' });

    const proposal = rows[0];
    const viewUrl = `${env.appUrl}/api/proposals/${proposal.id}`;

    await sendEmail({
      to: proposal.email,
      subject: `Propuesta: ${proposal.title} — Innova Talent`,
      body: `Hola ${proposal.contact_name},\n\nTe enviamos una propuesta para ${proposal.company_name}:\n\n📋 ${proposal.title}\n💰 Total: USD $${(proposal.total / 100).toFixed(2)}\n${proposal.valid_until ? `📅 Válida hasta: ${proposal.valid_until}` : ''}\n\n👉 Ver propuesta: ${viewUrl}\n\nSaludos,\nEquipo Innova Talent`,
      recipientId: proposal.client_id,
      recipientType: 'client',
      template: 'proposal_sent',
    });

    await db.query(`UPDATE proposals SET status = 'sent', sent_at = NOW() WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Propuesta enviada' });
  } catch (err) {
    console.error('[PROPOSALS] Send error:', err.message);
    res.status(500).json({ error: 'Error al enviar' });
  }
});

// Accept/reject proposal (public)
router.post('/:id/respond', validateBody({
  action: { required: true, enum: ['accepted', 'rejected'] },
}), async (req, res) => {
  try {
    const field = req.body.action === 'accepted' ? 'accepted_at' : 'rejected_at';
    const { rows } = await db.query(
      `UPDATE proposals SET status = $1, ${field} = NOW() WHERE id = $2 AND status IN ('sent', 'viewed') RETURNING *`,
      [req.body.action, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Propuesta no encontrada o ya respondida' });

    // Notify admin
    sendEmail({
      to: env.admin.email,
      subject: `Propuesta ${req.body.action === 'accepted' ? 'ACEPTADA ✅' : 'rechazada ❌'}: ${rows[0].title}`,
      body: `La propuesta #${rows[0].proposal_number} (${rows[0].title}) fue ${req.body.action === 'accepted' ? 'aceptada' : 'rechazada'}.`,
      recipientId: rows[0].id, recipientType: 'client', template: 'proposal_response',
    }).catch(() => {});

    res.json({ message: `Propuesta ${req.body.action === 'accepted' ? 'aceptada' : 'rechazada'}` });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
