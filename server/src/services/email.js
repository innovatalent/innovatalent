const { Resend } = require('resend');
const env = require('../config/env');
const db = require('../config/db');

let resend;
if (env.email.apiKey) {
  resend = new Resend(env.email.apiKey);
}

function replaceVars(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}

async function sendEmail({ to, subject, body, recipientId, recipientType, template, sequenceId, stepNumber }) {
  const messageId = require('uuid').v4();

  await db.query(
    `INSERT INTO messages (id, recipient_id, recipient_type, recipient_email, channel, subject, body, template, status, sequence_id, step_number)
     VALUES ($1, $2, $3, $4, 'email', $5, $6, $7, 'pending', $8, $9)`,
    [messageId, recipientId, recipientType, to, subject, body, template, sequenceId, stepNumber]
  );

  if (!resend) {
    console.log(`[EMAIL-DEV] To: ${to} | Subject: ${subject}`);
    await db.query(`UPDATE messages SET status = 'sent', sent_at = NOW() WHERE id = $1`, [messageId]);
    return { id: messageId, status: 'sent' };
  }

  try {
    await resend.emails.send({
      from: env.email.from,
      to,
      subject,
      html: body.replace(/\n/g, '<br>'),
    });
    await db.query(`UPDATE messages SET status = 'sent', sent_at = NOW() WHERE id = $1`, [messageId]);
    return { id: messageId, status: 'sent' };
  } catch (err) {
    await db.query(`UPDATE messages SET status = 'failed', error = $2 WHERE id = $1`, [messageId, err.message]);
    console.error('[EMAIL] Error:', err.message);
    return { id: messageId, status: 'failed', error: err.message };
  }
}

async function sendTemplateEmail({ to, recipientId, recipientType, template, subject, body, vars }) {
  const resolvedSubject = replaceVars(subject, vars);
  const resolvedBody = replaceVars(body, vars);
  return sendEmail({ to, subject: resolvedSubject, body: resolvedBody, recipientId, recipientType, template });
}

module.exports = { sendEmail, sendTemplateEmail, replaceVars };
