-- FIFA World Cup 2026 - Stadium Operations AI Platform
-- PostgreSQL Schema - Phase 1A Foundation
-- Version: 1.0.0 | Target: 500 LOC
-- Author: Arena AI Development Team

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ======================
-- CORE ENUM TYPES
-- ======================
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff', 'security', 'medical', 'viewer', 'fan');
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE incident_status AS ENUM ('reported', 'acknowledged', 'in_progress', 'resolved', 'closed');
CREATE TYPE incident_type AS ENUM ('medical', 'security', 'crowd', 'technical', 'safety', 'weather', 'other');
CREATE TYPE zone_type AS ENUM ('entrance', 'exit', 'seating', 'concourse', 'concession', 'restroom', 'vip', 'media', 'field', 'parking', 'medical', 'security');
CREATE TYPE zone_status AS ENUM ('open', 'closed', 'restricted', 'evacuation', 'maintenance');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'critical', 'emergency', 'update');
CREATE TYPE event_status AS ENUM ('scheduled', 'live', 'halftime', 'completed', 'cancelled', 'postponed');
CREATE TYPE sustainability_category AS ENUM ('transport', 'waste', 'energy', 'water', 'food');

-- ======================
-- TABLE 1: USERS
-- ======================
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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_users_created_at ON users(created_at);

-- ======================
-- TABLE 2: STADIUMS
-- ======================
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
    geo_location GEOMETRY(Point, 4326),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stadiums_city ON stadiums(city);
CREATE INDEX idx_stadiums_capacity ON stadiums(capacity);
CREATE INDEX idx_stadiums_geo ON stadiums USING GIST(geo_location);

-- ======================
-- TABLE 3: EVENTS
-- ======================
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

CREATE INDEX idx_events_stadium ON events(stadium_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_teams ON events(home_team, away_team);

-- ======================
-- TABLE 4: ZONES
-- ======================
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
    polygon GEOMETRY(Polygon, 4326),
    amenities JSONB DEFAULT '[]'::jsonb,
    accessibility_features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(stadium_id, code)
);

CREATE INDEX idx_zones_stadium ON zones(stadium_id);
CREATE INDEX idx_zones_type ON zones(type);
CREATE INDEX idx_zones_status ON zones(status);
CREATE INDEX idx_zones_occupancy ON zones(current_occupancy);
CREATE INDEX idx_zones_polygon ON zones USING GIST(polygon);

-- ======================
-- TABLE 5: CROWD_METRICS
-- ======================
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

CREATE INDEX idx_crowd_stadium_time ON crowd_metrics(stadium_id, timestamp DESC);
CREATE INDEX idx_crowd_zone_time ON crowd_metrics(zone_id, timestamp DESC);
CREATE INDEX idx_crowd_event ON crowd_metrics(event_id);
CREATE INDEX idx_crowd_risk ON crowd_metrics(risk_score) WHERE risk_score > 0.7;
CREATE INDEX idx_crowd_anomaly ON crowd_metrics(is_anomaly) WHERE is_anomaly = TRUE;
CREATE INDEX idx_crowd_timestamp ON crowd_metrics(timestamp DESC);

-- ======================
-- TABLE 6: INCIDENTS
-- ======================
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

CREATE INDEX idx_incidents_stadium ON incidents(stadium_id);
CREATE INDEX idx_incidents_zone ON incidents(zone_id);
CREATE INDEX idx_incidents_event ON incidents(event_id);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_type ON incidents(type);
CREATE INDEX idx_incidents_created ON incidents(created_at DESC);
CREATE INDEX idx_incidents_priority ON incidents(priority_score DESC);
CREATE INDEX idx_incidents_active ON incidents(status) WHERE status IN ('reported', 'acknowledged', 'in_progress');

-- ======================
-- TABLE 7: STAFF
-- ======================
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
    last_known_location GEOMETRY(Point, 4326),
    is_on_duty BOOLEAN DEFAULT FALSE,
    duty_start TIMESTAMPTZ,
    duty_end TIMESTAMPTZ,
    performance_rating DECIMAL(3,2) DEFAULT 0.0,
    emergency_contact JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_user ON staff(user_id);
CREATE INDEX idx_staff_stadium ON staff(stadium_id);
CREATE INDEX idx_staff_department ON staff(department);
CREATE INDEX idx_staff_on_duty ON staff(is_on_duty) WHERE is_on_duty = TRUE;
CREATE INDEX idx_staff_zone ON staff(current_zone_id);

