# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Use GitHub's private vulnerability reporting on this repository
(**Security → Report a vulnerability**), or contact the maintainer through
[GitHub](https://github.com/KhanHassanRiaz).

Please include:

- A short description of the issue
- Steps to reproduce
- Affected version (`Help → About` in the app, or the release tag)
- Any relevant logs, with personal data removed

## Scope

This repository contains documentation, sample code, and release binaries.
The application source is proprietary and is not published here.

## Secrets

This repository must never contain credentials. Release publishing uses a
`GH_TOKEN` environment variable on the maintainer's machine only; tokens are
never committed and are not required by installed apps to receive updates
from this public repository.
