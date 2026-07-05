# AI Usage Declaration

AI tools (Cursor / Claude) were used during development of this project.

## Where AI Was Used

| Area | Usage |
|------|-------|
| Planning docs | Drafted FRD and system design, reviewed and edited manually |
| Backend boilerplate | Service/controller structure, validation rules |
| Frontend components | UI layout, Zustand stores, socket integration |
| DevOps configs | Nginx template, GitHub Actions workflow |
| README | Initial draft, customized with project-specific details |

## What Was Done Manually

- Architecture decisions (Zustand over Redux, Socket.IO rooms per project)
- Security choices (bcrypt rounds, JWT expiry, rate limiting)
- Real-time flow design (REST persist + socket broadcast)
- Code review and simplification to match production patterns
- Trade-off documentation

## Developer Understanding

All code in this repository can be explained line-by-line by the developer, including:

- JWT verification in HTTP middleware and socket handshake
- Project room join authorization
- Optimistic UI updates on task drag with rollback on API failure
- Redis adapter optional flag for single-instance vs scaled deployment

AI was treated as a productivity tool, not a substitute for understanding.
