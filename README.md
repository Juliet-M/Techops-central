# TechOps Central

> A web-based internal operations management platform for small technology companies. Built with Python/Flask, fully containerised with Docker, and designed to centralise project tracking, partner management, task management, and proposal tracking in one place.

---

## 🚀 Quick Start (Single Command)

```bash
docker compose up --build
```

Then open your browser and go to:

```
http://localhost:5000
```

That's it. No Python installation, no dependencies, no manual setup required.

---

## 🔑 Test Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Administrator | `admin` | `admin123` |
| Standard User | `user` | `user123` |

---

## 📦 Modules Implemented

| # | Module | Description |
|---|--------|-------------|
| 1 | **Project Tracker** | Track projects with status, deadlines, budgets, progress bars and overdue flagging |
| 3 | **Partner & Supplier Directory** | Searchable directory of partners, suppliers and OEMs with real-time filtering |
| 4 | **Proposal & Tender Tracker** | Track proposals from drafting through to won/lost with value and win rate metrics |
| 5 | **Task Board** | Kanban drag-and-drop task board with priority badges and project linking |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12 + Flask 3.0 |
| Frontend | Vanilla HTML, CSS, JavaScript |
| Storage | In-memory (pre-loaded sample data) |
| Container | Docker + docker-compose |
| Fonts | Syne + DM Sans (Google Fonts) |

---

## 📁 Project Structure

```
techops-central/
├── Dockerfile
├── docker-compose.yml
├── README.md
└── app/
    ├── app.py                  # Flask backend — routes, APIs, data
    ├── requirements.txt
    ├── templates/
    │   ├── base.html           # Shared layout, sidebar, dark mode toggle
    │   ├── login.html          # Login page
    │   ├── dashboard.html      # Summary dashboard with live stats
    │   ├── projects.html       # Project Tracker (Module 1)
    │   ├── partners.html       # Partner & Supplier Directory (Module 3)
    │   ├── proposals.html      # Proposal Tracker (Module 4)
    │   └── tasks.html          # Task Board / Kanban (Module 5)
    └── static/
        ├── css/main.css        # Full UI — soft SaaS design, dark mode
        └── js/
            ├── main.js         # Shared utilities
            ├── projects.js
            ├── partners.js
            ├── proposals.js
            └── tasks.js
```

---

## ✨ Key Features

- **Secure login** with session-based authentication and two user roles
- **Live dashboard** showing real-time statistics across all 4 modules
- **Full CRUD** on all entities — create, read, update, delete with confirmation dialogs
- **Form validation** with inline error messages on all required fields
- **Drag-and-drop** Kanban board for task management
- **Real-time search** and multi-filter support on Partners and Proposals
- **Overdue detection** — projects and tasks past deadline flagged in red
- **Dark mode** toggle with smooth transition, persisted in localStorage
- **Responsive layout** supporting 1280×720 and above

---

## 🐳 Docker Details

```yaml
# docker-compose.yml
services:
  web:
    build: .
    ports:
      - "5000:5000"
```

```dockerfile
# Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY app/requirements.txt .
RUN pip install -r requirements.txt
COPY app/ .
CMD ["python", "app.py"]
```

---

## 📊 Sample Data Included

| Module | Sample Records |
|--------|---------------|
| Projects | 9 projects across 5 status types |
| Partners | 9 entries — Partners, Suppliers, OEMs across 6 countries |
| Proposals | 8 proposals across all 5 status stages |
| Tasks | 12 tasks distributed across To Do, In Progress, Done |

---

## 🔧 Stopping the Platform

```bash
# Press Ctrl+C in the terminal, then:
docker compose down
```

---

*Built as part of an AI-assisted development project using Claude (Anthropic) — March 2026*