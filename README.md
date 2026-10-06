# NutriPlan AI

A simple full-stack **AI meal planning** web application for students and general users.

Tell NutriPlan AI your goal, dietary preference, allergies, foods you dislike, the ingredients you
already have, how many days you need to plan for and how much time you want to spend cooking. It
generates a day-by-day meal plan, turns that plan into a grouped grocery list, and lets you replace
any single meal on request.

> **NutriPlan AI is a meal planning and wellness app, not a medical app.** It does not make medical,
> clinical, or dietary-treatment claims, and its AI prompts explicitly forbid them.

---

## Features

- **Landing page** explaining the app with a clear call to action.
- **Registration and login** with bcrypt-hashed passwords and JWT sessions in httpOnly cookies.
- **Dashboard** with a welcome message, a "Create Meal Plan" button and a list of saved plans.
- **Meal plan form** — goal, dietary preference, allergies, disliked foods, available ingredients,
  number of days, meals per day, preferred cooking time and free-text notes.
- **AI meal plan generation** — breakfast, lunch, dinner and snacks (snacks appear when you ask for
  4 or 5 meals a day).
- **Grocery list** grouped into Produce, Grains, Protein, Dairy and Other, with tick-off checkboxes.
- **Meal replacement** — ask for a swap in your own words ("make it vegetarian and under 20 minutes"),
  or use one of the quick suggestions.
- **Save plans and view your history**, with a summary, date and a View button.
- **Responsive design** for desktop, tablet and mobile.
- **Accessibility** — labelled fields, keyboard-accessible controls, visible focus rings, a skip
  link, semantic HTML and `aria-live` error messages.
- **Friendly error handling** — required fields, invalid input, failed AI requests, failed database
  requests, login/registration errors. Stack traces are never shown to the user.

---

## Technology stack

| Layer     | Choice                                            |
| --------- | ------------------------------------------------- |
| Frontend  | React 18 + React Router 6, built with Vite        |
| Styling   | Plain CSS with custom properties (no framework)    |
| Backend   | Node.js + Express 4                              |
| Database  | SQLite via `better-sqlite3`                       |
| Auth      | `bcryptjs` password hashing + `jsonwebtoken`       |
| AI        | Any OpenAI-compatible API, with a built-in demo fallback |

---

## Folder structure

```
NutriPlan_AI/
├── package.json              # convenience scripts to run both apps
├── README.md
├── .gitignore
│
├── backend/
│   ├── package.json
│   ├── .env.example          # template — copy to .env
│   ├── test-api.js           # end-to-end API test suite
│   └── src/
│       ├── server.js         # Express app entry point
│       ├── config.js         # all environment variables read here
│       ├── db/
│       │   ├── index.js      # SQLite connection + table creation
│       │   └── helpers.js    # small query/JSON helpers
│       ├── middleware/
│       │   ├── auth.js       # JWT signing, cookies, requireAuth guard
│       │   ├── validate.js   # all input validation rules
│       │   ├── ApiError.js   # friendly error type
│       │   └── errorHandler.js
│       ├── routes/
│       │   ├── auth.js       # register / login / logout / me
│       │   ├── plans.js      # save, list, view, delete
│       │   └── ai.js         # generate plan, grocery list, replacement
│       └── services/
│           ├── aiService.js    # the ONLY file that calls an AI API
│           ├── demoPlanner.js  # local fallback plan builder
│           └── mealLibrary.js  # meal templates used by the fallback
│
└── frontend/
    ├── package.json
    ├── vite.config.js        # dev server + /api proxy to the backend
    ├── index.html
    ├── .env.example          # optional frontend overrides
    ├── public/favicon.svg
    └── src/
        ├── main.jsx
        ├── App.jsx           # routes
        ├── styles.css        # all styling
        ├── api/client.js     # fetch wrapper with friendly errors
        ├── context/AuthContext.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── UI.jsx        # Alert, Loading, EmptyState, DemoBanner
        │   └── MealPlanView.jsx  # plan, meals, replace form, grocery list
        └── pages/
            ├── Home.jsx
            ├── AuthForm.jsx      # login + register
            ├── Dashboard.jsx
            ├── CreatePlan.jsx    # the meal plan form and results
            ├── History.jsx
            ├── PlanDetail.jsx
            └── NotFound.jsx
```

