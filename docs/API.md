# API Documentation - Stadium Operations AI Platform

## Base URL
- Development: `http://localhost:5000/api/v1`
- Production: `https://api.stadiumops.fifa2026.com/api/v1`
- Docs: `http://localhost:5000/api/docs` (Swagger UI)

## Authentication

All endpoints except `/auth/login`, `/auth/register`, `/health` require JWT Bearer token.

```
Authorization: Bearer <accessToken>
```

### Token Flow
1. POST /auth/login -> returns accessToken (24h) + refreshToken (7d)
2. Use accessToken for requests
3. On 401 TokenExpired, POST /auth/refresh with refreshToken to get new accessToken
4. Store tokens securely (localStorage web, SecureStore mobile)

### Roles
- admin: Full access, user management, system config
- manager: Stadium management, staff, events
- security: Incidents, crowd, emergency
- medical: Medical incidents, staff
- staff: Zone operations, crowd updates
- viewer/fan: Read-only, chatbot, sustainability

## Rate Limiting

- General: 100 req / 15 min per IP
- Auth: 10 req / 15 min (login/register)
- Strict (emergency, upload): 20 req / min
- Headers: X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After

## Endpoints

### Health
- GET /health - Overall health, DB, Redis, ML service status
- GET /health/ready - Readiness probe for K8s
- GET /health/live - Liveness probe

### Auth
- POST /auth/register - Body: { email, password, firstName, lastName, role?, phone?, language? } -> 201 user
- POST /auth/login - Body: { email, password } -> { user, accessToken, refreshToken }
- GET /auth/me - Auth required -> profile with stadium
- PUT /auth/me - Body: { firstName?, lastName?, phone?, language?, preferences? } -> updated profile
- POST /auth/change-password - Body: { currentPassword, newPassword } -> success
- GET /auth/users?role=&search=&page=&limit= - admin/manager -> { users, pagination }
- POST /auth/refresh - Body: { refreshToken } -> new tokens

Validation: Email format, password min 8 chars with uppercase/lowercase/number/special, role enum.

### Events
- GET /events?stadiumId=&status=&from=&to=&search=&page=&limit= - List events, pagination
- GET /events/upcoming?limit=5 - Upcoming scheduled
- GET /events/live - Currently live events
- GET /events/:id - Single with zones, ticket counts, incidents summary
- GET /events/:id/stats - { tickets, incidents, crowd, sustainability }
- POST /events - admin/manager, Body: { stadiumId, name, description?, homeTeam?, awayTeam?, startTime (ISO), endTime?, expectedAttendance?, matchType?, groupName?, round? } -> 201
- PUT /events/:id - Update allowed fields: name, description, home_team, away_team, start_time, end_time, status, expected_attendance, actual_attendance, weather_forecast, metadata
- DELETE /events/:id - admin only

Example:
```json
POST /events
{
  "stadiumId": "uuid-metlife",
  "name": "FIFA World Cup 2026 - Group A: USA vs Mexico",
  "homeTeam": "USA",
  "awayTeam": "Mexico",
  "startTime": "2026-06-11T20:00:00Z",
  "expectedAttendance": 80000,
  "matchType": "group_stage",
  "groupName": "A"
}
```

### Zones
- GET /zones?stadiumId=&type=&status=&search=&page=&limit= - List zones
- GET /zones/:id - Single with latest crowd metric, on-duty staff
- GET /zones/occupancy/:stadiumId - View v_zone_occupancy_status (percent, level)
- GET /zones/critical/:stadiumId?threshold=80 - Zones above threshold
- POST /zones - admin/manager, Body: { stadiumId, name, code (unique per stadium), type (enum zone_type), capacity, level?, gateNumber?, coordinates?, amenities? }
- PUT /zones/:id - Update
- PATCH /zones/:id/occupancy - Body: { occupancyCount } -> updates current_occupancy, emits socket
- DELETE /zones/:id - admin

Zone types: entrance, exit, seating, concourse, concession, restroom, vip, media, field, parking, medical, security
Zone status: open, closed, restricted, evacuation, maintenance

