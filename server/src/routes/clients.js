const { Router } = require('express');
const db = require('../config/db');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { triggerSequence } = require('../services/automation');
const { sendEmail } = require('../services/email');
const env = require('../config/env');

const router = Router();

const SERVICE_TYPES = ['recruitment', 'automation', 'data', 'web_dev', 'ai'];

// Public: Register as a lead/client
router.post('/', validateBody({
  company_name: { required: true, maxLength: 255 },
  contact_name: { required: true, maxLength: 255 },
  email: { required: true, type: 'email' },
  whatsapp: { required: false, maxLength: 50 },
  country: { required: false, maxLength: 100 },
  industry: { required: false, maxLength: 100 },
  employee_count: { required: false, maxLength: 50 },
  services: { required: true, type: 'array', enumItems: SERVICE_TYPES },
  urgency: { required: false, enum: ['low', 'medium', 'high', 'critical'] },
  budget: { required: false, maxLength: 100 },
  description: { required: false, maxLength: 5000 },
}), async (req, res) => {
  try {
    const {
      company_name, contact_name, email, whatsapp, country,
      industry, employee_count, services, urgency, budget, description
    } = req.body;

    // Calculate lead score
    let leadScore = 10;
    if (urgency === 'critical') leadScore += 30;
    else if (urgency === 'high') leadScore += 20;
    else if (urgency === 'medium') leadScore += 10;
    if (budget) leadScore += 15;
    if (description && description.length > 50) leadScore += 10;
    if (services.length > 1) leadScore += 5 * services.length;

    const { rows } = await db.query(
      `INSERT INTO clients (company_name, contact_name, email, whatsapp, country, industry, employee_count, services, urgency, budget, description, lead_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [company_name, contact_name, email, whatsapp, country, industry, employee_count, services, urgency || 'medium', budget, description, leadScore]
    );

    const client = rows[0];

    // Trigger automation sequence (async, don't block response)
    triggerSequence('client_created', client).catch(err =>
      console.error('[AUTOMATION] Trigger error:', err.message)
    );

    // Notify admin
    sendEmail({
      to: env.admin.email,
      subject: `🚀 Nuevo lead: ${company_name} (Score: ${leadScore})`,
      body: `Nuevo lead registrado:\n\nEmpresa: ${company_name}\nContacto: ${contact_name}\nEmail: ${email}\nWhatsApp: ${whatsapp || 'N/A'}\nServicios: ${services.join(', ')}\nUrgencia: ${urgency || 'medium'}\nPresupuesto: ${budget || 'N/A'}\n\nDescripción:\n${description || 'N/A'}\n\nLead Score: ${leadScore}`,
      recipientId: client.id,
      recipientType: 'client',
      template: 'admin_notification',
    }).catch(err => console.error('[NOTIFY] Admin notification error:', err.message));

    await db.query(
      `INSERT INTO activity_log (action, entity_type, entity_id, details, ip) VALUES ('client_created', 'client', $1, $2, $3)`,
      [client.id, JSON.stringify({ company_name, services }), req.ip]
    );

    res.status(201).json({ message: 'Solicitud recibida. Te contactaremos pronto.', id: client.id });
  } catch (err) {
    console.error('[CLIENTS] Create error:', err.message);
    res.status(500).json({ error: 'Error al registrar solicitud' });
  }
});

// Admin: List all clients
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, service, urgency, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (status) { conditions.push(`pipeline_status = $${paramIdx++}`); params.push(status); }
    if (urgency) { conditions.push(`urgency = $${paramIdx++}`); params.push(urgency); }
    if (service) { conditions.push(`$${paramIdx++} = ANY(services)`); params.push(service); }
    if (search) {
      conditions.push(`(company_name ILIKE $${paramIdx} OR contact_name ILIKE $${paramIdx} OR email ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(`SELECT COUNT(*) FROM clients ${where}`, params);
    const { rows } = await db.query(
      `SELECT * FROM clients ${where} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      data: rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (err) {
    console.error('[CLIENTS] List error:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Admin: Get single client
router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Admin: Update pipeline status
router.patch('/:id/status', authenticate, authorize('admin'), validateBody({
  pipeline_status: { required: true, enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] },
}), async (req, res) => {
  try {
    const { rows } = await db.query(
      'UPDATE clients SET pipeline_status = $1 WHERE id = $2 RETURNING *',
      [req.body.pipeline_status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Cliente no encontrado' });

    await db.query(
      `INSERT INTO activity_log (user_id, action, entity_type, entity_id, details, ip) VALUES ($1, 'pipeline_update', 'client', $2, $3, $4)`,
      [req.user.id, req.params.id, JSON.stringify({ status: req.body.pipeline_status }), req.ip]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Admin: Update client notes/tags
router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { notes, tags } = req.body;
    const updates = [];
    const params = [];
    let idx = 1;

    if (notes !== undefined) { updates.push(`notes = $${idx++}`); params.push(notes); }
    if (tags !== undefined) { updates.push(`tags = $${idx++}`); params.push(tags); }

    if (!updates.length) return res.status(400).json({ error: 'Nada que actualizar' });

    params.push(req.params.id);
    const { rows } = await db.query(
      `UPDATE clients SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (!rows.length) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
