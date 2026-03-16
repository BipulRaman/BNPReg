import type { LetterTemplate } from "../docgen/types";

const htmlModules = import.meta.glob<string>("./templates/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
});

export function loadCardTemplates(): LetterTemplate[] {
  const templates: LetterTemplate[] = [];

  for (const [path, raw] of Object.entries(htmlModules)) {
    const metaMatch = raw.match(
      /<!--\s*template:\s*(\{[\s\S]*?\})\s*-->/
    );
    if (!metaMatch) {
      console.warn(`Skipping ${path}: no template metadata comment found.`);
      continue;
    }

    try {
      const meta: { id: string; name: string; title?: string } = JSON.parse(metaMatch[1]);
      const html = raw.replace(/<!--\s*template:[\s\S]*?-->\s*/, "");
      templates.push({ id: meta.id, name: meta.name, title: meta.title, html });
    } catch {
      console.warn(`Skipping ${path}: invalid template metadata JSON.`);
    }
  }

  return templates.sort((a, b) => a.name.localeCompare(b.name));
}
