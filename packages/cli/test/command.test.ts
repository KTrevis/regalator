import { expect, mock, test } from "bun:test";
import { createCli } from "../src/cli";

test("registers the setup and start commands", () => {
  const commandNames = createCli().commands.map((command) => command.name());
  expect(commandNames).toEqual(["setup", "start"]);
});

test("dispatches commands through the CLI library", async () => {
  const setup = mock(async () => {});
  const start = mock(async () => {});
  const program = createCli({ setup, start });

  await program.parseAsync(["bun", "regalator", "setup"]);

  expect(setup).toHaveBeenCalledTimes(1);
  expect(start).not.toHaveBeenCalled();
});
