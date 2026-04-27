-- ====================================================================
-- INNOVA TALENT SAAS - Database Schema
-- PostgreSQL 16
-- ====================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ====================================================================
-- ENUMS
-- ====================================================================

CREATE TYPE user_role AS ENUM ('admin', 'startup', 'candidate');
CREATE TYPE pipeline_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost');
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE service_type AS ENUM ('recruitment', 'automation', 'data', 'web_dev', 'ai');
CREATE TYPE work_mode AS ENUM ('remote', 'hybrid', 'onsite');
CREATE TYPE seniority_level AS ENUM ('junior', 'mid', 'senior', 'lead', 'principal');
CREATE TYPE english_level AS ENUM ('none', 'basic', 'intermediate', 'advanced', 'native');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');
CREATE TYPE meeting_status AS ENUM ('scheduled', 'confirmed', 'completed', 'canceled', 'no_show');
CREATE TYPE message_channel AS ENUM ('email', 'whatsapp');
CREATE TYPE message_status AS ENUM ('pending', 'sent', 'delivered', 'failed');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');

-- ====================================================================
-- USERS
-- ====================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'startup',
    email_verified BOOLEAN DEFAULT FALSE,
    refresh_token TEXT,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ====================================================================
-- CLIENTS (Startups / Leads)
-- ====================================================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50),
    country VARCHAR(100),
    industry VARCHAR(100),
    employee_count VARCHAR(50),
    services service_type[] DEFAULT '{}',
    urgency urgency_level DEFAULT 'medium',
    budget VARCHAR(100),
    description TEXT,
    pipeline_status pipeline_status DEFAULT 'new',
    lead_score INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    source VARCHAR(100) DEFAULT 'website',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_pipeline ON clients(pipeline_status);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_user ON clients(user_id);

-- ====================================================================
-- CANDIDATES
-- ====================================================================

CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    linkedin VARCHAR(500),
    cv_path VARCHAR(500),
    desired_role VARCHAR(255),
    seniority seniority_level DEFAULT 'mid',
    skills TEXT[] DEFAULT '{}',
    english english_level DEFAULT 'intermediate',
    salary_expectation VARCHAR(100),
    availability VARCHAR(100),
    work_mode work_mode DEFAULT 'remote',
    visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_candidates_skills ON candidates USING GIN(skills);
CREATE INDEX idx_candidates_seniority ON candidates(seniority);
CREATE INDEX idx_candidates_country ON candidates(country);
CREATE INDEX idx_candidates_email ON candidates(email);

-- ====================================================================
-- SUBSCRIPTIONS
-- ====================================================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50) DEFAULT 'starter',
    status subscription_status DEFAULT 'active',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_customer_id);

-- ====================================================================
-- PAYMENTS
-- ====================================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    amount INTEGER NOT NULL, -- cents
    currency VARCHAR(3) DEFAULT 'usd',
    status payment_status DEFAULT 'pending',
    provider VARCHAR(20) DEFAULT 'stripe',
    provider_payment_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ====================================================================
-- MEETINGS
-- ====================================================================

CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Reunión con Innova Talent',
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
    status meeting_status DEFAULT 'scheduled',
    meet_link VARCHAR(500),
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meetings_date ON meetings(date);
CREATE INDEX idx_meetings_client ON meetings(client_id);
CREATE INDEX idx_meetings_status ON meetings(status);

-- ====================================================================
-- MESSAGES (Email + WhatsApp log)
-- ====================================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL,
    recipient_type VARCHAR(20) NOT NULL, -- 'client' or 'candidate'
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    channel message_channel NOT NULL,
    subject VARCHAR(500),
    body TEXT NOT NULL,
    template VARCHAR(100),
    status message_status DEFAULT 'pending',
    sequence_id UUID,
    step_number INTEGER,
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_scheduled ON messages(scheduled_at) WHERE status = 'pending';

-- ====================================================================
-- AUTOMATION SEQUENCES
-- ====================================================================

