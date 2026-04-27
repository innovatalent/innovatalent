const { Router } = require('express');
const db = require('../config/db');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const { sendEmail } = require('../services/email');
const env = require('../config/env');

const router = Router();

// Get available slots for a date
router.get('/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Fecha requerida (YYYY-MM-DD)' });

    const dayOfWeek = new Date(date).getDay();

    const { rows: slots } = await db.query(
      'SELECT start_time, end_time FROM available_slots WHERE day_of_week = $1 AND active = TRUE',
      [dayOfWeek]
    );

    if (!slots.length) return res.json({ available: [] });

    // Get booked meetings for that date
    const { rows: booked } = await db.query(
      `SELECT start_time, end_time FROM meetings WHERE date = $1 AND status != 'canceled'`,
      [date]
    );

    // Generate 30-min slots
    const available = [];
    for (const slot of slots) {
      let current = parseTime(slot.start_time);
      const end = parseTime(slot.end_time);

      while (current + 30 <= end) {
        const startStr = formatTime(current);
        const endStr = formatTime(current + 30);

        const isBooked = booked.some(b =>
          parseTime(b.start_time) < current + 30 && parseTime(b.end_time) > current
        );

        if (!isBooked) {
          available.push({ start: startStr, end: endStr });
        }
        current += 30;
      }
    }

    res.json({ date, available });
  } catch (err) {
    console.error('[MEETINGS] Slots error:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Book a meeting
router.post('/', validateBody({
  date: { required: true },
  start_time: { required: true },
  client_id: { required: false },
  name: { required: false, maxLength: 255 },
  email: { required: true, type: 'email' },
  notes: { required: false, maxLength: 2000 },
}), async (req, res) => {
  try {
    const { date, start_time, client_id, name, email, notes } = req.body;
    const endTime = formatTime(parseTime(start_time) + 30);

    // Verify slot is available
    const { rows: conflict } = await db.query(
      `SELECT id FROM meetings WHERE date = $1 AND status != 'canceled'
       AND ((start_time <= $2 AND end_time > $2) OR (start_time < $3 AND end_time >= $3))`,
      [date, start_time, endTime]
    );

    if (conflict.length) return res.status(409).json({ error: 'Horario no disponible' });

    // Find or match client
    let resolvedClientId = client_id;
    if (!resolvedClientId && email) {
      const { rows: clients } = await db.query('SELECT id FROM clients WHERE email = $1', [email]);
      if (clients.length) resolvedClientId = clients[0].id;
    }

    const { rows } = await db.query(
      `INSERT INTO meetings (client_id, date, start_time, end_time, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [resolvedClientId, date, start_time, endTime, notes]
    );

    const meeting = rows[0];

    // Send confirmation email
    sendEmail({
      to: email,
      subject: 'Reunión confirmada con Innova Talent',
      body: `Hola${name ? ` ${name}` : ''},\n\nTu reunión está confirmada:\n\n📅 Fecha: ${date}\n🕐 Hora: ${start_time} - ${endTime} (Buenos Aires)\n\nNos conectaremos por Google Meet. Recibirás el link 24hs antes.\n\n¿Necesitás cambiar el horario? Respondé este email.\n\nSaludos,\nEquipo Innova Talent`,
      recipientId: resolvedClientId || meeting.id,
      recipientType: 'client',
      template: 'meeting_confirmation',
    }).catch(err => console.error('[MEETING] Email error:', err.message));

    // Notify admin
    sendEmail({
      to: env.admin.email,
      subject: `📅 Nueva reunión: ${date} ${start_time}`,
      body: `Nueva reunión agendada:\n\nContacto: ${name || 'N/A'}\nEmail: ${email}\nFecha: ${date}\nHora: ${start_time} - ${endTime}\nNotas: ${notes || 'N/A'}`,
      recipientId: meeting.id,
      recipientType: 'client',
      template: 'admin_meeting_notification',
    }).catch(err => console.error('[MEETING] Admin notification error:', err.message));

    res.status(201).json({ message: 'Reunión agendada', meeting });
  } catch (err) {
    console.error('[MEETINGS] Create error:', err.message);
    res.status(500).json({ error: 'Error al agendar reunión' });
  }
});

// Admin: List meetings
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, from, to } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) { conditions.push(`m.status = $${idx++}`); params.push(status); }
    if (from) { conditions.push(`m.date >= $${idx++}`); params.push(from); }
    if (to) { conditions.push(`m.date <= $${idx++}`); params.push(to); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT m.*, c.company_name, c.contact_name, c.email as client_email
       FROM meetings m LEFT JOIN clients c ON m.client_id = c.id
       ${where} ORDER BY m.date ASC, m.start_time ASC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Admin: Update meeting status
router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, meet_link, notes } = req.body;
    const updates = [];
    const params = [];
    let idx = 1;

    if (status) { updates.push(`status = $${idx++}`); params.push(status); }
    if (meet_link) { updates.push(`meet_link = $${idx++}`); params.push(meet_link); }
    if (notes !== undefined) { updates.push(`notes = $${idx++}`); params.push(notes); }

    if (!updates.length) return res.status(400).json({ error: 'Nada que actualizar' });

    params.push(req.params.id);
    const { rows } = await db.query(
      `UPDATE meetings SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (!rows.length) return res.status(404).json({ error: 'Reunión no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Admin: Manage available slots
router.put('/admin/slots', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { slots } = req.body;
    await db.query('DELETE FROM available_slots');
    for (const slot of slots) {
      await db.query(
        'INSERT INTO available_slots (day_of_week, start_time, end_time, active) VALUES ($1, $2, $3, $4)',
        [slot.day_of_week, slot.start_time, slot.end_time, slot.active !== false]
      );
    }
    res.json({ message: 'Horarios actualizados' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

function parseTime(str) {
  const [h, m] = String(str).split(':').map(Number);
  return h * 60 + m;
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

module.exports = router;
