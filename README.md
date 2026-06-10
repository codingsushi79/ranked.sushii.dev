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
- Elo starting at 1000, levels 1–5 (740 Elo bands, 3701+ at level 5)
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
3. Download the Windows installer from [`/download`](https://ranked.sushii.dev/download) or the [`client-latest` release](https://github.com/codingsushi79/ranked.sushii.dev/releases/tag/client-latest)
4. Run the installer — it sets up CS2 GSI + JSI during setup
5. Open Ranked CS2 and sign in with your browser
6. Play Competitive or Premier — matches report automatically

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
| 1 | 0 – 740 |
| 2 | 741 – 1480 |
| 3 | 1481 – 2220 |
| 4 | 2221 – 2960 |
| 5 | 2961+ (uncapped Elo) |
