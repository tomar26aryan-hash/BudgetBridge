# 🚢 Deploying BudgetBridge (free)

**Architecture:** one web service on **Render** (Express serves the API *and* the built React app) + one free MySQL database on **Aiven**.

```
Browser ──► Render web service (Node/Express) ──► Aiven MySQL
            ├─ /api/*   → REST API
            └─ /*       → React app
```

Total time: about 20 minutes. Cost: ₹0.

---

## Step 1 — Push the updated code to GitHub

From the project folder on your computer:

```bash
git add .
git commit -m "Make app deployment-ready"
git push
```

Before you push, check that **no `.env` file** shows up in `git status`. The `.gitignore` already blocks it, but never commit secrets.

---

## Step 2 — Create the MySQL database (Aiven)

1. Sign up at **https://console.aiven.io** (no credit card needed for the free plan).
2. Click **Create service** → choose **MySQL**.
3. Select the **Free** plan, pick a cloud/region (choose one close to where you'll put Render in Step 3), give it a name, and create it.
4. Wait until the status says **Running** (a few minutes).
5. Open the service's **Overview** page and copy the **Service URI**. It looks like:

   ```
   mysql://avnadmin:AVNS_xxxxxxxx@mysql-yourname.aivencloud.com:12345/defaultdb?ssl-mode=REQUIRED
   ```

   Keep it private — it contains your database password.

> ⚠️ Leave Aiven's "allowed IP addresses" at the default (open). Render's free tier has no fixed IP, so restricting it would block your app. The password + TLS protect the database.

---

## Step 3 — Create the web service (Render)

1. Sign up at **https://render.com** (use "Sign in with GitHub"). Render may ask for a card for account verification (a small hold that is cancelled); free services stay free.
2. Click **New +** → **Web Service** → select your **BudgetBridge** repository.
3. Fill in the form **exactly** like this:

   | Field | Value |
   | --- | --- |
   | Name | `budgetbridge` (becomes part of your URL) |
   | Region | Closest to your Aiven region |
   | Branch | `main` |
   | Root Directory | *(leave empty)* |
   | Runtime / Language | **Node** |
   | Build Command | `npm run build` |
   | Start Command | `npm run db:init && npm start` |
   | Instance Type | **Free** |

4. Under **Environment Variables**, add these four:

   | Key | Value |
   | --- | --- |
   | `NODE_VERSION` | `22` |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | the Aiven **Service URI** from Step 2 |
   | `JWT_SECRET` | a long random string (see below) |

   Generate `JWT_SECRET` by running this on your computer and pasting the output:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

5. Open **Advanced** and set **Health Check Path** to `/api/health`.
6. Click **Create Web Service**.

Render now builds and starts your app. Watch the **Logs** tab. A successful start looks like:

```
Done. Tables present: budgets, transactions, users
BudgetBridge server running on port 10000 (production)
Database connection OK
```

> The start command runs `npm run db:init` first, which creates your database tables automatically. It is safe to run on every start — it only creates tables that don't exist.

**Shortcut:** the repo also contains a `render.yaml`. You can use **New + → Blueprint** instead of filling in the form; Render will ask you only for `DATABASE_URL`.

---

## Step 4 — Test it

Open your URL (`https://budgetbridge.onrender.com`, or whatever Render shows at the top of the page):

1. Visit `/api/health` — you should see `{"status":"ok"}`.
2. Register an account, add a transaction, set a budget, and check the dashboard.
3. Refresh the page on `/transactions` — it should still work (no 404).

🎉 You're live. Put the URL on your resume/GitHub (add it in the repo's "About" box).

From now on, every `git push` to `main` redeploys automatically.

---

## Things to know about the free tiers

- **Cold starts:** Render's free web service sleeps after 15 minutes without traffic. The first visit afterward takes ~30–60 seconds to wake up. This is normal. Mention it when you share the link, or open the URL yourself a minute before showing someone.
- **Keeping it awake (optional):** a free monitor such as UptimeRobot pinging `https://<your-url>/api/health` every 5 minutes keeps it awake. A single always-on service fits within Render's 750 free hours per month.
- **Aiven free database:** Aiven may power off free services that are unused for a long time (they email you first). If your app suddenly shows database errors, open the Aiven console and power the service back on. Your data is kept.
- Free-tier terms change over time — check the current limits on the Render and Aiven pricing pages.

---

## Troubleshooting

| Symptom | Likely cause & fix |
| --- | --- |
| Build fails with `npm ci ... package-lock.json` | Make sure `backend/package-lock.json` and `frontend/package-lock.json` are committed. |
| Logs: `JWT_SECRET is not set` / `too short` | Add `JWT_SECRET` (32+ characters) in Render → Environment. |
| Logs: `Database connection FAILED: ... ENOTFOUND / ETIMEDOUT` | `DATABASE_URL` is wrong, or the Aiven service is powered off. Re-copy the Service URI. |
| Logs: `Access denied for user` | Wrong password in `DATABASE_URL`. Special characters must be URL-encoded (`@` → `%40`, `#` → `%23`). Easiest: copy the URI straight from Aiven. |
| Logs: SSL / "self signed certificate" error | Make sure the URI ends with `?ssl-mode=REQUIRED`, or add env var `DB_SSL=true`. |
| Site loads but login says "Cannot reach the server" | The service is still waking up (cold start) — wait a minute and retry. |
| `/api/health` returns `database unavailable` | Same as the database errors above. |
| Logged out after a week | Normal: login tokens expire after 7 days. |

---

## Optional: verify the database's TLS certificate (extra hardening)

By default the connection is encrypted but the server certificate isn't verified. To verify it:

1. In Aiven → your service → Overview → download the **CA certificate**.
2. In Render, add an environment variable `DB_CA_CERT` and paste the full contents of that file (including the `BEGIN`/`END CERTIFICATE` lines).

---

## Optional: host the frontend separately (Vercel/Netlify)

Not needed for the setup above. If you prefer it:

1. Deploy only the `frontend/` folder to Vercel/Netlify and set the build-time environment variable `REACT_APP_API_URL=https://<your-render-url>`.
2. On Render, add the environment variable `CLIENT_URL=https://<your-vercel-url>` so the API allows requests from that domain (CORS).

`frontend/vercel.json` and `frontend/public/_redirects` are included so page refreshes work on those hosts.

---

## Environment variable reference

| Variable | Required | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | ✅ | Signs login tokens. 32+ random characters. |
| `DATABASE_URL` | ✅ (or `DB_*`) | Full MySQL connection URI. |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | alternative | Use instead of `DATABASE_URL` (e.g. local MySQL). |
| `NODE_ENV` | ✅ | Set to `production`. |
| `PORT` | auto | Provided by Render. |
| `DB_SSL` | optional | `true` forces TLS if your URI doesn't include `ssl-mode`. |
| `DB_CA_CERT` | optional | CA certificate for verified TLS. |
| `CLIENT_URL` | split hosting only | Allowed browser origin(s) for CORS. |
| `REACT_APP_API_URL` | split hosting only | Backend URL baked into the frontend at build time. |
