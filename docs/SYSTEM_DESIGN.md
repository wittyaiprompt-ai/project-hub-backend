# System Design Document
## Internal Project Management System

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Next.js)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Pages   │  │ Zustand  │  │ REST API │  │  Socket.IO    │  │
│  │ (App Rtr)│  │  Store   │  │  Client  │  │    Client     │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬───────┘  │
└───────┼─────────────┼─────────────┼─────────────────┼──────────┘
        │             │             │ HTTPS/WSS       │
        ▼             ▼             ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NGINX (Reverse Proxy + SSL)                    │
│              /api/* → Express    /socket.io/* → Express         │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                   NODE.JS + EXPRESS SERVER                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Routes  │→ │Controllers│→│ Services │  │  Socket.IO    │  │
│  │          │  │           │  │          │  │  Handlers     │  │
│  └──────────┘  └──────────┘  └────┬─────┘  └───────┬───────┘  │
│                                    │                 │          │
│  ┌──────────┐  ┌──────────┐       │         ┌───────▼───────┐  │
│  │   JWT    │  │ Validate │       │         │ Redis Adapter │  │
│  │Middleware│  │Middleware│       │         │  (Pub/Sub)    │  │
│  └──────────┘  └──────────┘       │         └───────────────┘  │
└────────────────────────────────────┼─────────────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
        ┌──────────┐          ┌──────────┐          ┌──────────┐
        │ MongoDB  │          │  Redis   │          │  (Future │
        │          │          │          │          │  scaling)│
        └──────────┘          └──────────┘          └──────────┘
```

---

## 2. API Endpoints

### Auth
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Create new user account |
| POST | `/api/auth/login` | Authenticate, return JWT |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/password` | Change password |

### Projects
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project (owner only) |
| DELETE | `/api/projects/:id` | Delete project (owner only) |
| POST | `/api/projects/:id/members` | Add member by email |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/projects/:projectId/tasks` | List all tasks in project |
| POST | `/api/projects/:projectId/tasks` | Create task |
| GET | `/api/tasks/:id` | Get single task |
| PUT | `/api/tasks/:id` | Update task fields |
| PATCH | `/api/tasks/:id/status` | Update status only |
| DELETE | `/api/tasks/:id` | Delete task |

### Health
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Server health check |

---

## 3. Database Schema

### Collection: `users`
```javascript
{
  _id: ObjectId,
  name: String,          // required, max 100
  email: String,         // required, unique, lowercase
  password: String,      // bcrypt hash
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: `projects`
```javascript
{
  _id: ObjectId,
  name: String,          // required, max 150
  description: String,   // max 2000
  owner: ObjectId,       // ref: users
  members: [ObjectId],   // ref: users (includes owner)
  createdAt: Date,
  updatedAt: Date
}
```

### Collection: `tasks`
```javascript
{
  _id: ObjectId,
  project: ObjectId,     // ref: projects
  title: String,         // required, max 200
  description: String,   // max 5000
  status: String,        // enum: todo|in_progress|review|done
  priority: String,      // enum: low|medium|high
  assignee: ObjectId,    // ref: users, nullable
  order: Number,         // column sort order
  dueDate: Date,         // nullable
  createdBy: ObjectId,   // ref: users
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `users.email` — unique
- `projects.owner` — query by owner
- `projects.members` — query by membership
- `tasks.project + status + order` — board queries
- `tasks.assignee` — filter by assignee

---

## 4. Real-Time Communication Strategy

### Approach: Socket.IO with Redis Adapter

**Why Socket.IO over raw WebSockets:**
- Built-in reconnection and fallback transports
- Room-based broadcasting maps cleanly to projects
- Redis adapter enables horizontal scaling without custom pub/sub code
- Mature JWT auth middleware pattern

### Event Flow — Task Status Update

```
User A (Browser)                Server                    User B (Browser)
      │                           │                            │
      │ PATCH /tasks/:id/status   │                            │
      │──────────────────────────>│                            │
      │                           │ Validate + save to MongoDB │
      │                           │                            │
      │  HTTP 200 + updated task  │                            │
      │<──────────────────────────│                            │
      │                           │                            │
      │ emit task:updated         │                            │
      │──────────────────────────>│                            │
      │                           │ Broadcast to room          │
      │                           │ "project:{projectId}"      │
      │                           │───────────────────────────>│
      │                           │                            │ Update Zustand store
      │                           │                            │ Re-render board
```

### Socket Events

**Client → Server**
| Event | Payload | Purpose |
|-------|---------|---------|
| `project:join` | `{ projectId }` | Join project room after auth |
| `project:leave` | `{ projectId }` | Leave room on navigation |
| `task:move` | `{ taskId, status, order }` | Move task (alternative to REST) |

**Server → Client**
| Event | Payload | Purpose |
|-------|---------|---------|
| `task:created` | `{ task }` | New task added |
| `task:updated` | `{ task }` | Task fields changed |
| `task:deleted` | `{ taskId, projectId }` | Task removed |
| `task:moved` | `{ task }` | Status/order changed |
| `member:added` | `{ projectId, member }` | Member joined project |
| `member:removed` | `{ projectId, userId }` | Member removed |

### Socket Authentication
1. Client connects with `auth: { token: jwt }` in handshake
2. Server verifies JWT in `io.use()` middleware
3. On `project:join`, server checks user is owner or member before joining room
4. Invalid/expired token → connection rejected

### Why Not Polling or SSE?
- Polling wastes bandwidth and adds latency (1–5s intervals)
- SSE is one-directional; task moves need bidirectional ack in future
- WebSockets give sub-100ms delivery for internal collaboration use case

---

## 5. Frontend State Management — Zustand

**Choice: Zustand over Redux / Context**

| Factor | Zustand | Redux | Context |
|--------|---------|-------|---------|
| Boilerplate | Minimal | High | Low |
| Real-time patches | Easy `set()` | Action/reducer overhead | Re-render all consumers |
| DevTools | Available | Built-in | None |
| Next.js SSR | Works with client components | Same | Provider nesting |

Zustand stores:
- `useAuthStore` — user, token, login/logout
- `useTaskStore` — tasks by project, socket-driven updates
- `useSocketStore` — connection status, join/leave helpers

---

## 6. Scalability Considerations

### Current (Single VM)
- One Express process handles HTTP + WebSocket
- Redis adapter ready but optional for single instance
- MongoDB connection pool: 10 connections

### Horizontal Scaling Path
1. Run multiple Express instances behind Nginx load balancer
2. Enable Redis adapter on Socket.IO — events propagate across instances
3. Sticky sessions not required with Redis adapter
4. MongoDB read replicas for heavy read loads

### Bottlenecks & Mitigations
| Bottleneck | Mitigation |
|------------|------------|
| MongoDB writes on every drag | Debounce order updates; batch if needed |
| Large task lists | Pagination on API; virtual scroll on FE |
| Socket connections | PM2 cluster mode + Redis adapter |

### Caching Strategy (Future)
- Redis cache project metadata (TTL 5 min)
- Invalidate on project update/delete

---

## 7. Security

- Passwords: bcrypt (12 rounds)
- JWT secret in env, never in code
- CORS restricted to frontend domain
- Rate limiting on auth routes (100 req/15 min)
- Input validation via express-validator
- MongoDB connection uses auth + TLS in production
- Helmet.js for HTTP security headers

---

## 8. Deployment Architecture

```
GitHub → GitHub Actions (lint, test, build)
              │
              ├── Frontend → Vercel / Netlify (Next.js static export or SSR)
              │
              └── Backend → DigitalOcean Droplet
                              ├── PM2 process manager
                              ├── Nginx reverse proxy
                              ├── Let's Encrypt SSL
                              └── MongoDB Atlas (managed)
```

Branch strategy: `main` (production), `develop` (staging), feature branches → PR → merge.