### Crowd
- GET /crowd?stadiumId=&zoneId=&eventId=&from=&to=&anomalyOnly=&page=&limit= - Metrics list
- GET /crowd/heatmap/:stadiumId?eventId= - Aggregated last hour per zone: avg_density, max_density
- GET /crowd/anomalies/:stadiumId?limit=20 - Only is_anomaly=true
- GET /crowd/peaks/:stadiumId?eventId= - Group by hour: avg, max
- GET /crowd/predict/:zoneId?stadiumId=&minutes=30 - ML or simple trend prediction
- POST /crowd - staff/security, Body: { stadiumId, zoneId, eventId?, density (0-100), flowRate?, occupancyCount, occupancyPercentage?, averageSpeed?, temperature?, noiseLevel?, sensorData? } -> calculates risk_score, is_anomaly, auto-creates incident if critical
- POST /crowd/bulk - Body: { metrics: [ ... ] } -> batch insert, socket broadcast bulk

Risk calculation: density>80 +0.4, >60 +0.2, flowRate>100 +0.3, >50 +0.15, occupancyPercent>90 +0.4 >75 +0.2 => capped 1.0

### Incidents
- GET /incidents?stadiumId=&zoneId=&eventId=&status=&severity=&type=&assignedTo=&search=&page=&limit=
- GET /incidents/:id - Single with stadium_name, zone_name, reporter/assignee emails
- GET /incidents/stats/:stadiumId?eventId= - { bySeverity, byType, byStatus, avgResolution, counts }
- GET /incidents/response-time/:stadiumId - { avg_ack, avg_resolution, p95 }
- POST /incidents - Body: { stadiumId, zoneId?, eventId?, type (medical/security/crowd/technical/safety/weather/other), severity (low/medium/high/critical), title (max255), description, locationDetail?, latitude?, longitude? } -> auto-assign if high/critical, broadcasts notification, emits socket
- PUT /incidents/:id - Body: { status?, severity?, assigned_to?, resolution_notes?, evidence_urls?, witness_reports?, priority_score?, zone_id? } -> if status resolved/closed sets resolved_at/closed_at, broadcasts
- PATCH /incidents/:id/assign - Body: { assignedTo: userId }
- PATCH /incidents/:id/resolve - Body: { resolutionNotes }
- DELETE /incidents/:id - admin

Status flow: reported -> acknowledged -> in_progress -> resolved -> closed

### Notifications
- GET /notifications?recipientId=&stadiumId=&type=&isRead=&isBroadcast=&page=&limit= - Own notifications
- GET /notifications/stats/:stadiumId - Group by type with unread
- POST /notifications - admin/manager, Body: { recipientId?, senderId?, stadiumId?, incidentId?, eventId?, type (info/warning/critical/emergency/update), title, message, channel? (in_app/push/email/sms), priority?, actionUrl?, metadata?, isBroadcast?, broadcastZones? } -> emits socket to stadium and user rooms
- POST /notifications/broadcast - Body: { stadiumId, type?, title, message, priority?, broadcastZones? } -> sends to all on-duty staff
- POST /notifications/emergency - security/admin/manager, Body: { stadiumId, title, message, zones? } -> uses sendEmergencyAlert with socket emergency_alert event
- PATCH /notifications/:id/read - Marks read
- PATCH /notifications/read-all - Marks all read for user
- DELETE /notifications/:id

### Staff
- GET /staff?stadiumId=&department=&onDuty=&search=&page=&limit=
- GET /staff/on-duty/:stadiumId - View v_staff_on_duty
- GET /staff/:id - With recent assignments
- POST /staff - admin/manager, Body: { userId, stadiumId, employeeId (unique), department, position?, skills?, currentZoneId? }
- PUT /staff/:id - Updatable: department, position, skills, certifications, current_zone_id, is_on_duty, performance_rating
- POST /staff/:id/checkin - Body: { zoneId? } -> sets is_on_duty true, duty_start NOW()
- POST /staff/:id/checkout - Sets is_on_duty false, duty_end NOW()
- GET /staff/:id/assignments - Shift history
- POST /staff/assignments - admin/manager, Body: { staffId, stadiumId, zoneId?, eventId?, taskTitle, taskDescription?, startTime, endTime, priority?, createdBy }

