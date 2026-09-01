# Regalator

Regalator switches the branch of a running web project and prepares, starts,
and checks that project through repository-owned shell scripts. It can also
turn Notion tickets into committed Git branches through a coding agent.

## Prerequisites

- [Bun](https://bun.sh/) 1.3.5 or later;
- a Git repository whose branches are available locally or on `origin`;
- a public HTTPS URL reachable by the managed website and Notion;
- a backend healthcheck that responds when the managed project is ready.

The managed repository should have a clean working tree before Regalator
switches or pulls branches. Branches checked out in another Git worktree are
not available in the branch picker.

## Install

Run the setup command from anywhere inside the Git repository that Regalator
should manage:

```sh
bunx @regalator/cli setup
```

The command finds the repository root, asks for the public Regalator URL and
the managed project healthcheck, and creates:

```text
.regalator/
├── .env
├── .gitignore
├── checkout-hook.sh
├── config.json
└── startup.sh
```

The setup is safe to run again. Existing files are validated but never
overwritten. `.regalator/config.json` and the two shell scripts should be
committed. `.regalator/.env` and `.regalator/state/` remain local and ignored.

Complete the generated shell scripts, add the requested GitHub and Notion
credentials to `.regalator/.env`, then start Regalator:

```sh
bunx @regalator/cli start
```

The start command initializes or migrates the local SQLite database and serves
the frontend, `embed.js`, and `/api` from the configured port. It stays in the
foreground until it receives `SIGTERM` or `SIGINT`.

## Managed project scripts

The script paths are fixed:

- `.regalator/checkout-hook.sh` prepares the selected branch;
- `.regalator/startup.sh` owns the long-running managed project process.

Both files must be committed to every branch that Regalator can select. A
branch without them is rejected before checkout. Regalator also refuses to
start while either generated template still contains its setup marker.

### Checkout hook

Regalator runs the checkout hook on initial startup, after every branch switch,
and while restoring the previous branch after a failed switch. Use it to
install dependencies, generate environment files, prepare a branch-specific
database, and run migrations.

The hook runs with `/bin/sh` from the repository root. It receives
`REGALATOR_BRANCH_ID`, a stable 12-character identifier derived from the branch
name. It must be idempotent and finish within five minutes.

```sh
#!/bin/sh
set -eu

pnpm install --frozen-lockfile
./scripts/prepare-branch-database "$REGALATOR_BRANCH_ID"
pnpm db:migrate:deploy
```

### Startup script

The startup script must keep the project in the foreground and shut down the
entire project when it receives `SIGTERM` or `SIGINT`. Use `exec` for a single
development command so signals reach it directly:

```sh
#!/bin/sh
set -eu

exec pnpm dev
```

Do not daemonize the project or leave child processes running after the script
exits. Regalator stops the current process group before switching branches.

### Readiness check

After the startup script runs, Regalator waits for the configured healthcheck
before completing a branch switch. Any HTTP response counts as ready. Requests
time out after one second and are retried for up to 30 seconds.

Choose an endpoint that responds only when the application and its required
dependencies are usable.

## Public access and embedding

Regalator serves its complete application from one local port, `3000` by
default. Expose that port through the public HTTPS reverse proxy or tunnel of
your choice. Regalator does not install or configure that infrastructure.

Add the embed script to the managed website, preferably near the end of
`<body>`:

```html
<script src="https://regalator.example.com/embed.js" async></script>
```

The browser must be able to reach the configured public URL. The managed
website's Content Security Policy must allow the Regalator script and iframe
origin. Expose Regalator only to trusted users because its API can switch
branches and start coding agents.

## GitHub and Notion

The setup command prints instructions and URLs derived from the configured
public origin.

Create a fine-grained GitHub personal access token for the managed repository:

1. Select the repository owner as the resource owner.
2. Grant access only to the managed repository.
3. Grant `Contents: Read and write`.
4. Add the token as `GITHUB_PAT` in `.regalator/.env`.

The `origin` remote may use a GitHub HTTPS URL or a standard GitHub SSH URL.
Regalator pushes through HTTPS without changing the repository configuration.

Create a Notion OAuth integration and register:

```text
https://regalator.example.com/api/notion/oauth/callback
```

Add `NOTION_CLIENT_ID` and `NOTION_CLIENT_SECRET` to `.regalator/.env`. Start
Regalator and open the authorization URL that it prints. The resulting access
token is stored under `.regalator/state/`.

Configure the Notion kanban automation to send its webhook to:

```text
https://regalator.example.com/api/notion/webhook
```

The payload must provide the ticket page ID and URL as `data.id` and `data.url`.
A duplicate trigger is ignored while an agent run for the same ticket is
pending or running.

Notion agent runs use `main` as their default base branch. Change it in the
Regalator settings interface. Temporary worktrees default to the sibling
directory `<project>-worktrees`; an absolute override can be stored as
`worktreesPath` in `.regalator/config.json`.

## Branch lifecycle

When a branch is selected, Regalator:

1. verifies that the managed scripts exist on the target branch;
2. stops the current project;
3. checks out the selected branch;
4. runs the checkout hook;
5. starts the managed project;
6. waits for the healthcheck;
7. reports that the branch is ready.

If preparation or startup fails, Regalator restores and restarts the previous
branch. Pulling a branch follows the same stop, prepare, start, and readiness
sequence. If the pull fails, the unchanged project is restarted.

## Develop Regalator

Install dependencies and run the complete validation suite:

```sh
bun install
bun run check-types
bun test
bun run build
```

To exercise the unpublished CLI against a test repository, build the frontend
once and invoke the source entrypoint from that repository:

```sh
bun /absolute/path/to/regalator/packages/cli/src/index.ts setup
bun /absolute/path/to/regalator/packages/cli/src/index.ts start
```

Build a publishable package archive with:

```sh
cd packages/cli
bun pm pack
```
