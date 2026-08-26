import { z } from "zod";

export const switchBranchSchema = z.object({
  branch: z
    .string()
    .trim()
    .min(1, "Branch is required")
    .max(255, "Branch name is too long"),
});

export type SwitchBranchInput = z.infer<typeof switchBranchSchema>;
