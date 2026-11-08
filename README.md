<p align="center">
  <img src="icon.webp" alt="NutriTrace Logo" width="21%">
</p>

# NutriTrace on StartOS

> Everything not listed in this document should behave the same as upstream NutriTrace.
> If a feature, setting, or behavior is not mentioned here, the upstream
> documentation is accurate and fully applicable — see the Documentation section of
> `instructions.md` for links.

[NutriTrace](https://github.com/TraceApps/nutritrace) is a self-hosted nutrition tracker: a food diary, foods and recipes, goals, fasting and wellness sync, served as one Node.js process with an embedded SQLite database. This package runs the upstream image unchanged, creates the admin account itself, and sets from StartOS actions the settings upstream reads from the environment: email, the address in its links, API access and the local food database.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

The package runs upstream's own image, unmodified, through its own entrypoint.

| Item          | Value                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Image         | `ghcr.io/traceapps/nutritrace`, pinned by digest (upstream publishes no per-version tags)             |
| Architectures | x86_64, aarch64                                                                                       |
| Entrypoint    | Upstream's (`docker-entrypoint.sh`, then `node index.js` in `/app`), run as root as upstream ships it |

Subcontainers:

- `nutritrace` — the NutriTrace server (web app, API and scheduler). Attach with `start-cli package attach nutritrace -n nutritrace`.
- `set-admin-password` — a short-lived container the **Set Admin Password** action starts from the same image; it exists only while the action runs.

## Volume and Data Layout

Two volumes: `main` holds NutriTrace's data, and `startos` holds the package's own state and is mounted into no container.

| Volume    | Subpath       | Mount point        | Contents                                                                                                                                     |
| --------- | ------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `main`    | `db/`         | `/data/db`         | `nutritrace.db`, the SQLite database (WAL mode): every account, diary, food, recipe and setting                                              |
| `main`    | `uploads/`    | `/data/uploads`    | uploaded and downloaded images (food and meal photos, avatars)                                                                               |
| `main`    | `backups/`    | `/data/backups`    | archives written by NutriTrace's own **Settings > Backup & Restore**, manual or scheduled (scheduling is off by default)                     |
| `main`    | `off-mirror/` | `/data/off-mirror` | `off.parquet`, the Open Food Facts copy (about 8 GB); mounted only while the local food database is enabled, and deleted when it is disabled |
| `startos` | —             | not mounted        | `store.json`                                                                                                                                 |

NutriTrace migrates its own schema at startup.

## File Models

The package writes no NutriTrace configuration file: upstream configures itself from environment variables and keeps everything else in its database, where its Settings pages edit it.

`store.json` on the `startos` volume holds the package's state:

| Key             | Seeded                                  | Rewritten by                           |
| --------------- | --------------------------------------- | -------------------------------------- |
| `jwtSecret`     | random, at install                      | never                                  |
| `tokenEncKey`   | random, at install                      | never                                  |
| `adminPassword` | empty until **Set Admin Password** runs | **Set Admin Password**, every run      |
| `primaryUrl`    | empty                                   | **Set Primary URL**                    |
| `smtp`          | `disabled`                              | **Configure SMTP**                     |
| `apiAccess`     | `off` (`off`, `read`, `write`, `full`)  | **Configure API Access**               |
| `foodMirror`    | `false`                                 | **Enable/Disable Local Food Database** |

`adminPassword` is the last password the action set. If the password is changed inside NutriTrace, the stored copy is stale; the action is the way to get a known one back.

The package reads `store.json` reactively, so a hand edit survives and restarts NutriTrace with the new values; a value that fails validation is replaced by its default at the next write. Changing `jwtSecret` signs everyone out, and changing `tokenEncKey` makes stored OIDC client secrets and wearable tokens unreadable.

Environment variables the package sets on every start. NutriTrace reads all of them at each launch, so none of them can be changed from inside NutriTrace:

| Variable                                                                       | Value                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PORT`                                                                         | `3001`                                                                                                                                                                                                                                                                                                 |
| `DB_PATH`                                                                      | `/data/db/nutritrace.db`                                                                                                                                                                                                                                                                               |
| `UPLOADS_PATH`                                                                 | `/data/uploads`                                                                                                                                                                                                                                                                                        |
| `BACKUPS_PATH`                                                                 | `/data/backups`                                                                                                                                                                                                                                                                                        |
| `JWT_SECRET`                                                                   | `jwtSecret` — signs sessions; changing it signs everyone out                                                                                                                                                                                                                                           |
| `TOKEN_ENC_KEY`                                                                | `tokenEncKey` — encrypts stored OIDC client secrets and wearable tokens; changing it makes them unreadable                                                                                                                                                                                             |
| `UPDATE_CHECK`                                                                 | `off` — no update checks against GitHub, whatever **Settings > Updates** says. The first start logs `update check stays on for this existing instance`, because the admin account already exists; the variable still wins                                                                              |
| `NODE_EXTRA_CA_CERTS`                                                          | this server's root CA, written into the container at each start                                                                                                                                                                                                                                        |
| `PUBLIC_URL`                                                                   | the address chosen with **Set Primary URL**, followed to its current port; until one is chosen, a public HTTPS domain of the `ui` interface, else its `.local` address. Used only in the links NutriTrace emails or shows for copying                                                                  |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | from **Configure SMTP**: the system SMTP server or a custom one; `SMTP_SECURE` is `true` for TLS and `false` for STARTTLS. Set to empty strings while SMTP is disabled, because NutriTrace keeps env-seeded values, and its lock on **Settings > Email (SMTP)**, until another env value replaces them |
| `WEBHOOKS_ENABLED`, `ALLOW_PRIVATE_WEBHOOK_URLS`                               | `true`: an admin's webhooks are delivered, including to LAN and loopback addresses                                                                                                                                                                                                                     |
| `MCP_ENABLED`, `PUBLIC_API_ENABLED`                                            | `true` unless **Configure API Access** is `off`                                                                                                                                                                                                                                                        |
| `MCP_WRITE_ENABLED`, `PUBLIC_API_WRITE_ENABLED`                                | `true` at `write` and `full`                                                                                                                                                                                                                                                                           |
| `MCP_DESTROY_ENABLED`                                                          | `true` at `full`                                                                                                                                                                                                                                                                                       |
| `OFF_LOCAL_DB`                                                                 | `/data/off-mirror/off.parquet`, only while the local food database is enabled                                                                                                                                                                                                                          |

Upstream variables the package leaves unset: `INSECURE_COOKIES` (StartOS serves HTTPS, so sign-in cookies stay `Secure`), `RECOVERY_TOKEN` (the login-page recovery that deletes every account stays disabled), `BASE_URL`, `ALLOWED_ORIGINS` (browser-based MCP clients are refused; desktop clients send no `Origin` and pass), `OFF_LOCAL_ONLY` (a product missing from the local copy is still looked up publicly), `OFF_LOCAL_URL`, and every `AI_*`, `OIDC_*`, `BACKUP_*` and `MAX_SESSION_HOURS` variable. NutriTrace's own Settings pages edit what those last ones set, and setting a variable would lock its field.

## Dependencies

None.

## Network Access and Interfaces

One interface, on port 3001.

| Interface id | Type | Port | Protocol | Serves                                                                                                                                  |
| ------------ | ---- | ---- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `ui`         | `ui` | 3001 | HTTP     | the web app, the session API the web and Android apps use, the Bearer-token federation and REST API at `/api/v1`, and MCP at `/api/mcp` |

Uploaded images under `/uploads` are served without authentication, as upstream does, so the Android app can load them; the `backups/` archives are not under that path.

Outbound, NutriTrace reaches Open Food Facts, USDA, wearable providers, any address a user saves in Settings (push services, OIDC issuers, CookTrace, Mealie, webhooks), and Hugging Face for the local food database's download and weekly refresh. For another service on this server, the addresses that work are its LAN address in IP form (`https://<server-ip>:<port>`) and any private or public domain on its interface, which StartOS DNS resolves inside the container: `NODE_EXTRA_CA_CERTS` makes their certificates trusted, while `.local` names do not resolve and fail with `Could not resolve host` or `ENOTFOUND`. Pocket ID's issuer is its primary URL, which its package restricts to a domain, so a Pocket ID on a private or public domain works as NutriTrace's OIDC provider. A certificate error such as `SELF_SIGNED_CERT_IN_CHAIN` means the root CA is missing from the container.

## Installation and First-Run Flow

Upstream opens to a setup wizard in which whoever loads the page first creates the admin account, or skips sign-in entirely. On StartOS the wizard is never reached:

1. Install generates `jwtSecret` and `tokenEncKey`.
2. A critical task holds the service stopped until **Set Admin Password** has run.
3. The action creates the `admin` account (role admin) directly in the database, so the first page anyone loads is a sign-in page. Open registration (`POST /api/auth/register`) is refused from then on.

The wizard's other steps (units, body stats, calorie goal, integrations) are skipped with it; each has its own Settings section.

## Actions

Five actions, all user-facing; none is hidden.

### Set Admin Password

Creates the `admin` account with a random 32-character password, or gives it a new one, and returns the username and password.

- **When to run it**: once at install (the task asks for it); again when the admin password is lost; and after **Disable User Management** has been used inside NutriTrace, to bring sign-in back.
- **What it changes**: the `admin` row of the `users` table, which it creates if missing and sets to role `admin`; when it creates the first account it also claims data left from single-user mode, as upstream registration does. It then writes `adminPassword` to `store.json`.
- **How**: it runs a short Node script in a temporary container from the NutriTrace image, using the image's own `db.js` and `bcryptjs` against the mounted database. Importing `db.js` migrates the schema first, so it works on a database NutriTrace has never opened.
- **Cost**: a few seconds, without restarting NutriTrace.
- **Repeat safety**: each run replaces the password. Existing sessions are signed tokens that a password change does not revoke, so devices already signed in stay signed in until their session expires (one year by default, **Settings > Users > Session Duration**).

### Set Primary URL

Chooses the address NutriTrace puts in its links (invitations, including the link **Settings > Users** shows for copying, password resets, shared foods and meals, weekly summaries), from the `ui` interface's HTTPS addresses. It is the SDK's primary-URL action: the stored choice becomes `PUBLIC_URL`, followed to the hostname's current port, and is also what StartOS's **Open UI** opens.

- **When to run it**: once email is set up, if the default address is not one everyone who gets a link can reach. Until it has run, `PUBLIC_URL` is a public HTTPS domain of the interface if there is one, otherwise its `.local` address; no task asks for it.
- **Cost**: a running NutriTrace restarts.
- **Repeat safety**: harmless; running it with the same address changes nothing.

### Configure SMTP

The SDK's standard SMTP form: **Disabled**, **System Credentials** (the StartOS system SMTP server, with an optional From address) or **Custom Credentials**. The choice is stored as `smtp` and turned into the `SMTP_*` variables; a change to the system SMTP server restarts NutriTrace with the new values. With **System Credentials** and no SMTP server set up in StartOS's own settings, email stays off.

- **What it changes in NutriTrace**: at each start NutriTrace copies the `SMTP_*` values into its `app_config` table and locks **Settings > Email (SMTP)**, which then shows them read-only and hides its **Send Test** button. While SMTP is disabled the package still sets every `SMTP_*` variable, to an empty string, so values from an earlier choice never linger and email stays off.
- **When to run it**: before inviting users or relying on password resets, both of which need email. The `admin` account the package creates has no email address, so a password-reset test needs another account or an address added to it.
- **Cost**: NutriTrace restarts.
- **Repeat safety**: each run replaces the whole SMTP choice.

### Configure API Access

One select, `off` by default, that sets the server-side switches for the MCP endpoint (`/api/mcp`) and the personal REST API (`/api/v1/diary`, `goals`, `meals`, `steps`, `body-composition`, `profile`):

| Level   | Shown as                   | Turns on                                                                                     |
| ------- | -------------------------- | -------------------------------------------------------------------------------------------- |
| `off`   | Off                        | nothing; `/api/mcp` and those REST routes answer 404                                         |
| `read`  | Read                       | `MCP_ENABLED`, `PUBLIC_API_ENABLED`                                                          |
| `write` | Read and log               | also `MCP_WRITE_ENABLED`, `PUBLIC_API_WRITE_ENABLED` (log food, water, meals and body stats) |
| `full`  | Read, log, edit and delete | also `MCP_DESTROY_ENABLED` (MCP's edit, delete and create-food tools, each call confirmed)   |

Every request still needs an API token from **Settings > API Tokens** holding the matching `mcp:read`, `mcp:write` or `mcp:destroy` scope. The federation routes the other Trace apps use (`/api/v1/me`, `foods`, `workouts`, `activity`, `body-measurements`) do not depend on this setting.

- **When to run it**: before connecting an AI assistant or a script; turn it back to `off` when nothing uses it.
- **Cost**: NutriTrace restarts.
- **Repeat safety**: each run sets the level outright.

### Enable / Disable Local Food Database

A toggle in the **Advanced** group, off by default. Enabled, it mounts `main/off-mirror/` at `/data/off-mirror` and sets `OFF_LOCAL_DB=/data/off-mirror/off.parquet`; NutriTrace then downloads the Open Food Facts Parquet dump from Hugging Face (about 8 GB) in the background and refreshes it weekly (**Settings > Food Sources** shows its status and refresh interval). Barcode and name lookups, including the Android app's, go to the copy first and to the public API only on a miss or while the first download runs.

- **Disk**: about 8 GB, and about 16 GB while a refresh downloads the new file beside the old one.
- **Disabling** clears `OFF_LOCAL_DB`, restarts NutriTrace and deletes `main/off-mirror/`.
- **When to run it**: only to keep food lookups off the public Open Food Facts API.
- **Cost**: NutriTrace restarts either way. The first download takes several minutes on a fast connection; lookups use the public API until it finishes.
- **Repeat safety**: it is a toggle, so a second run reverses the first, and disabling deletes the download.

## Tasks

One task, raised at install.

| Task                                | Raised when                              | Severity | Cleared by                     |
| ----------------------------------- | ---------------------------------------- | -------- | ------------------------------ |
| Create the NutriTrace admin account | `adminPassword` in `store.json` is empty | critical | running **Set Admin Password** |

The task is raised at install and does not return once the action has run, including after a restore, which brings `store.json` back with the rest of the backup.

## Health Checks

One check, on the NutriTrace server.

| Check                     | Probes                                                                                                     | Grace period | A failure means                                                                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `primary` (Web Interface) | an HTTP request to `http://127.0.0.1:3001/`, every second while starting and every 30 seconds once healthy | 10 seconds   | the server is not answering. NutriTrace exits at startup if it cannot open or migrate its database, so check the logs for a startup error before anything else. |

The check requests the web app rather than `/api/health` because NutriTrace logs every `/api/*` request. One `ECONNREFUSED 127.0.0.1:3001` trace right after `Launching primary...` is the first probe arriving before Node has bound the port; it is a fault only if it repeats.

## Backups and Restore

Both volumes are copied whole with rsync while the service is stopped, so the SQLite database and its WAL file are captured consistently.

- **Excluded**: `main/backups/`, NutriTrace's own archives, each a database dump plus every uploaded image, which stay on the server but would double the backup's size; and `main/off-mirror/`, the local food database, which NutriTrace downloads again after a restore if it is enabled.
- **Restore** brings back the database, uploads and `store.json`, including the secrets. Sessions, encrypted OIDC client secrets and wearable tokens therefore keep working, and the admin password is the one the action last set.
- **A restore after an uninstall can give the `ui` interface a new port.** `PUBLIC_URL` follows it, but an address with the old port pasted into another service, such as CookTrace or LiftTrace, must be updated there; a domain address is unaffected.

## Limitations and Differences

What works differently from a NutriTrace installed with upstream's Docker Compose file.

1. Update checks are off and cannot be turned on from **Settings > Updates**; StartOS handles updates.
2. The login-page recovery ("Disable user management") is unavailable because `RECOVERY_TOKEN` is unset. **Set Admin Password** is the recovery path.
3. **Settings > Email (SMTP)** is read-only and has no **Send Test** button; email is set with **Configure SMTP**.
4. The local food database's air-gapped mode (`OFF_LOCAL_ONLY`) is not offered: a product missing from the copy is looked up publicly.
5. Trace AI cannot be pointed at a model through the server (`AI_PROVIDER`, `AI_BASE_URL`). Each user configures it in **Settings > AI Assistant**, where the browser calls the provider, so a local model has to be reachable from the browser.
6. **Settings > Users > Disable User Management** works as upstream: it deletes every account and its data and leaves NutriTrace without sign-in.
7. Addresses NutriTrace dials itself must not use `.local` names; see [Network Access and Interfaces](#network-access-and-interfaces).

---

## Quick Reference for AI Consumers

The package's operable surface in one block.

```yaml
package_id: nutritrace
image: ghcr.io/traceapps/nutritrace
architectures: [x86_64, aarch64]
subcontainers: [nutritrace, set-admin-password]
volumes:
  main: [/data/db, /data/uploads, /data/backups, /data/off-mirror]
  startos: none
file_models:
  - startos/store.json
startos_managed_env_vars:
  - PORT
  - DB_PATH
  - UPLOADS_PATH
  - BACKUPS_PATH
  - JWT_SECRET
  - TOKEN_ENC_KEY
  - UPDATE_CHECK
  - NODE_EXTRA_CA_CERTS
  - PUBLIC_URL
  - SMTP_HOST
  - SMTP_PORT
  - SMTP_SECURE
  - SMTP_USER
  - SMTP_PASS
  - SMTP_FROM
  - WEBHOOKS_ENABLED
  - ALLOW_PRIVATE_WEBHOOK_URLS
  - MCP_ENABLED
  - MCP_WRITE_ENABLED
  - MCP_DESTROY_ENABLED
  - PUBLIC_API_ENABLED
  - PUBLIC_API_WRITE_ENABLED
  - OFF_LOCAL_DB
dependencies: none
interfaces:
  ui: { type: ui, port: 3001 }
actions:
  - set-admin-password
  - set-primary-url
  - manage-smtp
  - set-api-access
  - toggle-food-mirror
tasks:
  - { action: set-admin-password, severity: critical }
health_checks:
  - primary
```
