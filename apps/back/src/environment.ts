type EnvironmentVariableName =
  | "DATABASE_URL"
  | "GITHUB_PAT"
  | "NOTION_CLIENT_ID"
  | "NOTION_CLIENT_SECRET"
  | "PORT"
  | "REGALATOR_BACKEND_URL"
  | "REGALATOR_CHECKOUT_HOOK"
  | "REGALATOR_PROJECT_BACKEND_URL"
  | "REGALATOR_PROJECT_PATH"
  | "REGALATOR_START_SCRIPT"
  | "REGALATOR_WORKTREES_PATH";

function readEnvironmentVariable(name: EnvironmentVariableName) {
  return process.env[name];
}

function readTrimmedEnvironmentVariable(name: EnvironmentVariableName) {
  return readEnvironmentVariable(name)?.trim() || undefined;
}

function requireEnvironmentVariable(name: EnvironmentVariableName) {
  const value = readEnvironmentVariable(name);

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function getPort() {
  const value = readTrimmedEnvironmentVariable("PORT");
  const port = value ? Number(value) : 3000;

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return port;
}

export const environment = {
  get all() {
    return process.env;
  },
  get databaseUrl() {
    return readEnvironmentVariable("DATABASE_URL") ?? "file:./dev.db";
  },
  get githubPat() {
    return readEnvironmentVariable("GITHUB_PAT");
  },
  get notionClientId() {
    return readTrimmedEnvironmentVariable("NOTION_CLIENT_ID");
  },
  get notionClientSecret() {
    return readTrimmedEnvironmentVariable("NOTION_CLIENT_SECRET");
  },
  get port() {
    return getPort();
  },
  get projectBackendUrl() {
    return readEnvironmentVariable("REGALATOR_PROJECT_BACKEND_URL");
  },
  get projectCheckoutHook() {
    return readEnvironmentVariable("REGALATOR_CHECKOUT_HOOK");
  },
  get projectPath() {
    return requireEnvironmentVariable("REGALATOR_PROJECT_PATH");
  },
  get projectStartScript() {
    return readEnvironmentVariable("REGALATOR_START_SCRIPT");
  },
  get backendUrl() {
    return (
      readTrimmedEnvironmentVariable("REGALATOR_BACKEND_URL") ??
      `http://localhost:${getPort()}`
    );
  },
  get worktreesPath() {
    return readEnvironmentVariable("REGALATOR_WORKTREES_PATH");
  },
} as const;
