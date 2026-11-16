# REST API Documentation – AI Whiteboard

Base URL: `http://localhost:3000/api` (or environment-configured `API_URL`)

All endpoints returning JSON responses follow the standard response envelope:
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... }
}
```
Errors return:
```json
{
  "statusCode": 400,
  "message": ["validation error details..."],
  "error": "Bad Request",
  "timestamp": "2026-11-15T12:00:00.000Z",
  "path": "/api/..."
}
```

---

## 1. Health

### `GET /api/health`
Returns system status including database connection and object storage status.
- **Auth:** None
- **Response `200`:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-11-15T12:00:00.000Z",
    "services": {
      "database": "connected",
      "storage": "connected"
    }
  }
  ```

---

## 2. Authentication (`/api/auth`)

### `POST /api/auth/register`
Creates a new user account.
- **Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response `201`:**
  ```json
  {
    "user": {
      "id": "uuid-v4",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "avatarUrl": null
    },
    "accessToken": "jwt-token-string",
    "refreshToken": "refresh-token-string"
  }
  ```

### `POST /api/auth/login`
Authenticates a user and issues JWT tokens.
- **Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response `200`:**
  ```json
  {
    "user": {
      "id": "uuid-v4",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "avatarUrl": null
    },
    "accessToken": "jwt-token-string",
    "refreshToken": "refresh-token-string"
  }
  ```

### `POST /api/auth/refresh`
Rotates the refresh token and returns a new access token.
- **Body:**
  ```json
  {
    "refreshToken": "refresh-token-string"
  }
  ```
- **Response `200`:**
  ```json
  {
    "accessToken": "new-jwt-token-string",
    "refreshToken": "new-refresh-token-string"
  }
  ```

### `POST /api/auth/logout`
Revokes active refresh token.
- **Auth:** Bearer JWT
- **Body:**
  ```json
  {
    "refreshToken": "refresh-token-string"
  }
  ```
- **Response `200`:**
  ```json
  { "success": true, "message": "Successfully logged out" }
  ```

### `POST /api/auth/forgot-password`
Initiates a password reset flow by creating a reset token.
- **Body:**
  ```json
  { "email": "jane@example.com" }
  ```
- **Response `200`:**
  ```json
  { "message": "If this email is registered, password reset instructions have been issued." }
  ```

### `POST /api/auth/reset-password`
Completes password reset with token.
- **Body:**
  ```json
  {
    "token": "reset-token",
    "newPassword": "NewSecurePassword123!"
  }
  ```
- **Response `200`:**
  ```json
  { "message": "Password successfully reset." }
  ```

---

## 3. Users (`/api/users`)

### `GET /api/users/me`
Fetches currently authenticated user profile.
- **Auth:** Bearer JWT
- **Response `200`:** User entity.

### `PATCH /api/users/me`
Updates user profile (name, avatarUrl, change password).
- **Auth:** Bearer JWT
- **Body:**
  ```json
  {
    "name": "Jane Developer",
    "avatarUrl": "https://...",
    "currentPassword": "SecurePassword123!",
    "newPassword": "BrandNewPassword123!"
  }
  ```
- **Response `200`:** Updated user entity.

### `GET /api/users/search?q=jane`
Search registered users by name or email (for sharing invites).
- **Auth:** Bearer JWT
- **Response `200`:** Array of matching users (`id`, `name`, `email`, `avatarUrl`).

---

## 4. Whiteboards (`/api/whiteboards`)

### `GET /api/whiteboards?tab=all&search=project&sortBy=updatedAt&order=desc`
Lists whiteboards accessible to the current user (owned or shared).
- **Auth:** Bearer JWT
- **Query Params:**
  - `tab`: `all` | `mine` | `shared` | `recent`
  - `search`: string filter on title/description
  - `sortBy`: `updatedAt` | `title` | `createdAt`
  - `order`: `asc` | `desc`
- **Response `200`:**
  ```json
  [
    {
      "id": "uuid-v4",
      "title": "Q4 Strategy Canvas",
      "description": "Product launch brainstorming",
      "thumbnailUrl": null,
      "owner": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com" },
      "role": "OWNER",
      "createdAt": "2026-11-15T00:00:00.000Z",
      "updatedAt": "2026-11-15T02:00:00.000Z"
    }
  ]
  ```

### `POST /api/whiteboards`
Creates a new whiteboard.
- **Auth:** Bearer JWT
- **Body:**
  ```json
  {
    "title": "Untitled Whiteboard",
    "description": ""
  }
  ```
- **Response `201`:** Newly created whiteboard.

### `GET /api/whiteboards/:boardId`
Loads full board details and elements.
- **Auth:** Bearer JWT (requires OWNER, EDITOR, or VIEWER access)
- **Response `200`:** Whiteboard object with elements array and members array.

