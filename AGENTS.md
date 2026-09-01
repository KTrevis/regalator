# Project conventions

- Use English for all source code, identifiers, comments, documentation, configuration descriptions, validation messages, and user-facing text.
- After every change, review the resulting diff and use the `$simplify` skill to simplify the touched code before considering the work complete.

# Releases

- The CLI package version is independent from the Git release tag.
- To publish a release, commit and push `main`, then create and push the next unused `v*` tag from that exact commit.
- The release workflow builds `regalator-cli.tgz`, generates its SHA-256 checksum, and attaches both files to the GitHub release.
- Never reuse a release tag after a failed workflow run. Fix the issue on `main`, then create a new tag.
