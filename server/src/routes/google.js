const { Router } = require('express');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAuthUrl,
  getTokensFromCode,
  getSheetsService,
  getCalendarService,
} = require('../services/google');

const router = Router();

// ====================================================================
// OAUTH2 FLOW
// ====================================================================

router.get('/auth', authenticate, authorize('admin'), (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: 'Google API no configurada. Agregá GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env' });
  }
  const url = getAuthUrl();
  res.json({ url });
});

router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send('Código no recibido');

    const tokens = await getTokensFromCode(code);

    await db.query(
      `INSERT INTO google_tokens (id, tokens) VALUES ('admin', $1)
       ON CONFLICT (id) DO UPDATE SET tokens = $1, updated_at = NOW()`,
      [JSON.stringify(tokens)]
    );

    res.send(`<html><body style="background:#0f1117;color:#f0f1f3;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
      <div style="text-align:center"><h2>Google conectado correctamente</h2><p>Podés cerrar esta ventana y volver al dashboard.</p></div>
    </body></html>`);
  } catch (err) {
    console.error('[Google] Callback error:', err.message);
    res.status(500).send('Error al conectar con Google: ' + err.message);
  }
});

router.get('/status', authenticate, authorize('admin'), async (req, res) => {
  const { rows } = await db.query('SELECT tokens, updated_at FROM google_tokens WHERE id = $1', ['admin']);
  if (!rows.length) return res.json({ connected: false });
  const tokens = JSON.parse(rows[0].tokens);
  res.json({ connected: true, hasRefreshToken: !!tokens.refresh_token, updatedAt: rows[0].updated_at });
});

router.post('/disconnect', authenticate, authorize('admin'), async (req, res) => {
  await db.query('DELETE FROM google_tokens WHERE id = $1', ['admin']);
  res.json({ ok: true });
});

async function getTokens() {
  const { rows } = await db.query('SELECT tokens FROM google_tokens WHERE id = $1', ['admin']);
  if (!rows.length) throw new Error('Google no conectado. Andá a Configuración → Conectar Google.');
  return JSON.parse(rows[0].tokens);
}

// ====================================================================
// GOOGLE SHEETS
// ====================================================================

