import { resolve } from "node:path";

export function getPackageAssetPath(path: string) {
  if (import.meta.path.includes("/src/") && path === "web") {
    return resolve(import.meta.dir, "../../../apps/front/dist");
  }

  return resolve(import.meta.dir, "..", path);
}
