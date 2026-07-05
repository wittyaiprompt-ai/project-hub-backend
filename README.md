# ProjectHub — Backend API

Express + MongoDB + Socket.IO + Redis backend for the internal project management system.

## Live API

**https://project-hub-backend-q5me.onrender.com**

| Service | URL |
|---------|-----|
| API base | [project-hub-backend-q5me.onrender.com/api](https://project-hub-backend-q5me.onrender.com/api) |
| Health check | [project-hub-backend-q5me.onrender.com/api/health](https://project-hub-backend-q5me.onrender.com/api/health) |
| GitHub | [project-hub-be](https://github.com/wittyaiprompt-ai/project-hub-be) |

## Stack

- Node.js, Express
- MongoDB (Mongoose)
- JWT authentication
- Socket.IO (real-time task updates)
- Redis (Socket.IO adapter for pub/sub across instances)

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Server runs at `http://localhost:5000`

## Environment

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing tokens |
| `CLIENT_URL` | Frontend URL(s) for CORS — comma-separated, no trailing slash |
| `REDIS_ENABLED` | `true` to enable Redis adapter |
| `REDIS_URL` | Redis connection URL |
| `PORT` | Default `5000` (Render sets automatically) |

Production example (Render):

```
MONGODB_URI=<Atlas URI>
JWT_SECRET=<random secret>
CLIENT_URL=https://regal-mermaid-148817.netlify.app
REDIS_ENABLED=true
REDIS_URL=rediss://default:<password>@<host>.upstash.io:6379
NODE_ENV=production
```

## Redis setup (production — Upstash free)

1. Go to [upstash.com](https://upstash.com) → Create database → **Redis**
2. Copy the **read-write TCP URL** (starts with `rediss://`, user `default`)
3. On **Render**, add env vars:

```
REDIS_ENABLED=true
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379
```

4. Redeploy backend
5. Check health: https://project-hub-backend-q5me.onrender.com/api/health — `"redis": "ready"` means adapter works; `"unavailable"` means pub/sub blocked (app still runs on one server)

**Upstash NOPERM?** Use the read-write TCP URL (not `default_ro`). The server falls back automatically if pub/sub is blocked. Or set `REDIS_ENABLED=false`.

Redis is used as the Socket.IO adapter so real-time events sync if you scale to multiple server instances.

## API

- `POST /api/auth/register` · `POST /api/auth/login`
- `GET /api/projects` · `POST /api/projects`
- `GET /api/tasks/projects/:id/tasks` · `POST /api/tasks/projects/:id/tasks`
- `PATCH /api/tasks/:id/status`

Health: `GET /api/health`

## Socket events

**Client → Server:** `project:join`, `project:leave`, `task:move`  
**Server → Client:** `task:created`, `task:updated`, `task:moved`, `task:deleted`

## Frontend repo

[project-hub-fe](https://github.com/wittyaiprompt-ai/project-hub-fe) — live at https://regal-mermaid-148817.netlify.app

## License

Private — internal use.
