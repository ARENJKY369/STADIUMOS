# Developer Guide - StadiumOS

## Setup
- Node 18+, Python 3.10+, Docker, Expo CLI
- Clone repo, copy backend/.env.example to .env, set CLAUDE_API_KEY
- docker-compose up --build one command
- Or local: backend npm install dev, frontend npm install start, ml pip install requirements uvicorn main:app --reload 8000, mobile npm install start

## Project Structure
- backend/src/api/routes 12 modules, services 7+, middleware auth validation error rateLimiter, utils logger helpers db, socket, tests unit/integration, database seeds migrations, Dockerfile, package.json
- frontend/src/components layout charts common operations sustainability, pages 8+ sustainability, services api auth realtime chat, hooks useAuth useCrowd useNotifications useChat useForm useTheme useSocket, styles index.css tailwind config designSystem, App.jsx routes protected, index.jsx
- mobile/src/screens 6, components Card Button MapView IncidentCard ChatbotWidget Loading Toast, services api with SecureStore offline queue realtime Socket.IO, context Auth App Crowd, navigation RootNavigator bottom tabs stack deep linking, utils storage helpers, App.js entry
- ml-models/main.py FastAPI, crowd-prediction/model.py train.py predict.py, sentiment-analysis/model.py, incident-prediction/model.py, sustainability/calculator.py, requirements, Dockerfile
- database/schema.sql 14 tables enums indexes views triggers seed
- docker/docker-compose.yml
- docs/API ARCHITECTURE DEPLOYMENT USER_GUIDE DEVELOPER_GUIDE
- .github/workflows test.yml deploy.yml

## Conventions
- ESLint + Prettier 100% compliance zero warnings
- Commit messages conventional commits feat: fix: docs: etc
- Branch naming arena/<id> fixed per session
- Code quality: no console errors, test coverage 80%+, no vulnerabilities
- Accessibility: ARIA labels, keyboard nav, contrast 4.5:1, screen reader
- Performance: API <200ms p95, page <2s, mobile <3s, queries <100ms p95

## Adding New Endpoint
1. Create route file in backend/src/api/routes/new.js with express.Router, authenticateToken, authorizeRoles if needed, validation, asyncHandler, successResponse, emit socket if relevant
2. Create service in backend/src/services/newService.js with class methods using db.query, transaction if needed, logger
3. Add route to app.js: app.use(/api/v1/new, newRoutes)
4. Add Swagger JSDoc @swagger tags
5. Write tests in backend/tests/unit and integration
6. Update docs/API.md

## Adding New Frontend Page
1. Create file frontend/src/pages/NewPage.jsx with Card components, hooks useAuth etc, api calls, responsive Tailwind
2. Add route in App.jsx <Route path="/new" element={<ProtectedRoute><AppLayout><NewPage /></AppLayout></ProtectedRoute>} />
3. Add nav item in Sidebar.jsx
4. Create service functions if needed in services/api.js
5. Test WCAG

## Adding Mobile Screen
1. Create src/screens/NewScreen.jsx with StyleSheet dark theme #0f172a #1e293b #334155
2. Add to navigation/index.js Tab.Navigator or Stack
3. Use context useAppContext useCrowdContext etc
4. Test offline with airplane mode

## ML Model Development
1. Create model class similar to CrowdPredictionModel with feature_engineering, prepare_training_data synthetic, train, predict, save, load, evaluate_real_time
2. Train: python ml-models/crowd-prediction/train.py
3. Test CLI: python predict.py --zone zone-1 --stadium stad-1 --density 85 --minutes 30
4. Expose via main.py endpoint, get_or_create_model cache
5. Update requirements.txt

## Testing
- Backend: jest --coverage --runInBand, coverage threshold 80% branches functions lines statements in package.json jest config, mocks db.query
- Frontend: react-scripts test, RTL, jest coverage 80%
- E2E: Cypress login dashboard operations chatbot sustainability
- Accessibility: axe-core, Lighthouse CI

## Security
- JWT secret 64+ chars, bcrypt 12 rounds, Helmet, CORS whitelist, rate limiting, parameterized queries, sanitization, audit logs, HTTPS, encryption at rest

## Deployment Checklist See DEPLOYMENT.md

## LOC Targets
- Phase1: DB 500, Backend 1200, Config 400, Testing 400, Docs 500 = 4500
- Phase2: Frontend Dashboard 1500, Mobile 1500, Chatbot 800, UI Library 700 = 4500
- Phase3: ML 1500, Analytics 1200, Sustainability 800, Emergency 1000, Deployment 1000, Performance 500 = 6000
- Total 15000

