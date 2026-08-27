# Remote Kanban

Remote Kanban switches a managed project between Git branches without assuming a package manager, runtime, database engine, or migration tool.

## Supervisor configuration

Copy `.env.example` to `.env` and configure the managed project:

```env
REMOTE_KANBAN_PROJECT_PATH=/absolute/path/to/project
REMOTE_KANBAN_CHECKOUT_HOOK=scripts/remote-kanban-checkout.sh
REMOTE_KANBAN_START_SCRIPT=scripts/remote-kanban-start.sh
REMOTE_KANBAN_BACKEND_URL=http://127.0.0.1:8080
```

Hook and start script paths are relative to `REMOTE_KANBAN_PROJECT_PATH`. The backend URL is optional and must target the managed backend directly. Any HTTP response means it is ready.

## Checkout hook

The checkout hook runs after the initial checkout and every branch switch. Remote Kanban provides a stable branch identifier through `REMOTE_KANBAN_BRANCH_ID`.

The hook owns finite project preparation tasks such as dependency installation, branch database provisioning, environment updates, and migrations. A successful exit code allows the managed project to start; a failure leaves it stopped.

Example hook:

```sh
#!/bin/sh
set -eu

pnpm install --frozen-lockfile
./scripts/prepare-branch-database "$REMOTE_KANBAN_BRANCH_ID"
pnpm db:migrate:deploy
```

## Start script

The start script is the long-running managed project process. It should use `exec` so the supervisor can stop it cleanly.

```sh
#!/bin/sh
set -eu

exec pnpm dev
```

Remote Kanban itself remains running during branch switches. The supervisor only stops and restarts the managed project.

Both scripts are versioned by the managed project. Changes to them execute arbitrary code and must therefore require deployment permissions.
