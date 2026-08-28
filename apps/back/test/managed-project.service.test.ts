import { expect, mock, test } from "bun:test";

const events: string[] = [];
let currentRef = "main";
let pullFails = false;

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

mock.module("../src/utils/git/pullBranch", () => ({
  pullBranch: async () => {
    events.push(`pull:${currentRef}`);
    if (pullFails) throw new Error("Pull failed.");
    return currentRef;
  },
}));

mock.module("../src/managed-project/managed-project-scripts", () => ({
  assertManagedProjectScriptsExist: async () => {
    events.push(`check-scripts:${currentRef}`);
    if (currentRef === "broken") throw new Error("Preparation failed.");
  },
  assertManagedProjectScriptsExistOnBranch: async (
    _repositoryPath: string,
    branch: string,
  ) => {
    events.push(`check-branch-scripts:${branch}`);
    if (branch === "legacy") {
      throw new Error(
        'Branch "legacy" cannot be checked out because the following managed project scripts are missing: checkout hook, startup script.',
      );
    }
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
  stopManagedProjectProcess: async (
    process?: { ref: string },
    signal = "SIGTERM",
  ) => {
    events.push(`stop:${process?.ref ?? "none"}:${signal}`);
  },
  waitForManagedProjectReady: async () => events.push(`ready:${currentRef}`),
}));

const {
  pullManagedProjectBranch,
  startManagedProject,
  stopManagedProject,
  switchManagedProjectBranch,
} = await import("../src/managed-project/managed-project.service");

test("rejects a branch with missing managed project scripts before switching", async () => {
  await startManagedProject();
  events.length = 0;

  await expect(switchManagedProjectBranch("legacy")).rejects.toThrow(
    'Branch "legacy" cannot be checked out because the following managed project scripts are missing: checkout hook, startup script.',
  );

  expect(events).toEqual(["check-branch-scripts:legacy"]);
});

test("pulls the current branch and restarts the project", async () => {
  events.length = 0;

  await expect(pullManagedProjectBranch()).resolves.toBe("main");

  expect(events).toEqual([
    "get-ref:main",
    "stop:main:SIGTERM",
    "pull:main",
    "check-scripts:main",
    "hook:main",
    "start:main",
    "ready:main",
  ]);
});

test("restarts the project when pulling fails", async () => {
  events.length = 0;
  pullFails = true;

  try {
    await expect(pullManagedProjectBranch()).rejects.toThrow(
      "Failed to pull main; restarted main.",
    );
  } finally {
    pullFails = false;
  }

  expect(events).toEqual([
    "get-ref:main",
    "stop:main:SIGTERM",
    "pull:main",
    "check-scripts:main",
    "hook:main",
    "start:main",
    "ready:main",
  ]);
});

test("restores and keeps the previous branch running after preparation fails", async () => {
  events.length = 0;

  await expect(switchManagedProjectBranch("broken")).rejects.toThrow(
    "Failed to switch to broken; restored main.",
  );

  expect(events).toEqual([
    "check-branch-scripts:broken",
    "get-ref:main",
    "stop:main:SIGTERM",
    "checkout:broken",
    "check-scripts:broken",
    "stop:none:SIGTERM",
    "checkout:main",
    "check-scripts:main",
    "hook:main",
    "start:main",
    "ready:main",
  ]);

  events.length = 0;
  await stopManagedProject();
  expect(events).toEqual(["stop:main:SIGTERM"]);
});
