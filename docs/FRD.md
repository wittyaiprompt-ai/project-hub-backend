# Functional Requirements Document
## Internal Project Management System

**Version:** 1.0  
**Date:** July 2026  
**Status:** Approved for Phase 2

---

## 1. Overview

An internal web application that lets teams create projects, manage tasks on a Kanban-style board, and see changes from teammates in real time. Built for a growing company where multiple people work on the same project simultaneously.

---

## 2. Core Features

### 2.1 Authentication
- Email/password registration and login
- JWT-based sessions (access token, 7-day expiry)
- Protected routes on both API and WebSocket connections

### 2.2 Project Management
- Create, read, update, and delete projects
- Each project has a name, description, owner, and member list
- Project list view with search/filter by name

### 2.3 Task Management
- Tasks belong to a project and have: title, description, status, assignee, priority, due date
- Status workflow: `todo` → `in_progress` → `review` → `done`
- Drag-and-drop or click-to-move between columns on the task board
- Full CRUD on tasks within a project

### 2.4 Real-Time Collaboration
- When any user updates a task (status, title, assignee, etc.), all connected users on that project see the change immediately
- Users joining a project board receive the current task state on load
- Connection status indicator (connected / reconnecting / offline)

### 2.5 User Profile
- View own profile (name, email)
- Change password

---

## 3. User Roles & Permissions

| Action | Owner | Member | Non-member |
|--------|-------|--------|------------|
| View project | ✓ | ✓ | ✗ |
| Edit project details | ✓ | ✗ | ✗ |
| Delete project | ✓ | ✗ | ✗ |
| Add/remove members | ✓ | ✗ | ✗ |
| Create/edit/delete tasks | ✓ | ✓ | ✗ |
| Move task status | ✓ | ✓ | ✗ |

- **Owner:** User who created the project. Full control.
- **Member:** Invited collaborator. Can manage tasks but not project settings.
- **Non-member:** No access. API returns 403.

Role is stored on the project document (`owner` field + `members` array). No separate RBAC table for v1.

---

## 4. Assumptions

1. Single organization — no multi-tenant isolation needed
2. Users self-register; no admin approval flow
3. Project membership is managed by the owner via email lookup
4. Max ~50 concurrent users per project (sufficient for internal use)
5. MongoDB Atlas or self-hosted MongoDB with authentication enabled
6. Redis available for Socket.IO pub/sub adapter
7. Modern browsers (Chrome, Firefox, Edge — last 2 versions)
8. Tasks do not have sub-tasks or attachments in v1

---

## 5. Out of Scope (v1)

- Email notifications / push alerts
- File attachments on tasks
- Comments or activity feed
- Time tracking / sprint planning
- Third-party integrations (Slack, Jira, GitHub)
- Mobile native apps
- OAuth / SSO (Google, GitHub login)
- Admin dashboard for org-wide analytics
- Task dependencies and Gantt charts
- Offline mode with sync

---

## 6. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Real-time latency | < 500ms from action to peer UI update |
| API response time | < 200ms for CRUD (p95) |
| Uptime | 99% (internal tool) |
| Concurrent WebSocket connections | 200 per server instance |

---

## 7. Success Criteria

1. User A moves a task → User B sees it within 1 second without refresh
2. User C opens project later → sees latest task state from API
3. Unauthorized users cannot access projects they don't belong to
4. Application deployed with HTTPS and CI pipeline passing