### `PATCH /api/whiteboards/:boardId`
Renames board, updates description or thumbnail.
- **Auth:** Bearer JWT (requires OWNER or EDITOR access)
- **Body:**
  ```json
  {
    "title": "New Board Title",
    "description": "Updated description",
    "thumbnailUrl": "https://..."
  }
  ```

### `DELETE /api/whiteboards/:boardId`
Deletes whiteboard and associated elements.
- **Auth:** Bearer JWT (requires OWNER access)

---

## 5. Board Members (`/api/whiteboards/:boardId/members`)

### `GET /api/whiteboards/:boardId/members`
List collaborators on this board.
- **Auth:** Bearer JWT (OWNER, EDITOR, VIEWER)

### `POST /api/whiteboards/:boardId/members`
Invite user to board by email.
- **Auth:** Bearer JWT (OWNER or EDITOR)
- **Body:**
  ```json
  {
    "email": "colleague@example.com",
    "role": "EDITOR" // "EDITOR" | "VIEWER"
  }
  ```

### `PATCH /api/whiteboards/:boardId/members/:memberId`
Change collaborator role.
- **Auth:** Bearer JWT (OWNER only)
- **Body:**
  ```json
  { "role": "VIEWER" }
  ```

### `DELETE /api/whiteboards/:boardId/members/:memberId`
Remove collaborator from board.
- **Auth:** Bearer JWT (OWNER or self-leave)

---

## 6. Elements (`/api/whiteboards/:boardId/elements`)

### `POST /api/whiteboards/:boardId/elements`
Creates a single canvas element.
- **Auth:** Bearer JWT (OWNER, EDITOR)
- **Body:**
  ```json
  {
    "id": "uuid-v4",
    "type": "rectangle",
    "positionX": 150,
    "positionY": 200,
    "width": 120,
    "height": 80,
    "rotation": 0,
    "zIndex": 1,
    "data": {
      "fill": "#E8F5E9",
      "stroke": "#2D6A4F",
      "strokeWidth": 2
    }
  }
  ```

### `POST /api/whiteboards/:boardId/elements/bulk`
Creates, updates, or deletes elements in a single transactional batch.
- **Auth:** Bearer JWT (OWNER, EDITOR)
- **Body:**
  ```json
  {
    "create": [ { ...elementPayload } ],
    "update": [ { "id": "uuid", "positionX": 200, "positionY": 250, ... } ],
    "delete": [ "uuid-1", "uuid-2" ]
  }
  ```

### `PATCH /api/whiteboards/:boardId/elements/:elementId`
Updates a single element.
- **Auth:** Bearer JWT (OWNER, EDITOR)

### `DELETE /api/whiteboards/:boardId/elements/:elementId`
Deletes a single element.
- **Auth:** Bearer JWT (OWNER, EDITOR)

---

## 7. Uploads (`/api/uploads`)

### `POST /api/uploads`
Uploads an image (multipart/form-data with key `file`).
- **Auth:** Bearer JWT
- **Body:** `multipart/form-data`, optional `whiteboardId`
- **Response `201`:**
  ```json
  {
    "id": "uuid",
    "url": "http://localhost:9000/ai-whiteboard/uploads/uuid-filename.png",
    "storageKey": "uploads/uuid-filename.png",
    "originalFilename": "diagram.png",
    "mimeType": "image/png",
    "fileSize": 124560
  }
  ```

---

## 8. AI Assistant (`/api/ai`)

All AI endpoints utilize Google Gemini on the backend with structured JSON schemas.

### `POST /api/ai/brainstorm`
- **Body:** `{ "boardId": "uuid", "prompt": "Launch strategies for AI SaaS app", "count": 6 }`
- **Returns:** Structured sticky notes with coordinate layout and color groupings.

### `POST /api/ai/outline`
- **Body:** `{ "boardId": "uuid", "prompt": "Q1 2027 Engineering Roadmap" }`
- **Returns:** Structured phases and milestones with connected elements.

### `POST /api/ai/diagram`
- **Body:** `{ "boardId": "uuid", "prompt": "Microservices with API Gateway, Auth, Payment, and Postgres" }`
- **Returns:** Nodes, shapes, labels, and directional connectors.

### `POST /api/ai/chart`
- **Body:** `{ "boardId": "uuid", "prompt": "Quarterly revenue for 2026", "chartType": "bar" }`
- **Returns:** Structured chart element with labels, values, and styling.

### `POST /api/ai/edit`
- **Body:** `{ "boardId": "uuid", "elementIds": ["uuid-1"], "instruction": "Summarize into concise bullet points" }`
- **Returns:** Updated element attributes with original IDs preserved.

### `POST /api/ai/summary`
- **Body:** `{ "boardId": "uuid" }`
- **Returns:** Executive summary of the whiteboard content, categorized topics, and action items.
