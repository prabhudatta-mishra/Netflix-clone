# Netflix Backend (single app)

All microservice code lives in **one Spring Boot project**. Run it once in STS or with Maven — no gateway, no four separate ports.

## Folder layout (logical microservices)

```
backend/src/main/java/com/netflix/
├── NetflixBackendApplication.java   ← run this in STS
├── config/                          ← security, JWT, CORS
├── user/                            ← auth, users (was user-service)
├── movie/                           ← movies, reviews, upload (was movie-service)
└── watchlist/                       ← watchlist, history, AI picks (was watchlist-service)
```

## MySQL (automatic)

1. Start **MySQL** on port 3306.
2. Credentials in `application.properties`:
   - Username: `root`
   - Password: `55555`
   - Database: `netflix_clone` (created automatically)
3. Tables are created/updated by Hibernate on startup (`ddl-auto=update`).

## Run in Spring Tool Suite (STS)

1. **File → Import → Maven → Existing Maven Projects**
2. Select folder: `Netflix clone/backend`
3. Wait for Maven update to finish.
4. Open `com.netflix.NetflixBackendApplication`
5. **Run As → Spring Boot App** (or Java Application)

API base: `http://localhost:8080/api`

## Run from command line

```bash
cd backend
mvn spring-boot:run
```

## Test login

- `testuser` / `password123`
- `admin` / `admin123`
