import type { PlaceholderField } from "./types";

/**
 * Extracts unique placeholder fields from a template HTML string.
 * Placeholder format: {{key|Label}} or {{key|Label|type}}
 * Supported types: text (default), date, textarea
 */
export function extractPlaceholders(html: string): PlaceholderField[] {
  const regex = /\{\{(\w+)\|([^|}]+)(?:\|(\w+))?\}\}/g;
  const seen = new Set<string>();
  const fields: PlaceholderField[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const key = match[1];
    if (seen.has(key)) continue;
    seen.add(key);

    const label = match[2];
    const rawType = match[3] ?? "text";
    const type = (
      ["text", "date", "textarea"].includes(rawType) ? rawType : "text"
    ) as PlaceholderField["type"];

    fields.push({ key, label, type });
  }

  return fields;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatToday(): string {
  return new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Replaces all placeholder tokens in the template HTML with the provided values.
 */
export function renderTemplate(
  html: string,
  values: Record<string, string>
): string {
  return html
    .replace(/\{\{TODAY\}\}/g, formatToday())
    .replace(
    /\{\{(\w+)\|([^|}]+)(?:\|\w+)?\}\}/g,
    (_match, key: string, label: string) => {
      const val = values[key];
      if (!val) return `<span class="placeholder-empty">[${escapeHtml(label)}]</span>`;
      return escapeHtml(val).replace(/\n/g, "<br/>");
    }
  );
}
