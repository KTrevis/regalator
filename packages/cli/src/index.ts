#!/usr/bin/env bun

import { createCli } from "./cli";

try {
  await createCli().parseAsync(Bun.argv);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
