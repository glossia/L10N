const updated = new Date().toISOString().slice(0, 10);

export default {
  title: "L10N.md Standard",
  description:
    "A small, versioned standard for translation-context documents and their JSON Schemas.",
  url: process.env.SITE_URL || "https://l10n.glossia.dev",
  repo: "https://github.com/glossia/l10n",
  spec: {
    name: "L10N.md",
    subtitle: "A convention for repository-resident translation context",
    status: "Stable",
    version: "1",
    updated,
    license: "MIT",
    copyright: "2026 Glossia",
  },
};
