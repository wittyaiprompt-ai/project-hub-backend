# ProjectHub — Backend API

Express + MongoDB + Socket.IO backend for the internal project management system.

## Stack

- Node.js, Express
- MongoDB (Mongoose)
- JWT authentication
- Socket.IO (real-time task updates)
- Redis adapter (optional, for scaling)

## Setup

```bash
cp .env.example .env
# Edit MONGODB_URI, JWT_SECRET, CLIENT_URL

npm install
npm run dev
```

Server runs at `http://localhost:5000`

## Environment

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing tokens |
| `CLIENT_URL` | Frontend URL for CORS |
| `REDIS_ENABLED` | `true` to enable Redis adapter |
| `PORT` | Default `5000` |

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

[project-hub-fe](https://github.com/wittyaiprompt-ai/project-hub-fe)

## License

Private — internal use.
