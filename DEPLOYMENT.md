# 🚀 Deploying Notes-AI to Vercel

Everything (frontend **and** backend) now lives in one Next.js app, so it's a
**single Vercel deployment**. The old Express server in `backend/` is legacy and
no longer used — the API is served from `src/app/api/*`.

You need four things, all free to start:

| # | Thing | Why | Cost |
|---|-------|-----|------|
| 1 | MongoDB Atlas cluster | Stores users, notes, folders, chats | Free (M0) |
| 2 | Gemini API key | Powers the AI chat | Free tier |
| 3 | A JWT secret | Signs login tokens | Free (you generate it) |
| 4 | Vercel + GitHub accounts | Hosting | Free (Hobby) |

> **I can't create these accounts or type your secrets for you** — they're your
> logins and private keys. Follow the steps below; each takes a few minutes.

---

## Step 1 — MongoDB Atlas (database)

1. Go to <https://www.mongodb.com/cloud/atlas/register> and create a free account.
2. Create a **free M0 cluster** (pick any cloud/region near you).
3. **Database Access** → *Add New Database User* → username + password
   (save these; avoid symbols that need URL-encoding, or encode them later).
4. **Network Access** → *Add IP Address* → **Allow access from anywhere**
   (`0.0.0.0/0`). Vercel's serverless IPs are dynamic, so this is required.
5. **Clusters** → *Connect* → *Drivers* → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Insert your password and add a database name (`notes-ai`) before the `?`:
   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/notes-ai?retryWrites=true&w=majority
   ```
   This is your **`MONGODB_URI`**.

## Step 2 — Gemini API key (AI chat)

1. Go to <https://aistudio.google.com/apikey> (sign in with Google).
2. *Create API key* → copy it. This is your **`GEMINI_API_KEY`**.
   (The default model is `gemini-2.0-flash`; override with `GEMINI_MODEL` if you like.)

## Step 3 — JWT secret

Any long random string. Generate one in a terminal:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the output — that's your **`JWT_SECRET`**.

## Step 4 — Run it locally first (recommended)

1. Create `.env.local` in the project root (copy from `.env.example`) and fill in:
   ```bash
   MONGODB_URI=mongodb+srv://...            # from Step 1
   JWT_SECRET=...                           # from Step 3
   JWT_EXPIRE=30d
   GEMINI_API_KEY=...                       # from Step 2
   ```
2. Install + run:
   ```bash
   npm install
   npm run dev
   ```
3. Open <http://localhost:3000>, sign up, create a note, try the AI chat.

## Step 5 — Push to GitHub

```bash
git add -A
git commit -m "Convert to Next.js + neo-brutalist redesign + serverless API"
git push
```

(If this isn't a repo yet: `git init`, create a repo on GitHub, add it as
`origin`, then push.)

## Step 6 — Deploy on Vercel

1. Go to <https://vercel.com/signup> and sign in with GitHub.
2. **Add New… → Project** → import your `Notes-AI` repo.
3. Framework preset auto-detects **Next.js**. Leave build settings default
   (`next build`, output handled automatically).
4. Expand **Environment Variables** and add (for **Production**, and Preview if you want):
   | Name | Value |
   |------|-------|
   | `MONGODB_URI` | your Atlas string |
   | `JWT_SECRET` | your random secret |
   | `JWT_EXPIRE` | `30d` |
   | `GEMINI_API_KEY` | your Gemini key |
5. Click **Deploy**. In ~2 minutes you'll get a URL like
   `https://notes-ai-xxxx.vercel.app`.

> Do **not** set `NEXT_PUBLIC_API_URL` — the app calls its own `/api` routes on
> the same domain.

## Step 7 — Enable Google sign-in on the live domain

Google login uses Firebase (config is already in `src/config/firebase.js`).
For the popup to work on your Vercel URL:

1. Go to the [Firebase console](https://console.firebase.google.com/) →
   project **notes-ai-22520** → **Authentication → Settings → Authorized domains**.
2. Add your Vercel domain (e.g. `notes-ai-xxxx.vercel.app`) and any custom domain.
3. Make sure **Sign-in method → Google** is enabled.

> The Firebase project here is the original author's. If it's not yours, create
> your own Firebase project (Google provider enabled) and replace the config in
> `src/config/firebase.js` with your web app's config. Email/password login
> works without any Firebase setup.

---

## Notes & limits

- **Serverless functions** have a request-body limit (~4.5 MB on Vercel). Notes
  embed images as compressed base64; a note with a few images is fine, but very
  large image dumps can exceed it.
- **AI timeout**: the chat route sets `maxDuration = 60`. Gemini Flash usually
  replies in a few seconds. On the Hobby plan Vercel may cap duration lower.
- **Cold starts**: the first request after idle reconnects to MongoDB (a second
  or two). The connection is then cached across warm invocations.
- The `backend/` folder is legacy (the original standalone Express server) and is
  not deployed. You can delete it once you're confident in the new API.

---

## 🕸️ Knowledge graph tuning (optional)

The knowledge graph works **out of the box** — no extra setup. On note save, triplets are
extracted (Gemini JSON mode) into `entities` + `triplets` collections; the AI chat ranks them
with an in-app cosine search over 768-d Gemini embeddings and expands 1 hop through shared
entities. Two optional knobs:

- **Embedding model** — defaults to `gemini-embedding-001` (768-d). Set `GEMINI_EMBED_MODEL`
  if your key exposes a different one.
- **Atlas Vector Search (only needed at scale)** — the in-app cosine scan reads up to ~2000
  recent triplets per query, plenty for personal use. If the graph grows large, create a
  **Vector Search index** named `triplet_vec` on the `triplets` collection (field `embedding`,
  768 dims, cosine) via Atlas → cluster → **Atlas Search → Create Search Index → Vector Search**.

To (re)build the graph for existing notes, open **/graph** and click **Rebuild graph**.
