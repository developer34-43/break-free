# BREAK FREE

### Addiction Support & NGO Connect Platform — Surat City

> *"Every journey to recovery begins with one decision."*

Break Free is a full-stack web application that helps people in **Surat** find trusted de-addiction, rehabilitation and counselling support options — for themselves or for someone they care about.

Users fill one confidential form describing their situation and preferences. The platform stores the enquiry securely in MongoDB, compares it with support centres in the database using a transparent matching algorithm, and shows the best-matching organisations with filters, contact actions (call / WhatsApp / directions / website) and detailed information.

**Break Free is an information and support-connect platform. It does not replace professional medical advice, diagnosis, or treatment.**

---

## 1. Project Overview

| | |
|---|---|
| **Type** | Full-stack college project (single-page public website + protected admin panel) |
| **Focus city** | Surat, Gujarat, India |
| **Public site** | One single page (HTML + CSS + vanilla JS) |
| **Admin panel** | Separate protected route at `/admin/admin.html` |

### The problem it solves
People struggling with addiction (and their families) often don't know *where* to turn. Information about de-addiction centres is scattered across directories of varying quality. Break Free brings verified Surat-based support options into one place and helps users compare them based on what matters to them: addiction type, area, service type, gender support and budget.

## 2. Features

- Single-page website with smooth scrolling, sticky navbar, mobile hamburger menu
- Awareness section explaining how addiction affects life (supportive, non-judgemental tone)
- All common addiction categories explained (smoking, tobacco, gutkha, alcohol, opioids…)
- **Get Support form** with multi-select addiction categories, "Other" input, preferences and privacy consent
- Frontend **and** backend validation with friendly messages (Indian mobile number validation)
- Enquiries stored in MongoDB (`SupportRequest` collection) — never shown publicly
- **Matching algorithm** (0–100 score) comparing the request with every centre
- Results with **search, 6 filters, sorting**, match badges ("Strong Match", "85% Match")
- NGO cards with Call / WhatsApp / Directions / Website buttons (shown only when data exists)
- Detailed view per organisation including its **data source**
- Fallback states: loading, no exact matches, API errors, empty results
- **Admin dashboard**: login (bcrypt-hashed passwords), stats, view enquiries, add/edit/delete/verify NGOs
- Basic security: rate limiting, CORS, sanitisation, HMAC-signed session tokens, no secrets in frontend
- Fully responsive (desktop / tablet / mobile) and accessible (semantic HTML, labels, focus states, aria attributes)

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (no frameworks) |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose ODM |
| Auth | bcryptjs (password hashing) + HMAC-SHA256 signed tokens |
| Other | express-rate-limit, cors, dotenv |

Fonts are loaded from Google Fonts (with system-font fallback). No other external runtime dependencies.

## 4. Folder Structure

```
break-free/
├── public/                  # Frontend (served statically by Express)
│   ├── index.html           # The single-page website
│   ├── css/style.css        # Design system + all styles
│   ├── js/app.js            # Form, matching results, filters, modal
│   ├── assets/favicon.svg
│   └── admin/               # Admin dashboard (separate protected UI)
│       ├── admin.html
│       ├── admin.css
│       └── admin.js
├── server/
│   ├── server.js            # Express app entry point
│   ├── constants.js         # Shared vocabulary (addictions, services, areas…)
│   ├── config/db.js         # Mongoose connection
│   ├── models/
│   │   ├── NGO.js           # Support organisation schema
│   │   ├── SupportRequest.js# Confidential enquiry schema
│   │   └── Admin.js         # Admin user (bcrypt hash)
│   ├── controllers/
│   │   ├── ngoController.js        # CRUD + search/filter/sort
│   │   ├── supportController.js    # Create enquiry + admin listing
│   │   └── adminController.js      # Login + stats
│   ├── routes/
│   │   ├── ngoRoutes.js
│   │   ├── supportRoutes.js
│   │   ├── adminRoutes.js
│   │   └── configRoutes.js  # Serves shared constants to the frontend
│   ├── middleware/
│   │   ├── auth.js          # Bearer-token admin guard
│   │   ├── errorHandler.js  # Central JSON error handling
│   │   └── rateLimit.js     # Rate limiting
│   └── utils/
│       ├── match.js         # Matching algorithm
│       ├── validate.js      # Validation helpers
│       └── token.js         # HMAC token sign/verify
├── seed/
│   └── seedNGOs.js          # Curated Surat dataset (idempotent)
├── .env.example             # Template environment variables
├── .gitignore               # Excludes node_modules and .env
├── package.json
└── README.md
```

