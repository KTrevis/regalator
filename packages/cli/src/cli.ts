import { Command } from "commander";
import packageJson from "../package.json" with { type: "json" };
import { runSetup } from "./setup-command";
import { runStart } from "./start-command";

type CliActions = {
  setup: (directory: string) => Promise<void>;
  start: (directory: string) => Promise<void>;
};

export function createCli(actions: CliActions = defaultActions) {
  const program = new Command()
    .name("regalator")
    .description("Install and run Regalator for a Git project")
    .version(packageJson.version)
    .showHelpAfterError();

  program
    .command("setup")
    .description("Configure Regalator for the current Git repository")
    .action(() => actions.setup(process.cwd()));

  program
    .command("start")
    .description("Initialize and start Regalator")
    .action(() => actions.start(process.cwd()));

  return program;
}

const defaultActions: CliActions = {
  setup: runSetup,
  start: runStart,
};
