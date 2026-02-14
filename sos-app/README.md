# SOS Tunisie – Hackathon MVP (GraphQL + Prisma + Postgres + React)

This zip contains:
- Backend: Node.js + TypeScript + Apollo GraphQL + Prisma
- DB: PostgreSQL via docker-compose
- Frontend: React + Vite + Apollo Client (basic screens to test declarant + psychologue flows)

## Quick start

### 1) Start DB
```bash
docker compose up -d
```

### 2) Backend
```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```
GraphQL endpoint: http://localhost:4000/graphql

### 3) Frontend
```bash
cd ../frontend
cp .env.example .env
npm install
npm run dev
```
UI: http://localhost:5173

## Seeded accounts
Password for all: `password123`
- Declarant: decl1@sos.tn
- Psychologists (Village Tunis): psy1@sos.tn, psy2@sos.tn
- Psychologist (Village Sousse): psy3@sos.tn
