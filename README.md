# AI Whiteboard – Full-Stack Collaborative Canvas with Google Gemini

An AI-powered collaborative whiteboard web application built with **React 19**, **NestJS**, **standard PostgreSQL**, **Socket.IO**, and **Google Gemini AI**. Brainstorm, design architectures, visualize editable data charts, collaborate with team members in real-time with sub-50ms latency, and create visual content powered by generative AI.

---

## 🌟 Key Features

- **Infinite Canvas Engine:** Pan, smooth cursor-anchored zoom (10% - 500%), and switchable backgrounds (dotted grid, line grid, plain white, dark blueprint).
- **Google Gemini Generative AI:**
  - **AI Brainstorming:** Instantly turn product challenges into organized sticky note clusters.
  - **AI Architecture & Flowchart Diagrams:** Generate services, databases, gateways, and connecting arrows.
  - **AI Roadmap & Outline:** Generate chronological milestones and connected phases.
  - **AI Interactive Charts:** Synthesize bar, line, pie, and donut charts with editable datasets.
  - **AI Element Editing:** Rewrite, summarize, and convert existing elements to action-oriented bullet points.
  - **AI Executive Summary:** Synthesize comprehensive executive summaries and action items from all board content.
- **Real-Time Collaboration:**
  - Multi-user live cursor movements with user tags and unique colors.
  - Sub-50ms peer reactivity using Socket.IO room namespaces.
  - Real-time freehand stroke streaming and element mutation broadcasting.
  - Live active collaborator presence list.
- **Drawing & Annotation Tools:**
  - Pressure-sensitive freehand drawing (Pen, Pencil, Highlighter with blend mode, Eraser) powered by `perfect-freehand`.
  - Geometric shapes: Rectangle, Rounded Rectangle, Circle/Ellipse, Triangle, Diamond, Star, Cylinder (Database), and Connectors.
  - Rich text with custom font families, font sizes, weights, and alignment.
  - Sticky notes with vibrant pastel palettes.
  - Contextual floating toolbar for instantaneous color, border width, and layer adjustments.
- **Editable Charts & Data Visualization:**
  - Native SVG Bar, Line, Pie, and Donut charts.
  - Double-click any chart to open the Chart Editor and customize series data, labels, and colors.
- **Image Uploads & Object Storage:**
  - S3-compatible asset pipeline (MinIO for local development, AWS S3 for production).
  - Multer upload validation (JPEG, PNG, WebP, SVG, GIF up to 5MB).
  - File metadata persisted in PostgreSQL; binary data never stored in database.
- **History, Clipboard & Shortcuts:**
  - Undo/Redo stack (`Ctrl+Z`, `Ctrl+Shift+Z`).
  - Copy (`Ctrl+C`), Paste (`Ctrl+V`), Duplicate (`Ctrl+D`), Select All (`Ctrl+A`), and Delete (`Backspace`).
- **High-Fidelity Export:**
  - Export entire boards or selected element regions to crisp PNG images or vector SVG files.
- **Enterprise-Grade Security & RBAC:**
  - JWT authentication with rotating refresh tokens stored in PostgreSQL.
  - Role-based permissions (**OWNER**, **EDITOR**, **VIEWER**) enforced across REST APIs and WebSocket events.
  - Standard PostgreSQL only — no proprietary vendor lock-in.

---

## 📸 Screenshots (Light Theme)

### 🎨 Infinite Canvas Workspace & Collaboration
> Full-featured infinite canvas with pressure-sensitive drawing, geometric shapes, sticky notes, editable charts, layer ordering, and live minimap navigation.

![Whiteboard Canvas Workspace](docs/screenshots/06-whiteboard-canvas.png)

---

### 🤖 Google Gemini AI Assistant
> Interactive AI drawer providing one-click brainstorming sticky note clusters, technical architecture diagrams, outlines, and board executive summaries.

![Google Gemini AI Assistant Drawer](docs/screenshots/07-ai-assistant-drawer.png)

---

### 📊 Whiteboard Dashboard & Templates
> Multi-board management with grid view, template starters (Flowchart, Kanban, Retrospective), search filtering, and sorting.

![Dashboard Page](docs/screenshots/05-dashboard-page.png)

---

### 🌐 Landing Page
> Clean, responsive hero showcase highlighting product capabilities, live collaboration, and AI integrations.

![Landing Page](docs/screenshots/01-landing-page.png)

---

### 📥 High-Fidelity Export & Team Collaboration Modals
| Export Board (PNG, SVG, JSON) | Share & Manage Board Permissions |
| :---: | :---: |
| ![Export Modal](docs/screenshots/08-export-modal.png) | ![Share Modal](docs/screenshots/09-share-modal.png) |

---

