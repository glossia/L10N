import { promises as fs } from "node:fs";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020.js";
import matter from "gray-matter";

const rootDir = process.cwd();
const schemaDir = path.join(rootDir, "schemas", "v1");
const skipDirectories = new Set([".git", "_site", "node_modules"]);

const schemaByKind = {
  global: "https://glossia.dev/schemas/l10n/v1/global-document.schema.json",
  scoped: "https://glossia.dev/schemas/l10n/v1/scoped-document.schema.json",
  locale: "https://glossia.dev/schemas/l10n/v1/locale-overlay.schema.json",
};

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (skipDirectories.has(entry.name)) return [];
        return walk(absolutePath);
      }

      return [absolutePath];
    })
  );

  return files.flat();
}

function classify(relativePath) {
  if (relativePath === "L10N.md") return "global";
  if (/^(?:.+\/)?L10N\/[^/]+\.md$/.test(relativePath)) return "locale";
  if (/^.+\/L10N\.md$/.test(relativePath)) return "scoped";
  return null;
}

function toValidatorInput(relativePath, parsed) {
  return {
    path: relativePath,
    ...parsed.data,
    body: parsed.content.trim(),
  };
}

function formatAjvErrors(errors = []) {
  return errors.map((error) => {
    const location = error.instancePath || "/";
    return `${location} ${error.message}`;
  });
}

async function loadSchemas(ajv) {
  const schemaFiles = [
    "shared.schema.json",
    "l10n-document.schema.json",
    "global-document.schema.json",
    "scoped-document.schema.json",
    "locale-overlay.schema.json",
  ];

  for (const fileName of schemaFiles) {
    const filePath = path.join(schemaDir, fileName);
    const schema = JSON.parse(await fs.readFile(filePath, "utf8"));
    ajv.addSchema(schema);
  }
}

async function main() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  await loadSchemas(ajv);

  const allFiles = await walk(rootDir);
  const l10nFiles = allFiles
    .map((absolutePath) => path.relative(rootDir, absolutePath))
    .filter((relativePath) => relativePath.endsWith(".md"))
    .map((relativePath) => ({ relativePath, kind: classify(relativePath) }))
    .filter((entry) => entry.kind);

  const failures = [];

  for (const { relativePath, kind } of l10nFiles) {
    const absolutePath = path.join(rootDir, relativePath);
    const raw = await fs.readFile(absolutePath, "utf8");
    const parsed = matter(raw);
    const input = toValidatorInput(relativePath, parsed);
    const validate = ajv.getSchema(schemaByKind[kind]);

    if (!validate) {
      failures.push({
        relativePath,
        problems: [`Missing validator for ${kind}`],
      });
      continue;
    }

    const valid = validate(input);
    const problems = valid ? [] : formatAjvErrors(validate.errors);

    if (kind === "locale" && input.locale) {
      const expectedLocale = path.basename(relativePath, ".md");
      if (input.locale !== expectedLocale) {
        problems.push(`Frontmatter locale must match file name "${expectedLocale}"`);
      }
    }

    if (problems.length > 0) {
      failures.push({ relativePath, problems });
    }
  }

  if (failures.length > 0) {
    console.error("L10N schema validation failed.\n");
    for (const failure of failures) {
      console.error(`${failure.relativePath}`);
      for (const problem of failure.problems) {
        console.error(`  - ${problem}`);
      }
      console.error("");
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${l10nFiles.length} L10N document(s) against schema v1.`);
}

await main();
