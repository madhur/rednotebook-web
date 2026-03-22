# RedNotebook Web

A self-hostable web interface for [RedNotebook](https://rednotebook.app/) — the popular open-source desktop journal app. Write, browse, and search your journal from any browser, on any device, while keeping your data in the exact same format that the RedNotebook desktop app uses.

> **Your data stays yours.** RedNotebook Web reads and writes the same YAML files as the desktop app. Run both side by side — no migration, no lock-in.

---

## Screenshots

### Desktop

![Desktop view — editor](docs/screenshots/desktop-editor.png)
![Desktop view — preview](docs/screenshots/desktop-preview.png)

### Mobile

<p align="center">
  <img src="docs/screenshots/mobile-editor.png" width="280" alt="Mobile editor" />
  <img src="docs/screenshots/mobile-sidebar.png" width="280" alt="Mobile sidebar" />
</p>

---

## Features

- **Full read/write access** to your existing RedNotebook data — same YAML file format, no migration needed
- **Markdown editor** with syntax highlighting powered by CodeMirror 6
- **Live preview** — switch between Edit and Preview mode instantly
- **Calendar navigation** — browse any day, with dots marking days that have entries
- **Full-text search** — search across all your journal entries in real time
- **Hashtag & category sidebar** — all your `#tags` and categories listed with counts
- **Auto-save** — changes are saved automatically after 2 seconds of inactivity
- **Dark mode** — toggle between light and dark themes, persisted across sessions
- **Responsive UI** — works on desktop, tablet, and mobile
- **Installable PWA** — add to your phone's home screen and use like a native app
- **Single Docker container** — FastAPI backend serves the built React frontend

---

## Self-Hosting with Docker Compose

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- An existing RedNotebook data directory (default: `~/.rednotebook/data`) or an empty directory to start fresh

### Quick start

```bash
git clone https://github.com/yourusername/rednotebook-web.git
cd rednotebook-web
docker compose up -d
```

By default this mounts `~/.rednotebook/data` (the standard RedNotebook data location on Linux/macOS). Open [http://localhost:8000](http://localhost:8000) in your browser.

### Custom data directory

Edit `docker-compose.yml` to point the volume at your actual data folder:

```yaml
services:
  rednotebook-web:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - /path/to/your/rednotebook/data:/data   # ← change this
    environment:
      - REDNOTEBOOK_DATA_DIR=/data
    restart: unless-stopped
```

Then bring it up:

```bash
docker compose up -d
```

### Common data directory locations

| OS | Default path |
|----|-------------|
| Linux | `~/.rednotebook/data` |
| macOS | `~/.rednotebook/data` |
| Windows | `%APPDATA%\rednotebook\data` |

### Updating

```bash
docker compose down
git pull
docker compose up -d --build
```

---

## Running without Docker (Development)

### Requirements

- Python 3.11+
- Node.js 20+

### Setup

```bash
git clone https://github.com/yourusername/rednotebook-web.git
cd rednotebook-web

# Python backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd frontend && npm install && cd ..

# Start both servers
./dev.sh
```

- Frontend (Vite dev server): [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:8000](http://localhost:8000)

The `REDNOTEBOOK_DATA_DIR` environment variable controls which data directory is used (defaults to `~/.rednotebook/data`).

---

## Installing as a Mobile App (PWA)

RedNotebook Web is a Progressive Web App — you can install it on your phone and it behaves like a native app with its own icon and full-screen experience.

> **Note:** PWA installation requires the app to be served over **HTTPS** in production. On localhost it works without HTTPS for testing.

**Android (Chrome):**
1. Open the app in Chrome
2. Tap the menu (⋮) → **Add to Home screen** / **Install app**

**iOS (Safari):**
1. Open the app in Safari
2. Tap the Share button → **Add to Home Screen**

---

## Data Format

RedNotebook Web reads and writes the same YAML files as the desktop app. Files are named `YYYY-MM.txt` and stored in your data directory:

```
~/.rednotebook/data/
├── 2024-01.txt
├── 2024-02.txt
└── 2025-03.txt
```

Writes are atomic (write to `.new`, then rename), so your data is safe even if the server is interrupted. The desktop app and the web app can safely coexist pointing at the same folder.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python · FastAPI · PyYAML |
| Frontend | React 18 · TypeScript · Vite |
| Editor | CodeMirror 6 |
| Styling | Tailwind CSS |
| State | Zustand · TanStack Query |
| Container | Docker (single image) |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` / `Cmd+S` | Save entry |
| `Ctrl+F` / `Cmd+F` | Open search |
| `Esc` | Close search |

---

## License

MIT — see [LICENSE](LICENSE).

---

## Related

- [RedNotebook](https://rednotebook.app/) — the original desktop journal app by Jendrik Seipp
