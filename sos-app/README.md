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
cp .env.examplee .env
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
# creer .env avec:
# NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
# NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
```
UI: http://localhost:5173

## Assistant IA (integration des dossiers `models`)

La page `frontend/src/app/assistant/page.tsx` est connectee a:
- `models/Modele_rag` pour le chatbot RAG
- `models/model/emotional_classification` pour l analyse emotionnelle du dessin

### 4) Installer et lancer le modele RAG
```bash
cd models/Modele_rag
python -m venv .venv
# Linux/Mac
source .venv/bin/activate
# Windows (PowerShell)
# .venv\\Scripts\\Activate.ps1

pip install --upgrade pip
pip install -e .
```

Configurer les variables d environnement du dossier `models/Modele_rag`:
- `GROQ_API_KEY` requis pour `app.py`

Puis lancer:
```bash
python app.py
```
API attendue sur: `http://127.0.0.1:5000/chat`

### 5) Installer le modele emotionnel
```bash
cd models/model
python -m venv .venv
# Linux/Mac
source .venv/bin/activate
# Windows (PowerShell)
# .venv\\Scripts\\Activate.ps1

pip install --upgrade pip
pip install -r requirements-fixed.txt
```

Le backend Node execute directement:
- `models/model/emotional_classification/run_yolo_EMCLS.py`

### 6) Variables backend pour l assistant
Dans `backend/.env` ajouter/verifier:
```env
MODELE_RAG_CHAT_URL=http://127.0.0.1:5000/chat
MODELS_ROOT=../models
EMOTIONAL_MODEL_ROOT=../models/model
EMOTIONAL_MODEL_PYTHON=python
EMOTIONAL_MODEL_TIMEOUT_MS=180000
ASSISTANT_MAX_IMAGE_MB=8
```

Ensuite relancer le backend:
```bash
cd backend
npm run dev
```

### 7) Variables frontend (si absent)
Dans `frontend/.env` verifier:
```env
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 8) Demarrage complet (ordre recommande)
1. Lancer PostgreSQL:
```bash
docker compose up -d
```
2. Lancer le chatbot RAG:
```bash
cd models/Modele_rag
python app.py
```
3. Lancer le backend principal:
```bash
cd backend
npm run dev
```
4. Lancer le frontend:
```bash
cd frontend
npm run dev
```

### 9) Verification rapide
- Ouvrir `http://localhost:5173`
- Se connecter avec un compte declarant (role `normal`)
- Aller sur `/assistant`
- Le chat doit repondre via `models/Modele_rag`
- Upload image: l analyse emotion doit utiliser `models/model/emotional_classification`

## Speech-to-Text (Create Ticket)

Le formulaire `frontend/src/app/tickets/create/page.tsx` inclut un bouton **Transcrire vers description**
qui envoie l audio vers le service `models/speech2text`, puis ajoute le texte dans la zone Description.

La transcription est disponible pour:
- **Enregistrement vocal** (micro)
- **Audio importe** dans "Ajouter des fichiers" (mp3, wav, m4a, ogg, webm, etc.)

### 10) Installer et lancer le service STT
```bash
cd models/speech2text
python -m venv .venv
# Linux/Mac
source .venv/bin/activate
# Windows (PowerShell)
# .venv\\Scripts\\Activate.ps1

pip install --upgrade pip
pip install -r requirements.txt
```

Copier le modele Vosk decompresse dans:
- `models/speech2text/vosk-model-small-ar-tn-0.1-linto`

Lancer le service:
```bash
uvicorn app:app --host 0.0.0.0 --port 7001 --reload
```

### 11) Config backend pour STT
Dans `backend/.env` ajouter/verifier:
```env
SPEECH2TEXT_API_URL=http://127.0.0.1:7001
```

Puis relancer le backend:
```bash
cd backend
npm run dev
```

### 12) Utilisation dans "Creer Ticket"
1. Ouvrir `http://localhost:5173/tickets/create`
2. Soit enregistrer un vocal (micro), soit importer un fichier audio
3. Cliquer:
- `Transcrire vers description` pour l enregistrement micro
- `Transcrire` sur la ligne d un audio importe
4. Le texte transcrit est ajoute automatiquement dans le champ `Description`

## Seeded accounts
Password for all: `password123`
- Declarant: decl1@sos.tn
- Psychologists (Village Tunis): psy1@sos.tn, psy2@sos.tn
- Psychologist (Village Sousse): psy3@sos.tn
