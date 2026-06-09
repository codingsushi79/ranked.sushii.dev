# Code signing policy

This policy applies to the **Ranked CS2 Windows desktop client** (`client/`), distributed from [ranked.sushii.dev/download](https://ranked.sushii.dev/download).

Free code signing provided by [SignPath.io](https://signpath.io/), certificate by [SignPath Foundation](https://signpath.org/).

## What we sign

We sign only `ranked-cs2-client-setup.exe`, built from this repository’s `client/` directory via the GitHub Actions workflow [`.github/workflows/release-client.yml`](../.github/workflows/release-client.yml). Unsigned builds from local machines are not published.

## Team roles

Replace the placeholders below with your GitHub org/user links before applying to SignPath.

| Role | Responsibility | Members |
|------|----------------|---------|
| **Authors** | Merge changes to the default branch | `[Maintainers](https://github.com/codingsushi79/ranked.sushii.dev)` |
| **Reviewers** | Review pull requests before merge | Same as maintainers (branch protection required) |
| **Approvers** | Approve each SignPath signing request in the SignPath.io dashboard | `YOUR_GITHUB_USERNAME` |

## Privacy

The desktop client:

- Runs locally and reads CS2 match data via Game State Integration (GSI).
- Connects to **ranked.sushii.dev** only when you save a Client ID, verify your account, or report a **Competitive** or **Premier** match result.
- Does not send data to other networked systems unless you configure it to use a different API URL (development builds only).

The hosted service’s data practices are described in our [Privacy Policy](https://ranked.sushii.dev/privacy) and [Terms of Service](https://ranked.sushii.dev/terms).

Third-party components in the client include Electron, Node.js runtime libraries, and open-source npm packages (see `client/package-lock.json`).

## Release process

1. Tag a release: `client-v2.0.0` (must match `client/package.json` version).
2. GitHub Actions builds the unsigned installer on `windows-latest`.
3. The workflow submits the artifact to SignPath.io for signing.
4. An **Approver** approves the signing request in SignPath.io.
5. The signed installer is attached to the GitHub Release and copied to `public/downloads/` for site deployment (manual step until automated).

## Reporting issues

Report suspected policy violations or malware concerns to [support@signpath.io](mailto:support@signpath.io) and the project maintainers.
