import { CONFIG } from "../config";
import { prisma } from "../lib/prisma";
import { getBranches } from "../utils/git/getBranches";

const SETTINGS_ID = 1;

export async function getSettings() {
  return prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      defaultBaseBranch: CONFIG.defaultBaseBranch,
    },
    update: {},
  });
}

export async function getDefaultBaseBranch() {
  return (await getSettings()).defaultBaseBranch;
}

export async function updateDefaultBaseBranch(defaultBaseBranch: string) {
  const branches = await getBranches(CONFIG.repoPath);
  const branchExists = branches.some(
    ({ name, local }) => name === defaultBaseBranch && local,
  );

  if (!branchExists) {
    throw new Error("The default branch must be an existing local branch.");
  }

  return prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, defaultBaseBranch },
    update: { defaultBaseBranch },
  });
}
