## University Leadboard Web Interface

Full-stack Next.js application with MongoDB for managing university teams and leaderboard rankings.

### Included Features

- Modern Bento-style leaderboard as the default homepage
- Top 3 highlighted team cards by marks
- Admin login and protected mark management page
- Full team registration wizard
  - Team details (name, logo, slogan)
  - Team leader details
  - 8 team members added one-by-one
- GSAP-based transitions for interactive UI feel
- MongoDB persistence with API routes

### Setup

1. Install dependencies:

```bash
npm install
```

2. Add environment values:

```bash
cp .env.example .env
```

Then update `.env` with:

- MongoDB connection values
- `MONGODB_URI`=mongodb+srv://url
- `MONGODB_DB_NAME`=database_name
  
- Admin credentials
- `ADMIN_USERNAME`=username
- `ADMIN_PASSWORD`=password

1. Run dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### API

- `GET /api/teams`: get all teams sorted by marks
- `POST /api/teams`: register a new team (leader + 7 members)
- `POST /api/admin/login`: admin login
- `POST /api/admin/logout`: admin logout
- `GET /api/admin/session`: admin session check
- `PATCH /api/teams/:teamId/marks`: update individual team mark (admin-only)

### Notes

- New teams are created with `teamMark = 0` by default.
- Team logo is stored as a data URL in MongoDB for this demo setup.
- Admin panel route is `/admin`.
