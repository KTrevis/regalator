# Regalator

Regalator switches a managed project between Git branches without assuming a package manager, runtime, database engine, or migration tool.

## Supervisor configuration

Copy `.env.example` to `.env` and configure the managed project:

```env
REGALATOR_PROJECT_PATH=/absolute/path/to/project
REGALATOR_CHECKOUT_HOOK=scripts/regalator-checkout.sh
REGALATOR_START_SCRIPT=scripts/regalator-start.sh
REGALATOR_BACKEND_URL=http://127.0.0.1:8080
```

Hook and start script paths are relative to `REGALATOR_PROJECT_PATH`. The backend URL is optional and must target the managed backend directly. Any HTTP response means it is ready.

## Checkout hook

The checkout hook runs after the initial checkout and every branch switch. Regalator provides a stable branch identifier through `REGALATOR_BRANCH_ID`.

The hook owns finite project preparation tasks such as dependency installation, branch database provisioning, environment updates, and migrations. A successful exit code allows the managed project to start; a failure leaves it stopped.

Example hook:

```sh
#!/bin/sh
set -eu

pnpm install --frozen-lockfile
./scripts/prepare-branch-database "$REGALATOR_BRANCH_ID"
pnpm db:migrate:deploy
```

## Start script

The start script is the long-running managed project process. It should use `exec` so Regalator can stop it cleanly.

```sh
#!/bin/sh
set -eu

exec pnpm dev
```

Regalator itself remains running during branch switches. Its backend stops and restarts the managed project.

Both scripts are versioned by the managed project. Changes to them execute arbitrary code and must therefore require deployment permissions.
