import { spawnSync } from "node:child_process";
import { root } from "./preservation-model.mjs";

const commands = [
  ["npm", ["run", "test:preservation:unit"]],
  ["npm", ["run", "test:preservation:property"]],
];

let failed = false;
for (const [command, args] of commands) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) failed = true;
}

if (!failed) {
  console.log("Preservation suite passed independently; intentional task 1 exploration checks were not invoked.");
}
process.exitCode = failed ? 1 : 0;
