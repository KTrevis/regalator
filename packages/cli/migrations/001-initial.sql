CREATE TABLE "AgentRun" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "notionPageId" TEXT NOT NULL,
  "notionTitle" TEXT NOT NULL,
  "notionUrl" TEXT NOT NULL,
  "piSessionId" TEXT,
  "piSessionFile" TEXT,
  "branchName" TEXT NOT NULL,
  "worktreePath" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "output" TEXT,
  "error" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" DATETIME,
  "completedAt" DATETIME,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "AgentRun_notionPageId_key"
ON "AgentRun"("notionPageId");

CREATE TABLE "AppSettings" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
  "defaultBaseBranch" TEXT NOT NULL DEFAULT 'main',
  "updatedAt" DATETIME NOT NULL
);
