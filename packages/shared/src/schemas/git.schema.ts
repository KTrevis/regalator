import { z } from "zod";

export const SWITCH_BRANCH_SCHEMA = z.object({
  branch: z
    .string()
    .trim()
    .min(1, "Branch is required")
    .max(255, "Branch name is too long"),
});

export type SwitchBranchInput = z.infer<typeof SWITCH_BRANCH_SCHEMA>;
