#!/usr/bin/env bun
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { LOCALES, LOCALE_NAMES } from "../config/locale";

const DEFAULT_LOCALE = "en";
const PAGES_DIR = path.join(import.meta.dir, "..", "pages");

if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY environment variable is not set");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getLanguageName(code: string): string {
  return LOCALE_NAMES.find((l) => l.code === code)?.name ?? code;
}

function parseFrontmatterVersion(content: string): number {
  const match = content.match(/^---[\s\S]*?^version:\s*(\d+)/m);
  return match ? parseInt(match[1], 10) : 0;
}

async function translateFile(
  pageName: string,
  targetLocale: string,
): Promise<void> {
  const sourcePath = path.join(PAGES_DIR, DEFAULT_LOCALE, `${pageName}.md`);
  const targetDir = path.join(PAGES_DIR, targetLocale);
  const targetPath = path.join(targetDir, `${pageName}.md`);

  const sourceContent = fs.readFileSync(sourcePath, "utf8");
  const sourceVersion = parseFrontmatterVersion(sourceContent);

  // Skip if target already exists at the same version
  if (fs.existsSync(targetPath)) {
    const targetVersion = parseFrontmatterVersion(
      fs.readFileSync(targetPath, "utf8"),
    );
    if (sourceVersion > 0 && targetVersion >= sourceVersion) {
      console.log(
        `  Skipping ${pageName} → ${targetLocale} (up to date at v${targetVersion})`,
      );
      return;
    }
  }

  const languageName = getLanguageName(targetLocale);
  console.log(`  Translating ${pageName} → ${targetLocale} (${languageName})`);

  const prompt = `Translate the following markdown page from English to ${languageName}.

Rules:
1. Preserve all YAML frontmatter keys exactly as-is (title:, header:, description:, legend:, version:)
2. Translate the frontmatter values (the text after each colon)
3. Preserve markdown heading markers (# and ##) exactly — only translate the heading text
4. Translate all paragraph and list text
5. Do not wrap the output in markdown code fences
6. Output only the translated markdown file, nothing else

${sourceContent}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a professional translator. Output only the translated content with no additional commentary.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  });

  let translated = response.choices[0].message.content?.trim() ?? "";

  // Strip any accidental code fences the model may have added
  translated = translated
    .replace(/^```(?:markdown)?\n/, "")
    .replace(/\n```$/, "");

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetPath, translated, "utf8");
  console.log(`  ✅ Written: ${path.relative(PAGES_DIR, targetPath)}`);
}

async function main() {
  const sourceDir = path.join(PAGES_DIR, DEFAULT_LOCALE);
  const pageName = (name: string) => name.replace(/\.md$/, "");
  const pageNames = fs
    .readdirSync(sourceDir)
    .filter((f) => f.endsWith(".md"))
    .map(pageName);

  const targetLocales = LOCALES.filter((l) => l !== DEFAULT_LOCALE);

  console.log(
    `Found ${pageNames.length} pages, translating to ${targetLocales.length} locales...`,
  );

  for (const page of pageNames) {
    console.log(`\nPage: ${page}`);
    for (const locale of targetLocales) {
      await translateFile(page, locale);
    }
  }

  console.log("\n✅ Translation complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
