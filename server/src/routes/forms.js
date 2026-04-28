const { Router } = require('express');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = Router();

// List forms
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM forms ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Get form by slug (public)
router.get('/s/:slug', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, name, fields, settings FROM forms WHERE slug = $1 AND active = TRUE', [req.params.slug]);
    if (!rows.length) return res.status(404).json({ error: 'Formulario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Submit form (public)
router.post('/s/:slug/submit', async (req, res) => {
  try {
    const { rows: formRows } = await db.query('SELECT * FROM forms WHERE slug = $1 AND active = TRUE', [req.params.slug]);
    if (!formRows.length) return res.status(404).json({ error: 'Formulario no encontrado' });

    const form = formRows[0];
    const data = req.body;

    // Validate required fields
    const errors = [];
    for (const field of form.fields) {
      if (field.required && (!data[field.name] || data[field.name] === '')) {
        errors.push(`${field.label || field.name} es requerido`);
      }
    }
    if (errors.length) return res.status(400).json({ error: 'Validación fallida', details: errors });

    // Auto-create client if email field exists
    let clientId = null;
    const emailField = form.fields.find(f => f.type === 'email');
    if (emailField && data[emailField.name]) {
      const email = data[emailField.name];
      const nameField = form.fields.find(f => f.name === 'name' || f.name === 'nombre');
      const name = nameField ? data[nameField.name] : '';

      const { rows: existing } = await db.query('SELECT id FROM clients WHERE email = $1', [email]);
      if (existing.length) {
        clientId = existing[0].id;
      } else {
        const { rows: newClient } = await db.query(
          `INSERT INTO clients (company_name, contact_name, email, source) VALUES ($1, $2, $3, $4) RETURNING id`,
          [name || email, name || '', email, `form:${form.slug}`]
        );
        clientId = newClient[0].id;
      }
    }

    const { rows } = await db.query(
      `INSERT INTO form_submissions (form_id, data, client_id, ip, source) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [form.id, JSON.stringify(data), clientId, req.ip, req.headers.referer]
    );

    await db.query('UPDATE forms SET submission_count = submission_count + 1 WHERE id = $1', [form.id]);

    // Webhook
    if (form.webhook_url) {
      fetch(form.webhook_url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ form: form.slug, submission_id: rows[0].id, data }) }).catch(() => {});
    }

    res.status(201).json({ message: form.settings?.success_message || 'Formulario enviado', redirect: form.redirect_url });
  } catch (err) {
    console.error('[FORMS] Submit error:', err.message);
    res.status(500).json({ error: 'Error al enviar' });
  }
});

// Get form submissions
router.get('/:id/submissions', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT fs.*, c.company_name, c.contact_name FROM form_submissions fs
       LEFT JOIN clients c ON fs.client_id = c.id WHERE fs.form_id = $1 ORDER BY fs.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Create form
router.post('/', authenticate, authorize('admin'), validateBody({
  name: { required: true, maxLength: 255 },
  slug: { required: true, maxLength: 100 },
}), async (req, res) => {
  try {
    const { name, slug, fields, settings, redirect_url, webhook_url } = req.body;
    const { rows } = await db.query(
      `INSERT INTO forms (name, slug, fields, settings, redirect_url, webhook_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, slug, JSON.stringify(fields || []), JSON.stringify(settings || {}), redirect_url, webhook_url]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Slug ya existe' });
    res.status(500).json({ error: 'Error interno' });
  }
});

// Update form
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, fields, settings, redirect_url, webhook_url, active } = req.body;
    const { rows } = await db.query(
      `UPDATE forms SET name = COALESCE($1, name), fields = COALESCE($2, fields),
       settings = COALESCE($3, settings), redirect_url = $4, webhook_url = $5, active = COALESCE($6, active)
       WHERE id = $7 RETURNING *`,
      [name, fields ? JSON.stringify(fields) : null, settings ? JSON.stringify(settings) : null, redirect_url, webhook_url, active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
