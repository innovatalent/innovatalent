const env = require('../config/env');
const db = require('../config/db');
const { replaceVars } = require('./email');

let twilioClient;
if (env.twilio.accountSid && env.twilio.authToken) {
  const twilio = require('twilio');
  twilioClient = twilio(env.twilio.accountSid, env.twilio.authToken);
}

async function sendWhatsApp({ to, body, recipientId, recipientType, template, sequenceId, stepNumber }) {
  const { v4: uuidv4 } = require('uuid');
  const messageId = uuidv4();
  const phone = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  await db.query(
    `INSERT INTO messages (id, recipient_id, recipient_type, recipient_phone, channel, body, template, status, sequence_id, step_number)
     VALUES ($1, $2, $3, $4, 'whatsapp', $5, $6, 'pending', $7, $8)`,
    [messageId, recipientId, recipientType, to, body, template, sequenceId, stepNumber]
  );

  if (!twilioClient) {
    console.log(`[WHATSAPP-DEV] To: ${to} | Body: ${body.substring(0, 80)}...`);
    await db.query(`UPDATE messages SET status = 'sent', sent_at = NOW() WHERE id = $1`, [messageId]);
    return { id: messageId, status: 'sent' };
  }

  try {
    await twilioClient.messages.create({
      from: env.twilio.whatsappFrom,
      to: phone,
      body,
    });
    await db.query(`UPDATE messages SET status = 'sent', sent_at = NOW() WHERE id = $1`, [messageId]);
    return { id: messageId, status: 'sent' };
  } catch (err) {
    await db.query(`UPDATE messages SET status = 'failed', error = $2 WHERE id = $1`, [messageId, err.message]);
    console.error('[WHATSAPP] Error:', err.message);
    return { id: messageId, status: 'failed', error: err.message };
  }
}

async function sendTemplateWhatsApp({ to, recipientId, recipientType, body, vars, template, sequenceId, stepNumber }) {
  const resolvedBody = replaceVars(body, vars);
  return sendWhatsApp({ to, body: resolvedBody, recipientId, recipientType, template, sequenceId, stepNumber });
}

module.exports = { sendWhatsApp, sendTemplateWhatsApp };
