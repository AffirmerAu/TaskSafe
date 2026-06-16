# Affirmer — AI Safety-Induction Training App (MVP)

A mobile-first, conversational Work Health & Safety (WHS) induction app. A worker
logs in with a magic link (no password), plays a lesson — video, images,
narration, quick quizzes — and can ask an AI safety guide questions **by text or
voice, in any language**, getting answers grounded in the course content and
spoken back aloud. Lessons are gated per worker: locked modules can't be opened.

Built with **Next.js + Supabase + Gemini**, runs on **free tiers**.

---

## ⚡ The easy way to get it live (about 15 minutes)

You'll use three free websites: **GitHub** (stores the code), **Vercel** (runs the
app), and **Supabase** (the database). You won't need to write any code. The only
things you copy-paste are a few keys and one database file.

> 🔑 **Golden rule:** your secret keys go into **Vercel's settings boxes**, never
> into the code files. That's what keeps GitHub happy (see *"Got a 'secret
> detected' error?"* at the bottom if you hit that).

### Step 1 — Put the code on GitHub

1. Create a free account at <https://github.com> if you don't have one.
2. Click **New repository**, give it a name (e.g. `training-app`), keep it
   **Private**, and create it.
3. On the new repo page, use GitHub's **"uploading an existing file"** link and
   drag in the contents of this project folder. (If you know git, you can push
   instead — but never include a `.env.local` file. It's already ignored for you.)

### Step 2 — Create the database (Supabase)

1. Sign up free at <https://supabase.com> → **New project**. Pick a name, set a
   database password (save it somewhere), choose a region near your users. Wait
   ~2 minutes for it to finish.
2. In the left sidebar click **SQL Editor → New query**.
3. Open the file **`setup.sql`** from this project, copy **everything** in it,
   paste it into the editor, and click **Run**. You should see "Success." ✅
   *(That builds all the tables in one go.)*

### Step 3 — Grab your 4 keys

You need exactly four values:

| Where to find it | What to copy |
|---|---|
| Supabase → **Project Settings → API** | **Project URL** |
| same page | **`anon` `public`** key |
| same page | **`service_role`** key *(keep this one secret)* |
| <https://aistudio.google.com/apikey> | a **Gemini API key** |

### Step 4 — Deploy on Vercel

1. Sign up free at <https://vercel.com> with your GitHub account.
2. Click **Add New → Project** and import your `training-app` repo. Vercel
   recognises it as Next.js automatically.
3. Expand **Environment Variables** and add these four (paste the values from
   Step 3):

   ```
   NEXT_PUBLIC_SUPABASE_URL        -> your Project URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY   -> your anon public key
   SUPABASE_SERVICE_ROLE_KEY       -> your service_role key
   GEMINI_API_KEY                  -> your Gemini key
   ```

4. Click **Deploy** and wait. You'll get a web address like
   `https://training-app-xxxx.vercel.app`.

### Step 5 — Tell Supabase about your address

In Supabase → **Authentication → URL Configuration**:

- **Site URL:** paste your Vercel address.
- **Redirect URLs:** add your address with `/auth/confirm` on the end, e.g.
  `https://training-app-xxxx.vercel.app/auth/confirm`.

Click **Save**.

### Step 6 — Load the course (one button)

Go to **`https://YOUR-ADDRESS.vercel.app/setup`** in your browser.

You'll see a friendly checklist. Type the **email you want to log in with** (use a
real inbox you can open), and click **"Set up my app."** It loads the course and
gets the AI guide ready in a few seconds. ✅

### Step 7 — Try it

Go to **`https://YOUR-ADDRESS.vercel.app`**, choose a language, enter that same
email, and click the magic link that lands in your inbox. You're in — play
**Working at Heights** and tap **"Ask the guide"** to ask a question by text or
voice. The other two modules are locked on purpose, to show the gating.

**That's the whole setup.** Everything below is reference — you don't need it to
get running.

---

## Don't want to use GitHub at all?

