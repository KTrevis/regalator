import { defineConfig } from "prisma/config";
import { environment } from "./src/environment";

export default defineConfig({
  datasource: {
    url: environment.databaseUrl,
  },
  schema: "prisma/schema",
});
