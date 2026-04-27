const db = require('../config/db');
const { sendTemplateEmail } = require('./email');
const { sendTemplateWhatsApp } = require('./whatsapp');

async function triggerSequence(triggerOn, client) {
  const { rows: sequences } = await db.query(
    `SELECT id FROM automation_sequences WHERE trigger_on = $1 AND active = TRUE`,
    [triggerOn]
  );

  const vars = {
    contact_name: client.contact_name,
    company_name: client.company_name,
    email: client.email,
    service_type: Array.isArray(client.services) ? client.services.join(', ') : client.services || '',
  };

  for (const seq of sequences) {
    const { rows: steps } = await db.query(
      `SELECT * FROM automation_steps WHERE sequence_id = $1 ORDER BY step_order`,
      [seq.id]
    );

    for (const step of steps) {
      if (step.delay_days === 0) {
        await executeStep(step, client, vars, seq.id);
      } else {
        const scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + step.delay_days);
        await db.query(
          `INSERT INTO messages (id, recipient_id, recipient_type, recipient_email, recipient_phone, channel, subject, body, template, status, sequence_id, step_number, scheduled_at)
           VALUES (uuid_generate_v4(), $1, 'client', $2, $3, $4, $5, $6, 'automation', 'pending', $7, $8, $9)`,
          [client.id, client.email, client.whatsapp, step.channel, step.subject, replaceVars(step.body, vars), seq.id, step.step_order, scheduledAt]
        );
      }
    }
  }
}

function replaceVars(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}

async function executeStep(step, client, vars, sequenceId) {
  if (step.channel === 'email' && client.email) {
    await sendTemplateEmail({
      to: client.email,
      recipientId: client.id,
      recipientType: 'client',
      template: 'automation',
      subject: step.subject || '',
      body: step.body,
      vars,
    });
  } else if (step.channel === 'whatsapp' && client.whatsapp) {
    await sendTemplateWhatsApp({
      to: client.whatsapp,
      recipientId: client.id,
      recipientType: 'client',
      body: step.body,
      vars,
      template: 'automation',
      sequenceId,
      stepNumber: step.step_order,
    });
  }
}

async function processScheduledMessages() {
  const { rows } = await db.query(
    `SELECT m.*, c.contact_name, c.company_name, c.services
     FROM messages m
     LEFT JOIN clients c ON m.recipient_id = c.id
     WHERE m.status = 'pending' AND m.scheduled_at <= NOW()
     ORDER BY m.scheduled_at
     LIMIT 50`
  );

  for (const msg of rows) {
    try {
      if (msg.channel === 'email' && msg.recipient_email) {
        await sendTemplateEmail({
          to: msg.recipient_email,
          recipientId: msg.recipient_id,
          recipientType: msg.recipient_type,
          template: msg.template,
          subject: msg.subject || '',
          body: msg.body,
          vars: {},
        });
      } else if (msg.channel === 'whatsapp' && msg.recipient_phone) {
        await sendTemplateWhatsApp({
          to: msg.recipient_phone,
          recipientId: msg.recipient_id,
          recipientType: msg.recipient_type,
          body: msg.body,
          vars: {},
          template: msg.template,
        });
      }
      await db.query(`UPDATE messages SET status = 'sent', sent_at = NOW() WHERE id = $1`, [msg.id]);
    } catch (err) {
      await db.query(`UPDATE messages SET status = 'failed', error = $2 WHERE id = $1`, [msg.id, err.message]);
    }
  }

  return rows.length;
}

module.exports = { triggerSequence, processScheduledMessages };