CREATE TABLE automation_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_on VARCHAR(50) DEFAULT 'client_created',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE automation_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_id UUID NOT NULL REFERENCES automation_sequences(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    delay_days INTEGER NOT NULL DEFAULT 0,
    channel message_channel NOT NULL,
    subject VARCHAR(500),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_steps_sequence ON automation_steps(sequence_id, step_order);

-- ====================================================================
-- AI CONVERSATIONS
-- ====================================================================

CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    visitor_name VARCHAR(255),
    visitor_email VARCHAR(255),
    messages JSONB DEFAULT '[]',
    report JSONB,
    detected_service service_type,
    detected_urgency urgency_level,
    detected_budget VARCHAR(100),
    company_size VARCHAR(50),
    lead_score INTEGER DEFAULT 0,
    converted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_conv_client ON ai_conversations(client_id);

-- ====================================================================
-- FAVORITES
-- ====================================================================

CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, candidate_id)
);

-- ====================================================================
-- INTERVIEW REQUESTS
-- ====================================================================

CREATE TABLE interview_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interview_client ON interview_requests(client_id);

-- ====================================================================
-- ACTIVITY LOG
-- ====================================================================

CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB DEFAULT '{}',
    ip VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_created ON activity_log(created_at);

-- ====================================================================
-- AVAILABLE MEETING SLOTS (Admin schedule)
-- ====================================================================

CREATE TABLE available_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

-- ====================================================================
-- SEED: Default automation sequence
-- ====================================================================

INSERT INTO automation_sequences (name, description, trigger_on) VALUES
('Onboarding Cliente', 'Secuencia automática para nuevos leads', 'client_created');

INSERT INTO automation_steps (sequence_id, step_order, delay_days, channel, subject, body)
SELECT s.id, step.step_order, step.delay_days, step.channel::message_channel, step.subject, step.body
FROM automation_sequences s,
(VALUES
    (1, 0, 'email', 'Bienvenido a Innova Talent 🚀', 'Hola {{contact_name}},\n\nGracias por contactarnos. Somos Innova Talent Labs y nos especializamos en conectar startups con talento tech de primer nivel.\n\nEn las próximas horas un miembro de nuestro equipo se pondrá en contacto para entender mejor tu necesidad.\n\n¿Mientras tanto querés agendar una reunión directa?\n👉 https://innovatalentlabs.com/meetings\n\nSaludos,\nEquipo Innova Talent'),
    (2, 0, 'whatsapp', NULL, 'Hola {{contact_name}} 👋 Soy del equipo de Innova Talent. Recibimos tu consulta sobre {{service_type}}. ¿Tenés unos minutos para charlar sobre lo que necesitás?'),
    (3, 1, 'email', 'Caso de éxito: cómo ayudamos a una startup a escalar su equipo tech', 'Hola {{contact_name}},\n\nQueríamos compartirte un caso reciente: una startup de fintech necesitaba 4 devs senior en 3 semanas. Lo logramos.\n\n¿Te gustaría saber cómo podemos hacer lo mismo por {{company_name}}?\n\nAgendá una reunión: https://innovatalentlabs.com/meetings\n\nSaludos,\nEquipo Innova Talent'),
    (4, 3, 'email', '¿Agendamos una reunión esta semana?', 'Hola {{contact_name}},\n\nQueremos conocer mejor a {{company_name}} y entender cómo podemos ayudarlos.\n\n¿Te queda bien una reunión de 30 min esta semana?\n\n👉 https://innovatalentlabs.com/meetings\n\nSaludos,\nEquipo Innova Talent'),
    (5, 5, 'whatsapp', NULL, 'Hola {{contact_name}}, soy de Innova Talent 👋 ¿Pudiste ver nuestros mensajes? Nos encantaría ayudarte con {{service_type}}. ¿Agendamos una llamada rápida?')
) AS step(step_order, delay_days, channel, subject, body)
WHERE s.name = 'Onboarding Cliente';

-- ====================================================================
-- SEED: Default available slots (Mon-Fri 9-18)
-- ====================================================================

INSERT INTO available_slots (day_of_week, start_time, end_time) VALUES
(1, '09:00', '18:00'),
(2, '09:00', '18:00'),
(3, '09:00', '18:00'),
(4, '09:00', '18:00'),
(5, '09:00', '18:00');

-- ====================================================================
-- FUNCTION: Update updated_at timestamp
-- ====================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_candidates_updated BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_meetings_updated BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ai_conversations_updated BEFORE UPDATE ON ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_interview_requests_updated BEFORE UPDATE ON interview_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
