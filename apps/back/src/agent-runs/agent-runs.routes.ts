import { Elysia } from "elysia";
import { prisma } from "../lib/prisma";

export const AGENT_RUNS_ROUTES = new Elysia({ prefix: "/agent-runs" }).get(
  "/",
  () =>
    prisma.agentRun.findMany({
      orderBy: { updatedAt: "desc" },
    }),
);
