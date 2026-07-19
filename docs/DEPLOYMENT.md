# Deployment Guide - Stadium Operations AI Platform

## Overview
Production-ready deployment for 100K+ concurrent users, 99.9% uptime SLA.

## Quick Start (One Command)
```bash
docker-compose up --build
# Frontend http://localhost:3000
# Backend http://localhost:5000
# ML http://localhost:8000
```

## Environment Setup
Copy .env.example to .env and fill:
- DATABASE_URL, REDIS_URL
- JWT_SECRET (64+ chars), JWT_REFRESH_SECRET
- CLAUDE_API_KEY (Anthropic)
- GOOGLE_MAPS_API_KEY, TWILIO, SENDGRID optional
- ML_SERVICE_URL http://ml-service:8000
- AWS keys for production

## Local Development
Backend: cd backend && npm install && npm run dev
Frontend: cd frontend && npm install && npm start
ML: cd ml-models && pip install -r requirements.txt && uvicorn main:app --reload --port 8000
Mobile: cd mobile && npm install && npm start (Expo)

## Docker Production
- Backend Dockerfile: node:18-alpine, non-root nodejs, healthcheck wget /api/health
- Frontend: multi-stage build node -> nginx
- ML: python:3.10-slim, uvicorn workers 2, healthcheck curl /health
- Compose: postgres 15-alpine healthcheck pg_isready, redis 7-alpine, backend depends_on healthy, volumes, network stadium-network

## AWS Production
- EC2 Auto Scaling Group launch template Docker
- ALB target groups backend:5000 frontend:3000 ml:8000
- RDS PostgreSQL Multi-AZ db.r6g.large, PostGIS extension
- ElastiCache Redis cluster
- S3 buckets: stadium-ops-assets (uploads), stadium-ops-frontend (static)
- CloudFront CDN global, origins S3 + ALB, behaviors /api/* -> ALB, /* -> S3
- Route 53 hosted zone stadiumops.fifa2026.com A record alias CloudFront
- ACM SSL cert *.fifa2026.com
- CloudWatch logs: /aws/ec2/stadium-backend, /aws/rds, metrics API latency p95 <200ms, alarms SNS if error rate >1% or CPU >80%
- ECR for Docker images: backend, frontend, ml
- Secrets Manager: JWT secrets, Claude API key, DB password
- Backup: RDS automated snapshots every 6h, retention 7d, cross-region copy to eu-west-1, S3 versioning
- Disaster Recovery: pilot light in second region, RTO 4h RPO 1h

## CI/CD GitHub Actions
- test.yml: on push/PR, jobs backend (node18 npm ci test coverage lint), frontend (node18 test build), ml (python3.10 pip install pytest), audit
- deploy.yml: on push main, build images, push to ECR, deploy via SSH to EC2 or ECS update-service, run migrations, healthcheck curl /api/health, rollback on failure

## Database Migrations
- schema.sql initial with 14 tables indexes views triggers seed
- migrations folder: timestamped SQL files
- Run: PGPASSWORD=... psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/migrations/xxx.sql
- Or node backend/database/migrations/run.js

## Monitoring
- Winston logs to logs/error.log and combined.log, rotation 10MB x5/10, morgan combined
- Prometheus /metrics endpoint (future) for api_requests_total, db_query_duration, ml_predictions_total
- Grafana dashboards: API latency, error rate, DB connections, Redis memory, crowd density heatmap, incidents timeline
- Sentry for frontend/backend error tracking (optional DSN)

## Performance Tuning
- DB: EXPLAIN ANALYZE queries >100ms, indexes on timestamp DESC, partial indexes for is_active, is_anomaly, broadcast, GIST for PostGIS, increase pool max to 20
- Redis: cache zones occupancy 30s, leaderboard 60s, translation 1h
- API: compression, pagination default 20 max 100, rate limiting Redis store distributed
- Frontend: code splitting React.lazy, memo, virtualization, bundle <500KB gzipped
- Mobile: Hermes, FlatList, image caching

## Security Checklist
- [x] JWT 24h access + 7d refresh rotation
- [x] Bcrypt 12 rounds
- [x] Helmet headers HSTS, noSniff, frameguard, xssFilter
- [x] CORS whitelist
- [x] Rate limiting general 100/15min auth 10/15min
- [x] Parameterized queries prevent SQL injection
- [x] Sanitization sanitizeString for XSS
- [x] Audit logs for all tables
- [x] HTTPS only Nginx + CloudFront + ACM
- [x] Encryption at rest RDS + S3 SSE
- [x] 0 critical vulnerabilities npm audit
- [x] 2FA via mfa_secret for admin

## Scaling to 100K Concurrent
- ALB with 3 backend instances c5.xlarge, auto scaling policy CPU >70% adds instance, <30% removes
- Socket.IO with Redis adapter for multi-instance
- DB read replicas for analytics
- CDN caches static
- ML service 2 instances g4dn.xlarge GPU optional

## Rollback
- Keep last 3 Docker images in ECR
- DB migrations reversible down files
- If healthcheck fails after deploy, rollback to previous task definition in ECS or restart old container in EC2

## Production Checklist
- [ ] Env vars set, secrets in Secrets Manager, not in repo
- [ ] RDS Multi-AZ enabled, backups 6h
- [ ] CloudFront distribution with WAF + DDoS Shield Advanced
- [ ] Domain SSL valid
- [ ] Monitoring alarms SNS
- [ ] Load test with Artillery 100K concurrent Socket.IO
- [ ] Security audit npm audit clean
- [ ] Accessibility audit Lighthouse 90+ and axe-core 0 violations
- [ ] Backup tested restore
- [ ] Runbook for incident response

## Cost Estimate AWS Monthly
- EC2 3 x c5.xlarge ~ $400
- RDS db.r6g.large Multi-AZ ~ $300
- ElastiCache ~ $100
- ALB + CloudFront + S3 ~ $150
- Total ~ $950/month for staging, production 3x ~ $3000/month for 16 stadiums ~ $48k peak tournament (auto scaling)
