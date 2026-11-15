# System Architecture – AI Whiteboard

## 1. Overview

**AI Whiteboard** is a production-ready, full-stack, AI-powered collaborative whiteboard web application. It combines an infinite interactive canvas with real-time multi-user collaboration and generative AI capabilities powered by Google Gemini.

The system is designed with a desktop-first collaborative canvas, standard PostgreSQL relational storage for structured data and JSONB attributes, S3-compatible object storage for uploaded assets, and bidirectional WebSocket communication via Socket.IO.

```
+-------------------------------------------------------------------------+
|                              Web Clients                                |
|  - React 19 + TypeScript + Vite + Tailwind CSS v4                       |
|  - Infinite Canvas (SVG & Canvas Rendering, Perfect-Freehand)           |
|  - Zustand Global Stores + Socket.IO Client + Axios                     |
+--------------------+--------------------------------+-------------------+
                     | HTTP REST (JWT Auth)           | WebSocket (WSS)
                     v                                v
+-------------------------------------------------------------------------+
|                           NestJS API Server                             |
|  - Passport JWT Auth & Refresh Tokens (bcrypt)                          |
|  - Whiteboards & Elements Services (Transactions & Batching)            |
|  - Socket.IO WebSocket Gateway (Rooms, Presence, Cursors)               |
|  - Google Gemini AI Module (Diagrams, Charts, Outlines, Summaries)      |
|  - Multer & S3 Client (Presigned URLs / Stream to MinIO or AWS S3)      |
+--------------------+--------------------------------+-------------------+
                     |                                |
         SQL Queries | ORM (Prisma)        S3 SDK API |
                     v                                v
+----------------------------+   +----------------------------------------+
|    PostgreSQL Database     |   |   S3-Compatible Storage (MinIO / S3)   |
|  - Standard PostgreSQL     |   |  - Media assets & images               |
|  - Users & Refresh Tokens  |   |  - Bucket: `ai-whiteboard`             |
|  - Whiteboards & Members   |   |  - Secure metadata stored in DB        |
|  - Elements (JSONB & BBox) |   +----------------------------------------+
|  - AI Usage Audit Logs     |
+----------------------------+
```

---

## 2. Technology Stack

### 2.1 Frontend
- **Framework:** React 19+ with Vite and TypeScript
- **Styling:** Tailwind CSS v4 (Forest green brand palette `#1B4332`, `#2D6A4F`, `#40916C`, `#52B788`, `#74C69D`, neutral slates)
- **State Management:** Zustand for modular global stores (`useAuthStore`, `useWhiteboardStore`, `useCanvasStore`, `useCollaborationStore`, `useAiStore`)
- **Canvas Engine:** HTML5 Canvas & SVG dual-layer engine with `perfect-freehand` for natural stylus and mouse strokes
- **Networking:** Axios with request/response interceptors for automatic JWT refresh; Socket.IO client for sub-50ms sync
- **UI Components & Icons:** Lucide React, Framer Motion for micro-interactions, React Hot Toast for notification toasts

### 2.2 Backend
- **Framework:** NestJS (Node.js) with TypeScript
- **Database Access:** Prisma ORM connected to standard PostgreSQL
- **Real-Time:** `@nestjs/websockets` and `@nestjs/platform-socket.io` with WebSocket Gateway
- **Authentication:** Passport-JWT, bcrypt password hashing, rotating refresh token persistence
- **File Uploads:** Multer with `@aws-sdk/client-s3` supporting MinIO locally and AWS S3 in cloud
- **AI Processing:** Google Gemini API (`@google/genai` or `@google/generative-ai`) with strict JSON schema validation
- **Validation:** `class-validator` and `class-transformer` on all incoming REST DTOs and socket payloads
- **Security:** Helmet, CORS, Throttler (rate limiting), secure HTTP-only cookies and Authorization headers

---

## 3. Monorepo Organization