---

## Installation

**Prerequisites:** [Node.js](https://nodejs.org) 18 or newer (built-in `fetch` is used for the AI
calls) and npm.

```bash
# 1. Get the code
cd NutriPlan_AI

# 2. Install dependencies for both apps
npm run install:all
```

Or install them separately:

```bash
cd backend  && npm install
cd frontend && npm install
```

---

## Environment variables

The backend reads everything from `backend/.env`. Create it from the example:

```bash
cd backend
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

| Variable           | Required | Default                       | Description                                                        |
| ------------------ | -------- | ----------------------------- | ------------------------------------------------------------------ |
| `PORT`             | No       | `5000`                        | Port for the Express API                                          |
| `NODE_ENV`         | No       | `development`                 | `development` or `production`                                      |
| `CLIENT_ORIGIN`    | No       | `http://localhost:5173`       | Frontend origin allowed to call the API (comma separated)          |
| `JWT_SECRET`       | **Yes**  | insecure dev fallback         | Secret used to sign sessions. Generate one (see below)            |
| `JWT_EXPIRES_IN`   | No       | `7d`                          | How long a login lasts                                             |
| `DB_FILE`          | No       | `nutriplan.sqlite`            | SQLite file name; created automatically                            |
| `AI_PROVIDER`      | No       | `openai`                      | `openai` for a real service, anything else disables it             |
| `AI_API_KEY`       | No       | *(empty)*                     | Your AI API key. **Empty = demo mode.**                            |
| `AI_BASE_URL`      | No       | `https://api.openai.com/v1`   | Works with any OpenAI-compatible endpoint                          |
| `AI_MODEL`         | No       | `gpt-4o-mini`                 | Model name                                                         |
| `AI_TIMEOUT_MS`    | No       | `45000`                       | Timeout for AI requests                                            |
| `AI_DEMO_MODE`     | No       | `false`                       | Set `true` to force demo mode even when a key is present           |

Generate a strong `JWT_SECRET` with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Never put a real API key in source code.** Keys live only in `backend/.env`, which is listed in
`.gitignore`.

### Optional frontend variables

`frontend/.env.example` documents `VITE_API_TARGET`, which overrides the backend address the Vite dev
server proxies to. You only need it if your backend does not run on `http://localhost:5000`.

---

## AI configuration and demo mode

`backend/src/services/aiService.js` is the only file that talks to an external AI provider. It works
with any OpenAI-compatible chat-completions API — OpenAI, Groq, OpenRouter, or a local Ollama server.

```bash
# In backend/.env
AI_PROVIDER=openai
AI_API_KEY=sk-your-real-key-here
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

**Demo mode** is used when no API key is set. The app then builds plans from a curated local meal
library (`mealLibrary.js`), applying the same dietary, allergy, dislike and cooking-time filters. The
demo planner and the real AI integration are completely separate code paths, and every API response
reports which one was used in a `mode` field (`"ai"` or `"demo"`), which the UI displays honestly.
The full workflow — form, plan, grocery list, replacement, save, history — works identically in both
modes, so the app is fully demonstrable with no API key and no internet connection.

If a real AI request fails, the service logs the reason on the server and falls back to demo mode
rather than showing the user an error.

---

## Running the application locally

You need **two terminals**.

**Terminal 1 — backend:**

```bash
cd NutriPlan_AI/backend
npm install          # first time only
npm start            # or: npm run dev  (auto-restarts on change)
```

Runs on **http://localhost:5000** — check it with http://localhost:5000/api/health

**Terminal 2 — frontend:**

```bash
cd NutriPlan_AI/frontend
npm install          # first time only
npm run dev
```

### Open the app

> ### **http://localhost:5173**

The Vite dev server proxies all `/api` calls to the backend, so the browser only ever talks to one
origin and the auth cookie works without any CORS setup.

To produce a production build of the frontend: `npm run build` (output in `frontend/dist/`).

---

## API reference

Base URL: `http://localhost:5000/api`

### Authentication