router.post('/sheets/export-leads', authenticate, authorize('admin'), async (req, res) => {
  try {
    const tokens = await getTokens();
    const sheets = getSheetsService(tokens);

    const { rows } = await db.query(
      `SELECT company_name, contact_name, email, whatsapp, services, urgency, pipeline_status, lead_score, source, country, created_at
       FROM clients ORDER BY created_at DESC`
    );

    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: `Innova Talent — Leads ${new Date().toLocaleDateString('es-AR')}` },
        sheets: [{ properties: { title: 'Leads' } }],
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;

    const header = ['Empresa', 'Contacto', 'Email', 'WhatsApp', 'Servicios', 'Urgencia', 'Estado', 'Score', 'Fuente', 'País', 'Fecha'];
    const data = rows.map(r => [
      r.company_name, r.contact_name, r.email, r.whatsapp,
      Array.isArray(r.services) ? r.services.join(', ') : r.services,
      r.urgency, r.pipeline_status, r.lead_score, r.source, r.country,
      r.created_at ? new Date(r.created_at).toLocaleDateString('es-AR') : '',
    ]);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Leads!A1',
      valueInputOption: 'RAW',
      requestBody: { values: [header, ...data] },
    });

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          { repeatCell: { range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.2, green: 0.2, blue: 0.3 } } }, fields: 'userEnteredFormat(textFormat,backgroundColor)' } },
          { autoResizeDimensions: { dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: header.length } } },
        ],
      },
    });

    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    res.json({ url, spreadsheetId, rows: rows.length });
  } catch (err) {
    console.error('[Google Sheets] Export error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/sheets/export-candidates', authenticate, authorize('admin'), async (req, res) => {
  try {
    const tokens = await getTokens();
    const sheets = getSheetsService(tokens);

    const { rows } = await db.query(
      `SELECT name, email, phone, skills, seniority, status, availability, expected_salary, linkedin_url, created_at
       FROM candidates ORDER BY created_at DESC`
    );

    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: `Innova Talent — Candidatos ${new Date().toLocaleDateString('es-AR')}` },
        sheets: [{ properties: { title: 'Candidatos' } }],
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;

    const header = ['Nombre', 'Email', 'Teléfono', 'Skills', 'Seniority', 'Estado', 'Disponibilidad', 'Salario esperado', 'LinkedIn', 'Fecha'];
    const data = rows.map(r => [
      r.name, r.email, r.phone,
      Array.isArray(r.skills) ? r.skills.join(', ') : r.skills,
      r.seniority, r.status, r.availability, r.expected_salary, r.linkedin_url,
      r.created_at ? new Date(r.created_at).toLocaleDateString('es-AR') : '',
    ]);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Candidatos!A1',
      valueInputOption: 'RAW',
      requestBody: { values: [header, ...data] },
    });

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          { repeatCell: { range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.2, green: 0.2, blue: 0.3 } } }, fields: 'userEnteredFormat(textFormat,backgroundColor)' } },
          { autoResizeDimensions: { dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: header.length } } },
        ],
      },
    });

    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    res.json({ url, spreadsheetId, rows: rows.length });
  } catch (err) {
    console.error('[Google Sheets] Export error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// GOOGLE CALENDAR
// ====================================================================

router.get('/calendar/events', authenticate, authorize('admin'), async (req, res) => {
  try {
    const tokens = await getTokens();
    const calendar = getCalendarService(tokens);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(response.data.items || []);
  } catch (err) {
    console.error('[Google Calendar] List error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/calendar/sync-meeting', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { meeting_id } = req.body;
    const tokens = await getTokens();
    const calendar = getCalendarService(tokens);

    const { rows } = await db.query(
      `SELECT m.*, c.company_name, c.contact_name, c.email as client_email
       FROM meetings m LEFT JOIN clients c ON m.client_id = c.id WHERE m.id = $1`,
      [meeting_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Reunión no encontrada' });

    const meeting = rows[0];
    const startDate = new Date(meeting.date);
    const endDate = new Date(startDate.getTime() + (meeting.duration || 30) * 60000);

    const event = {
      summary: `${meeting.title || 'Reunión'} — ${meeting.company_name || 'Cliente'}`,
      description: `Contacto: ${meeting.contact_name || ''}\nEmail: ${meeting.client_email || ''}\n\n${meeting.notes || ''}`,
      start: { dateTime: startDate.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
      end: { dateTime: endDate.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
      attendees: meeting.client_email ? [{ email: meeting.client_email }] : [],
      reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 15 }] },
    };

    let googleEvent;
    if (meeting.google_event_id) {
      googleEvent = await calendar.events.update({ calendarId: 'primary', eventId: meeting.google_event_id, requestBody: event });
    } else {
      googleEvent = await calendar.events.insert({ calendarId: 'primary', requestBody: event });
      await db.query('UPDATE meetings SET google_event_id = $1 WHERE id = $2', [googleEvent.data.id, meeting_id]);
    }

    res.json({ ok: true, eventId: googleEvent.data.id, htmlLink: googleEvent.data.htmlLink });
  } catch (err) {
    console.error('[Google Calendar] Sync error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/calendar/sync-all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const tokens = await getTokens();
    const calendar = getCalendarService(tokens);

    const { rows } = await db.query(
      `SELECT m.id, m.title, m.date, m.duration, m.notes, m.google_event_id,
              c.company_name, c.contact_name, c.email as client_email
       FROM meetings m LEFT JOIN clients c ON m.client_id = c.id
       WHERE m.date >= NOW() AND m.google_event_id IS NULL
       ORDER BY m.date ASC LIMIT 50`
    );

    let synced = 0;
    for (const meeting of rows) {
      try {
        const startDate = new Date(meeting.date);
        const endDate = new Date(startDate.getTime() + (meeting.duration || 30) * 60000);

        const event = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: `${meeting.title || 'Reunión'} — ${meeting.company_name || 'Cliente'}`,
            description: `Contacto: ${meeting.contact_name || ''}\nEmail: ${meeting.client_email || ''}`,
            start: { dateTime: startDate.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
            end: { dateTime: endDate.toISOString(), timeZone: 'America/Argentina/Buenos_Aires' },
            attendees: meeting.client_email ? [{ email: meeting.client_email }] : [],
          },
        });

        await db.query('UPDATE meetings SET google_event_id = $1 WHERE id = $2', [event.data.id, meeting.id]);
        synced++;
      } catch (e) {
        console.warn(`[Calendar] Failed to sync meeting ${meeting.id}:`, e.message);
      }
    }

    res.json({ ok: true, synced, total: rows.length });
  } catch (err) {
    console.error('[Google Calendar] Sync all error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
