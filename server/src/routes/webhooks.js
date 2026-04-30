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

// GHL → App: New registration triggers meeting prep report
router.post('/ghl/new-registration', async (req, res) => {
  try {
    const {
      name, email, phone, type,
      company, position, vacancy, service,
      cv_text, requirements, notes
    } = req.body;

    if (!name || !type) return res.status(400).json({ error: 'name and type are required' });

    const isRecruited = type.toLowerCase().includes('reclut') || type.toLowerCase().includes('candid');

    const systemPrompt = `Sos un analista senior de Innova Talent Labs, consultora de reclutamiento IT y automatización.
Generás informes de preparación de reunión ultra-concisos y profesionales en español rioplatense.

REGLAS ESTRICTAS:
- Sé extremadamente conciso. Cero relleno.
- Detectá Red Flags y Oportunidades de Venta Cruzada en cada reporte.
- Formato Markdown estructurado.
- Solo datos relevantes.`;

    const userPrompt = isRecruited
      ? `NUEVO RECLUTADO REGISTRADO:
- Nombre: ${name}
- Email: ${email || 'N/A'}
- Teléfono: ${phone || 'N/A'}
- Posición/Vacante: ${vacancy || position || 'N/A'}
- CV/Experiencia: ${cv_text || notes || 'No proporcionado'}

Generá el Informe de Preparación de Reunión con:

## 📋 Contexto
Quién es y qué vacante busca.

## 💎 Análisis de Valor
Por qué es un perfil clave. Puntos fuertes detectados.

## 🚩 Red Flags
Posibles riesgos o inconsistencias en su perfil.

## 📌 Agenda Propuesta
3 puntos clave para guiar la reunión.

## 🔬 Preparación Técnica
Qué evaluar técnicamente, preguntas específicas según su stack.

## ⚡ Oportunidades
Otras vacantes donde podría encajar.`
      : `NUEVO CLIENTE REGISTRADO:
- Nombre: ${name}
- Empresa: ${company || 'N/A'}
- Email: ${email || 'N/A'}
- Teléfono: ${phone || 'N/A'}
- Servicio de interés: ${service || 'N/A'}
- Requerimientos: ${requirements || notes || 'No especificados'}

Generá el Informe de Preparación de Reunión con:

## 📋 Contexto
Quién es, su empresa, y qué busca.

## 💎 Análisis de Valor
Por qué es un cliente clave. Potencial de facturación.

## 🚩 Red Flags
Posibles riesgos (presupuesto, timelines irreales, scope creep).

## 📌 Agenda Propuesta
3 puntos clave de descubrimiento para la reunión.

## 🛠 Preparación Técnica
Qué soluciones ofrecer según sus necesidades.

## ⚡ Oportunidades de Venta Cruzada
Otros servicios de Innova Talent que podrían interesarle (reclutamiento, automatización, IA, desarrollo web).`;

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    const aiData = await aiResponse.json();
    const report = aiData.choices?.[0]?.message?.content || 'No se pudo generar el informe.';

    const subject = isRecruited
      ? `[Innova Talent] Informe de Reunión — Reclutado: ${name}`
      : `[Innova Talent] Informe de Reunión — Cliente: ${name} (${company || 'N/A'})`;

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'admin@innovatalent.local';

    const emailBody = `Informe de Preparación de Reunión\n\nTipo: ${isRecruited ? 'Reclutado' : 'Cliente'}\nNombre: ${name}\nEmail: ${email || 'N/A'}\n\n---\n\n${report}`;

    try {
      const { Resend } = require('resend');
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey && !resendKey.includes('placeholder')) {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'Innova Talent <hola@innovatalentlabs.com>',
          to: adminEmail,
          subject,
          text: emailBody,
        });
      } else {
        console.log(`[GHL-REPORT] Email (dev mode) To: ${adminEmail} | Subject: ${subject}`);
      }
    } catch (emailErr) {
      console.error('[GHL-REPORT] Email send error:', emailErr.message);
    }

    await db.query(
      `INSERT INTO activity_log (entity_type, entity_id, action, details) VALUES ($1, $2, 'meeting_prep_report', $3)`,
      [isRecruited ? 'candidate' : 'client', email || name, JSON.stringify({ name, type, report: report.substring(0, 500) })]
    );

    res.json({ ok: true, report });
  } catch (err) {
    console.error('[GHL] Meeting prep error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
