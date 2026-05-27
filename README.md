# Netflix Clone

Netflix-style streaming app: **React** frontend + **one Spring Boot backend** + **MySQL** (JWT auth).

API base: `http://localhost:8080/api` (Axios — no Postman required).

---

## Project structure

```
Netflix clone/
├── backend/              → Port 8080 (ALL APIs in one app — use this in STS)
│   └── src/.../com/netflix/
│       ├── user/         ← auth (was user-service)
│       ├── movie/        ← movies, reviews (was movie-service)
│       └── watchlist/    ← watchlist, history, AI (was watchlist-service)
├── frontend-react/       → Port 3000
└── README.md
```

---

## Quick start

### 1. MySQL

- Start MySQL on port **3306**
- Username: **root**
- Password: **55555**
- Database **`netflix_clone`** is created automatically when the backend starts (no manual SQL required)

### 2. Backend (one run)

**STS:** Import `backend` as Maven project → Run `NetflixBackendApplication`

**Or command line / batch:**

```bash
cd backend
mvn spring-boot:run
```

### 3. Frontend

```bash
cd frontend-react
npm install
npm run dev
```

Open **http://localhost:3000**

---

## Test users (auto-seeded)

| Username  | Password     | Role  |
|-----------|--------------|-------|
| testuser  | password123  | USER  |
| admin     | admin123     | ADMIN |

---

## Ports

| App              | Port |
|------------------|------|
| Backend (single) | 8080 |
| React frontend   | 3000 |

---

## Features

- Login / register (JWT)
- Movie carousels, hero banner, search
- Watchlist, watch history, continue watching
- AI-style recommendations
- Reviews, notifications, admin upload
- MySQL tables auto-created on startup

---

## How to play movies

1. Log in (`testuser` / `password123` or `admin` / `admin123`).
2. On **Home**, hover a movie card and click the **Play** icon, or open a movie then choose **Play**.
3. **Seeded movies** (first run) stream sample **MP4 links from the internet** (Big Buck Bunny, etc.) — no local video files needed.
4. **Your uploads** are saved under `backend/uploads/` and play from `/uploads/videos/...` via the dev proxy.

## Add movies offline (best for large files — no network upload)

1. Download the video file to your PC (mp4, mkv, avi, mov, etc.).
2. Copy it into **`backend/offline-import/`**  
   Example: `backend/offline-import/Interstellar.mp4`
3. Optional poster: `Interstellar.jpg` in the same folder.
4. Optional metadata file `Interstellar.properties`:
   ```
   title=Interstellar
   genre=Sci-Fi
   rating=8.6
   year=2014
   description=Space movie
   ```
5. Start backend → open **http://localhost:3000** → login **admin** / **admin123** → **Admin Panel**.
6. Click **Import from folder** (green section). No browser upload needed.
7. Play from **Home**. Imported files move to `offline-import/imported/`.

See also: `backend/offline-import/HOW-TO-ADD-MOVIES.txt`

## Admin upload (browser — small files only)

Use only for small videos. Large movies → use **offline import** above.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Login / network error | Run `backend` + `npm run dev`; open http://localhost:3000 |
| Upload failed | Log in as admin; use .mp4 video + image thumbnail; restart backend after code changes |
| Video won't play | Use MP4; for uploads ensure `npm run dev` is running (proxies `/uploads`) |
| Port 8080 in use | Stop the other process using port 8080, then start backend again |
| MySQL error | Check MySQL is running; root / 55555 in `backend/src/main/resources/application.properties` |

More detail: [backend/README.md](backend/README.md)
