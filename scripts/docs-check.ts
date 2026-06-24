#!/usr/bin/env npx tsx
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const DOCS_ROOT = path.join(process.cwd(), "docs");
const LOCALES = ["en", "de", "fr", "es", "it", "pt-BR", "ru"] as const;
const SOURCE_LOCALE = "en";

function listMarkdownFiles(dir: string, base = dir): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listMarkdownFiles(full, base);
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
      return [path.relative(base, full)];
    }
    return [];
  });
}

function extractLinks(content: string): string[] {
  const links: string[] = [];
  const mdLink = /\[[^\]]*\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = mdLink.exec(content)) !== null) {
    links.push(match[1]);
  }
  return links;
}

function assertLocaleParity(): void {
  const sourceDir = path.join(DOCS_ROOT, SOURCE_LOCALE);
  const sourceFiles = listMarkdownFiles(sourceDir).sort();
  assert.ok(sourceFiles.length > 0, "English docs must exist");

  for (const locale of LOCALES) {
    if (locale === SOURCE_LOCALE) continue;
    const localeDir = path.join(DOCS_ROOT, locale);
    assert.ok(fs.existsSync(localeDir), `Missing docs locale folder: ${locale}`);
    const localeFiles = listMarkdownFiles(localeDir).sort();
    assert.deepEqual(
      localeFiles,
      sourceFiles,
      `${locale} docs file list must match ${SOURCE_LOCALE}`,
    );
  }
}

function assertInternalLinks(): void {
  for (const locale of LOCALES) {
    const localeDir = path.join(DOCS_ROOT, locale);
    for (const relFile of listMarkdownFiles(localeDir)) {
      const filePath = path.join(localeDir, relFile);
      const content = fs.readFileSync(filePath, "utf8");
      const fileDir = path.dirname(filePath);

      for (const link of extractLinks(content)) {
        if (
          link.startsWith("http") ||
          link.startsWith("mailto:") ||
          link.startsWith("#")
        ) {
          continue;
        }

        const [linkPath] = link.split("#");
        if (!linkPath || linkPath.startsWith("/")) continue;

        const target = path.resolve(fileDir, linkPath);
        assert.ok(
          fs.existsSync(target),
          `Broken link in ${locale}/${relFile}: ${link} → ${target}`,
        );
      }
    }
  }
}

function assertHubLinks(): void {
  const hub = path.join(DOCS_ROOT, "README.md");
  assert.ok(fs.existsSync(hub), "docs/README.md hub must exist");
  for (const locale of LOCALES) {
    const indexPath = path.join(DOCS_ROOT, locale, "README.md");
    assert.ok(fs.existsSync(indexPath), `Missing ${locale}/README.md`);
  }
}

assertLocaleParity();
assertInternalLinks();
assertHubLinks();

console.log(
  `docs-check passed: ${LOCALES.length} locales, ${listMarkdownFiles(path.join(DOCS_ROOT, SOURCE_LOCALE)).length} files each`,
);
