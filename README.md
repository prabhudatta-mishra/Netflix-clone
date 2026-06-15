# Netflix Clone

A full-stack Netflix-style movie streaming project built with React, Spring Boot, and MySQL.

## Tech Stack

- Frontend: React, Vite, CSS, Axios
- Backend: Spring Boot, Spring Security, JWT, JPA/Hibernate
- Database: MySQL
- Media: Local MP4 playback, offline import folder, uploaded thumbnails

## Main Features

- User registration and login
- JWT protected routes
- Netflix-style browse page
- Movie details modal and full details page
- Local MP4 movie playback
- Continue watching progress
- Watch history with resume status
- Watchlist / My List
- Reviews and ratings
- Like / Dislike feedback
- Admin dashboard
- Admin movie library
- Admin sync for local movie files
- Admin recent feedback panel
- Admin health/status panel

## How To Run

### 1. Start Backend

```powershell
cd "I:\project\Netflix clone\backend"
mvn spring-boot:run
```

Backend runs on:

```text
http://localhost:8080
```

### 2. Start Frontend

Open a second terminal:

```powershell
cd "I:\project\Netflix clone\frontend-react"
npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

## Local Movie Files

For large movie files, copy MP4 files into:

```text
I:\project\Netflix clone\backend\offline-import
```

Then open Admin Dashboard and click:

```text
Sync Movies
```

Recommended browser format:

```text
H.264 video + AAC audio MP4
```

## Demo Flow

1. Login as user.
2. Browse movies on Home.
3. Open a movie.
4. Click Play and watch for a few seconds.
5. Open History and show resume progress.
6. Add movie to My List.
7. Click Like or Not for me.
8. Login as admin.
9. Open Admin Dashboard.
10. Show Movie Library, System Health, Recent Feedback, and user activity.

## Important Notes

- Backend must be running before opening the app.
- MySQL must be running with the configured credentials in `backend/src/main/resources/application.properties`.
- If Admin Dashboard shows a backend error, restart backend on port `8080`.
- If a local video does not play, convert it to H.264 + AAC MP4.

## Final Verification Commands

Frontend:

```powershell
cd "I:\project\Netflix clone\frontend-react"
npm run build
```

Backend:

```powershell
cd "I:\project\Netflix clone\backend"
mvn test
```
