# api-first-test

```markdown
## Quick start — Run local Prism mock (cross-platform)

Prereqs:
- Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- Node.js (only needed for npm helper scripts)

Files:
- OpenAPI spec: `openapi/statement-api.yaml`
- Makefile targets: `mock`, `mock-rm`, `stop-mock`, `remove-mock`, `lint`, `validate`
- npm scripts (cross-platform): `npm run mock`, `npm run mock:detached`, `npm run mock:rm`, `npm run mock:stop`, `npm run mock:raw`, `npm run lint`, `npm run validate`

Usage (一致行為)：
- Unix developers (macOS/Linux with Make):
  - Foreground (logs in terminal): `make mock`
  - Detached background: `make mock` (if you changed target to -d) or use `make` variant you have
  - Stop: `make stop-mock`
  - Remove: `make remove-mock`

- Windows / cross-platform (use npm):
  - Foreground: `npm run mock`  (runs docker with --rm and logs in terminal; Ctrl+C to stop)
  - Detached background (keep container): `npm run mock:detached`
  - Detached ephemeral (auto remove on stop): `npm run mock:rm`
  - Stop & remove: `npm run mock:stop`
  - Fallback (no local mount): `npm run mock:raw` (Prism reads YAML from GitHub raw URL)

Lint & validate (same in both):
- Lint: `make lint` or `npm run lint`
- Validate: `make validate` or `npm run validate`

Notes:
- On macOS Docker Desktop, if you see "Mounts denied" add your project path to Docker Desktop → Preferences → Resources → File Sharing.
- If preferring not to mount local file, use `npm run mock:raw` which fetches the YAML from GitHub directly.
```