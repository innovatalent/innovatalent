const { Router } = require('express');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

// Full analytics dashboard data
router.get('/dashboard', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [
      pipeline, revenue, leads, conversions, topServices,
      meetings, messages, conversations, tasks, proposals
    ] = await Promise.all([
      // Pipeline distribution
      db.query(`SELECT pipeline_status as status, COUNT(*)::int as count, AVG(lead_score)::int as avg_score FROM clients GROUP BY pipeline_status`),

      // Revenue by month (last 12 months)
      db.query(`SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
        SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END)::int as revenue,
        COUNT(*) FILTER (WHERE status = 'succeeded')::int as count
        FROM payments WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at) ORDER BY month`),

      // Leads over time (last 30 days)
      db.query(`SELECT DATE(created_at) as date, COUNT(*)::int as count
        FROM clients WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at) ORDER BY date`),

      // Conversion funnel
      db.query(`SELECT
        COUNT(*)::int as total_leads,
        COUNT(*) FILTER (WHERE pipeline_status != 'new')::int as contacted,
        COUNT(*) FILTER (WHERE pipeline_status IN ('qualified','proposal','negotiation','won'))::int as qualified,
        COUNT(*) FILTER (WHERE pipeline_status IN ('proposal','negotiation','won'))::int as proposal,
        COUNT(*) FILTER (WHERE pipeline_status = 'won')::int as won,
        COUNT(*) FILTER (WHERE pipeline_status = 'lost')::int as lost,
        ROUND(COUNT(*) FILTER (WHERE pipeline_status = 'won')::numeric / NULLIF(COUNT(*), 0) * 100, 1) as win_rate
        FROM clients`),

      // Top services requested
      db.query(`SELECT unnest(services) as service, COUNT(*)::int as count
        FROM clients GROUP BY unnest(services) ORDER BY count DESC`),

      // Meetings this month
      db.query(`SELECT status, COUNT(*)::int as count FROM meetings
        WHERE date >= DATE_TRUNC('month', CURRENT_DATE) GROUP BY status`),

      // Messages stats
      db.query(`SELECT channel, status, COUNT(*)::int as count FROM messages GROUP BY channel, status`),

      // Conversations stats
      db.query(`SELECT status, COUNT(*)::int as count, SUM(unread_count)::int as unread
        FROM conversations GROUP BY status`),

      // Tasks stats
      db.query(`SELECT status, priority, COUNT(*)::int as count FROM tasks GROUP BY status, priority`),

      // Proposals stats
      db.query(`SELECT status, COUNT(*)::int as count, SUM(total)::int as total_value
        FROM proposals GROUP BY status`),
    ]);

    res.json({
      pipeline: pipeline.rows,
      revenue: revenue.rows,
      leads_over_time: leads.rows,
      conversion_funnel: conversions.rows[0],
      top_services: topServices.rows,
      meetings: meetings.rows,
      messages: messages.rows,
      conversations: conversations.rows,
      tasks: tasks.rows,
      proposals: proposals.rows,
    });
  } catch (err) {
    console.error('[ANALYTICS] Dashboard error:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// KPIs summary
router.get('/kpis', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM clients)::int as total_leads,
        (SELECT COUNT(*) FROM clients WHERE created_at >= NOW() - INTERVAL '7 days')::int as leads_7d,
        (SELECT COUNT(*) FROM clients WHERE created_at >= NOW() - INTERVAL '30 days')::int as leads_30d,
        (SELECT COUNT(*) FROM candidates)::int as total_candidates,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active')::int as active_subs,
        (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'succeeded')::int as total_revenue,
        (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status = 'succeeded' AND created_at >= NOW() - INTERVAL '30 days')::int as revenue_30d,
        (SELECT COUNT(*) FROM meetings WHERE date >= CURRENT_DATE AND status = 'scheduled')::int as upcoming_meetings,
        (SELECT COUNT(*) FROM conversations WHERE status = 'open')::int as open_conversations,
        (SELECT SUM(unread_count) FROM conversations)::int as unread_messages,
        (SELECT COUNT(*) FROM tasks WHERE status IN ('todo','in_progress'))::int as pending_tasks,
        (SELECT COUNT(*) FROM proposals WHERE status IN ('sent','viewed'))::int as pending_proposals,
        (SELECT ROUND(COUNT(*) FILTER (WHERE pipeline_status = 'won')::numeric / NULLIF(COUNT(*), 0) * 100, 1) FROM clients) as win_rate
    `);
    const kpis = rows[0];
    kpis.total_revenue = kpis.total_revenue / 100;
    kpis.revenue_30d = kpis.revenue_30d / 100;
    res.json(kpis);
  } catch (err) {
    console.error('[ANALYTICS] KPIs error:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
});

// Lead sources
router.get('/sources', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT source, COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE pipeline_status = 'won')::int as won,
        ROUND(COUNT(*) FILTER (WHERE pipeline_status = 'won')::numeric / NULLIF(COUNT(*), 0) * 100, 1) as conversion_rate
      FROM clients GROUP BY source ORDER BY total DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
