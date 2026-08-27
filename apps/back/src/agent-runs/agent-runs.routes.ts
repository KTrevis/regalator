import { Elysia, t } from "elysia";
import { prisma } from "../lib/prisma";
import { isAgentRunActive } from "./agent-run-status";
import { startAgentRunFollowUp } from "./startAgentRunFollowUp";

export const AGENT_RUNS_ROUTES = new Elysia({ prefix: "/agent-runs" })
  .get("/", () =>
    prisma.agentRun.findMany({
      orderBy: { updatedAt: "desc" },
    }),
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      const agentRun = await prisma.agentRun.findUnique({
        where: { id: params.id },
        select: { status: true },
      });

      if (!agentRun) {
        set.status = 404;
        return { message: "Agent run not found." };
      }

      if (isAgentRunActive(agentRun.status)) {
        set.status = 409;
        return { message: "An active agent run cannot be deleted." };
      }

      await prisma.agentRun.delete({ where: { id: params.id } });
      return { deleted: true as const };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  )
  .post(
    "/:id/instructions",
    ({ params, body }) =>
      startAgentRunFollowUp(params.id, body.instruction, body.images),
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        instruction: t.String({ minLength: 1, maxLength: 10_000 }),
        images: t.Array(
          t.Object({
            mediaType: t.Union([
              t.Literal("image/jpeg"),
              t.Literal("image/png"),
              t.Literal("image/gif"),
              t.Literal("image/webp"),
            ]),
            data: t.String(),
          }),
          { maxItems: 5 },
        ),
      }),
    },
  );
