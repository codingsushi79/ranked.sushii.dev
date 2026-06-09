# Ranked CS2

FaceIT-style ranked tracking for Counter-Strike 2. Sign up, link Steam, download the Windows client, and play — match stats and Elo update automatically each season.

## Stack

- **Next.js 16** · App Router
- **PostgreSQL** · Drizzle ORM
- **shadcn/ui** · Tailwind CSS · Lucide + Font Awesome icons
- **Resend** · OTP email verification
- **Steam OpenID** · Account linking

## Features

- Email signup with 6-digit OTP verification (white-background Resend template)
- Steam profile linking
- Elo starting at 1000, levels 1–20 (200 Elo bands after level 2)
- Per-level leaderboards (only after 5 placement games)
- Season resets every 4 months
- Fair Elo: team-based expected score, K-factor scaling, performance modifier from K/D and ADR
- Full stat tracking: kills, deaths, assists, headshots, MVPs, damage, K/D
- Windows desktop client + CS2 JSI script (download gated until Steam is linked)

## Setup

### Docker (Mac)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Apple Silicon and Intel).

```bash
# Optional: copy env overrides for Resend / Steam
cp .env.example .env

npm run docker:up
# App: http://localhost:3000
# Postgres: localhost:5433 (ranked / ranked / ranked_cs2)

npm run docker:down          # stop
docker compose down -v       # stop and wipe database volume
```

### Local development

```bash
cp .env.example .env.local
# Fill in DATABASE_URL, AUTH_SECRET, RESEND_API_KEY

npm install
npm run db:push   # or apply drizzle/0000_init.sql manually

npm run dev
```

## Environment

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | JWT signing secret |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM` | Verified sender address |
| `STEAM_API_KEY` | Optional Steam Web API key for avatars |

## License

MIT — see [LICENSE](./LICENSE). The Windows desktop client source lives in `client/` and is included under the same license.

## Code signing (SignPath Foundation)

Free Authenticode signing for the Windows client via [SignPath Foundation](https://signpath.org/) (OSS program). Setup checklist: **[docs/SIGNPATH.md](./docs/SIGNPATH.md)**. Public policy: `/code-signing` on the site and [docs/CODE_SIGNING.md](./docs/CODE_SIGNING.md).

Signed releases are built by GitHub Actions (`.github/workflows/release-client.yml`) on `windows-latest`, then submitted to SignPath for manual approval.

## Desktop client

Pushes to `main` build the Windows installer in GitHub Actions (`.github/workflows/build-client.yml`) and publish it to the [`client-latest` release](https://github.com/codingsushi79/ranked.sushii.dev/releases/tag/client-latest). The site download page links there — no manual exe upload to Vercel.

Local build (optional):

```bash
cd client
npm install
npm start              # dev
npm run build:win      # optional local installer in client/release/build/
```

1. Sign up and verify email
2. Link Steam on `/profile`
3. Copy your Client ID from `/profile`
4. Download from `/download`
5. Paste Client ID into the desktop app
6. Run the client — it auto-installs `ranked.jsi.js` into CS2 JSI script folders

## API

### `POST /api/matches/report`

Requires `Authorization: Bearer <client_id>` (your account UUID from Profile).

```json
{
  "externalId": "unique-match-id",
  "map": "de_dust2",
  "mode": "competitive",
  "winnerTeam": 0,
  "players": [
    {
      "steamId": "76561198000000000",
      "team": 0,
      "kills": 24,
      "deaths": 18,
      "assists": 5,
      "headshots": 12,
      "mvps": 3,
      "damage": 2800,
      "adr": 87.5
    }
  ]
}
```

## Elo levels

| Level | Elo range |
|-------|-----------|
| 1 | 0 – 100 |
| 2 | 101 – 300 |
| 3 | 301 – 500 |
| … | +200 per level |
| 20 | 3701+ (uncapped Elo) |
