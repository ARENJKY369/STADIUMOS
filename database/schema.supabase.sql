-- FIFA World Cup 2026 - Stadium Operations - Supabase Compatible Schema
-- This version handles "type already exists" errors

-- Clean up if re-running - drop existing types and tables safely
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS analytics_snapshots CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS sustainability_metrics CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS staff_assignments CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS crowd_metrics CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS stadiums CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP VIEW IF EXISTS v_zone_occupancy_status CASCADE;
DROP VIEW IF EXISTS v_active_incidents CASCADE;
DROP VIEW IF EXISTS v_event_summary CASCADE;
DROP VIEW IF EXISTS v_staff_on_duty CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS incident_severity CASCADE;
DROP TYPE IF EXISTS incident_status CASCADE;
DROP TYPE IF EXISTS incident_type CASCADE;
DROP TYPE IF EXISTS zone_type CASCADE;
DROP TYPE IF EXISTS zone_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS sustainability_category CASCADE;

-- Enable extensions (Supabase has these)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- PostGIS may not be needed for Supabase free, skip if fails
-- CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff', 'security', 'medical', 'viewer', 'fan');
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE incident_status AS ENUM ('reported', 'acknowledged', 'in_progress', 'resolved', 'closed');
CREATE TYPE incident_type AS ENUM ('medical', 'security', 'crowd', 'technical', 'safety', 'weather', 'other');
CREATE TYPE zone_type AS ENUM ('entrance', 'exit', 'seating', 'concourse', 'concession', 'restroom', 'vip', 'media', 'field', 'parking', 'medical', 'security');
CREATE TYPE zone_status AS ENUM ('open', 'closed', 'restricted', 'evacuation', 'maintenance');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'critical', 'emergency', 'update');
CREATE TYPE event_status AS ENUM ('scheduled', 'live', 'halftime', 'completed', 'cancelled', 'postponed');
CREATE TYPE sustainability_category AS ENUM ('transport', 'waste', 'energy', 'water', 'food');

-- Now include the rest of schema from original but without extensions and types re-creation
-- For brevity, we will create minimal tables needed for backend to work (users, stadiums, events, zones, crowd_metrics, incidents, staff, staff_assignments, notifications, chat_messages, sustainability_metrics, tickets, analytics_snapshots, audit_logs)

-- USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    phone VARCHAR(20),
    avatar_url TEXT,
    language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- STADIUMS (without PostGIS for Supabase free)
CREATE TABLE stadiums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'USA',
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    timezone_offset INT DEFAULT -5,
    facilities JSONB DEFAULT '{}'::jsonb,
    contact_info JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EVENTS
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stadium_id UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    match_type VARCHAR(50) DEFAULT 'group_stage',
    home_team VARCHAR(100),
    away_team VARCHAR(100),
    group_name VARCHAR(10),
    round VARCHAR(50),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    status event_status DEFAULT 'scheduled',
    expected_attendance INTEGER,
    actual_attendance INTEGER DEFAULT 0,
    weather_forecast JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ZONES
CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stadium_id UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    type zone_type NOT NULL,
    status zone_status DEFAULT 'open',
    capacity INTEGER NOT NULL CHECK (capacity >= 0),
    current_occupancy INTEGER DEFAULT 0 CHECK (current_occupancy >= 0),
    level VARCHAR(50),
    gate_number VARCHAR(20),
    coordinates JSONB,
    amenities JSONB DEFAULT '[]'::jsonb,
    accessibility_features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stadium_id, code)
);

-- CROWD_METRICS
CREATE TABLE crowd_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stadium_id UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    density DECIMAL(5,2) CHECK (density >= 0 AND density <= 100),
    flow_rate INTEGER CHECK (flow_rate >= 0),
    occupancy_count INTEGER NOT NULL CHECK (occupancy_count >= 0),
    occupancy_percentage DECIMAL(5,2),
    average_speed DECIMAL(5,2),
    crowd_mood VARCHAR(20) DEFAULT 'calm',
    temperature DECIMAL(5,2),
    noise_level DECIMAL(5,2),
    risk_score DECIMAL(3,2) CHECK (risk_score >= 0 AND risk_score <= 1),
    is_anomaly BOOLEAN DEFAULT FALSE,
    sensor_data JSONB DEFAULT '{}'::jsonb,
    predicted_overflow TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INCIDENTS
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stadium_id UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    reported_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    type incident_type NOT NULL,
    severity incident_severity NOT NULL DEFAULT 'medium',
    status incident_status DEFAULT 'reported',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location_detail TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    response_time INTERVAL,
    resolution_time INTERVAL,
    resolution_notes TEXT,
    evidence_urls TEXT[] DEFAULT '{}',
    witness_reports JSONB DEFAULT '[]'::jsonb,
    priority_score INTEGER DEFAULT 50 CHECK (priority_score >= 0 AND priority_score <= 100),
    ai_predicted BOOLEAN DEFAULT FALSE,
    ai_confidence DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