```text
ai-whiteboard/
├── client/                     # Frontend SPA (React + Vite + Tailwind)
│   ├── src/
│   │   ├── app/                # Main App entry and route definitions
│   │   ├── canvas/             # Infinite canvas engine
│   │   │   ├── elements/       # Shape, text, note, chart, image renderers
│   │   │   ├── tools/          # Pen, pencil, eraser, selection, connector tools
│   │   │   ├── Canvas.tsx      # Main canvas orchestrator
│   │   │   ├── Viewport.tsx    # Pan and zoom transform container
│   │   │   └── SelectionLayer.tsx # Bounding boxes, transform handles
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ai/             # Gemini AI assistant drawer and prompt modals
│   │   │   ├── common/         # Buttons, inputs, modals, dropdowns
│   │   │   ├── dashboard/      # Whiteboard grid, search, recent boards
│   │   │   ├── layout/         # Header, sidebar, user navigation
│   │   │   └── whiteboard/     # Canvas toolbar, properties panel, export dialog
│   │   ├── pages/              # LandingPage, LoginPage, DashboardPage, WhiteboardPage
│   │   ├── services/           # Axios API client, Socket.IO client singleton
│   │   ├── store/              # Zustand state stores
│   │   └── types/              # Shared client-side interfaces and enums
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                     # Backend API & Gateway (NestJS)
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema definitions
│   │   └── migrations/         # SQL migration scripts
│   ├── src/
│   │   ├── auth/               # Register, login, refresh, logout, reset-pass
│   │   ├── users/              # Profile, search users
│   │   ├── whiteboards/        # Whiteboard management & member permissions
│   │   ├── elements/           # Canvas element persistence & bulk mutations
│   │   ├── collaboration/      # Socket.IO Gateway, rooms, live cursors
│   │   ├── ai/                 # Gemini API service, prompt builders, parsers
│   │   ├── uploads/            # Multer handler and S3 / MinIO integration
│   │   ├── database/           # Prisma service & lifecycle hooks
│   │   ├── common/             # Guards, decorators, filters, interceptors
│   │   ├── config/             # Config module & schema validation
│   │   ├── app.module.ts       # Root module
│   │   └── main.ts             # Bootstrap, Swagger, CORS, Helmet
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── docs/                       # Architectural & API specifications
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_DOCUMENTATION.md
│   ├── WEBSOCKET_EVENTS.md
│   └── DEVELOPMENT_PLAN.md
│
├── docker-compose.yml          # Local orchestration (PostgreSQL, MinIO, Server, Client)
├── DEVELOPMENT_PROGRESS.md     # Tracking completed phases and features
└── README.md                   # Comprehensive developer documentation
```

---

## 4. Key Architectural Patterns

### 4.1 Hybrid Real-Time Persistence (Performance-Optimized)
High-frequency interactions such as cursor movement (`cursor:move`) and in-progress drawing strokes (`draw:stroke`) are broadcast ephemerally over Socket.IO rooms without hitting PostgreSQL. Once a user finishes drawing a stroke or dragging elements, the final state is committed via REST/WebSocket batch operations, ensuring database efficiency while retaining sub-50ms peer reactivity.

### 4.2 Role-Based Access Control (RBAC)
Every board resource has strict role enforcement:
- **OWNER**: Full administrative control, delete board, invite/remove members, transfer ownership, edit elements.
- **EDITOR**: Create, update, delete elements, upload assets, invite other editors/viewers.
- **VIEWER**: Read-only access. Cannot create/update/delete elements, cannot emit drawing events.
Permissions are validated at both REST endpoints (via NestJS `BoardRoleGuard`) and WebSocket gateways (via room membership checks).

### 4.3 Generative AI with Google Gemini
The AI engine runs exclusively on the backend:
1. User provides prompt (e.g., "Create a microservices architecture for an e-commerce platform").
2. NestJS `AiService` sends system instructions requiring strict JSON output conforming to whiteboard schema.
3. Response is parsed, validated, and converted into canvas elements with calculated coordinate layouts (`position_x`, `position_y`, width, height, colors, connectors).
4. Tokens and requests are logged in the `ai_usage` table for auditability and rate-limiting.
