import { z } from "zod";

const HTTP_URL_SCHEMA = z
  .url()
  .refine((value) => /^https?:\/\//.test(value), {
    error: "Must be an HTTP or HTTPS URL",
  });

export const PROJECT_CONFIG_SCHEMA = z.object({
  backendUrl: HTTP_URL_SCHEMA,
  projectHealthcheckUrl: HTTP_URL_SCHEMA,
  port: z.int().min(1).max(65_535).default(3000),
  worktreesPath: z.string().trim().min(1).optional(),
});

export type ProjectConfig = z.infer<typeof PROJECT_CONFIG_SCHEMA>;
