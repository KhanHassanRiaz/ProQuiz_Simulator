# Architecture

> High-level overview. The production source is proprietary; this document
> describes the design without exposing implementation details.

## Overview

ProQuiz Simulator is an Electron desktop application with three layers:

```
┌─────────────────────────────────────────────────────────────┐
│ Renderer (sandboxed)                                        │
│  HTML views · CSS/Tailwind · vanilla JavaScript UI modules  │
└──────────────────────────┬──────────────────────────────────┘
                           │ contextBridge (preload)
                           │ narrow, allow-listed IPC
┌──────────────────────────▼──────────────────────────────────┐
│ Main process (Node.js)                                      │
│  window lifecycle · IPC handlers · local data access        │
│  progress storage · update orchestration                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ Local resources                                             │
│  bundled content packs · content-addressed cache · logs      │
└─────────────────────────────────────────────────────────────┘
```

## Process separation

- **Main process** owns the window, filesystem access, and update lifecycle.
  It never exposes raw Node APIs to the page.
- **Preload script** exposes a small, explicit API surface through
  `contextBridge`.
- **Renderer** contains the interface. It has no direct filesystem or Node
  access; every data request goes through an IPC handler.

This keeps untrusted page content away from privileged APIs and makes the
data flow easy to audit.

## Content and caching

Study material is pre-built into local content packs and shipped with the app.
At runtime, a resource path is hashed into a stable cache key; the loader reads
the matching local file and validates it before handing it to the renderer.

Benefits:

- Fast subject/topic switching
- Works without a network connection
- Cache keys are deterministic, so repeated reads do not depend on filenames
  or directory order

Progress, bookmarks, and UI preferences are stored locally per user.

## Update flow

Installed builds use `electron-updater` against the public GitHub Releases of
this repository.

```
check for updates
      │
      ▼
download latest.yml ──► compare version
      │
      ▼
download installer + blockmap ──► verify sha512
      │
      ▼
user confirms ──► quit and install
```

Because the repository is public, the installed app does **not** need a token
to check for or download updates. Publishing still requires a token on the
maintainer's machine.

## Release pipeline

The packaging pipeline:

1. Rebuilds the Tailwind stylesheet.
2. Hashes every packaged source file and bumps the patch version only when the
   hash changed.
3. Copies the app into a staging directory and obfuscates the distributed
   JavaScript.
4. Packages a Windows x64 NSIS installer with `electron-builder`.
5. Creates or updates the GitHub release and uploads the installer, blockmap,
   and update metadata.

See [BUILD_AND_RELEASE.md](BUILD_AND_RELEASE.md) for commands and details.

## Design principles

- **Offline first** — studying must work without connectivity.
- **Least privilege** — the renderer only receives the APIs it needs.
- **Deterministic releases** — the same source produces the same version.
- **Repeatable publishing** — re-running a release updates the existing
  release rather than failing.
- **Small blast radius** — generated artifacts (`dist/`, staging, caches) never
  enter the source tree.
