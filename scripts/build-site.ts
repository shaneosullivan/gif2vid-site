import { parse } from "node-html-parser";
import { readdir, readFile, writeFile, unlink, mkdir } from "fs/promises";
import { join, basename } from "path";
import { existsSync } from "fs";
import * as prettier from "prettier";
import * as esbuild from "esbuild";
import { LOCALE_NAMES } from "../config/locale";

const ROOT = join(import.meta.dir, "..");
const PAGES_DIR = join(ROOT, "i18n", "pages");
const TEMPLATE_PATH = join(ROOT, "index.html");
const BASE_URL = "https://gif2vid.com";

interface Frontmatter {
  title: string;
  header: string;
  description: string;
}

interface Subsection {
  title: string;
  content: string;
}

interface Section {
  title: string;
  intro: string;
  subsections: Subsection[];
}

function parseFrontmatter(content: string): {
  frontmatter: Frontmatter;
  body: string;
} {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("No frontmatter block found");

  const frontmatter: Partial<Frontmatter> = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim() as keyof Frontmatter;
    const value = line
      .slice(colonIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    frontmatter[key] = value;
  }

  return { frontmatter: frontmatter as Frontmatter, body: match[2] };
}

function parseBody(body: string): Section[] {
  const sections: Section[] = [];
  const lines = body.split("\n");

  let currentSection: Section | null = null;
  let currentSubsection: Subsection | null = null;
  let buffer: string[] = [];

  for (const line of lines) {
    if (line.startsWith("# ") && !line.startsWith("## ")) {
      if (currentSubsection) {
        currentSubsection.content = buffer.join("\n").trim();
        buffer = [];
        currentSubsection = null;
      } else if (currentSection) {
        currentSection.intro = buffer.join("\n").trim();
        buffer = [];
      }
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: line.slice(2).trim(),
        intro: "",
        subsections: [],
      };
    } else if (line.startsWith("## ") && !line.startsWith("### ")) {
      if (currentSubsection) {
        currentSubsection.content = buffer.join("\n").trim();
        buffer = [];
      } else if (currentSection) {
        currentSection.intro = buffer.join("\n").trim();
        buffer = [];
      }
      currentSubsection = { title: line.slice(3).trim(), content: "" };
      currentSection?.subsections.push(currentSubsection);
    } else {
      buffer.push(line);
    }
  }

  if (currentSubsection) {
    currentSubsection.content = buffer.join("\n").trim();
  } else if (currentSection) {
    currentSection.intro = buffer.join("\n").trim();
  }
  if (currentSection) sections.push(currentSection);

  return sections;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPageContent(sections: Section[]): string {
  return sections
    .map((section, i) => {
      const parts: string[] = [];

      if (i > 0) parts.push("<hr>");

      parts.push(`<h2 class="why-heading">${escapeHtml(section.title)}</h2>`);

      if (section.intro) {
        parts.push(`<p class="subtitle">${escapeHtml(section.intro)}</p>`);
      }

      if (section.subsections.length > 0) {
        parts.push(`<dl class="faq-list">`);
        for (const sub of section.subsections) {
          parts.push(`  <dt>${escapeHtml(sub.title)}</dt>`);
          parts.push(`  <dd>${escapeHtml(sub.content)}</dd>`);
        }
        parts.push(`</dl>`);
      }

      return parts.join("\n");
    })
    .join("\n");
}

function pageUrl(locale: string, pageName: string): string {
  const isIndex = pageName === "index";

  if (pageName.indexOf(".html") < 0) {
    pageName += ".html";
  }

  if (locale === "en") {
    return isIndex ? "/" : `/${pageName}`;
  }
  return isIndex ? `/${locale}/` : `/${locale}/${pageName}`;
}

function renderLocaleLinks(currentLocale: string, pageName: string): string {
  return LOCALE_NAMES.map(({ code, name }) => {
    const url = pageUrl(code, pageName);
    const isCurrent = code === currentLocale;
    return `<a href="${url}" class="locale-link${isCurrent ? " locale-link--current" : ""}"${isCurrent ? ' aria-current="true"' : ""}>
  <img src="/images/locale/${code}.png" alt="${escapeHtml(name)}" class="locale-flag" width="32" height="24" />
  <span class="locale-name">${escapeHtml(name)}</span>
</a>`;
  }).join("\n");
}

const STRINGS_PLACEHOLDER =
  'const strings: Record<string, string> = {}; // BUILD SCRIPT REPLACE';

async function loadLocaleStrings(
  locale: string,
): Promise<Record<string, string>> {
  const stringsPath = join(ROOT, "i18n", "strings", locale, "common.json");
  if (!existsSync(stringsPath)) return {};
  return JSON.parse(await readFile(stringsPath, "utf-8"));
}

async function buildLocaleJs(
  locale: string,
  strings: Record<string, string>,
): Promise<string> {
  if (Object.keys(strings).length === 0) return "/dist/main.js";

  const mainTs = await readFile(join(ROOT, "main.ts"), "utf-8");
  const stringsJson = JSON.stringify(strings);
  const localeTs = mainTs.replace(
    STRINGS_PLACEHOLDER,
    `const strings: Record<string, string> = ${stringsJson}; // BUILD SCRIPT REPLACE`,
  );

  const tsTempPath = join(ROOT, "dist", `main.${locale}.ts`);
  const jsOutPath = join(ROOT, "dist", `main.${locale}.js`);

  await writeFile(tsTempPath, localeTs, "utf-8");

  await esbuild.build({
    entryPoints: [tsTempPath],
    bundle: true,
    outfile: jsOutPath,
    format: "esm",
  });

  await unlink(tsTempPath);
  console.log(`Built: dist/main.${locale}.js`);
  return `/dist/main.${locale}.js`;
}

