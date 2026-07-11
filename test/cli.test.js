import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const cliPath = path.join(repoRoot, "bin", "rafsaw-ai-toolkit.js");

function readPackageVersion() {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  );
  return pkg.version;
}

test("`version` command prints the package version from package.json", () => {
  const output = execFileSync(process.execPath, [cliPath, "version"], {
    encoding: "utf8",
  });
  assert.equal(output.trim(), readPackageVersion());
});
