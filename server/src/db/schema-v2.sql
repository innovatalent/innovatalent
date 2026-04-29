-- ====================================================================
-- INNOVA TALENT SAAS v2 — GoHighLevel-grade extensions
-- Run AFTER schema.sql
-- ====================================================================

-- ====================================================================
-- CONVERSATIONS (Unified Inbox — email + whatsapp in one thread)
-- ====================================================================

CREATE TYPE conversation_channel AS ENUM ('email', 'whatsapp', 'web_chat', 'internal');
CREATE TYPE conversation_status AS ENUM ('open', 'snoozed', 'closed');

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    channel conversation_channel NOT NULL DEFAULT 'email',
    status conversation_status NOT NULL DEFAULT 'open',
    subject VARCHAR(500),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_contact ON conversations(contact_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_msg ON conversations(last_message_at DESC);

CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    sender_type VARCHAR(20) NOT NULL, -- 'contact', 'admin', 'system', 'ai'
    sender_name VARCHAR(255),
    body TEXT NOT NULL,
    channel conversation_channel NOT NULL,
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conv_messages_conv ON conversation_messages(conversation_id, created_at);

-- ====================================================================
-- PROPOSALS / INVOICING
-- ====================================================================

CREATE TYPE proposal_status AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired');

CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_number SERIAL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    status proposal_status DEFAULT 'draft',
    items JSONB NOT NULL DEFAULT '[]',
    subtotal INTEGER NOT NULL DEFAULT 0,  -- cents
    tax_rate NUMERIC(5,2) DEFAULT 0,
    tax_amount INTEGER DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'usd',
    notes TEXT,
    valid_until DATE,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proposals_client ON proposals(client_id);
CREATE INDEX idx_proposals_status ON proposals(status);

-- ====================================================================
-- TASKS
-- ====================================================================

CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done', 'canceled');

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
    priority task_priority DEFAULT 'medium',
    status task_status DEFAULT 'todo',
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_due ON tasks(due_date) WHERE status != 'done';

-- ====================================================================
-- NOTES (universal notes on any entity)
-- ====================================================================

CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(20) NOT NULL, -- 'client', 'candidate', 'proposal'
    entity_id UUID NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_entity ON notes(entity_type, entity_id);

-- ====================================================================
-- TAGS (reusable tag system)
-- ====================================================================

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- CUSTOM FIELDS
-- ====================================================================

CREATE TABLE custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(20) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_type VARCHAR(20) DEFAULT 'text', -- text, number, date, select, multiselect
    options JSONB DEFAULT '[]',
    required BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE custom_field_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL,
    value TEXT,
    UNIQUE(field_id, entity_id)
);

-- ====================================================================
-- WORKFLOWS (advanced automation engine)
-- ====================================================================

CREATE TYPE workflow_trigger AS ENUM (
    'client_created', 'pipeline_changed', 'proposal_sent', 'proposal_accepted',
    'meeting_booked', 'meeting_completed', 'payment_received', 'tag_added',
    'form_submitted', 'ai_chat_completed', 'manual'
);

CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger workflow_trigger NOT NULL,
    trigger_conditions JSONB DEFAULT '{}',
    steps JSONB NOT NULL DEFAULT '[]',
    active BOOLEAN DEFAULT TRUE,
    run_count INTEGER DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workflow_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    entity_type VARCHAR(20),
    entity_id UUID,
    status VARCHAR(20) DEFAULT 'running', -- running, completed, failed
    current_step INTEGER DEFAULT 0,
    log JSONB DEFAULT '[]',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_workflow_runs_wf ON workflow_runs(workflow_id);

-- ====================================================================
-- FORMS (embeddable forms)
-- ====================================================================

CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    fields JSONB NOT NULL DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    redirect_url VARCHAR(500),
    webhook_url VARCHAR(500),
    active BOOLEAN DEFAULT TRUE,
    submission_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    client_id UUID REFERENCES clients(id),
    ip VARCHAR(45),
    source VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_form_submissions_form ON form_submissions(form_id);

-- ====================================================================
-- DASHBOARD WIDGETS (customizable dashboard)
-- ====================================================================

CREATE TABLE dashboard_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    layout JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- TRIGGERS for new tables
-- ====================================================================

CREATE TRIGGER trg_conversations_updated BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_proposals_updated BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_workflows_updated BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_forms_updated BEFORE UPDATE ON forms FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ====================================================================
-- ANALYTICS VIEWS
-- ====================================================================

CREATE OR REPLACE VIEW v_pipeline_analytics AS
SELECT
    pipeline_status,
    COUNT(*) as count,
    AVG(lead_score) as avg_score,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7d,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as last_30d
FROM clients
GROUP BY pipeline_status;

CREATE OR REPLACE VIEW v_revenue_monthly AS
SELECT
    DATE_TRUNC('month', created_at) as month,
    SUM(amount) FILTER (WHERE status = 'succeeded') as revenue,
    COUNT(*) FILTER (WHERE status = 'succeeded') as transactions,
    COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM payments
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

CREATE OR REPLACE VIEW v_lead_sources AS
SELECT
    source,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE pipeline_status = 'won') as won,
    AVG(lead_score) as avg_score,
    ROUND(COUNT(*) FILTER (WHERE pipeline_status = 'won')::numeric / NULLIF(COUNT(*), 0) * 100, 1) as conversion_rate
FROM clients
GROUP BY source;

-- ====================================================================
-- CALENDLY INTEGRATION
-- ====================================================================
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