async function buildPage(
  mdPath: string,
  templateHtml: string,
  locale: string,
  mainJsFile: string = "/dist/main.js",
  strings: Record<string, string> = {},
): Promise<{ outputPath: string; url: string; html: string }> {
  const mdContent = await readFile(mdPath, "utf-8");
  const { frontmatter, body } = parseFrontmatter(mdContent);
  const sections = parseBody(body);
  const pageContent = renderPageContent(sections);

  const name = basename(mdPath, ".md");
  const isIndex = name === "index";
  const isEnglish = locale === "en";

  const outputDir = isEnglish ? ROOT : join(ROOT, locale);
  const outputFilename = isIndex ? "index.html" : `${name}.html`;
  const outputPath = join(outputDir, outputFilename);

  const url = isEnglish
    ? isIndex
      ? `${BASE_URL}/`
      : `${BASE_URL}/${name}`
    : isIndex
      ? `${BASE_URL}/${locale}/`
      : `${BASE_URL}/${locale}/${name}`;

  const root = parse(templateHtml);

  // Language attribute
  root.querySelector("html")?.setAttribute("lang", locale);

  // Locale switcher
  const localesEl = root.querySelector("#locales");
  if (localesEl) localesEl.innerHTML = renderLocaleLinks(locale, name);

  // 4 content nodes
  root.querySelector("#title")?.set_content(frontmatter.title);
  root.querySelector("#header")?.set_content(frontmatter.header);
  root.querySelector("#description")?.set_content(frontmatter.description);
  const pageContentEl = root.querySelector("#page-content");
  if (pageContentEl) pageContentEl.innerHTML = pageContent;

  // Meta tags
  root
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", frontmatter.description);
  root
    .querySelector('meta[property="og:title"]')
    ?.setAttribute("content", frontmatter.title);
  root
    .querySelector('meta[property="og:description"]')
    ?.setAttribute("content", frontmatter.description);
  root.querySelector('meta[property="og:url"]')?.setAttribute("content", url);
  root
    .querySelector('meta[property="twitter:title"]')
    ?.setAttribute("content", frontmatter.title);
  root
    .querySelector('meta[property="twitter:description"]')
    ?.setAttribute("content", frontmatter.description);
  root
    .querySelector('meta[property="twitter:url"]')
    ?.setAttribute("content", url);
  root.querySelector('link[rel="canonical"]')?.setAttribute("href", url);

  // Locale-specific JS bundle
  if (mainJsFile !== "/dist/main.js") {
    root
      .querySelector('script[src="/dist/main.js"]')
      ?.setAttribute("src", mainJsFile);
  }

  // Translate data-i18n nodes
  if (Object.keys(strings).length > 0) {
    for (const node of root.querySelectorAll("[data-i18n]")) {
      const key = node.textContent.trim();
      const translated = strings[key];
      if (translated) node.set_content(translated);
    }
  }

  const html = await prettier.format(root.toString(), { parser: "html" });

  return { outputPath, url, html };
}

async function updateSitemap(urls: string[]): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const entries = urls
    .map((url) => {
      const priority = url.endsWith("/") ? "1.0" : "0.8";
      return `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;

  await writeFile(join(ROOT, "sitemap.xml"), sitemap, "utf-8");
}

async function main() {
  const templateHtml = await readFile(TEMPLATE_PATH, "utf-8");

  // Discover locale directories under pages/
  const localeDirs = (await readdir(PAGES_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    // English first — its output becomes the root template for subsequent locales
    .sort((a, b) => (a === "en" ? -1 : b === "en" ? 1 : a.localeCompare(b)));

  const allUrls: string[] = [];

  // Load strings and build locale-specific JS bundles for all non-English locales
  const localeJsMap = new Map<string, string>();
  const localeStringsMap = new Map<string, Record<string, string>>();
  for (const locale of localeDirs) {
    const strings =
      locale === "en" ? {} : await loadLocaleStrings(locale);
    localeStringsMap.set(locale, strings);
    localeJsMap.set(
      locale,
      locale === "en" ? "/dist/main.js" : await buildLocaleJs(locale, strings),
    );
  }

  for (const locale of localeDirs) {
    const localeDir = join(PAGES_DIR, locale);
    const mdFiles = (await readdir(localeDir))
      .filter((f) => f.endsWith(".md"))
      .sort((a, b) => (a === "index.md" ? -1 : b === "index.md" ? 1 : 0));

    if (mdFiles.length === 0) continue;

    if (locale !== "en") {
      await mkdir(join(ROOT, locale), { recursive: true });
    }

    for (const mdFile of mdFiles) {
      const mdPath = join(localeDir, mdFile);
      const { outputPath, url, html } = await buildPage(
        mdPath,
        templateHtml,
        locale,
        localeJsMap.get(locale) ?? "/dist/main.js",
        localeStringsMap.get(locale) ?? {},
      );

      // Never delete the root index.html; always delete and recreate everything else
      const isRootIndex = outputPath === join(ROOT, "index.html");
      if (!isRootIndex && existsSync(outputPath)) {
        await unlink(outputPath);
      }

      await writeFile(outputPath, html, "utf-8");
      allUrls.push(url);
      console.log(`Built [${locale}]: ${outputPath.replace(ROOT + "/", "")}`);
    }
  }

  await updateSitemap(allUrls);
  console.log(`\nUpdated: sitemap.xml (${allUrls.length} URLs)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
