const { Router } = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../config/db');
const env = require('../config/env');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = Router();

let anthropic;
if (env.anthropic.apiKey) {
  anthropic = new Anthropic({ apiKey: env.anthropic.apiKey });
}

const SYSTEM_PROMPT = `Eres un consultor experto de Innova Talent Labs, una empresa que ofrece:
1. Reclutamiento IT para startups (desarrolladores, data, DevOps, liderazgo)
2. Automatizaciones empresariales (WhatsApp, CRM, integraciones)
3. Desarrollo web profesional (landing pages, sitios corporativos, e-commerce)
4. Ciencia de datos & BI (dashboards, KPIs, predicciones)
5. IA aplicada a negocios

Tu objetivo es:
- Entender qué necesita el cliente
- Hacer preguntas inteligentes para calificar el lead
- Detectar: servicio buscado, urgencia, tamaño de empresa, presupuesto
- Ser amable, profesional y directo
- Responder en español
- Al final de la conversación, sugerir agendar una reunión

Información que debes extraer durante la conversación:
- Nombre y empresa
- Qué servicio necesitan
- Nivel de urgencia
- Tamaño del equipo/empresa
- Presupuesto estimado
- Timeline

Responde de forma concisa (máximo 3-4 oraciones por mensaje).`;

// Start or continue AI conversation
router.post('/chat', validateBody({
  conversation_id: { required: false },
  message: { required: true, maxLength: 2000 },
  visitor_name: { required: false, maxLength: 255 },
  visitor_email: { required: false, type: 'email' },
}), async (req, res) => {
  try {
    if (!anthropic) {
      return res.status(503).json({ error: 'IA no configurada' });
    }

    const { conversation_id, message, visitor_name, visitor_email } = req.body;
    let conversationId = conversation_id;
    let messages = [];

    if (conversationId) {
      const { rows } = await db.query('SELECT * FROM ai_conversations WHERE id = $1', [conversationId]);
      if (rows.length) {
        messages = rows[0].messages || [];
      }
    }

    messages.push({ role: 'user', content: message });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages,
    });

    const assistantMessage = response.content[0].text;
    messages.push({ role: 'assistant', content: assistantMessage });

    if (conversationId) {
      await db.query(
        `UPDATE ai_conversations SET messages = $1, visitor_name = COALESCE($2, visitor_name), visitor_email = COALESCE($3, visitor_email) WHERE id = $4`,
        [JSON.stringify(messages), visitor_name, visitor_email, conversationId]
      );
    } else {
      const { rows } = await db.query(
        `INSERT INTO ai_conversations (messages, visitor_name, visitor_email) VALUES ($1, $2, $3) RETURNING id`,
        [JSON.stringify(messages), visitor_name, visitor_email]
      );
      conversationId = rows[0].id;
    }

    res.json({ conversation_id: conversationId, response: assistantMessage });
  } catch (err) {
    console.error('[AI] Chat error:', err.message);
    res.status(500).json({ error: 'Error en el chat' });
  }
});

// Generate report from conversation
router.post('/report/:conversationId', authenticate, authorize('admin'), async (req, res) => {
  try {
    if (!anthropic) return res.status(503).json({ error: 'IA no configurada' });

    const { rows } = await db.query('SELECT * FROM ai_conversations WHERE id = $1', [req.params.conversationId]);
    if (!rows.length) return res.status(404).json({ error: 'Conversación no encontrada' });

    const conversation = rows[0];

    const reportPrompt = `Analiza esta conversación con un cliente potencial y genera un informe ejecutivo en JSON con esta estructura exacta:
{
  "resumen_ejecutivo": "resumen de 2-3 oraciones",
  "necesidad_detectada": "descripción clara de lo que necesita",
  "servicio_recomendado": "recruitment|automation|data|web_dev|ai",
  "urgencia": "low|medium|high|critical",
  "tamano_empresa": "estimación",
  "presupuesto_potencial": "estimación en USD",
  "lead_score": 0-100,
  "que_venderle": "producto/servicio específico a ofrecer",
  "proximos_pasos": ["paso 1", "paso 2", "paso 3"],
  "notas": "observaciones adicionales"
}

Conversación:
${conversation.messages.map(m => `${m.role}: ${m.content}`).join('\n')}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: reportPrompt }],
    });

    let report;
    try {
      const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
      report = JSON.parse(jsonMatch[0]);
    } catch {
      report = { raw: response.content[0].text };
    }

    await db.query(
      `UPDATE ai_conversations SET report = $1, detected_service = $2, detected_urgency = $3, lead_score = $4 WHERE id = $5`,
      [JSON.stringify(report), report.servicio_recomendado, report.urgencia, report.lead_score || 0, req.params.conversationId]
    );

    res.json({ report });
  } catch (err) {
    console.error('[AI] Report error:', err.message);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// Admin: List conversations
router.get('/conversations', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, visitor_name, visitor_email, detected_service, detected_urgency, lead_score, converted,
              jsonb_array_length(messages) as message_count, created_at, updated_at
       FROM ai_conversations ORDER BY created_at DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Admin: Get conversation detail
router.get('/conversations/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM ai_conversations WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