There's an even more direct route that skips GitHub (so it can never trip the
"secret detected" block). On your computer, inside the project folder, run:

```bash
npx vercel
```

It walks you through logging in and deploying the current folder straight to
Vercel — no GitHub, no git. Add the four keys with `npx vercel env add` (or in the
Vercel dashboard afterward), then continue from **Step 5** above. This needs
[Node.js](https://nodejs.org) installed but nothing else.

---

## What's inside

```
training-app/
|- setup.sql                       <- paste this into Supabase once (Step 2)
|- src/
|  |- app/
|  |  |- page.tsx                  Landing: language picker + magic-link entry
|  |  |- setup/page.tsx            <- the friendly one-click setup screen
|  |  |- login/page.tsx            Request a magic link
|  |  |- auth/confirm/route.ts     Magic-link callback -> logs in
|  |  |- course/page.tsx           Course overview: modules + lock state + progress
|  |  |- lesson/[moduleSlug]/page.tsx   Gated lesson player (404s if locked)
|  |  |- api/
|  |     |- tutor/route.ts         Q&A: auth + rate-limit + RAG + grounded answer
|  |     |- admin/seed/route.ts    Loads the course (used by /setup)
|  |     |- admin/status/route.ts  Powers the setup checklist
|  |     |- tts/route.ts           Optional cloud text-to-speech (off by default)
|  |     |- stt/route.ts           Optional cloud speech-to-text (off by default)
|  |- components/                  Lesson player, tutor chat, icons
|  |- lib/
|  |  |- content.ts                * Auth-aware content layer (the gating)
|  |  |- seed-data.ts              The course content + seed/embed logic
|  |  |- gemini.ts                 Embeddings + grounded answers
|  |  |- voice.ts                  Free in-browser voice (text-to-speech + speech)
|  |  |- ...                       Supabase clients, languages, rate limiting
|  |- middleware.ts               Session refresh + route protection
|  |- styles/                     Design tokens + components
|- supabase/migrations/0001_init.sql   (same as setup.sql, for CLI users)
```

## Environment variables

Only the first four are required. Add them in **Vercel -> your project -> Settings
-> Environment Variables** (or in a local `.env.local` — see `.env.example`).

| Variable | Required? | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Public client key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Secret server key (setup + secure content queries) |
| `GEMINI_API_KEY` | yes | The AI tutor + embeddings |
| `SEED_EMAIL` | optional | Default login email (you can just type it on `/setup`) |
| `SEED_SECRET` | optional | Password for the `/setup` page; lets you re-run setup later |
| `GEMINI_MODEL` | optional | `gemini-2.0-flash-lite-preview` for the cheapest tier |
| `TTS_PROVIDER` / `STT_PROVIDER` | optional | Switch to cloud voice (see below) |
| `VIMEO_ACCESS_TOKEN` | optional | Hosted video |
| `NEXT_PUBLIC_APP_URL` | optional | Only for custom domains if redirects misbehave |

**About `/setup` security:** if you don't set `SEED_SECRET`, the setup page works
once and then **locks itself automatically** (it won't run again because the
course already exists). If you *do* set `SEED_SECRET`, the page asks for it every
time, so you can re-run setup whenever you like. Either way the page can only ever
add the demo course — it can't expose your data.

## Cost & the free/paid toggles

The brief said *favour the lowest-cost option and ask before adding paid
services*, so by default everything runs on **free tiers**:

- **Voice is free.** Read-aloud, spoken answers, and voice questions use the
  browser's built-in speech features. No cloud voice bill.
- **Video is free.** The lesson uses a lightweight built-in player so it works
  with zero video hosting. Switch to Vimeo when you want.
- **The only metered service is Gemini**, which has a free tier and is the
  cheapest strong multilingual option. Set
  `GEMINI_MODEL=gemini-2.0-flash-lite-preview` for the cheapest tier.

The cloud voice and Vimeo paths are wired but **off** — flip an environment
variable to turn them on (below).

## Enabling the optional paid services

**Cloud text-to-speech (Azure):** set `TTS_PROVIDER=azure`, `AZURE_SPEECH_KEY`,
`AZURE_SPEECH_REGION`. **Cloud speech-to-text (Whisper/Deepgram):** set
`STT_PROVIDER=openai` (+`OPENAI_API_KEY`) or `deepgram` (+`DEEPGRAM_API_KEY`).
**Vimeo video:** add a `vimeo_id` to a slide, set `VIMEO_ACCESS_TOKEN`, and turn
on domain-restricted privacy in Vimeo. For exact 95%-watched gating add
`@vimeo/player`.

## How it works (architecture notes)

**Two inputs, one app.** A build brief defined the backend/architecture; the
Claude Design files defined the UI (a white-label WHS induction for "Coastline
Civil / Affirmer"). This app implements that UI on a Next.js + Supabase + RAG +
tutor backend.

**The "MCP content server" -> an auth-aware content module.** Rather than a
separate long-running server (awkward on Vercel), the same contract lives in
`src/lib/content.ts`: it validates the session, works out which modules the worker
has unlocked, and **only ever serves unlocked content** — it even passes the
allowed module IDs into the vector-search SQL so the AI can't retrieve locked
material. It can be lifted into a standalone MCP server later without changing the
gating.

**Gating is enforced twice** — in that content layer *and* in Postgres row-level
security — so locked modules can't leak even via a direct query.

**RAG.** Course knowledge is embedded with Gemini `text-embedding-004` (768-dim,
matching the `pgvector` column) and retrieved at question time so answers stay
grounded in the actual content.

## What's deferred / out of scope

Intentionally not built (per the brief): payments, an admin upload UI (content is
loaded by the setup step), per-user watermarking/DRM, talking-avatar video,
multiple courses, and analytics dashboards. The design also included **Results**
and **Certificate** screens that aren't in this MVP — finishing a lesson returns
to the course overview for now.

---

## Troubleshooting

- **The `/setup` checklist shows a red X on "Connection keys."** One of the four
  keys is missing or misspelled in Vercel. Fix it under Settings -> Environment
  Variables, then **redeploy** (Vercel -> Deployments -> ... -> Redeploy) and
  refresh `/setup`.
- **Red X on "Database tables."** You haven't run `setup.sql` yet — do Step 2.
- **"Set up my app" says it's already set up / locked.** That's normal — it only
  runs once. To re-run, add a `SEED_SECRET` in Vercel and use it as the password.
- **Magic link doesn't sign me in.** The redirect URL isn't whitelisted. Add
  `https://YOUR-ADDRESS/auth/confirm` under Supabase -> Authentication -> URL
  Configuration (Step 5).
- **The AI guide gives thin answers.** The embeddings didn't finish — re-run
  `/setup` (set a `SEED_SECRET` first if it's locked).
- **Voice buttons do nothing.** Some browsers lack built-in speech (e.g. certain
  Firefox builds). Use Chrome, Edge, or Safari — or enable cloud voice.

### Got a "secret detected" error when pushing to GitHub?

GitHub blocks any upload that contains a real key. It almost always means a key
ended up inside a file (usually a `.env.local` added by mistake). **Don't click
"Allow"** — that would publish your key. Instead:

1. **Make sure no real keys are in your files.** Your keys belong in Vercel's
   settings boxes, not in the project. The file `.env.local` is already ignored,
   so it should never be uploaded.
2. **If you already committed one**, the simplest clean fix for a fresh repo is to
   start its history over (this erases the bad commit):
   ```bash
   rm -rf .git
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
3. **Rotate the exposed key** to be safe — regenerate the Gemini key at
   <https://aistudio.google.com/apikey>, or reset the Supabase `service_role` key
   in Project Settings -> API. Put the new value in Vercel.

Or sidestep GitHub entirely with the `npx vercel` route above — it never touches
GitHub's secret scanner.
