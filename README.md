# Hive

> Real-time collaboration for teams.

Hive is a full-stack project management platform that enables teams to organize workspaces, manage projects, coordinate tasks, and collaborate in real time.

Users can create workspaces, manage members with role-based access control, organize projects through a Kanban board, assign tasks, comment on work, and receive real-time notifications and updates.

## Live Demo

**Frontend:** https://hive-mu-seven.vercel.app

**Backend:** https://hive-k9sh.onrender.com

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| Owner | owner@hive.demo | HiveDemo@123 |
| Admin | admin@hive.demo | HiveDemo@123 |
| Member | member@hive.demo | HiveDemo@123 |

---

## Features

### Authentication
- JWT-based authentication
- Secure password hashing with bcrypt
- Protected API routes
- Session-based frontend authentication
- Automatic unauthorized-session handling

### Workspace Management
- Create and manage workspaces
- Workspace membership management
- Role-based access control
- Owner, Admin, and Member roles
- Member role management
- Permission-based actions

### Project Management
- Create, update, and delete projects
- Project-specific task management
- Workspace-level project isolation

### Task Management
- Kanban board with TODO, IN PROGRESS, and DONE columns
- Create, edit, and delete tasks
- Task assignment
- Priority levels
- Due dates
- Drag-and-drop status updates
- Role-based task permissions

### Real-Time Collaboration
- Real-time task creation and updates
- Real-time task deletion
- Real-time comments
- Real-time notifications
- Online presence
- Workspace and project Socket.IO rooms
- Automatic socket reconnection and room rejoining

### Notifications
- Task assignment notifications
- Task status change notifications
- Comment notifications
- Unread notification count
- Mark individual notifications as read
- Mark all notifications as read
- Real-time notification updates

### Comments
- Add comments to tasks
- Edit own comments
- Delete own comments
- Owners/Admins can moderate comments
- Real-time comment synchronization

---

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- Tailwind CSS
- React Router
- Fetch API
- Socket.IO Client

### Backend
- Node.js
- Express.js
- JavaScript
- JWT
- bcrypt
- Socket.IO

### Database
- PostgreSQL
- Prisma ORM

### Deployment
- Vercel — Frontend
- Render — Backend
- Neon — PostgreSQL

---

## Architecture

```text
                        ┌─────────────────────┐
                        │       React         │
                        │      + Vite         │
                        │     + Tailwind      │
                        └──────────┬──────────┘
                                   │
                         REST API  │  Socket.IO
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │   Node + Express     │
                        │                     │
                        │ Authentication      │
                        │ RBAC                │
                        │ Projects            │
                        │ Tasks               │
                        │ Comments            │
                        │ Notifications       │
                        └──────────┬──────────┘
                                   │
                         Prisma ORM │
                                   ▼
                        ┌─────────────────────┐
                        │     PostgreSQL       │
                        │       (Neon)         │
                        └─────────────────────┘
