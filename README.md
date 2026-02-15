# AmenSOS - Child Protection Case Management System


A comprehensive child protection case management platform built for SOS Villages d'Enfants Tunisie, enabling secure reporting, tracking, and management of child welfare incidents with role-based access control and multi-level approval workflows.


## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Role-Based Access Control](#role-based-access-control)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Security Considerations](#security-considerations)
- [License](#license)


---

## 🎯 Overview

This system was developed for the SOS Tunisie hackathon to digitize and streamline the child protection case management process. It provides a secure, auditable platform for:

- **Incident Reporting**: Village personnel can report child welfare concerns (health, behavioral, violence, abuse, neglect, conflict)
- **Case Assignment**: Automatic and manual assignment to psychologists with dual assignment support
- **Documentation**: Structured workflows for initial reports (Fiche Initiale) and psychological evaluations (DPE)
- **Multi-Level Approvals**: Sequential approval workflow requiring signatures from Village Directors and Child Protection Officers
- **Analytics**: Real-time dashboards and national-level statistics
- **Audit Trails**: Complete history of all actions for accountability
- **Notifications**: Multi-channel alerts (email/WhatsApp) for case updates

---

## ✨ Key Features

### 🔐 Security & Access Control
- **Six distinct user roles** with granular permissions (Normal, Psychologist, Village Director, Child Protection Officer, National Director, IT Admin)
- **JWT-based authentication** with secure session management
- **Sensitive data protection** with role-based content filtering
- **Complete audit logging** of all system actions

### 📊 Case Management
- **Smart scoring algorithm** for incident prioritization
- **Multi-psychologist assignment** (primary/secondary)
- **Document management** with type-specific validation
- **Status tracking** (Pending → In Progress → Signed → Closed/False Report)
- **Urgency levels** (Low, Medium, High, Critical)

### 🗺️ Geographic Support
- **Village-based organization** with location mapping
- **Interactive maps** using Leaflet for case visualization
- **Regional analytics** and reporting

### 📈 Analytics & Reporting
- **Real-time dashboards** for each role level
- **National statistics** (Director National access)
- **Village-specific metrics** (Village Directors)
- **Psychologist performance tracking**

### 🔔 Notifications
- **Email notifications** via Nodemailer
- **WhatsApp integration** via Twilio
- **Configurable notification preferences**
- **Real-time in-app notifications**

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **API**: Apollo GraphQL Server
- **ORM**: Prisma
- **Database**: PostgreSQL 16
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **Validation**: Zod
- **Notifications**: Nodemailer, Twilio

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19
- **Styling**: Tailwind CSS 4
- **Maps**: Leaflet + React Leaflet
- **Icons**: Lucide React
- **Components**: Custom component library with radix-ui primitives

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database Migrations**: Prisma Migrate
- **Development**: ts-node-dev with hot reload

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  Next.js App (Port 3000) - Role-based UI Components        │
│  - Dashboard, Cases, Reports, Analytics, User Management   │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/GraphQL
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                    Backend API Layer                        │
│  Apollo GraphQL Server (Port 4000)                          │
│  - Authentication & Authorization Middleware                │
│  - Role-based Resolvers                                     │
│  - Business Logic (Scoring, Assignment, Notifications)      │
└──────────────────┬──────────────────────────────────────────┘
                   │ Prisma Client
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                   PostgreSQL Database                       │
│  Container (Port 5433)                                      │
│  - 9 tables: Users, Cases, Villages, Assignments, etc.     │
│  - Audit logs, Notifications, Documents, Attachments       │
└─────────────────────────────────────────────────────────────┘
```

### Case Management Workflow

![Workflow Diagram](https://i.imgur.com/MDFJp29.png)

The diagram above illustrates the complete case management workflow:

1. **Déclarant** (Reporter) creates a signalement (report)
2. **Enregistrement & Classification automatique** - Automatic registration and classification based on incident type and urgency
3. **Assignation par priorité** - Priority-based assignment to a psychologist
4. **Psychologue** processes the case:
   - Analyzes the case
   - Fills out the initial report (Fiche Initiale)
   - Writes the psychological evaluation report (DPE)
5. **Notification/Alerte** system triggers alerts throughout the process
6. **Directeur Village** receives notification and validates with electronic signature
7. **Responsable Sauvegarde** provides final validation with electronic signature
8. Case moves to **Decision** phase (closure or further action)
9. **Vérification** loop ensures quality and allows the declarant to verify case status

---

## 🔐 Role-Based Access Control

The system implements a comprehensive RBAC system with 6 distinct roles:

![Role-Based Access Control](https://i.imgur.com/XRI8RYm.png)


---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ahmed95059/sos-hackathon.git
cd sos-hackathon/sos-app
```

2. **Start PostgreSQL database**
```bash
docker compose up -d
```

3. **Setup Backend**
```bash
cd backend

# Create environment file
cp .env.example .env

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with test data
npm run seed

# Start development server
npm run dev
```

GraphQL Playground: http://localhost:4000/graphql

4. **Setup Frontend**
```bash
cd ../frontend

# Create environment file
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

Application: http://localhost:3000

### 🔑 Seeded Test Accounts

All accounts use password: `password123`

| Role | Email | Village |
|------|-------|---------|
| Declarant | decl1@sos.tn | Tunis |
| Psychologist | psy1@sos.tn | Tunis |
| Psychologist | psy2@sos.tn | Tunis |
| Psychologist | psy3@sos.tn | Sousse |
| Village Director | dir1@sos.tn | Tunis |
| Child Protection Officer | sauv1@sos.tn | National |
| National Director | dirnat@sos.tn | National |
| IT Admin | admin@sos.tn | N/A |

---

## 📁 Project Structure

```
amen_sos/
├── README.md                          # This file
└── sos-app/                           # Main application
    ├── docker-compose.yml             # PostgreSQL container
    ├── backend/                       # GraphQL API
    │   ├── prisma/
    │   │   ├── schema.prisma          # Database schema
    │   │   ├── seed.ts                # Test data seeding
    │   │   └── migrations/            # Database migrations
    │   ├── src/
    │   │   ├── index.ts               # Apollo Server setup
    │   │   ├── schema.ts              # GraphQL type definitions
    │   │   ├── resolvers.ts           # GraphQL resolvers
    │   │   ├── auth.ts                # Authentication logic
    │   │   ├── assignment.ts          # Case assignment algorithm
    │   │   ├── scoring.ts             # Case scoring system
    │   │   ├── notifications.ts       # Email/WhatsApp notifications
    │   │   ├── storage.ts             # File upload handling
    │   │   └── context.ts             # GraphQL context (auth)
    │   └── package.json
    └── frontend/                      # Next.js UI
        ├── src/
        │   ├── app/                   # Next.js App Router pages
        │   │   ├── dashboard/         # Role-based dashboard
        │   │   ├── cases/             # Case management
        │   │   ├── tickets/           # Ticket creation/viewing
        │   │   ├── reports/           # Report generation
        │   │   ├── analytics/         # Statistics dashboard
        │   │   ├── users/             # User management (Admin)
        │   │   ├── approvals/         # Approval workflow
        │   │   └── login/             # Authentication
        │   ├── components/            # React components
        │   │   ├── layout/            # Layout components
        │   │   ├── ui/                # Base UI components
        │   │   ├── Map.tsx            # Leaflet map components
        │   │   └── ...
        │   ├── context/
        │   │   └── AuthContext.tsx    # Authentication state
        │   ├── lib/
        │   │   ├── backend.ts         # Server-side API client
        │   │   ├── graphql.ts         # GraphQL queries/mutations
        │   │   ├── roleMapping.ts     # RBAC permission mapping
        │   │   └── session.ts         # Session management
        │   └── types/
        │       └── index.ts           # TypeScript type definitions
        ├── RBAC_SPECIFICATION.md      # Complete RBAC documentation
        ├── RBAC_IMPLEMENTATION_SUMMARY.md
        └── package.json
```

## .ENV EXAMPLE
# BACKEND
```
# ===============================
# Server Configuration
# ===============================
PORT=4000

# ===============================
# Database
# ===============================
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public

# ===============================
# Authentication
# ===============================
JWT_SECRET=your_super_secret_here

# ===============================
# File Upload
# ===============================
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=150

# ===============================
# Email (SMTP)
# ===============================
EMAIL_ADDRESS=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587

# ===============================
# WhatsApp (Twilio)
# ===============================
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# ===============================
# Reminder Scheduler
# ===============================
PENDING_REMINDER_INTERVAL_MIN=15
```
# Frontend Configuration (Next.js)

```


# GraphQL endpoint URL
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql

# Backend REST API base URL
NEXT_PUBLIC_API_URL=http://localhost:4000

# Enable mock data (true | false)
NEXT_PUBLIC_USE_MOCK_DATA=false
```
---

## 📡 API Documentation

### GraphQL Schema Highlights

#### Enums
- **Role**: DECLARANT, PSY, ADMIN_IT, DIR_VILLAGE, RESPONSABLE_SAUVEGARDE, DIR_NATIONAL
- **CaseStatus**: PENDING, IN_PROGRESS, SIGNED, FALSE_REPORT, CLOSED
- **Urgency**: LOW, MEDIUM, HIGH, CRITICAL
- **IncidentType**: HEALTH, BEHAVIOR, VIOLENCE, SEXUAL_ABUSE, NEGLECT, CONFLICT, OTHER

#### Key Queries
```graphql
# Authentication
login(email: String!, password: String!): AuthPayload

# Cases
cases(villageId: ID, status: CaseStatus): [Case!]!
case(id: ID!): Case

# Analytics
casesByStatus: [CaseStatusCount!]!
casesByVillage: [VillageCaseCount!]!

# Notifications
myNotifications: [Notification!]!

# Audit
auditLogs(limit: Int): [AuditLogEntry!]!
```

#### Key Mutations
```graphql
# Case Management
createCase(input: CreateCaseInput!): Case!
assignPsychologist(caseId: ID!, psychologistId: ID!, role: AssignmentRole!): Case!
updateCaseStatus(caseId: ID!, status: CaseStatus!): Case!

# Approvals
approveByDirVillage(caseId: ID!, signature: String!): Case!
approveBySauvegarde(caseId: ID!, signature: String!): Case!
closeCase(caseId: ID!): Case!

# Documents
uploadDocument(caseId: ID!, docType: DocumentType!, file: Upload!): CaseDocument!
uploadAttachment(caseId: ID!, file: Upload!): Attachment!

# Notifications
markNotificationRead(id: ID!): Notification!
```

---

## 👨‍💻 Development Workflow

### Backend Development

```bash
cd backend

# Run in development mode with hot reload
npm run dev

# Generate Prisma client after schema changes
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate

# View database in Prisma Studio
npx prisma studio

# Re-seed database
npm run seed
```

### Frontend Development

```bash
cd frontend

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm run start

# Lint code
npm run lint
```

### Database Management

```bash
# Start database
docker compose up -d

# Stop database
docker compose down

# View logs
docker compose logs -f

# Reset database (destructive!)
docker compose down -v
docker compose up -d
cd backend && npm run prisma:migrate && npm run seed
```

---

## 🧪 Testing

### RBAC Testing
The frontend includes comprehensive RBAC testing:
```bash
cd frontend
npx ts-node test-rbac.ts
```
**Results**: 84/84 tests pass ✅

### Manual Testing Checklist
- [ ] User authentication (all roles)
- [ ] Case creation and assignment
- [ ] Document upload (Fiche, DPE)
- [ ] Approval workflow (Dir Village → Sauvegarde → Close)
- [ ] Notifications (email/WhatsApp)
- [ ] Analytics dashboards
- [ ] Permission boundaries for each role
- [ ] Audit log generation

---

## 🌟 Key Implementation Highlights

### Scoring Algorithm
Cases are automatically scored based on:
- Urgency level (LOW: 1, MEDIUM: 3, HIGH: 5, CRITICAL: 10)
- Incident type weights
- Time elapsed since creation

### Assignment Logic
- Auto-assignment to least-busy psychologists in the village
- Support for dual assignment (PRIMARY/SECONDARY)
- Load balancing across available psychologists

### Approval Workflow
Sequential approval chain:
1. **Psychologist** writes Fiche Initiale + DPE
2. **Dir Village** reviews and signs
3. **Responsable Sauvegarde** reviews and signs
4. **Psychologist** can then close the case

### Notification System
Triggered on:
- New case creation
- Case assignment
- Status changes
- Approvals/signatures
- Case closure

---

## 🔒 Security Considerations

- All passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens for stateless authentication
- Role-based middleware checks all GraphQL resolvers
- Sensitive data filtered based on user permissions
- Audit logs track all mutations
- File uploads validated by type and size
- SQL injection prevention via Prisma ORM
- XSS protection through React's built-in escaping

---

## 📝 License

This project was created for the SOS Tunisie hackathon. All rights reserved.
TEAM:

Mohamed Amine MSADDAK

Ahmed BAYA CHATTI

Jawher ESSID

Salma IBN CHEIKH

**Built with ❤️ for SOS Villages d'Enfants Tunisie**
