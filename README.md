# Regalator

Regalator runs a web project, switches its Git branch, and turns Notion tickets
into coding-agent branches.

## Requirements

- [Bun](https://bun.sh/) 1.3.5 or later;
- a Git repository with a GitHub `origin`;
- a healthcheck URL for the managed project;
- a public HTTPS URL routed to Regalator's local port through Caddy or an
  equivalent reverse proxy.

The public URL must work before setup so Notion can reach the temporary OAuth
callback server.

## Setup

Run the CLI from anywhere inside the Git repository that Regalator should
manage:

```sh
bunx \
  --package https://github.com/KTrevis/regalator/releases/latest/download/regalator-cli.tgz \
  regalator setup
```

The CLI guides the complete GitHub and Notion setup and creates `.regalator/`.
It is safe to run again and does not overwrite existing project files.

Complete the two generated scripts:

- `.regalator/checkout-hook.sh` prepares the selected branch and must finish;
- `.regalator/startup.sh` starts the managed project and must stay in the
  foreground.

For example:

```sh
# .regalator/checkout-hook.sh
#!/bin/sh
set -eu

bun install --frozen-lockfile
bun run db:migrate
```

```sh
# .regalator/startup.sh
#!/bin/sh
set -eu

exec bun run dev
```

Commit `.regalator/config.json` and both scripts to every branch Regalator can
select. `.regalator/.env` and `.regalator/state/` contain local secrets and
state and remain ignored.

## Start

```sh
bunx \
  --package https://github.com/KTrevis/regalator/releases/latest/download/regalator-cli.tgz \
  regalator start
```

Regalator serves the interface, `embed.js`, and `/api` from one port, `3000` by
default. It also starts the managed project and waits for its configured
healthcheck.

## Embed Regalator

Add the script to the managed website, preferably near the end of `<body>`:

```html
<script src="https://regalator.example.com/embed.js" async></script>
```

Replace the origin with the public URL entered during setup. The website's
Content Security Policy must allow the Regalator script and iframe origin.
Expose Regalator only to trusted users because it can switch branches and
start coding agents.

## Notion automation

In the Notion ticket database:

1. Open **Automations** and create the desired trigger, such as a status change.
2. Add a **Send webhook** action.
3. Use the URL printed by setup:

   ```text
   https://regalator.example.com/api/notion/webhook
   ```

4. Ensure the payload contains the ticket page ID and URL as `data.id` and
   `data.url`.

The ticket must be accessible to the Notion integration authorized during
setup. Duplicate triggers are ignored while an agent is already pending or
running for the same ticket. The default base branch and worktree directory can
be changed in the Regalator settings interface.

See [Notion webhook actions](https://www.notion.com/help/webhook-actions) for
the Notion interface instructions.

## Development

```sh
bun install
bun run check-types
bun test
bun run build
```

Run the unpublished CLI against another repository with:

```sh
bun /absolute/path/to/regalator/packages/cli/src/index.ts setup
bun /absolute/path/to/regalator/packages/cli/src/index.ts start
```

## Release

Pushing a new `v*` tag runs the release workflow and publishes
`regalator-cli.tgz` with its SHA-256 checksum:

```sh
git switch main
git pull --ff-only
git tag v0.6
git push origin v0.6
```

Use a new tag for every attempt. A rerun uses the workflow from the original
tagged commit, not newer changes on `main`.
