import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

async function readText(relativePath) {
  return fs.readFile(path.join(rootDir, relativePath), "utf8");
}

async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

export default async function () {
  return {
    standard: await readText("L10N.md"),
    examples: {
      scoped: await readText("examples/app/L10N.md"),
      es: await readText("examples/app/L10N/es.md"),
      ja: await readText("examples/app/L10N/ja.md"),
    },
    schemas: {
      entry: await readJson("schemas/v1/l10n-document.schema.json"),
      global: await readJson("schemas/v1/global-document.schema.json"),
      scoped: await readJson("schemas/v1/scoped-document.schema.json"),
      locale: await readJson("schemas/v1/locale-overlay.schema.json"),
    },
  };
}
