const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const env = require('./config/env');
const { globalLimiter } = require('./middleware/rateLimiter');
const { pool } = require('./config/db');

const app = express();

// Trust proxy (behind Nginx)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: env.nodeEnv === 'production' ? env.frontendUrl : '*',
  credentials: true,
}));

// Rate limiting
app.use(globalLimiter);

// Body parsing (raw for Stripe webhook)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (frontend)
app.use(express.static(path.join(__dirname, '../../client/public')));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use('/dashboard', express.static(path.join(__dirname, '../../client/dashboard')));
app.use('/auth', express.static(path.join(__dirname, '../../client/auth')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/proposals', require('./routes/proposals'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/workflows', require('./routes/workflows'));
app.use('/api/forms', require('./routes/forms'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/notes', require('./routes/notes'));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', message: 'Database unavailable' });
  }
});

// Public form pages
app.get('/form/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/public/form.html'));
});

// Public proposal view
app.get('/proposal/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/public/proposal.html'));
});

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint no encontrado' });
  }
  res.sendFile(path.join(__dirname, '../../client/public/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Archivo demasiado grande' });
  }
  if (err.message && err.message.includes('Solo se permiten')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Start scheduled jobs
const cron = require('node-cron');
const { processScheduledMessages } = require('./services/automation');

// Process scheduled messages every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  try {
    const count = await processScheduledMessages();
    if (count > 0) console.log(`[CRON] Processed ${count} scheduled messages`);
  } catch (err) {
    console.error('[CRON] Error processing messages:', err.message);
  }
});

// Meeting reminders daily at 9am
cron.schedule('0 9 * * *', async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const { rows } = await pool.query(
      `SELECT m.*, c.email, c.contact_name
       FROM meetings m JOIN clients c ON m.client_id = c.id
       WHERE m.date = $1 AND m.status = 'scheduled' AND m.reminder_sent = FALSE`,
      [dateStr]
    );

    const { sendEmail } = require('./services/email');
    for (const meeting of rows) {
      await sendEmail({
        to: meeting.email,
        subject: 'Recordatorio: reunión mañana con Innova Talent',
        body: `Hola ${meeting.contact_name},\n\nTe recordamos que mañana tenés una reunión con Innova Talent:\n\n📅 ${meeting.date}\n🕐 ${meeting.start_time}\n${meeting.meet_link ? `🔗 ${meeting.meet_link}` : ''}\n\nSaludos,\nEquipo Innova Talent`,
        recipientId: meeting.client_id,
        recipientType: 'client',
        template: 'meeting_reminder',
      });
      await pool.query('UPDATE meetings SET reminder_sent = TRUE WHERE id = $1', [meeting.id]);
    }

    if (rows.length) console.log(`[CRON] Sent ${rows.length} meeting reminders`);
  } catch (err) {
    console.error('[CRON] Reminder error:', err.message);
  }
});

// Start server
app.listen(env.port, '0.0.0.0', () => {
  console.log(`\n  🚀 Innova Talent SaaS running on port ${env.port}`);
  console.log(`  📌 Environment: ${env.nodeEnv}`);
  console.log(`  🌐 URL: ${env.appUrl}\n`);
});
