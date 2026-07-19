# Deploy Public App - One Click

## Frontend - Vercel (Free, Global CDN, Public URL)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ARENJKY369/STADIUMOS&branch=arena/019f7898-stadiumos&root-directory=frontend&env=REACT_APP_API_URL,REACT_APP_SOCKET_URL&envDescription=Backend API URL&envLink=https://github.com/ARENJKY369/STADIUMOS/blob/arena/019f7898-stadiumos/docs/PUBLIC_APP_GUIDE.md)

Manual: vercel.com → New Project → Import ARENJKY369/STADIUMOS → Root frontend → Env REACT_APP_API_URL=https://stadium-backend-xxxx.onrender.com/api/v1 → Deploy → Public URL https://stadium-ops.vercel.app

## Backend - Render (Free, EU Frankfurt)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ARENJKY369/STADIUMOS&branch=arena/019f7898-stadiumos)

Manual: render.com → New Web Service → Connect repo → Root backend → Build npm install → Start node src/app.js → Add env DATABASE_URL (Supabase), REDIS_URL (Upstash), JWT_SECRET, CLAUDE_API_KEY → Deploy

## Full Stack - Render Blueprint (One Click Deploys All)
Go to https://dashboard.render.com/blueprint/new?repo=https://github.com/ARENJKY369/STADIUMOS&branch=arena/019f7898-stadiumos
It will read render.yaml and deploy backend + ML + Redis + DB all at once.

## Public GitHub Pages (Already Live)
Your app is already live at: https://ARENJKY369.github.io/STADIUMOS/
Source: gh-pages branch index.html - Full standalone public app, no backend needed, works offline with mock data.

Enable GitHub Pages if not yet:
GitHub → Your Repo → Settings → Pages → Source: Deploy from branch → Branch: gh-pages → / (root) → Save → Wait 1 min → Public URL live.

## Mobile APK (Public Download)
```bash
cd mobile
npm install -g eas-cli
eas login
eas build --platform android --profile preview
# Gives public URL anyone can download APK
```

For full guide see docs/PUBLIC_APP_GUIDE.md