### Analytics
- GET /analytics/dashboard/:stadiumId?eventId= - { capacity, incidents, crowd, staff, tickets }
- GET /analytics/trends/:stadiumId?period=7d (24h/7d/30d/90d) - Historical crowd
- GET /analytics/incidents/timeline/:stadiumId?hours=24 - Hourly incident counts
- GET /analytics/zones/:stadiumId - Per-zone avg_density, incident_count
- GET /analytics/sustainability/:stadiumId?eventId= - By category totals + overall
- GET /analytics/staff/performance/:stadiumId - Performance metrics
- POST /analytics/snapshot - admin/manager, Body: { stadiumId, eventId?, type? (hourly/daily) } -> creates analytics_snapshots row
- GET /analytics/export/:stadiumId?format=json - Exports crowd, incidents, sustainability (limit 1000 each)
- GET /analytics/kpis/:stadiumId - Calculated: occupancyRate, incidentRate, crowdSafetyScore, staffUtilization, sustainabilityScore, fanSatisfaction

### Sustainability
- GET /sustainability?stadiumId=&eventId=&category=&userId=&page=&limit=
- GET /sustainability/my-stats - Current user totals + byCategory
- GET /sustainability/leaderboard/:stadiumId?period=all/week/month/event&limit=10 - Ranked by total_points
- GET /sustainability/report/:stadiumId?eventId= - { totalCarbon, benchmark, savings, savingsPercent, breakdown, equivalent: { trees, carKm } }
- GET /sustainability/rewards - Current user's unlocked rewards
- POST /sustainability/calculate-transport - Body: { transportMode, distanceKm, passengers? } -> { carbonFootprint, carEquivalent, carbonSaved, ecoPoints }
- POST /sustainability - Body: { stadiumId, eventId?, category (transport/waste/energy/water/food), metricName, value, unit, transportMode?, distanceKm?, wasteType?, energySource?, metadata? } -> calculates carbonFootprint & ecoPoints, logs
- POST /sustainability/transport - Body: { stadiumId, eventId?, transportMode, distanceKm, passengers? } -> calculates + logs as transport metric

Transport emission factors (kg CO2/km): car 0.12, bus 0.05, train 0.03, subway 0.02, bicycle 0, walking 0, flight 0.25, rideshare 0.10
Eco points: walking 100, bicycle 80, bus 50, train 60, subway 55, car 10, rideshare 20 + bonus floor(carbonSaved*10)

### Chatbot (GenAI)
- POST /chatbot/chat - Public + optional auth, Body: { message, sessionId, stadiumId?, eventId?, language?=en } -> { message (assistant), intent, language, confidence, responseTimeMs, stadiumContext?, eventContext?, sessionId }
- GET /chatbot/history/:sessionId?limit=50 - Chat history for session
- GET /chatbot/sessions - Current user's sessions grouped: session_id, message_count, last_message, first_message (limit 20)
- POST /chatbot/feedback - Body: { messageId, rating (1-5), comment? } -> saves rating
- GET /chatbot/stats/:stadiumId - Feedback stats: avg_rating, total, positive + total_messages, total_sessions
- POST /chatbot/translate - Body: { message, targetLanguage } -> { original, translated, targetLanguage }

Supported languages: en, es, fr, de, pt, ar, ja, ko, zh + 40 more via Claude

Intents: navigation, event_info, crowd_info, safety_emergency, sustainability, ticketing, accessibility, general

### Emergency
- POST /emergency/alert - admin/manager/security, Body: { stadiumId, title, message, severity?=critical, zones?[], evacuationRequired?=false } -> creates incident type safety severity, broadcast emergency_alert socket, if evacuationRequired updates zones to evacuation
- POST /emergency/evacuate - admin/manager/security, Body: { stadiumId, zoneIds[], reason? } -> sets zones status evacuation, broadcast alert
- POST /emergency/lockdown - admin/security, Body: { stadiumId, zoneIds?[] (if empty all stadium zones), reason? } -> sets status restricted, broadcast
- POST /emergency/resolve - admin/manager/security, Body: { stadiumId, incidentId?, resolutionNotes? } -> resolves incident, reopens evacuation zones, emits emergency_resolved
- GET /emergency/active/:stadiumId - { activeCriticalIncidents (severity high/critical, status reported/acknowledged/in_progress), evacuationZones }
- GET /emergency/protocol/:type - type: medical/evacuation/security -> { steps, contacts }

