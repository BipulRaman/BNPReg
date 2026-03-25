import { marked } from "marked";
import type { PlaceholderField } from "./types";

marked.setOptions({ async: false, breaks: true });

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
      ["text", "date", "textarea", "markdown"].includes(rawType) ? rawType : "text"
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
    /\{\{(\w+)\|([^|}]+)(?:\|(\w+))?\}\}/g,
    (_match, key: string, label: string, type?: string) => {
      const val = values[key];
      if (!val) return `<span class="placeholder-empty">[${escapeHtml(label)}]</span>`;
      if (type === "textarea" || type === "markdown") return marked.parse(val) as string;
      return escapeHtml(val);
    }
  );
}

/**
 * Post-processes rendered invoice HTML:
 * - Removes item rows where both item and amount are empty
 * - Renumbers remaining rows and applies alternating background
 * - Auto-calculates total from filled amounts
 * - Hides notes section if empty
 */
export function postProcessInvoice(
  html: string,
  values: Record<string, string>
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  // Remove empty item rows & renumber visible ones
  let visibleIndex = 0;
  for (let i = 1; i <= 5; i++) {
    const row = body.querySelector(`[data-invoice-row="${i}"]`) as HTMLElement | null;
    if (!row) continue;
    const hasItem = !!values[`item_${i}`];
    const hasAmount = !!values[`amount_${i}`];
    if (!hasItem && !hasAmount) {
      row.remove();
    } else {
      visibleIndex++;
      const cells = row.querySelectorAll("td");
      if (cells[0]) cells[0].textContent = String(visibleIndex);
      // Prefix amount with ₹
      if (cells[2] && hasAmount) {
        const raw = cells[2].textContent?.trim() ?? "";
        if (raw && !raw.startsWith("\u20B9")) {
          cells[2].textContent = `\u20B9 ${raw}`;
        }
      }
      row.style.background = visibleIndex % 2 === 0 ? "#f8f8f8" : "";
    }
  }

  // Auto-calculate total
  let total = 0;
  for (let i = 1; i <= 5; i++) {
    const val = values[`amount_${i}`];
    if (val) {
      const num = parseFloat(val.replace(/,/g, ""));
      if (!isNaN(num)) total += num;
    }
  }
  const totalSpan = body.querySelector("[data-invoice-total]");
  if (totalSpan) {
    totalSpan.textContent = total > 0
      ? `\u20B9 ${total.toLocaleString("en-IN")}`
      : "";
  }

  // Hide notes if empty
  const notesEl = body.querySelector("[data-invoice-notes]") as HTMLElement | null;
  if (notesEl && !values["notes"]) {
    notesEl.style.display = "none";
  }

  return body.innerHTML;
}
