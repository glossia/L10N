import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const contentRoot = path.join(process.cwd(), "site", "_content", "v1");

const locales = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "ja", label: "日本語" },
];

async function loadLocale(locale) {
  const dir = path.join(contentRoot, locale);
  const entries = await fs.readdir(dir);
  const files = entries.filter((name) => name.endsWith(".md")).sort();
  const sections = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(dir, file), "utf8");
    const parsed = matter(raw);
    sections.push({
      ...parsed.data,
      body: parsed.content,
      file,
    });
  }
  return sections;
}

export default async function () {
  const byLocale = {};
  for (const { code } of locales) {
    byLocale[code] = await loadLocale(code);
  }
  return {
    version: "1",
    locales,
    byLocale,
  };
}