### 🔐 Authentication & Account Management
| User Login | User Registration | Password Recovery |
| :---: | :---: | :---: |
| ![Login Page](docs/screenshots/02-login-page.png) | ![Register Page](docs/screenshots/03-register-page.png) | ![Forgot Password Page](docs/screenshots/04-forgot-password-page.png) |

---

### ⚙️ User Profile & Settings
> Account management, profile details, and security controls.

![User Settings](docs/screenshots/10-settings-page.png)

---

## 🛠 Technology Stack

### Frontend
- **React 19** + **Vite** + **TypeScript**
- **Tailwind CSS v4** (Forest green brand palette)
- **Zustand** for state management (`useAuthStore`, `useWhiteboardStore`, `useCanvasStore`, `useCollaborationStore`, `useAiStore`)
- **Socket.IO Client** for WebSocket synchronization
- **Perfect Freehand** for smooth vector stroke generation
- **Framer Motion** for modals and drawer animations
- **Lucide React** for icons
- **React Hot Toast** for notifications

### Backend
- **Node.js** + **NestJS** + **TypeScript**
- **Standard PostgreSQL** + **Prisma ORM**
- **Socket.IO** + **@nestjs/websockets**
- **Google Gemini API** (`@google/genai`)
- **Passport.js** + **JWT** + **bcryptjs**
- **Multer** + **AWS SDK S3 Client** (`@aws-sdk/client-s3`)
- **Swagger / OpenAPI** (`/api/docs`)
- **Helmet**, **CORS**, and **Throttler** rate limiting

---

## 🏛 System Architecture

```
+-------------------------------------------------------------------------+
|                              Web Browser                                |
|  React 19 + TypeScript + Tailwind v4 + Perfect Freehand + Zustand        |
+--------------------+--------------------------------+-------------------+
                     | HTTP REST (JWT Auth)           | WebSocket (WSS)
                     v                                v
+-------------------------------------------------------------------------+
|                           NestJS API Server                             |
|  - Passport JWT Auth & Refresh Tokens (bcrypt)                          |
|  - Whiteboards & Elements Services (Transactions & Batching)            |
|  - Socket.IO Gateway (Rooms, Presence, Throttled Cursors)               |
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
|  - Whiteboards & Members   |   +----------------------------------------+
|  - Elements (JSONB & BBox) |
|  - AI Usage Audit Logs     |
+----------------------------+
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js** >= 20.x
- **npm** >= 10.x
- **Docker** and **Docker Compose** (for PostgreSQL and MinIO)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/VirendraArekar/ai-whiteboard.git
cd ai-whiteboard
npm install
```

### 2. Environment Configuration
Create `.env` in the `server` folder:
```bash
cp server/.env.example server/.env
```
Key environment variables:
```env
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_whiteboard
JWT_ACCESS_SECRET=your_secure_access_secret_minimum_32_characters
JWT_REFRESH_SECRET=your_secure_refresh_secret_minimum_32_characters
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=ai-whiteboard
```

### 3. Start PostgreSQL and MinIO via Docker
```bash
docker compose up -d postgres minio minio-init
```

### 4. Run Prisma Migrations & Generate Client
```bash
npm --workspace=server run prisma:generate
```

### 5. Start Development Servers
Run both frontend and backend concurrently:
```bash
npm run dev
```
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3000/api](http://localhost:3000/api)
- **Swagger Documentation:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **MinIO Console:** [http://localhost:9001](http://localhost:9001) (`minioadmin` / `minioadmin`)

---

## 🧪 Testing

### Backend Tests (Jest)
Runs unit test suites covering Authentication, Users, Whiteboards, Elements, Collaboration, Object Storage, and Gemini AI:
```bash
npm --workspace=server run test
```

### Frontend Tests (Vitest)
Runs coordinate math, bounding box intersections, and SVG freehand stroke tests:
```bash
npm --workspace=client run test
```

### Full Monorepo Build Check
```bash
npm run build
```

---

## 🐳 Docker Deployment

To run the complete application inside Docker containers:
```bash
docker compose up -d --build
```
This launches:
- `postgres`: PostgreSQL 16 standard database
- `minio`: MinIO S3 object storage
- `minio-init`: Auto-configures `ai-whiteboard` bucket
- `server`: NestJS backend API and WebSocket Gateway
- `client`: React SPA served with Nginx

---

## 📚 Documentation Reference

Detailed architectural specifications and contracts are located in the `docs/` folder:
- **Architecture Overview:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Database Schema:** [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)
- **REST API Endpoints:** [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
- **WebSocket Events:** [docs/WEBSOCKET_EVENTS.md](docs/WEBSOCKET_EVENTS.md)
- **Development Plan:** [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md)
- **Progress Log:** [DEVELOPMENT_PROGRESS.md](DEVELOPMENT_PROGRESS.md)

---

## 📄 License
This project is licensed under the MIT License.
