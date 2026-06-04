# Deploying the Habit Rabit API to Railway

The backend lives in this `server/` folder. `railway.json` runs the DB
migration and then starts the server on every deploy (the schema is
idempotent — `CREATE TABLE IF NOT EXISTS` — so re-running is safe).

## One-time setup

1. **Create the project**
   - https://railway.app → New Project → Deploy from GitHub repo →
     `HimanshuGolwa/habit-rabit`

2. **Add PostgreSQL**
   - In the project: **+ New → Database → Add PostgreSQL**

3. **Point the service at this folder**
   - Open the service → **Settings → Root Directory** → `server`
   - (Railway reads `server/railway.json` for the build + start command.)

4. **Set environment variables** (service → **Variables**)

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Reference the Postgres plugin's `DATABASE_URL` (Variables → Add Reference) |
   | `JWT_SECRET` | a 64-byte hex string (see below) |
   | `JWT_REFRESH_SECRET` | a *different* 64-byte hex string |
   | `JWT_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | `*` (tighten to your frontend origin later) |

   Generate the two secrets locally:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

5. **Generate a public domain**
   - Service → **Settings → Networking → Generate Domain**
   - You'll get something like `habit-rabit-api.up.railway.app`

6. **Verify**
   - Visit `https://<your-domain>/health` → should return
     `{"status":"ok","timestamp":"..."}`

## Wire the frontends

- **Web app:** set `API_BASE` in `../js/auth.js`
- **Flutter app:** set `AuthService.apiBase` in
  `../flutter_app/lib/services/auth_service.dart`

## Redeploys

Every push to `main` redeploys automatically. The migration runs first, then
the server boots. Check the deploy logs for `✓ Database schema applied`.
