# Regalator

Regalator does not assume a package manager, runtime, database engine, or migration tool. The managed project defines its own preparation and startup scripts.

## Prerequisites

- [Bun](https://bun.sh/) 1.3.5 or later;
- a Git repository with the branches that Regalator should manage available locally or on the `origin` remote;
- a web project that can be started by a long-running shell script;
- a backend endpoint that Regalator can use as a readiness check;
- a public Regalator URL reachable by the managed website and, for the Notion integration, by Notion.

The managed repository should have a clean working tree before Regalator switches or pulls branches. Branches already checked out in another Git worktree are not available in the branch picker.

## Install Regalator

Install the dependencies and initialize the local database:

```sh
bun install
bun run --cwd apps/back db:push
```

Copy the backend environment template:

```sh
cp apps/back/.env.example apps/back/.env
```

## Configure the managed project

Add the managed project configuration to `apps/back/.env`:

```env
REGALATOR_BACKEND_URL=https://regalator.example.com
REGALATOR_PROJECT_PATH=/absolute/path/to/project
REGALATOR_CHECKOUT_HOOK=/absolute/path/to/project/scripts/regalator/checkout-hook.sh
REGALATOR_START_SCRIPT=/absolute/path/to/project/scripts/regalator/startup.sh
REGALATOR_PROJECT_HEALTHCHECK_URL=http://127.0.0.1:8080

# Optional. Defaults to <REGALATOR_PROJECT_PATH>-worktrees.
REGALATOR_WORKTREES_PATH=/absolute/path/to/project-worktrees
```

`REGALATOR_BACKEND_URL` is the public Regalator backend origin, including its protocol and without `/api` or a trailing slash.

`REGALATOR_PROJECT_PATH` is the absolute path to the Git repository that Regalator manages. The checkout hook and startup script live in that repository under `scripts/regalator/`.

The two scripts should be committed to every branch that can be selected in Regalator. A branch that does not contain them is rejected before checkout.

### Checkout hook

The checkout hook is a finite preparation script. Regalator runs it:

- when the managed project first starts;
- after every branch switch;
- after restoring the previous branch when a switch fails.

Use it for tasks such as installing dependencies, generating environment files, provisioning a branch-specific database, and running migrations.

Regalator executes the hook with `/bin/sh` from the repository root and exposes `REGALATOR_BRANCH_ID`, a stable 12-character identifier derived from the current branch name.

```sh
#!/bin/sh
set -eu

pnpm install --frozen-lockfile
./scripts/prepare-branch-database "$REGALATOR_BRANCH_ID"
pnpm db:migrate:deploy
```

The hook should be idempotent. It must exit successfully before Regalator starts the project and must complete within five minutes. If it fails during a branch switch, Regalator checks out and restarts the previous branch.

### Startup script

The startup script owns the long-running project process. It must stay in the foreground and shut the entire project down when it receives `SIGTERM` or `SIGINT`.

Use `exec` when the project has a single development command so that signals reach it directly:

```sh
#!/bin/sh
set -eu

exec pnpm dev
```

Do not daemonize the project or leave child processes running after the script exits. During a branch switch, Regalator stops the current process group before checking out the selected branch.

### Readiness check

After the startup script runs, Regalator waits for `REGALATOR_PROJECT_HEALTHCHECK_URL` to send a valid HTTP response before completing the branch switch request, which tells the Regalator frontend that the new branch is ready.

The current readiness check:

- considers any HTTP response successful, regardless of its status code;
- retries for up to 30 seconds;
- times out each individual request after one second.

Choose an endpoint that only starts responding once the application and its required dependencies are usable.

## Run Regalator

Start the backend and frontend from the repository root:

```sh
bun run dev
```

By default, the backend listens on `http://localhost:3000` and the frontend on `http://localhost:5173`. Make sure these ports do not conflict with the managed project. Set `PORT` for the Regalator backend if port 3000 is unavailable.

## Embed Regalator in the managed website

Add the following element to the managed website, ideally near the end of `<body>`:

```html
<script src="<REGALATOR_FRONTEND_URL>/embed.js" async></script>
```

Replace `<REGALATOR_FRONTEND_URL>` with the public origin that serves the Regalator frontend. The script injects a movable Regalator launcher and opens the interface in an iframe.

When embedding Regalator:

- the browser must be able to reach the URL that serves `embed.js`;
- an HTTPS website must load Regalator over HTTPS to avoid mixed-content blocking;
- the managed website's Content Security Policy must allow the Regalator script and iframe origins;
- Regalator should only be exposed to trusted users because its API can switch branches and start coding agents.

## Connect Notion

The Notion integration reads a ticket, creates a dedicated branch and Git worktree, runs the coding agent there, commits the result, and removes the worktree when the run completes.

Agent branches are pushed to the repository's `origin` remote over HTTPS before their worktrees are removed. Create a fine-grained GitHub personal access token with the following configuration:

1. Select the organization that owns the managed repository as the resource owner.
2. Under repository access, select only the managed repository.
3. Under repository permissions, grant `Contents: Read and write`.

Add the generated token to `apps/back/.env`:

```env
GITHUB_PAT=<fine-grained-personal-access-token>
```

The configured `origin` may use either a GitHub HTTPS URL or a standard GitHub SSH URL. Regalator uses an HTTPS URL for the push without modifying the repository's remote configuration.

### Expose Regalator

Notion must be able to reach `REGALATOR_BACKEND_URL`. Use a public hostname or the server IP, including its protocol and port when required:

```text
<REGALATOR_BACKEND_URL>/api/notion/webhook
```

Prefer HTTPS and restrict access to the server as much as the Notion integration allows. The webhook currently has no application-level authentication and starts an agent for every valid payload it receives.

### Create the Notion OAuth integration

1. Open [Notion integrations](https://www.notion.so/my-integrations) and create an OAuth integration.
2. Register this redirect URI:

   ```text
   <REGALATOR_BACKEND_URL>/api/notion/oauth/callback
   ```

3. Copy the integration credentials to `apps/back/.env`:

   ```env
   NOTION_CLIENT_ID=<notion-client-id>
   NOTION_CLIENT_SECRET=<notion-client-secret>
   ```

4. Start Regalator with `bun run dev`.
5. Open the Notion authorization URL printed by the Regalator backend.
6. Authorize the integration for the workspace and ensure it can access the kanban database and its tickets.

Regalator stores the resulting access token locally. Do not commit the token or `apps/back/.env`.

### Create the kanban automation

Choose a kanban status that starts the coding agent. A dedicated status such as `Ready for Regalator` is recommended because moving a ticket into it is an explicit action and avoids accidental runs.

In the Notion kanban database:

1. Create a new automation.
2. Use a status change as its trigger.
3. Configure it to run when a ticket enters the chosen trigger status.
4. Add a webhook action with this URL:

   ```text
   <REGALATOR_BACKEND_URL>/api/notion/webhook
   ```

5. Save and enable the automation.

The webhook payload must contain the ticket page ID and URL as `data.id` and `data.url`. Regalator ignores a duplicate trigger while an agent run for the same ticket is already pending or running.

### Select the base branch

Notion agent runs create a branch named `feature/notion-...` in a separate worktree. The default base branch is `main`; it can be changed from the Regalator settings interface to any existing local branch.

`REGALATOR_WORKTREES_PATH` controls where these temporary worktrees are created. Keep that directory outside the managed repository.

## Branch lifecycle

When a branch is selected in the embedded interface, Regalator:

1. verifies that the managed scripts exist on the target branch;
2. stops the current project with `SIGTERM`;
3. checks out the selected branch;
4. runs the checkout hook;
5. starts the managed project;
6. waits for `REGALATOR_PROJECT_HEALTHCHECK_URL`;
7. completes the UI request when the project is ready.

If preparation or startup fails, Regalator restores the previous branch and runs its hook, startup script, and readiness check again.

The pull button fetches and fast-forwards the current branch from `origin`. Regalator stops the project before pulling, then runs the checkout hook and starts the project again. If the pull fails, the unchanged project is restarted.
