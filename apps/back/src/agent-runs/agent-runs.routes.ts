import { Elysia, t } from "elysia";
import { prisma } from "../lib/prisma";
import { startAgentRunFollowUp } from "./startAgentRunFollowUp";

export const AGENT_RUNS_ROUTES = new Elysia({ prefix: "/agent-runs" })
  .get("/", () =>
    prisma.agentRun.findMany({
      orderBy: { updatedAt: "desc" },
    }),
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
