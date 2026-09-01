import { CONFIG } from "./config";

type EnvironmentVariableName =
  | "DATABASE_URL"
  | "GITHUB_PAT"
  | "NOTION_ACCESS_TOKEN"
  | "NOTION_CLIENT_ID"
  | "NOTION_REFRESH_TOKEN"
  | "NOTION_CLIENT_SECRET"
  | "REGALATOR_WEB_ROOT";

function readEnvironmentVariable(name: EnvironmentVariableName) {
  return process.env[name];
}

function readTrimmedEnvironmentVariable(name: EnvironmentVariableName) {
  return readEnvironmentVariable(name)?.trim() || undefined;
}

export const environment = {
  get all() {
    return process.env;
  },
  get databaseUrl() {
    return (
      readEnvironmentVariable("DATABASE_URL") ??
      `file:${CONFIG.projectFiles.database}`
    );
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
  get notionAccessToken() {
    return readTrimmedEnvironmentVariable("NOTION_ACCESS_TOKEN");
  },
  get notionRefreshToken() {
    return readTrimmedEnvironmentVariable("NOTION_REFRESH_TOKEN");
  },
  get port() {
    return CONFIG.project.port;
  },
  get projectHealthcheckUrl() {
    return CONFIG.project.projectHealthcheckUrl;
  },
  get backendUrl() {
    return CONFIG.project.backendUrl;
  },
  get webRoot() {
    return readTrimmedEnvironmentVariable("REGALATOR_WEB_ROOT");
  },
} as const;
