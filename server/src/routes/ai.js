const { Router } = require('express');
const db = require('../config/db');
const env = require('../config/env');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = Router();

// AI provider — prefers OpenRouter, falls back to Gemini
const AI_PROVIDER = env.openrouter.apiKey ? 'openrouter' : env.gemini.apiKey ? 'gemini' : null;

const FREE_MODELS = [
  env.openrouter.model,
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'openrouter/free',
];

async function callOpenRouter(systemPrompt, messages, model) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.openrouter.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': env.appUrl,
      'X-Title': 'Innova Talent SaaS',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 600,
      temperature: 0.7,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.choices[0].message.content;
}

async function callAI(systemPrompt, messages) {
  if (AI_PROVIDER === 'openrouter') {
    const models = [...new Set(FREE_MODELS)];
    for (const model of models) {
      try {
        return await callOpenRouter(systemPrompt, messages, model);
      } catch (err) {
        console.warn(`[AI] Model ${model} failed: ${err.message}, trying next...`);
      }
    }
    throw new Error('Todos los modelos gratuitos están agotados. Intentá de nuevo en unos minutos.');
  }

  if (AI_PROVIDER === 'gemini') {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(env.gemini.apiKey);
    const model = genAI.getGenerativeModel({
      model: env.gemini.model,
      systemInstruction: systemPrompt,
      generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
    });
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(messages[messages.length - 1].content);
    return result.response.text();
  }

  throw new Error('IA no configurada. Agregá OPENROUTER_API_KEY o GEMINI_API_KEY en .env');
}

// Role-specific system prompts
const SYSTEM_PROMPTS = {
  visitor: `Eres el asistente virtual de Innova Talent Labs, una empresa que ofrece:
1. Reclutamiento IT para startups (desarrolladores, data, DevOps, liderazgo tech)
2. Automatizaciones empresariales (WhatsApp, CRM, flujos de trabajo, integraciones)
3. Desarrollo web profesional (landing pages, sitios corporativos, e-commerce, apps)
4. Ciencia de datos & BI (dashboards, KPIs, predicciones, análisis)
5. IA aplicada a negocios (chatbots, procesamiento de documentos, automatización inteligente)

PERSONALIDAD: Eres amable, profesional, directo y entusiasta. Hablas en español rioplatense natural.

TU OBJETIVO:
- Entender qué necesita el visitante
- Hacer preguntas inteligentes para calificar el lead
- Detectar: servicio buscado, urgencia, tamaño de empresa, presupuesto
- Al detectar interés real, sugerir agendar una reunión de diagnóstico gratuita
- Si preguntan precios, dar rangos orientativos y ofrecer diagnóstico personalizado

INFORMACIÓN QUE DEBES EXTRAER:
- Nombre y empresa
- Qué servicio necesitan
- Nivel de urgencia
- Tamaño del equipo/empresa
- Timeline del proyecto

REGLAS:
- Responde MÁXIMO 3-4 oraciones por mensaje
- No inventes datos ni hagas promesas específicas de plazos
- Si preguntan algo que no sabés, ofrecé conectarlos con el equipo
- Nunca rompas tu rol de asistente de Innova Talent`,

  admin: `Eres el asistente de inteligencia de negocios de Innova Talent Labs. Estás integrado en el panel de administración CRM/GoHighLevel de la empresa.

CONTEXTO DEL NEGOCIO:
- Innova Talent ofrece: reclutamiento IT, automatizaciones, desarrollo web, data/BI, IA aplicada
- El admin gestiona: leads, pipeline CRM, propuestas, reuniones, workflows, tareas, inbox, analytics

TU ROL — estratega de negocios y CRM assistant. Ayudás al admin a:
- Analizar leads y sugerir próximos pasos
- Redactar propuestas comerciales y emails de seguimiento
- Interpretar métricas y KPIs del dashboard
- Sugerir estrategias de nurturing y cierre
- Priorizar tareas y organizar el pipeline
- Crear templates de email y mensajes de WhatsApp
- Analizar conversaciones y detectar oportunidades

PERSONALIDAD: Directo, estratégico, orientado a resultados. Español rioplatense profesional.

REGLAS:
- Si te piden redactar algo, hacelo directamente
- Respuestas concisas pero completas
- Podés usar formato markdown
- Sugerí acciones concretas, no generalidades`,

  startup: `Eres el asistente de Innova Talent Labs para empresas startup clientes.

El usuario es una startup que usa la plataforma para buscar y contratar talento tech.

TU ROL:
- Ayudar a encontrar el talento ideal
- Explicar el proceso de reclutamiento
- Orientar sobre qué perfil necesitan
- Responder dudas sobre suscripciones y servicios
- Dar tips de entrevistas técnicas

PERSONALIDAD: Cercano, práctico, conocedor del ecosistema tech. Español rioplatense natural.
Máximo 4-5 oraciones por mensaje.`,
};

