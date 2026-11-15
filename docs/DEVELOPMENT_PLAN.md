# Detailed Development Plan – AI Whiteboard

This plan lays out the 21 development phases defined in the project specification, executed incrementally.

---

## Phase Breakdown

### Phase 1: Project Initialization & Monorepo Setup
- Initialize root monorepo configuration and scripts.
- Scaffold React 19 + TypeScript + Vite frontend with Tailwind CSS v4.
- Scaffold NestJS + TypeScript backend.
- Set up Prettier, ESLint, and Git repository hooks/settings.

### Phase 2: PostgreSQL Setup & Prisma ORM
- Configure standard PostgreSQL connection.
- Define `schema.prisma` with all entities (`users`, `whiteboards`, `whiteboard_members`, `elements`, `ai_usage`, `refresh_tokens`, `uploads`).
- Configure Docker Compose with PostgreSQL (standard version 16/17) and MinIO object storage.
- Create database migrations and client generation scripts.
- Add database connection health checks.

### Phase 3: Backend Foundation & Infrastructure
- Configure NestJS global validation pipe, custom exception filters, and logging interceptors.
- Configure Swagger / OpenAPI documentation (`/api/docs`).
- Configure environment variable validation with `class-validator` / Joi.
- Set up security middleware: Helmet, CORS, and Rate Limiting.

### Phase 4: Authentication & User Management
- Implement User registration with bcrypt password hashing.
- Implement Login with JWT access tokens and rotating refresh tokens.
- Implement Token refresh and revoke on logout.
- Implement Forgot password and Reset password flows.
- Implement User profile retrieval, update, and user search APIs.
- Create NestJS authentication guards (`JwtAuthGuard`) and `@CurrentUser` decorator.

### Phase 5: Whiteboard CRUD & RBAC
- Implement Whiteboard CRUD (create, read by ID, list, update, delete, duplicate).
- Implement role-based member management (OWNER, EDITOR, VIEWER).
- Create `BoardRoleGuard` to enforce permissions on board operations.
- Add filtering, search, and sorting (by date and title).

### Phase 6: Element Persistence & Batching
- Implement Element CRUD APIs (single element create, update, delete).
- Implement bulk operations (`POST /api/whiteboards/:boardId/elements/bulk`) with database transactions.
- Implement JSONB attribute parsing and bounding box coordinates.
- Ensure z-index ordering and layer management.

### Phase 7: Real-Time WebSocket Gateway
- Implement NestJS WebSocket Gateway with Socket.IO.
- Implement JWT authentication during socket handshake.
- Implement room management (`board:<boardId>`) with membership verification.
- Implement cursor broadcasting with throttling.
- Implement live element sync and presence indicators.

### Phase 8: S3/MinIO Object Storage & Uploads
- Configure `@aws-sdk/client-s3` for MinIO (local) and AWS S3 (production).
- Implement Multer file upload filter (images only: PNG, JPEG, SVG, WebP, GIF; max 5MB).
- Implement upload endpoint with UUID storage keys and PostgreSQL metadata tracking.
- Support direct serving or presigned image URLs.

### Phase 9: Google Gemini AI Module
- Configure Google Gemini API integration using `@google/genai` or `@google/generative-ai`.
- Implement AI Brainstorming service (structured sticky notes).
- Implement AI Outline/Roadmap generator.
- Implement AI Architecture/Flowchart diagram generator (nodes + connectors).
- Implement AI Chart generator (bar, line, pie, donut).
- Implement AI Element Editing (rewrite, summarize, bullet points).
- Implement AI Whiteboard Summary generator.
- Track token usage in `ai_usage` table.

### Phase 10: Frontend Foundation & Design System
- Configure React Router with protected and public route layouts.
- Set up Zustand state stores (`useAuthStore`, `useWhiteboardStore`, `useCanvasStore`, etc.).
- Set up Axios instance with automatic token refreshing interceptors.
- Build design system in Tailwind CSS v4 with Forest green theme.
- Create reusable UI components (Button, Input, Modal, Dropdown, Tooltip, Avatar).

### Phase 11: Landing Page & Authentication UI
- Build modern SaaS Landing Page (Hero, Features, AI showcase, Templates preview, CTA, Footer).
- Build Registration, Login, Forgot Password, and Reset Password views with validation and toasts.
- Build User Profile and Settings page.

### Phase 12: Dashboard UI
- Whiteboard grid with thumbnail cards, last modified timestamp, and role badges.
- Tab views: "All Boards", "My Whiteboards", "Shared with Me", "Recent".
- Create Whiteboard modal with templates.
- Rename, Duplicate, and Delete actions with confirmation dialogs.
- Search and sorting controls.

### Phase 13: Infinite Canvas Engine
- Viewport pan (middle mouse, space+drag) and zoom (mouse wheel, buttons, pinch).
- Coordinate transformation between screen space and world space.
- Grid backgrounds: Dotted, Grid lines, Plain, Dark.
- Multi-selection marquee box, single-click selection, bounding box handles.
- Move, resize (8 handles), rotate, layer reordering (bring forward, send backward), lock/unlock.

### Phase 14: Whiteboard Drawing & Annotation Tools
- Text Tool (inline editing, font size, bold, italic, underline, alignment, color).
- Sticky Note Tool (color palettes, auto-wrap text, drag, resize).
- Freehand Drawing (Pen, Pencil, Highlighter, Eraser) with `perfect-freehand` SVG rendering.
- Shapes (Rectangle, Rounded Rectangle, Circle/Ellipse, Triangle, Diamond, Star, Line, Arrow, Double Arrow, Polygon).
- Connectors between shapes.
- Floating contextual toolbar for selected elements.

### Phase 15: Charts & Image Insertion
- Interactive Chart element (Bar, Line, Pie, Donut).
- Chart data editor modal (labels, series, values, colors).
- Image upload integration (drag and drop onto canvas, file picker, S3 upload, resize handles).

### Phase 16: History, Clipboard & Export
- Undo/Redo history stack with shortcut support (`Ctrl+Z`, `Ctrl+Shift+Z`).
- Clipboard operations (Copy `Ctrl+C`, Paste `Ctrl+V`, Duplicate `Ctrl+D`, Delete `Delete`/`Backspace`).
- High-fidelity export to PNG and SVG (retaining shapes, text, charts, images).

### Phase 17: Board Sharing & Permissions UI
- Share modal with email invitation input and role selector (EDITOR / VIEWER).
- Active collaborators list with role switching and removal for owners.
- Read-only UI enforcement for VIEWERs (disable editing tools, show viewer badge).

### Phase 18: Real-Time Collaborative Canvas UI
- Socket.IO connection hook integrated into canvas.
- Live collaborator cursors with name badges and unique colors.
- Presence indicator in top navigation bar with collaborator avatars.
- Real-time element sync without flickering or losing local drag states.

### Phase 19: AI Assistant UI & Workflows
- Collapsible AI Assistant side drawer with quick prompts.
- Brainstorm dialog, Roadmap generator, Diagram generator, and Chart generator forms.
- Element editing floating prompt (Rewrite, Bullet points, Summarize).
- "Summarize Board" modal with executive summary and key findings.

### Phase 20: Testing & Optimization
- Backend unit and integration tests (Auth, Whiteboards, Elements, AI).
- Frontend component and canvas tests with Vitest.
- Performance optimization: memoization, canvas layer separation, throttled broadcasts.

### Phase 21: Docker, CI/CD & Final Documentation
- Dockerfiles for backend and frontend.
- `docker-compose.yml` verifying local end-to-end execution.
- GitHub Actions CI workflow (`.github/workflows/ci.yml`).
- Final documentation and verification.
