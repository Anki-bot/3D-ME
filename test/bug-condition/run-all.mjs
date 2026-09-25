import { spawnSync } from "node:child_process";
import { root } from "./audit-model.mjs";

const commands = [
  ["npm", ["run", "test:bug:unit"]],
  ["npm", ["run", "test:bug:property"]],
  ["npm", ["run", "test:bug:navigation-source"]],
  ["npm", ["run", "test:bug:navigation-browser"]],
  ["npm", ["run", "test:bug:projects-source"]],
  ["npm", ["run", "test:bug:projects-browser"]],
  ["npm", ["run", "test:bug:browser"]],
];
let failed = false;
for (const [command, args] of commands) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", env: process.env });
  if (result.status !== 0) failed = true;
}
process.exitCode = failed ? 1 : 0;
