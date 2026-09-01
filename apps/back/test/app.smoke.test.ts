import { afterAll, expect, test } from "bun:test";
import { resolve } from "node:path";

process.env["REGALATOR_WEB_ROOT"] = resolve(
  import.meta.dir,
  "../../front/dist",
);

const { app } = await import("../src/app");
app.listen(0);

afterAll(async () => {
  await app.stop();
});

test("serves the application, embed script, and API from one origin", async () => {
  const origin = `http://127.0.0.1:${app.server?.port}`;
  const [indexResponse, embedResponse, healthResponse] = await Promise.all([
    fetch(`${origin}/`),
    fetch(`${origin}/embed.js`),
    fetch(`${origin}/api/health`),
  ]);

  expect(indexResponse.status).toBe(200);
  expect(await indexResponse.text()).toContain('<div id="root"></div>');
  expect(embedResponse.status).toBe(200);
  expect(await embedResponse.text()).toContain("data-regalator-frame");
  expect(await healthResponse.json()).toEqual({ status: "ok" });
});