-- ======================
-- TABLE 8: STAFF_ASSIGNMENTS (Shifts & Tasks)
-- ======================
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

CREATE INDEX idx_assignments_staff ON staff_assignments(staff_id);
CREATE INDEX idx_assignments_stadium ON staff_assignments(stadium_id);
CREATE INDEX idx_assignments_event ON staff_assignments(event_id);
CREATE INDEX idx_assignments_time ON staff_assignments(start_time, end_time);
CREATE INDEX idx_assignments_status ON staff_assignments(status);

-- ======================
-- TABLE 9: NOTIFICATIONS
-- ======================
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

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_stadium ON notifications(stadium_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_broadcast ON notifications(is_broadcast) WHERE is_broadcast = TRUE;
CREATE INDEX idx_notifications_unread ON notifications(recipient_id) WHERE is_read = FALSE;

-- ======================
-- TABLE 10: CHAT_MESSAGES
-- ======================
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

CREATE INDEX idx_chat_session ON chat_messages(session_id, created_at);
CREATE INDEX idx_chat_user ON chat_messages(user_id);
CREATE INDEX idx_chat_stadium ON chat_messages(stadium_id);
CREATE INDEX idx_chat_intent ON chat_messages(intent);
CREATE INDEX idx_chat_created ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_role ON chat_messages(role);

-- ======================
-- TABLE 11: SUSTAINABILITY_METRICS
-- ======================
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

CREATE INDEX idx_sustain_stadium ON sustainability_metrics(stadium_id);
CREATE INDEX idx_sustain_event ON sustainability_metrics(event_id);
CREATE INDEX idx_sustain_category ON sustainability_metrics(category);
CREATE INDEX idx_sustain_user ON sustainability_metrics(user_id);
CREATE INDEX idx_sustain_timestamp ON sustainability_metrics(timestamp DESC);
CREATE INDEX idx_sustain_carbon ON sustainability_metrics(carbon_footprint_kg);

-- ======================
-- TABLE 12: TICKETS
-- ======================
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

CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_code ON tickets(ticket_code);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_zone ON tickets(zone_id);
CREATE INDEX idx_tickets_entry ON tickets(entry_time);

-- ======================
-- TABLE 13: ANALYTICS_SNAPSHOTS
-- ======================
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

CREATE INDEX idx_analytics_stadium ON analytics_snapshots(stadium_id);
CREATE INDEX idx_analytics_event ON analytics_snapshots(event_id);
CREATE INDEX idx_analytics_type ON analytics_snapshots(snapshot_type);
CREATE INDEX idx_analytics_period ON analytics_snapshots(period_start, period_end);

-- ======================
-- TABLE 14: AUDIT_LOGS
-- ======================
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

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_table ON audit_logs(table_name);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_record ON audit_logs(record_id);

-- ======================
-- VIEWS
-- ======================
CREATE OR REPLACE VIEW v_zone_occupancy_status AS
SELECT 
    z.id,
    z.name,
    z.code,
    z.stadium_id,
    s.name as stadium_name,
    z.capacity,
    z.current_occupancy,
    ROUND((z.current_occupancy::DECIMAL / NULLIF(z.capacity,0) * 100),2) as occupancy_percent,
    CASE 
        WHEN (z.current_occupancy::DECIMAL / NULLIF(z.capacity,0)) >= 0.95 THEN 'critical'
        WHEN (z.current_occupancy::DECIMAL / NULLIF(z.capacity,0)) >= 0.8 THEN 'high'
        WHEN (z.current_occupancy::DECIMAL / NULLIF(z.capacity,0)) >= 0.5 THEN 'medium'
        ELSE 'low'
    END as occupancy_level,
    z.status,
    z.type
FROM zones z
JOIN stadiums s ON s.id = z.stadium_id;

CREATE OR REPLACE VIEW v_active_incidents AS
SELECT 
    i.*,
    s.name as stadium_name,
    z.name as zone_name,
    u1.email as reported_by_email,
    u2.email as assigned_to_email
FROM incidents i
LEFT JOIN stadiums s ON s.id = i.stadium_id
LEFT JOIN zones z ON z.id = i.zone_id
LEFT JOIN users u1 ON u1.id = i.reported_by
LEFT JOIN users u2 ON u2.id = i.assigned_to
WHERE i.status IN ('reported', 'acknowledged', 'in_progress')
ORDER BY 
    CASE i.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
    i.created_at DESC;

CREATE OR REPLACE VIEW v_event_summary AS
SELECT 
    e.id,
    e.name,
    e.stadium_id,
    s.name as stadium_name,
    e.start_time,
    e.status,
    e.expected_attendance,
    e.actual_attendance,
    COUNT(DISTINCT t.id) as tickets_sold,
    COUNT(DISTINCT i.id) as incident_count,
    AVG(cm.density) as avg_crowd_density,
    MAX(cm.density) as max_crowd_density
FROM events e
LEFT JOIN stadiums s ON s.id = e.stadium_id
LEFT JOIN tickets t ON t.event_id = e.id
LEFT JOIN incidents i ON i.event_id = e.id
LEFT JOIN crowd_metrics cm ON cm.event_id = e.id
GROUP BY e.id, s.name;

CREATE OR REPLACE VIEW v_staff_on_duty AS
SELECT 
    st.*,
    u.first_name,
    u.last_name,
    u.email,
    z.name as zone_name,
    s.name as stadium_name
FROM staff st
JOIN users u ON u.id = st.user_id
JOIN stadiums s ON s.id = st.stadium_id
LEFT JOIN zones z ON z.id = st.current_zone_id
WHERE st.is_on_duty = TRUE;

-- ======================
-- TRIGGERS & FUNCTIONS
-- ======================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_stadiums_updated_at BEFORE UPDATE ON stadiums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_zones_updated_at BEFORE UPDATE ON zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_assignments_updated_at BEFORE UPDATE ON staff_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit logging function
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
    audit_user_id UUID;
BEGIN
    audit_user_id := NULLIF(current_setting('app.current_user_id', true), '')::UUID;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
        VALUES (audit_user_id, 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
        VALUES (audit_user_id, 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values)
        VALUES (audit_user_id, 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers
CREATE TRIGGER trg_audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
CREATE TRIGGER trg_audit_incidents AFTER INSERT OR UPDATE OR DELETE ON incidents FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
CREATE TRIGGER trg_audit_zones AFTER INSERT OR UPDATE OR DELETE ON zones FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- Incidence auto-priority function
CREATE OR REPLACE FUNCTION set_incident_priority()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.severity = 'critical' THEN
        NEW.priority_score := 95;
    ELSIF NEW.severity = 'high' THEN
        NEW.priority_score := 75;
    ELSIF NEW.severity = 'medium' THEN
        NEW.priority_score := 50;
    ELSE
        NEW.priority_score := 25;
    END IF;

    IF NEW.type IN ('medical', 'safety') THEN
        NEW.priority_score := LEAST(NEW.priority_score + 10, 100);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_incident_priority BEFORE INSERT ON incidents FOR EACH ROW EXECUTE FUNCTION set_incident_priority();

-- Crowd occupancy sync
CREATE OR REPLACE FUNCTION sync_zone_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE zones SET current_occupancy = NEW.occupancy_count, updated_at = NOW() WHERE id = NEW.zone_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_occupancy AFTER INSERT ON crowd_metrics FOR EACH ROW EXECUTE FUNCTION sync_zone_occupancy();

-- Incident auto-assign emergency broadcast
CREATE OR REPLACE FUNCTION notify_incident_insert()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (stadium_id, type, title, message, is_broadcast, priority, incident_id)
    VALUES (
        NEW.stadium_id,
        CASE WHEN NEW.severity IN ('critical','high') THEN 'critical'::notification_type ELSE 'warning'::notification_type END,
        'New Incident: ' || NEW.title,
        NEW.description,
        TRUE,
        CASE NEW.severity WHEN 'critical' THEN 5 WHEN 'high' THEN 4 WHEN 'medium' THEN 3 ELSE 2 END,
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_incident AFTER INSERT ON incidents FOR EACH ROW EXECUTE FUNCTION notify_incident_insert();

-- ======================
-- SEED DATA
-- ======================
INSERT INTO stadiums (name, city, capacity, address, latitude, longitude) VALUES
('MetLife Stadium', 'East Rutherford', 82500, '1 MetLife Stadium Dr, East Rutherford, NJ 07073', 40.813528, -74.074361),
('SoFi Stadium', 'Inglewood', 70000, '1001 Stadium Dr, Inglewood, CA 90301', 33.953522, -118.339429),
('AT&T Stadium', 'Arlington', 80000, '1 AT&T Way, Arlington, TX 76011', 32.747778, -97.092778),
('Mercedes-Benz Stadium', 'Atlanta', 71000, '1 AMB Dr NW, Atlanta, GA 30313', 33.755556, -84.400556),
('Hard Rock Stadium', 'Miami Gardens', 65326, '347 Don Shula Dr, Miami Gardens, FL 33056', 25.957966, -80.238860),
('Arrowhead Stadium', 'Kansas City', 76416, '1 Arrowhead Dr, Kansas City, MO 64129', 39.048889, -94.483889);

INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified) VALUES
('admin@fifa2026.com', crypt('Admin123!@#', gen_salt('bf')), 'System', 'Administrator', 'admin', true),
('manager@stadium.com', crypt('Manager123!', gen_salt('bf')), 'John', 'Manager', 'manager', true),
('security.lead@stadium.com', crypt('Security123!', gen_salt('bf')), 'Mike', 'Johnson', 'security', true),
('medical.lead@stadium.com', crypt('Medical123!', gen_salt('bf')), 'Sarah', 'Williams', 'medical', true),
('staff001@stadium.com', crypt('Staff123!', gen_salt('bf')), 'Carlos', 'Rodriguez', 'staff', true),
('viewer@fifa2026.com', crypt('Viewer123!', gen_salt('bf')), 'Emily', 'Chen', 'viewer', true);

-- Seed zones for first stadium
DO $$
DECLARE
    stadium_uuid UUID;
BEGIN
    SELECT id INTO stadium_uuid FROM stadiums WHERE name='MetLife Stadium' LIMIT 1;
    INSERT INTO zones (stadium_id, name, code, type, capacity, level, gate_number) VALUES
    (stadium_uuid, 'North Entrance Gate A', 'N-A', 'entrance', 5000, 'Ground', 'A'),
    (stadium_uuid, 'South Entrance Gate B', 'S-B', 'entrance', 5000, 'Ground', 'B'),
    (stadium_uuid, 'East Seating Lower', 'E-LOW-1', 'seating', 15000, 'Lower', NULL),
    (stadium_uuid, 'West Seating Lower', 'W-LOW-1', 'seating', 15000, 'Lower', NULL),
    (stadium_uuid, 'Upper Bowl North', 'UB-N', 'seating', 20000, 'Upper', NULL),
    (stadium_uuid, 'Main Concourse', 'CONC-M', 'concourse', 10000, 'Ground', NULL),
    (stadium_uuid, 'VIP Lounge Level 3', 'VIP-3', 'vip', 500, 'Level 3', NULL),
    (stadium_uuid, 'Medical Center Ground', 'MED-G', 'medical', 100, 'Ground', NULL),
    (stadium_uuid, 'Security Control Center', 'SEC-CC', 'security', 50, 'Ground', NULL),
    (stadium_uuid, 'Concession Area East', 'FOOD-E', 'concession', 2000, 'Ground', NULL);
END $$;

-- Seed events
DO $$
DECLARE
    stadium_uuid UUID;
    admin_uuid UUID;
BEGIN
    SELECT id INTO stadium_uuid FROM stadiums WHERE name='MetLife Stadium' LIMIT 1;
    SELECT id INTO admin_uuid FROM users WHERE email='admin@fifa2026.com' LIMIT 1;
    INSERT INTO events (stadium_id, name, description, home_team, away_team, start_time, end_time, expected_attendance, created_by, status) VALUES
    (stadium_uuid, 'FIFA World Cup 2026 - Group A: USA vs Mexico', 'Opening group stage match', 'USA', 'Mexico', '2026-06-11 20:00:00+00', '2026-06-11 22:00:00+00', 80000, admin_uuid, 'scheduled'),
    (stadium_uuid, 'FIFA World Cup 2026 - Group B: England vs Germany', 'Group stage high stakes', 'England', 'Germany', '2026-06-12 19:00:00+00', '2026-06-12 21:00:00+00', 80000, admin_uuid, 'scheduled'),
    (stadium_uuid, 'FIFA World Cup 2026 - Quarter Final', 'Quarter final knockout', 'TBD', 'TBD', '2026-07-04 20:00:00+00', '2026-07-04 22:00:00+00', 82500, admin_uuid, 'scheduled');
END $$;