-- STAFF
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stadium_id UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    position VARCHAR(100),
    skills TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    availability JSONB DEFAULT '{}'::jsonb,
    current_zone_id UUID REFERENCES zones(id),
    is_on_duty BOOLEAN DEFAULT FALSE,
    duty_start TIMESTAMPTZ,
    duty_end TIMESTAMPTZ,
    performance_rating DECIMAL(3,2) DEFAULT 0.0,
    emergency_contact JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STAFF_ASSIGNMENTS
CREATE TABLE staff_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    stadium_id UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    task_title VARCHAR(255) NOT NULL,
    task_description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    priority INTEGER DEFAULT 1,
    completion_notes TEXT,
    checkin_time TIMESTAMPTZ,
    checkout_time TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (end_time > start_time)
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stadium_id UUID REFERENCES stadiums(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    type notification_type NOT NULL DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(20) DEFAULT 'in_app',
    priority INTEGER DEFAULT 1,
    is_read BOOLEAN DEFAULT FALSE,
    is_broadcast BOOLEAN DEFAULT FALSE,
    broadcast_zones UUID[] DEFAULT '{}',
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHAT_MESSAGES
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255) NOT NULL,
    stadium_id UUID REFERENCES stadiums(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    message TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    intent VARCHAR(100),
    confidence DECIMAL(3,2),
    entities JSONB DEFAULT '{}'::jsonb,
    context JSONB DEFAULT '{}'::jsonb,
    response_time_ms INTEGER,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    is_translated BOOLEAN DEFAULT FALSE,
    original_language VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUSTAINABILITY_METRICS
CREATE TABLE sustainability_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stadium_id UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    category sustainability_category NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    value DECIMAL(12,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    carbon_footprint_kg DECIMAL(10,2) DEFAULT 0,
    eco_points INTEGER DEFAULT 0,
    transport_mode VARCHAR(50),
    distance_km DECIMAL(8,2),
    waste_type VARCHAR(50),
    energy_source VARCHAR(50),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TICKETS
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    stadium_id UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    ticket_code VARCHAR(100) UNIQUE NOT NULL,
    seat_section VARCHAR(20),
    seat_row VARCHAR(10),
    seat_number VARCHAR(10),
    category VARCHAR(50) DEFAULT 'general',
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'valid',
    entry_time TIMESTAMPTZ,
    exit_time TIMESTAMPTZ,
    accessibility_required BOOLEAN DEFAULT FALSE,
    qr_code_data TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ANALYTICS_SNAPSHOTS
CREATE TABLE analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stadium_id UUID NOT NULL REFERENCES stadiums(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    snapshot_type VARCHAR(50) NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    total_attendance INTEGER DEFAULT 0,
    avg_occupancy_percent DECIMAL(5,2),
    peak_occupancy_percent DECIMAL(5,2),
    peak_time TIMESTAMPTZ,
    incident_count INTEGER DEFAULT 0,
    avg_response_time INTERVAL,
    crowd_sentiment_score DECIMAL(3,2),
    sustainability_score DECIMAL(5,2),
    sustainability_carbon_total DECIMAL(12,2),
    revenue_total DECIMAL(12,2),
    concession_revenue DECIMAL(12,2),
    predicted_vs_actual JSONB DEFAULT '{}'::jsonb,
    kpis JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT_LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    stadium_id UUID REFERENCES stadiums(id) ON DELETE SET NULL,
    severity VARCHAR(20) DEFAULT 'info',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES (essential)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_events_stadium ON events(stadium_id);
CREATE INDEX idx_zones_stadium ON zones(stadium_id);
CREATE INDEX idx_crowd_stadium_time ON crowd_metrics(stadium_id, timestamp DESC);
CREATE INDEX idx_incidents_stadium ON incidents(stadium_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);

-- SEED DATA (minimal for backend to work)
INSERT INTO stadiums (name, city, capacity, address, latitude, longitude) VALUES
('MetLife Stadium', 'East Rutherford', 82500, '1 MetLife Stadium Dr', 40.813528, -74.074361),
('SoFi Stadium', 'Inglewood', 70000, '1001 Stadium Dr', 33.953522, -118.339429)
ON CONFLICT DO NOTHING;

-- Seed users with bcrypt 'Admin123!@#' etc - using crypt
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified) VALUES
('admin@fifa2026.com', crypt('Admin123!@#', gen_salt('bf')), 'System', 'Administrator', 'admin', true),
('manager@stadium.com', crypt('Manager123!', gen_salt('bf')), 'John', 'Manager', 'manager', true),
('security.lead@stadium.com', crypt('Security123!', gen_salt('bf')), 'Mike', 'Johnson', 'security', true),
('medical.lead@stadium.com', crypt('Medical123!', gen_salt('bf')), 'Sarah', 'Williams', 'medical', true),
('staff001@stadium.com', crypt('Staff123!', gen_salt('bf')), 'Carlos', 'Rodriguez', 'staff', true)
ON CONFLICT (email) DO NOTHING;