| Method | Endpoint          | Auth | Description                                    |
| ------ | ----------------- | ---- | ---------------------------------------------- |
| POST   | `/auth/register`  | No   | Create an account. Returns the user.          |
| POST   | `/auth/login`     | No   | Sign in. Sets the session cookie.             |
| POST   | `/auth/logout`    | No   | Clear the session cookie.                      |
| GET    | `/auth/me`        | No   | Who am I? Returns `{ user: null }` if signed out. |

### AI

| Method | Endpoint                | Auth | Description                                |
| ------ | ----------------------- | ---- | ------------------------------------------ |
| GET    | `/ai/status`            | No   | Is the real AI in use, or demo mode?       |
| POST   | `/ai/meal-plan`         | Yes  | Generate a meal plan from the form input.  |
| POST   | `/ai/grocery-list`      | Yes  | Build a grocery list from a plan.          |
| POST   | `/ai/meal-replacement`  | Yes  | Generate a replacement for one meal.       |

### Saved plans

| Method | Endpoint        | Auth | Description                       |
| ------ | --------------- | ---- | --------------------------------- |
| GET    | `/plans/options`| Yes  | Dropdown values for the form.     |
| POST   | `/plans`        | Yes  | Save a generated plan.            |
| GET    | `/plans`        | Yes  | Meal plan history, newest first. |
| GET    | `/plans/:id`    | Yes  | One saved plan.                   |
| DELETE | `/plans/:id`    | Yes  | Delete a saved plan.              |

Every response follows the same shape: `{ success, message, ... }` on success, and
`{ success: false, message, errors? }` on failure, where `errors` holds per-field messages the form
displays inline.

---

## Database

SQLite is used so there is nothing to install or host. The file `backend/nutriplan.sqlite` is created
automatically on first run, along with two tables.

```sql
users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,          -- bcrypt hash, never the plain password
  created_at    TEXT NOT NULL
)

meal_plans (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,        -- FK -> users(id), ON DELETE CASCADE
  name        TEXT NOT NULL,
  goal        TEXT,
  preferences TEXT NOT NULL,            -- JSON: the form input
  plan        TEXT NOT NULL,            -- JSON: the generated plan
  grocery     TEXT,                     -- JSON: the grocery list
  created_at  TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
)
```

To start completely fresh, stop the server and delete `backend/nutriplan.sqlite`.

---

## Security

- Passwords are hashed with **bcrypt** (cost 10) and are never stored or logged in plain text.
- The JWT session is kept in an **httpOnly** cookie, so page JavaScript cannot read it, which
  protects against token theft through XSS.
- Login compares against a dummy hash when the account does not exist, so response timing does not
  reveal which emails are registered.
- **All AI calls happen on the server.** The API key is never sent to the browser.
- All input is validated on both the client and the server; the server always re-validates.
- Every saved-plan query is scoped by `user_id`, so one user can never read or delete another's plan.
- Rate limiting is applied globally and more strictly to auth and AI-generation endpoints.
- Error responses are user-friendly; stack traces are logged server-side only and never returned.

---

## Testing

A script covering the whole API is included:

```bash
# With the backend running on port 5000
npm test
```

It exercises registration, validation, duplicate emails, login, wrong passwords, session restore,
meal plan generation, dietary and allergy filtering, the grocery list, meal replacement, saving,
history, deletion, cross-user isolation, logout, unknown routes and error-message safety.

---

## Troubleshooting

| Problem                                | Fix                                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------------------- |
| `EADDRINUSE: port 5000 already in use` | Another process is using the port. Stop it, or set a different `PORT` in `.env`.     |
| `"better-sqlite3" install fails`        | Use Node 18 or 20, or `npm rebuild better-sqlite3 --build-from-source`.            |
| Frontend shows "could not reach the server" | The backend is not running, or `PORT` does not match `VITE_API_TARGET`.          |
| Login works but is lost on refresh     | Make sure you are using `localhost` (not `127.0.0.1`) consistently for both apps. |
| AI errors, plans still generate         | Expected: the app fell back to demo mode. Check the backend terminal for the reason. |
| `Cannot find module '../config'`        | Run the server from the `backend` folder: `npm start --prefix backend`.            |

---

## Licence

Created as a student project. Free to use and modify for learning purposes.
