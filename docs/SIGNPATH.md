# SignPath Foundation setup guide

Follow these steps to get **free** Authenticode signing for the Ranked CS2 Windows client. The repo is already wired for GitHub Actions + SignPath; you finish the parts only you can do.

## Prerequisites checklist

Before applying, confirm:

- [ ] **Public GitHub repository** with this code (SignPath OSS requires public source)
- [ ] **MIT license** at repo root (`LICENSE` — already added)
- [ ] **Download page** describes the client ([/download](https://ranked.sushii.dev/download))
- [ ] **Code signing policy** published ([/code-signing](https://ranked.sushii.dev/code-signing) + `docs/CODE_SIGNING.md`)
- [ ] **2FA enabled** on your GitHub account (required for all SignPath OSS maintainers)
- [ ] Client **already released** at least once (unsigned exe on the site counts)

## Step 1 — Publish the repository

1. Create a **public** GitHub repo (e.g. `YOUR_ORG/ranked.sushii.dev`).
2. Push this codebase.
3. Replace placeholders:
   - `YOUR_ORG` / `YOUR_REPO` in `docs/CODE_SIGNING.md`
   - `YOUR_GITHUB_USERNAME` in `.github/CODEOWNERS`
   - `client/package.json` → `repository.url`
   - `src/app/(app)/code-signing/page.tsx` → GitHub link
4. Enable **branch protection** on `main`:
   - Require pull request before merge
   - Require at least 1 approval
   - Block force pushes

## Step 2 — Apply to SignPath Foundation

1. Read the official terms: https://signpath.org/terms.html  
2. Download the request form: https://signpath.org/assets/OSSRequestForm-v4.xlsx  
3. Fill in:
   - Project name: **Ranked CS2 Client**
   - Repository URL: your public GitHub repo
   - Description: Windows desktop client for CS2 ranked match tracking (GSI + JSI), connects to ranked.sushii.dev
   - License: MIT
   - Download page: https://ranked.sushii.dev/download
   - Code signing policy: https://ranked.sushii.dev/code-signing
4. Email the completed form to **oss@signpath.org**
5. Wait for approval (often 1–2 weeks)

## Step 3 — Configure SignPath.io (after approval)

SignPath will create a free **SignPath.io** subscription. In the dashboard:

1. Note your **Organization ID**, **Project slug**, and **Signing policy slug**  
   (defaults in this repo assume project slug `ranked-cs2-client`, policy `release-signing` — rename `.signpath/policies/...` if SignPath uses different slugs)
2. Install the **SignPath GitHub App** on your repository
3. Link the **GitHub.com** trusted build system to your project
4. Create an **API token** with submitter permissions for the signing policy
5. Assign yourself as **Approver** for signing requests

### GitHub repository configuration

**Secrets** (Settings → Secrets and variables → Actions):

| Name | Value |
|------|--------|
| `SIGNPATH_API_TOKEN` | API token from SignPath.io |

**Variables** (same page, Variables tab):

| Name | Example |
|------|---------|
| `SIGNPATH_ORGANIZATION_ID` | UUID from SignPath org settings |
| `SIGNPATH_PROJECT_SLUG` | `ranked-cs2-client` |
| `SIGNPATH_SIGNING_POLICY_SLUG` | `release-signing` |

## Step 4 — First signed release

1. Bump `client/package.json` version if needed (e.g. `2.0.1`)
2. Commit and push to `main`
3. Create and push a tag matching the client version:

```bash
git tag client-v2.0.1
git push origin client-v2.0.1
```

4. GitHub Actions runs [`.github/workflows/release-client.yml`](../.github/workflows/release-client.yml):
   - Builds unsigned exe on `windows-latest`
   - Submits to SignPath
5. **Approve** the signing request in SignPath.io (email notification)
6. When the workflow finishes, download the **signed** artifact from the Actions run or GitHub Release

## Step 5 — Publish signed exe

After SignPath approval on a tagged release, the signed installer is attached to that GitHub Release. Day-to-day builds on `main` go to the [`client-latest`](https://github.com/codingsushi79/ranked.sushii.dev/releases/tag/client-latest) release automatically; the site download page links there.

## Step 6 — Verify on Windows

1. Download the new exe from ranked.sushii.dev
2. Right-click → Properties → **Digital Signatures**
3. Publisher should show **SignPath Foundation**
4. SmartScreen should not show the blue “Unknown publisher” block (may still warn briefly until reputation builds)

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Workflow builds but skips signing | Set all three `SIGNPATH_*` variables + `SIGNPATH_API_TOKEN` secret |
| SignPath rejects origin | Ensure SignPath GitHub App is installed; workflow uses `windows-latest` + `ubuntu-latest` only |
| Policy file mismatch | Rename `.signpath/policies/<project-slug>/<policy-slug>.yml` to match SignPath dashboard |
| Application rejected | Repo must be public, maintained, MIT-licensed, with clear download + policy pages |

## What stays unsigned

The Next.js website and API are not code-signed — only the Windows `.exe` installer. That is normal for SignPath OSS programs.

## Links

- SignPath Foundation: https://signpath.org/
- OSS terms: https://signpath.org/terms.html
- GitHub integration docs: https://docs.signpath.io/trusted-build-systems/github
- Submit signing action: https://github.com/signpath/github-action-submit-signing-request