## 5. MongoDB Setup

**Option A — Local MongoDB (recommended for the demo)**

1. Install MongoDB Community Server from <https://www.mongodb.com/try/download/community>
2. Make sure the service is running (`mongod` on port 27017)
3. Use this connection string in `.env`:
   ```
   MONGODB_URI=mongodb://127.0.0.1:27017/breakfree
   ```

**Option B — MongoDB Atlas (free cloud cluster)**

1. Create a free account at <https://www.mongodb.com/cloud/atlas>
2. Create a free cluster, a database user, and allow your IP
3. Copy the connection string into `.env`:
   ```
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/breakfree
   ```

The database and collections are created automatically on first run/seed.

## 6. Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/breakfree
PORT=5000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ChangeMe123
SESSION_SECRET=change-this-to-a-long-random-string
```

- `ADMIN_USERNAME` / `ADMIN_PASSWORD` are used **only when no admin exists yet**; the seed script hashes the password with bcrypt before storing it.
- `.env` is listed in `.gitignore` and must never be committed.
- The MongoDB connection string is never sent to the frontend.

## 7. Installation

```bash
git clone <your-repo-url> break-free
cd break-free
npm install
```

## 8. Running Locally

```bash
# development (auto-restart on file changes)
npm run dev

# or production style
npm start
```

Then open:

- Website: <http://localhost:5000>
- Admin panel: <http://localhost:5000/admin/admin.html>

## 9. Database Seeding

```bash
npm run seed
```

This inserts the curated Surat support-centre dataset (15 organisations) and creates the default admin account if none exists. The script is **idempotent** — running it again updates existing records instead of duplicating them.

## 10. API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Health check |
| GET | `/api/config` | Public | Shared option lists (addictions, services, areas…) |
| GET | `/api/ngos` | Public | List/search/filter/sort centres (`?search=&addiction=&area=&service=&gender=&facility=&pricing=&verified=true&sort=best\|area\|verified\|az`) |
| GET | `/api/ngos/:id` | Public | Single centre details |
| POST | `/api/support-requests` | Public | Submit enquiry → returns matched NGOs |
| POST | `/api/admin/login` | Public (rate-limited) | Admin login → returns signed token |
| GET | `/api/support-requests` | Admin | List enquiries (paginated) |
| GET | `/api/support-requests/:id` | Admin | Single enquiry |
| GET | `/api/admin/stats` | Admin | Dashboard statistics |
| GET | `/api/admin/me` | Admin | Token validation |
| POST | `/api/ngos` | Admin | Add centre |
| PUT | `/api/ngos/:id` | Admin | Update centre |
| PATCH | `/api/ngos/:id/verify` | Admin | Set verified true/false |
| DELETE | `/api/ngos/:id` | Admin | Delete centre |

Status codes used: `200` OK, `201` Created, `400` Validation error, `401` Unauthorized, `404` Not found, `409` Duplicate, `429` Too many requests, `500` Server error.

Example response from `POST /api/support-requests`:

```json
{
  "success": true,
  "message": "Support options found",
  "requestId": "6a881eb2015798a2aac038fd",
  "matchCount": 15,
  "matches": [ { "_id": "...", "name": "...", "matchScore": 92 } ]
}
```

## 11. Matching Algorithm

Implemented in `server/utils/match.js`. Every request is compared with every centre and scored out of 100:

| Criterion | Points |
|---|---|
| Addiction category overlap | +30 |
| Preferred service offered | +20 |
| Area match | +15 |
| Gender support match | +10 |
| Budget match (low-cost also matches free) | +10 |
| Verified organisation | +10 |
| Facility type fits the preferred service | +5 |
| **Maximum** | **100** |

Scores are displayed as a percentage plus a label (Strong / Good / Possible Match). The UI always explains: *"Match scores are based on the preferences entered and are intended only to help you compare available support options."* — it is a comparison tool, **not** a medical recommendation.

If no strong match exists (best score < 40), the UI says: *"We couldn't find an exact match, but here are nearby/general support options."*

## 12. Admin Panel

Open `/admin/admin.html`, login with the credentials from `.env`.

Capabilities:
- Dashboard stats (total enquiries, centres, verified count)
- View all submitted enquiries with full details (admin-only, never public)
- Add / edit / delete support centres
- Toggle the "Verified" badge
- Logout (token stored in localStorage, expires after 24h)

Passwords are hashed with bcryptjs. Session tokens are HMAC-SHA256 signatures verified server-side; login attempts are rate-limited to 10 per 15 minutes.

## 13. Data Sources & Accuracy

The seeded dataset contains **real, researched Surat organisations** collected in August 2026 from:

1. **Official government sources** — e.g. SMIMER Psychiatry Department facilities page (suratmunicipal.gov.in), New Civil Hospital listing (surat.nic.in, nchsurat.org)
2. **Official organisation websites** — e.g. SOCH Institute of Mental Health & De-addiction (mentalhospitalsurat.com)
3. **Established directories** — rehabs.in, Sulekha (verified listings), findrehabcentres.com, webindia123

Every record stores its `source` URL(s), shown in the details view. Where information could not be reliably verified (phone numbers, addresses, timings, prices), fields were left empty or set to *"Not available"* rather than invented. Coordinates are approximate and used only for map display; directions links use the street address.

**Please verify contact details before real-world use** — directory data can become outdated.

## 14. Privacy

- Support requests are stored securely and visible **only to admins**
- Nothing from an enquiry is ever rendered on the public site
- Only information needed for matching is collected
- The platform does not claim medical confidentiality beyond standard web security practices

## 15. Viva Quick Answers

- **Why this project?** Addiction support information in Indian cities is fragmented; a single trusted, non-judgemental entry point helps people take the first step.
- **Frontend?** Plain HTML/CSS/JS single page — fast, no build step, easy to explain.
- **Backend?** Express REST API with controllers/routes/models separation (MVC pattern).
- **Database?** MongoDB via Mongoose; three collections: NGOs, SupportRequests, Admins.
- **CRUD?** NGOs have full Create/Read/Update/Delete via the admin panel; support requests have Create (public) and Read (admin).
- **Validation?** Both client-side (instant feedback) and server-side (security) with the same rules.
- **Matching?** Deterministic weighted scoring (see section 11) — simple, explainable, no AI.
- **Security?** bcrypt password hashing, HMAC tokens, rate limiting, CORS, input sanitisation, secrets in `.env`.

## 16. Future Improvements

- Map view of centres using Leaflet/OpenStreetMap
- Follow-up reminders via SMS/email (opt-in)
- Multi-language support (Gujarati/Hindi)
- Centre self-service profile claims and updates
- Anonymous chat-based triage to improve matching quality
- Automated verification workflow for listings

## 17. Known Limitations

- Contact details come from public directories and may change — verify before visiting any centre.
- "Area match" uses the neighbourhood name, not GPS distance.
- The admin panel is intentionally simple (single admin role).
- This is an educational project — it must not be presented as a medical service.

---

Made as an educational college project. If you or someone you know is in crisis, call **Tele-MANAS 14416** (free, 24×7, Govt. of India) or emergency services **108**.
