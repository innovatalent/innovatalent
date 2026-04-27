const { Router } = require('express');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const upload = require('../middleware/upload');

const router = Router();

// Public: Register as candidate
router.post('/', upload.single('cv'), validateBody({
  name: { required: true, maxLength: 255 },
  email: { required: true, type: 'email' },
  whatsapp: { required: false, maxLength: 50 },
  country: { required: false, maxLength: 100 },
  city: { required: false, maxLength: 100 },
  linkedin: { required: false, maxLength: 500 },
  desired_role: { required: true, maxLength: 255 },
  seniority: { required: true, enum: ['junior', 'mid', 'senior', 'lead', 'principal'] },
  english: { required: false, enum: ['none', 'basic', 'intermediate', 'advanced', 'native'] },
  salary_expectation: { required: false, maxLength: 100 },
  availability: { required: false, maxLength: 100 },
  work_mode: { required: false, enum: ['remote', 'hybrid', 'onsite'] },
}), async (req, res) => {
  try {
    const {
      name, email, whatsapp, country, city, linkedin,
      desired_role, seniority, english, salary_expectation,
      availability, work_mode
    } = req.body;

    let skills = req.body.skills;
    if (typeof skills === 'string') {
      skills = skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    const cvPath = req.file ? req.file.filename : null;

    const { rows } = await db.query(
      `INSERT INTO candidates (name, email, whatsapp, country, city, linkedin, cv_path, desired_role, seniority, skills, english, salary_expectation, availability, work_mode)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id, name, email, desired_role`,
      [name, email, whatsapp, country, city, linkedin, cvPath, desired_role, seniority, skills || [], english || 'intermediate', salary_expectation, availability, work_mode || 'remote']
    );

    await db.query(
      `INSERT INTO activity_log (action, entity_type, entity_id, details, ip) VALUES ('candidate_created', 'candidate', $1, $2, $3)`,
      [rows[0].id, JSON.stringify({ name, desired_role }), req.ip]
    );

    res.status(201).json({ message: 'Perfil registrado exitosamente', candidate: rows[0] });
  } catch (err) {
    console.error('[CANDIDATES] Create error:', err.message);
    res.status(500).json({ error: 'Error al registrar perfil' });
  }
});

// Startup (paid) + Admin: Search candidates
router.get('/', authenticate, authorize('admin', 'startup'), async (req, res) => {
  try {
    // Check subscription for startup users
    if (req.user.role === 'startup') {
      const { rows: subs } = await db.query(
        `SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'active'`,
        [req.user.id]
      );
      if (!subs.length) {
        return res.status(403).json({ error: 'Suscripción requerida para buscar candidatos', code: 'SUBSCRIPTION_REQUIRED' });
      }
    }

    const { skill, seniority, country, work_mode, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = ['visible = TRUE'];
    const params = [];
    let paramIdx = 1;

    if (skill) { conditions.push(`$${paramIdx++} = ANY(skills)`); params.push(skill); }
    if (seniority) { conditions.push(`seniority = $${paramIdx++}`); params.push(seniority); }
    if (country) { conditions.push(`country ILIKE $${paramIdx++}`); params.push(`%${country}%`); }
    if (work_mode) { conditions.push(`work_mode = $${paramIdx++}`); params.push(work_mode); }
    if (search) {
      conditions.push(`(name ILIKE $${paramIdx} OR desired_role ILIKE $${paramIdx} OR skills::text ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const countResult = await db.query(`SELECT COUNT(*) FROM candidates ${where}`, params);

    // Startups don't see salary, full contact until interview
    const fields = req.user.role === 'admin'
      ? '*'
      : 'id, name, country, city, desired_role, seniority, skills, english, availability, work_mode, created_at';

    const { rows } = await db.query(
      `SELECT ${fields} FROM candidates ${where} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
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
    console.error('[CANDIDATES] Search error:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Get single candidate
router.get('/:id', authenticate, authorize('admin', 'startup'), async (req, res) => {
  try {
    if (req.user.role === 'startup') {
      const { rows: subs } = await db.query(
        `SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'active'`,
        [req.user.id]
      );
      if (!subs.length) {
        return res.status(403).json({ error: 'Suscripción requerida', code: 'SUBSCRIPTION_REQUIRED' });
      }
    }

    const fields = req.user.role === 'admin'
      ? '*'
      : 'id, name, country, city, linkedin, desired_role, seniority, skills, english, availability, work_mode, created_at';

    const { rows } = await db.query(`SELECT ${fields} FROM candidates WHERE id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Candidato no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Startup: Add to favorites
router.post('/:id/favorite', authenticate, authorize('startup'), async (req, res) => {
  try {
    const { rows: clientRows } = await db.query('SELECT id FROM clients WHERE user_id = $1', [req.user.id]);
    if (!clientRows.length) return res.status(400).json({ error: 'Perfil de empresa no encontrado' });

    await db.query(
      `INSERT INTO favorites (client_id, candidate_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [clientRows[0].id, req.params.id]
    );
    res.json({ message: 'Agregado a favoritos' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Startup: Remove from favorites
router.delete('/:id/favorite', authenticate, authorize('startup'), async (req, res) => {
  try {
    const { rows: clientRows } = await db.query('SELECT id FROM clients WHERE user_id = $1', [req.user.id]);
    if (!clientRows.length) return res.status(400).json({ error: 'Perfil de empresa no encontrado' });

    await db.query('DELETE FROM favorites WHERE client_id = $1 AND candidate_id = $2', [clientRows[0].id, req.params.id]);
    res.json({ message: 'Eliminado de favoritos' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Startup: Request interview
router.post('/:id/interview', authenticate, authorize('startup'), validateBody({
  notes: { required: false, maxLength: 2000 },
}), async (req, res) => {
  try {
    const { rows: clientRows } = await db.query('SELECT id FROM clients WHERE user_id = $1', [req.user.id]);
    if (!clientRows.length) return res.status(400).json({ error: 'Perfil de empresa no encontrado' });

    const { rows } = await db.query(
      `INSERT INTO interview_requests (client_id, candidate_id, notes) VALUES ($1, $2, $3) RETURNING *`,
      [clientRows[0].id, req.params.id, req.body.notes]
    );
    res.status(201).json({ message: 'Solicitud de entrevista enviada', request: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Download CV (admin only)
router.get('/:id/cv', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query('SELECT cv_path FROM candidates WHERE id = $1', [req.params.id]);
    if (!rows.length || !rows[0].cv_path) return res.status(404).json({ error: 'CV no encontrado' });

    const path = require('path');
    const filePath = path.resolve(require('../config/env').upload.dir, rows[0].cv_path);
    res.download(filePath);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
