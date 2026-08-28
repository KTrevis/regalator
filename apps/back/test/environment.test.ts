import { afterEach, expect, test } from "bun:test";
import { environment } from "../src/environment";

const testedVariables = [
  "DATABASE_URL",
  "GITHUB_PAT",
  "PORT",
  "REGALATOR_PROJECT_PATH",
  "REGALATOR_PUBLIC_URL",
] as const;
const originalValues = Object.fromEntries(
  testedVariables.map((name) => [name, environment.all[name]]),
);

afterEach(() => {
  for (const name of testedVariables) {
    const originalValue = originalValues[name];

    if (originalValue === undefined) {
      delete environment.all[name];
    } else {
      environment.all[name] = originalValue;
    }
  }
});

test("requires the managed project path when it is accessed", () => {
  delete environment.all["REGALATOR_PROJECT_PATH"];

  expect(() => environment.projectPath).toThrow(
    "REGALATOR_PROJECT_PATH is required.",
  );
});

test("provides defaults without requiring unrelated variables", () => {
  delete environment.all["DATABASE_URL"];
  delete environment.all["PORT"];
  delete environment.all["REGALATOR_PUBLIC_URL"];

  expect(environment.databaseUrl).toBe("file:./dev.db");
  expect(environment.port).toBe(3000);
  expect(environment.publicUrl).toBe("http://localhost:3000");
});

test("rejects an invalid port", () => {
  environment.all["PORT"] = "invalid";

  expect(() => environment.port).toThrow(
    "PORT must be an integer between 1 and 65535.",
  );
});

test("exposes the GitHub PAT without logging or transforming it", () => {
  environment.all["GITHUB_PAT"] = "github-token";

  expect(environment.githubPat).toBe("github-token");
});
