#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const projectRoot = process.cwd();

const PACKAGE_NAME = "@rafsaw/rafsaw-ai-toolkit";
const BEGIN = "<!-- BEGIN @rafsaw/rafsaw-ai-toolkit -->";
const END = "<!-- END @rafsaw/rafsaw-ai-toolkit -->";

const manifestPath = path.join(
  projectRoot,
  ".claude",
  ".rafsaw-ai-toolkit-manifest.json",
);

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function writeText(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function copyFile(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function removeFileIfExists(filePath) {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath);
  }
}

function getPackageVersion() {
  const pkg = JSON.parse(readText(path.join(packageRoot, "package.json")));
  return pkg.version;
}

function assertNoSentinelInjection(content) {
  if (content.includes(BEGIN) || content.includes(END)) {
    throw new Error(
      "Refusing to install rules because delivered content contains sentinel markers.",
    );
  }
}

function applySentinelBlock(existing, blockContent) {
  assertNoSentinelInjection(blockContent);

  const block = `${BEGIN}\n${blockContent.trim()}\n${END}`;
  const start = existing.indexOf(BEGIN);
  const end = existing.indexOf(END);

  if ((start === -1 && end !== -1) || (start !== -1 && end === -1)) {
    throw new Error(
      "Broken sentinel block in CLAUDE.md. One marker exists without the other.",
    );
  }

  if (start !== -1 && end !== -1) {
    return `${existing.slice(0, start)}${block}${existing.slice(
      end + END.length,
    )}`;
  }

  return `${existing.trimEnd()}\n\n${block}\n`;
}

function removeSentinelBlock(existing) {
  const start = existing.indexOf(BEGIN);
  const end = existing.indexOf(END);

  if (start === -1 && end === -1) {
    return existing;
  }

  if ((start === -1 && end !== -1) || (start !== -1 && end === -1)) {
    throw new Error(
      "Broken sentinel block in CLAUDE.md. One marker exists without the other.",
    );
  }

  return `${existing.slice(0, start).trimEnd()}\n\n${existing
    .slice(end + END.length)
    .trimStart()}`;
}

function install() {
  const installedFiles = [];

  const skillSource = path.join(packageRoot, "skills", "rafsaw-code-review", "SKILL.md");
  const skillTarget = path.join(
    projectRoot,
    ".claude",
    "skills",
    "rafsaw-code-review",
    "SKILL.md",
  );
  copyFile(skillSource, skillTarget);
  installedFiles.push(path.relative(projectRoot, skillTarget));

  const promptSource = path.join(packageRoot, "prompts", "rafsaw-code-review.md");
  const promptTarget = path.join(
    projectRoot,
    ".claude",
    "prompts",
    "rafsaw-code-review.md",
  );
  copyFile(promptSource, promptTarget);
  installedFiles.push(path.relative(projectRoot, promptTarget));

  const evalSource = path.join(packageRoot, "evals", "promptfooconfig.yaml");
  const evalTarget = path.join(
    projectRoot,
    "evals",
    "rafsaw-ai-toolkit.promptfooconfig.yaml",
  );

  const evalContent = readText(evalSource).replace(
    "../prompts/rafsaw-code-review.md",
    "../.claude/prompts/rafsaw-code-review.md",
  );

  writeText(evalTarget, evalContent);
  installedFiles.push(path.relative(projectRoot, evalTarget));

  const rulesSource = path.join(packageRoot, "rules", "CLAUDE.md");
  const rules = readText(rulesSource);
  const rulesTarget = path.join(projectRoot, "CLAUDE.md");
  const existingRules = fs.existsSync(rulesTarget) ? readText(rulesTarget) : "";

  writeText(rulesTarget, applySentinelBlock(existingRules, rules));
  installedFiles.push(path.relative(projectRoot, rulesTarget));

  const manifest = {
    package: PACKAGE_NAME,
    version: getPackageVersion(),
    installedAt: new Date().toISOString(),
    files: installedFiles,
    rules: {
      file: "CLAUDE.md",
      begin: BEGIN,
      end: END,
    },
  };

  writeText(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`Installed ${PACKAGE_NAME}`);
  console.log(`Version: ${manifest.version}`);
  console.log("Files:");
  for (const file of installedFiles) {
    console.log(`- ${file}`);
  }
}

function uninstall() {
  if (!fs.existsSync(manifestPath)) {
    console.log("No manifest found. Removing CLAUDE.md sentinel block if present.");

    const rulesTarget = path.join(projectRoot, "CLAUDE.md");
    if (fs.existsSync(rulesTarget)) {
      writeText(rulesTarget, removeSentinelBlock(readText(rulesTarget)));
    }

    return;
  }

  const manifest = JSON.parse(readText(manifestPath));

  for (const relativeFile of manifest.files ?? []) {
    if (relativeFile === "CLAUDE.md") {
      continue;
    }

    removeFileIfExists(path.join(projectRoot, relativeFile));
  }

  const rulesTarget = path.join(projectRoot, "CLAUDE.md");
  if (fs.existsSync(rulesTarget)) {
    writeText(rulesTarget, removeSentinelBlock(readText(rulesTarget)));
  }

  removeFileIfExists(manifestPath);

  console.log(`Uninstalled ${PACKAGE_NAME}`);
}

function status() {
  if (!fs.existsSync(manifestPath)) {
    console.log(`${PACKAGE_NAME} is not installed in this project.`);
    return;
  }

  const manifest = JSON.parse(readText(manifestPath));
  console.log(`${PACKAGE_NAME} is installed`);
  console.log(`Version: ${manifest.version}`);
  console.log("Files:");
  for (const file of manifest.files ?? []) {
    console.log(`- ${file}`);
  }
}

function help() {
  console.log(`
rafsaw-ai-toolkit

Usage:
  rafsaw-ai-toolkit install
  rafsaw-ai-toolkit status
  rafsaw-ai-toolkit uninstall
  rafsaw-ai-toolkit version

Commands:
  install    Copy shared AI artifacts into the current project
  status     Show installed toolkit version and managed files
  uninstall  Remove files previously installed by the toolkit
  version    Print the installed toolkit version
`);
}

const command = process.argv[2] ?? "help";

try {
  switch (command) {
    case "install":
      install();
      break;
    case "uninstall":
      uninstall();
      break;
    case "status":
      status();
      break;
    case "version":
      console.log(getPackageVersion());
      break;
    case "help":
    default:
      help();
      break;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}