// Public chat (visitors on landing page)
router.post('/chat', validateBody({
  conversation_id: { required: false },
  message: { required: true, maxLength: 2000 },
  visitor_name: { required: false, maxLength: 255 },
  visitor_email: { required: false, type: 'email' },
}), async (req, res) => {
  try {
    const { conversation_id, message, visitor_name, visitor_email } = req.body;
    let conversationId = conversation_id;
    let messages = [];

    if (conversationId) {
      const { rows } = await db.query('SELECT * FROM ai_conversations WHERE id = $1', [conversationId]);
      if (rows.length) messages = rows[0].messages || [];
    }

    messages.push({ role: 'user', content: message });

    const assistantMessage = await callAI(SYSTEM_PROMPTS.visitor, messages);
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
    res.status(500).json({ error: 'Error en el chat: ' + err.message });
  }
});

// Authenticated chat (admin or startup dashboard)
router.post('/assistant', authenticate, validateBody({
  message: { required: true, maxLength: 5000 },
  conversation_id: { required: false },
  context: { required: false, maxLength: 10000 },
}), async (req, res) => {
  try {
    const { message, conversation_id, context } = req.body;
    const role = req.user.role;
    const systemPrompt = SYSTEM_PROMPTS[role] || SYSTEM_PROMPTS.visitor;

    let conversationId = conversation_id;
    let messages = [];

    if (conversationId) {
      const { rows } = await db.query(
        'SELECT messages FROM ai_conversations WHERE id = $1 AND visitor_email = $2',
        [conversationId, req.user.email]
      );
      if (rows.length) messages = rows[0].messages || [];
    }

    let fullMessage = message;
    if (context) fullMessage = `[CONTEXTO DEL CRM]\n${context}\n\n[MI PREGUNTA]\n${message}`;

    messages.push({ role: 'user', content: fullMessage });

    const assistantMessage = await callAI(systemPrompt, messages);
    messages.push({ role: 'assistant', content: assistantMessage });

    if (conversationId) {
      await db.query(`UPDATE ai_conversations SET messages = $1 WHERE id = $2`, [JSON.stringify(messages), conversationId]);
    } else {
      const { rows } = await db.query(
        `INSERT INTO ai_conversations (messages, visitor_name, visitor_email) VALUES ($1, $2, $3) RETURNING id`,
        [JSON.stringify(messages), req.user.email, req.user.email]
      );
      conversationId = rows[0].id;
    }

    res.json({ conversation_id: conversationId, response: assistantMessage });
  } catch (err) {
    console.error('[AI] Assistant error:', err.message);
    res.status(500).json({ error: 'Error en el asistente' });
  }
});

// Generate report from conversation
router.post('/report/:conversationId', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM ai_conversations WHERE id = $1', [req.params.conversationId]);
    if (!rows.length) return res.status(404).json({ error: 'Conversación no encontrada' });

    const conversation = rows[0];
    const reportPrompt = `Analiza esta conversación con un cliente potencial y genera un informe ejecutivo en JSON con esta estructura exacta:
{
  "resumen_ejecutivo": "resumen de 2-3 oraciones",
  "necesidad_detectada": "descripción clara",
  "servicio_recomendado": "recruitment|automation|data|web_dev|ai",
  "urgencia": "low|medium|high|critical",
  "tamano_empresa": "estimación",
  "presupuesto_potencial": "estimación en USD",
  "lead_score": numero_0_a_100,
  "que_venderle": "producto/servicio específico",
  "proximos_pasos": ["paso 1", "paso 2", "paso 3"],
  "notas": "observaciones"
}

Responde SOLO el JSON.

Conversación:
${conversation.messages.map(m => `${m.role}: ${m.content}`).join('\n')}`;

    const text = await callAI('Eres un analista de ventas B2B. Generás informes ejecutivos en JSON puro.', [{ role: 'user', content: reportPrompt }]);

    let report;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      report = JSON.parse(jsonMatch[0]);
    } catch {
      report = { raw: text };
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

// Admin: Quick AI actions
router.post('/quick', authenticate, authorize('admin'), validateBody({
  action: { required: true },
  data: { required: true },
}), async (req, res) => {
  try {
    const { action, data } = req.body;
    const prompts = {
      summarize_lead: `Resumí este lead en 2-3 oraciones con recomendación de acción:\n${JSON.stringify(data)}`,
      draft_email: `Redactá un email profesional de seguimiento para este lead. Datos:\n${JSON.stringify(data)}\n\nCorto (3-4 párrafos), en español, profesional pero cercano.`,
      draft_whatsapp: `Redactá un mensaje de WhatsApp corto para este contacto. Datos:\n${JSON.stringify(data)}\n\nMáximo 3 oraciones.`,
      draft_proposal: `Generá el contenido de una propuesta comercial. Datos:\n${JSON.stringify(data)}\n\nIncluí: resumen, alcance, entregables, notas. Formato markdown.`,
      analyze_pipeline: `Analizá este estado del pipeline CRM y dá 3 recomendaciones accionables:\n${JSON.stringify(data)}`,
      suggest_tasks: `Basado en esta info, sugerí 3-5 tareas concretas con prioridad:\n${JSON.stringify(data)}`,
    };

    const prompt = prompts[action];
    if (!prompt) return res.status(400).json({ error: 'Acción no válida' });

    const result = await callAI(SYSTEM_PROMPTS.admin, [{ role: 'user', content: prompt }]);
    res.json({ result });
  } catch (err) {
    console.error('[AI] Quick action error:', err.message);
    res.status(500).json({ error: 'Error en acción rápida' });
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
