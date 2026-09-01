import { readFile } from "node:fs/promises";
import { getProjectFiles, SCRIPT_TEMPLATE_MARKER } from "../project-files";

export async function assertScriptTemplatesCompleted(repositoryPath: string) {
  const files = getProjectFiles(repositoryPath);
  const scripts = [
    { label: "checkout hook", path: files.checkoutHook },
    { label: "startup script", path: files.startupScript },
  ];
  const unconfiguredScripts: string[] = [];

  for (const script of scripts) {
    const content = await readFile(script.path, "utf8");
    if (content.includes(SCRIPT_TEMPLATE_MARKER)) {
      unconfiguredScripts.push(script.label);
    }
  }

  if (unconfiguredScripts.length > 0) {
    throw new Error(
      `Complete the generated managed project scripts before starting Regalator: ${unconfiguredScripts.join(", ")}.`,
    );
  }
}
