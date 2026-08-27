import { expect, mock, test } from "bun:test";

const events: string[] = [];
let currentRef = "main";

mock.module("../src/config", () => ({
  CONFIG: { repoPath: "/repository" },
}));

mock.module("../src/utils/git/getCurrentRef", () => ({
  getCurrentRef: async () => {
    events.push(`get-ref:${currentRef}`);
    return currentRef;
  },
}));

mock.module("../src/utils/git/switchBranch", () => ({
  switchBranch: async (_repositoryPath: string, ref: string) => {
    events.push(`checkout:${ref}`);
    currentRef = ref;
  },
}));

mock.module("../src/managed-project/managed-project-scripts", () => ({
  assertManagedProjectScriptsExist: async () => {
    events.push(`check-scripts:${currentRef}`);
    if (currentRef === "legacy") throw new Error("Scripts are missing.");
  },
}));

mock.module("../src/managed-project/checkout-hook", () => ({
  runCheckoutHook: async () => events.push(`hook:${currentRef}`),
}));

mock.module("../src/managed-project/managed-process", () => ({
  spawnManagedProject: () => {
    events.push(`start:${currentRef}`);
    return { ref: currentRef };
  },
  stopManagedProjectProcess: async (process?: { ref: string }) => {
    events.push(`stop:${process?.ref ?? "none"}`);
  },
  waitForManagedProjectReady: async () => events.push(`ready:${currentRef}`),
}));

const { startManagedProject, stopManagedProject, switchManagedProjectBranch } =
  await import("../src/managed-project/managed-project.service");

test("restores and keeps the previous branch running when scripts are missing", async () => {
  await startManagedProject();
  events.length = 0;

  await expect(switchManagedProjectBranch("legacy")).rejects.toThrow(
    "Failed to switch to legacy; restored main.",
  );

  expect(events).toEqual([
    "get-ref:main",
    "stop:main",
    "checkout:legacy",
    "check-scripts:legacy",
    "stop:none",
    "checkout:main",
    "check-scripts:main",
    "hook:main",
    "start:main",
    "ready:main",
  ]);

  events.length = 0;
  await stopManagedProject();
  expect(events).toEqual(["stop:main"]);
});