## Socket.IO Real-Time

Connection: `io(SOCKET_URL, { auth: { token } })`

### Client -> Server
- join_stadium (stadiumId) - Join stadium room for broadcasts
- join_zone (zoneId) - Join zone room
- leave_stadium (stadiumId)
- crowd_update (data: stadiumId, zoneId, density, etc.) - From staff devices, broadcast to stadium room
- incident_report (data: stadiumId, zoneId, type, severity, title, description) - Quick incident via socket, inserts and broadcasts
- staff_location (data: stadiumId, zoneId, latitude, longitude) - Updates staff current zone and location
- chat_typing (data: stadiumId, sessionId) - Typing indicator
- emergency_ack (data: stadiumId, alertId) - Acknowledge emergency

### Server -> Client
- joined_stadium ({ stadiumId, message })
- joined_zone ({ zoneId })
- crowd_update (metric object)
- crowd_bulk_update (array)
- crowd_anomaly (metric with is_anomaly)
- incident_created (incident)
- incident_updated (incident)
- notification (notification object)
- notification_broadcast ({ title, message, type })
- emergency_alert ({ id, title, message, zones, timestamp, priority })
- emergency_resolved ({ message, timestamp })
- emergency_acknowledged ({ userId, alertId, timestamp })
- zone_created (zone)
- zone_updated (zone)
- zone_occupancy_updated (zone)
- stadium_stats ({ stadiumId, stats, timestamp })
- event_created / event_updated
- staff_checkin (staff)
- staff_location_updated ({ userId, zoneId, lat, lon, timestamp })
- user_typing ({ userId, sessionId })
- eco_points_earned ({ points, total })

Rooms: stadium:{id}, zone:{id}, user:{id}, role:{role}

Periodic: Every 30s server broadcasts stadium_stats to each active stadium room.

## Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": [{ "field": "email", "message": "Valid email required" }],
  "timestamp": "2026-07-19T...",
  "stack": "Only in development"
}
```

Common codes: TOKEN_MISSING, TOKEN_EXPIRED, TOKEN_INVALID, USER_INACTIVE, FORBIDDEN, VALIDATION_ERROR, DUPLICATE_RESOURCE, INVALID_REFERENCE, RATE_LIMIT_EXCEEDED, ROUTE_NOT_FOUND, INTERNAL_ERROR

## Pagination

Query: ?page=1&limit=20
Response pagination:
```json
{
  "pagination": {
    "currentPage": 1,
    "perPage": 20,
    "total": 125,
    "totalPages": 7,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Webhooks (Future)

- incident.created
- incident.resolved
- crowd.anomaly
- emergency.alert

## SDK Examples

### JavaScript (Axios)
```js
import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:5000/api/v1' });
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
const res = await api.get('/events?stadiumId=...&status=scheduled');
```

### Mobile (React Native)
```js
import api from './services/api';
const crowd = await api.getCrowdMetrics(stadiumId);
```

### Python (ML service)
```python
import requests
res = requests.post('http://localhost:8000/predict/crowd', json={...}, headers={'X-API-Key': 'ml-service-internal-key'})
```

## Testing with curl

```bash
# Health
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"admin@fifa2026.com","password":"Admin123!@#"}'

# Use token
TOKEN=<accessToken from login>
curl http://localhost:5000/api/v1/events -H "Authorization: Bearer $TOKEN"

# Report incident
curl -X POST http://localhost:5000/api/v1/incidents -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"stadiumId":"...","type":"medical","severity":"high","title":"Need medical at Gate A","description":"Fan fainted"}'

# Chatbot
curl -X POST http://localhost:5000/api/v1/chatbot/chat -H "Content-Type: application/json" -d '{"message":"Where is Gate B?","sessionId":"test123","stadiumId":"...","language":"en"}'
```
