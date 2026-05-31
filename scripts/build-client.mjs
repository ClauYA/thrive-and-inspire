// Builds the React client (client/dist) so the Express server can serve it.
//
// This runs automatically as the root `postinstall`, which is how the build
// happens on Hostinger: their Git deploy only runs `npm install` + starts the
// entry file — there is no separate "build command" field. Triggering the build
// from postinstall fills that gap.
//
// Guard: a nested `npm install` inside a lifecycle script re-fires the parent's
// postinstall, which would recurse forever. We set an env flag on the first run
// and bail out on any re-entry. Children inherit process.env, so the flag
// reliably propagates.
import { execSync } from "node:child_process";

if (process.env.TI_BUILDING) {
  process.exit(0); // already building higher up the stack — don't recurse
}
process.env.TI_BUILDING = "1";

const run = (cmd) =>
  execSync(cmd, { cwd: "client", stdio: "inherit", env: process.env });

// --include=dev forces Vite/Tailwind (client devDependencies) to install even
// when NODE_ENV=production, which Hostinger may set.
run("npm install --include=dev");
run("npm run build");

console.log("✅ client/dist built");
