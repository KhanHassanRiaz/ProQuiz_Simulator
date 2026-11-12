# Build and release

> Commands below are from the private application repository. Only the results
> (installers and update metadata) are published to this public repository.

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm
- Windows x64 for producing the NSIS installer
- A GitHub token with `Contents: write` on the release repository, set as
  `GH_TOKEN` in the environment

## Commands

```bash
npm install

npm run start        # run the app from source
npm run build        # build an unpacked/portable app into dist/
npm run build:css    # rebuild Tailwind only
npm run version:check # report whether the packaged source changed
npm run release      # bump if needed, build, and publish/update the release
```

## Versioning: bump only when source changes

Every packaged source file is hashed with SHA-256. The hash covers:

- `main.js`, `preload.js`, `index.html`, `style.css`, `input.css`,
  `tailwind.config.js`, `icon.ico`
- `js/`, `css/`, `fonts/`, `views/`, `lib_cache/`
- `package.json` with `version`, `scripts`, and `devDependencies` excluded

The last released version and hash are stored in `.version-state.json`.

Behavior:

| Situation | Result |
| --- | --- |
| Source hash unchanged | Version stays the same |
| Source hash changed | Patch version is incremented |
| Version was edited manually since the last release | No second bump; the manual version is respected |
| No state file yet | Treated as changed; run `--init` to baseline instead |

Useful commands:

```bash
node scripts/bump-version.js --check   # explain what the next release will do
node scripts/bump-version.js --init    # record current version + hash without bumping
```

Why: rebuilding the installer should not create a new version if nothing that
ships to users actually changed. It also lets a maintainer re-upload a release
for the same version deliberately.

## Publishing: create or update

`npm run release` performs:

1. `npm run build:css`
2. `node scripts/bump-version.js`
3. `node scripts/build-obfuscated.js --publish never`
4. `node scripts/publish-release.js`

The publisher:

- Looks up the release by tag (`v<version>`).
- Creates it if missing.
- If it already exists, **updates it in place**: matching assets are deleted
  and re-uploaded.
- Uploads `Setup.exe`, `Setup.exe.blockmap`, and `latest.yml` (regenerating
  `latest.yml` if it does not match the built installer).

This avoids the classic `422 Unprocessable Entity` / "release already exists"
failure when rebuilding the same version.

### Useful publisher flags

```bash
node scripts/publish-release.js --dry-run    # print the plan, upload nothing
node scripts/publish-release.js --fresh      # delete release + tag, recreate
node scripts/publish-release.js --check-env  # verify token and config early
```

`npm run release -- --fresh` forwards the flag to the publisher.

## Token handling

Never commit a token. Set it in the shell session or as a persistent user
environment variable:

```powershell
# PowerShell (current session)
$env:GH_TOKEN = "github_pat_xxx"
npm run release
```

```bat
:: CMD
set GH_TOKEN=github_pat_xxx && npm run release
```

```powershell
# Persistent (reopen the terminal afterwards)
setx GH_TOKEN "github_pat_xxx"
```

Installed apps do **not** need a token: the release repository is public.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `GH_TOKEN is not set` | Export the token before running the release. |
| `404` when publishing | Token lacks access to the target repository. |
| `422 ... repository is empty` | Push at least one commit (for example a README) before the first release. |
| `latest.yml` mismatch | The publisher regenerates it from the built installer automatically. |
| Version did not increase | No packaged source changed, which is intentional. Run `npm run version:check`. |
| Version increased unexpectedly | A packaged file or `package.json` field changed. Compare with `version:check`. |
