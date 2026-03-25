import { marked } from "marked";
import type { PlaceholderField, RowGroup } from "./types";

marked.setOptions({ async: false, breaks: true });

// ────────────────────────────────────────────────────────────
//  Extraction — used by the form to build input fields
// ────────────────────────────────────────────────────────────

/**
 * Extracts top-level placeholder fields from template HTML.
 * Fields inside <tpl-rows> are excluded — those are handled
 * by extractRowGroups() and rendered as dynamic row inputs.
 *
 * Placeholder format: {{key|Label}} or {{key|Label|type}}
 * Supported types: text (default), date, textarea, markdown
 */
export function extractPlaceholders(html: string): PlaceholderField[] {
  // Strip <tpl-rows> blocks so their fields don't appear as top-level
  const stripped = html.replace(/<tpl-rows\s+group="[^"]+"\s*>[\s\S]*?<\/tpl-rows>/gi, "");
  const regex = /\{\{(\w+)\|([^|}]+)(?:\|(\w+))?\}\}/g;
  const seen = new Set<string>();
  const fields: PlaceholderField[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(stripped)) !== null) {
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

/**
 * Extracts <tpl-rows> blocks from template HTML.
 * Returns each group's name and its template-row placeholder fields.
 * Used by the form to render dynamic add/remove row UI.
 */
export function extractRowGroups(html: string): RowGroup[] {
  const groups: RowGroup[] = [];
  const rgx = /<tpl-rows\s+group="([^"]+)"\s*>([\s\S]*?)<\/tpl-rows>/gi;
  let m: RegExpExecArray | null;
  while ((m = rgx.exec(html)) !== null) {
    const group = m[1];
    const content = m[2];
    const fields: RowGroup["fields"] = [];
    const fRgx = /\{\{(\w+)\|([^|}]+)(?:\|(\w+))?\}\}/g;
    let fm: RegExpExecArray | null;
    while ((fm = fRgx.exec(content)) !== null) {
      const rawType = fm[3] ?? "text";
      fields.push({
        key: fm[1],
        label: fm[2],
        type: (["text", "date", "textarea", "markdown"].includes(rawType) ? rawType : "text") as PlaceholderField["type"],
      });
    }
    groups.push({ group, fields });
  }
  return groups;
}

// ────────────────────────────────────────────────────────────
//  Helpers
// ────────────────────────────────────────────────────────────

/** Escapes HTML special characters to prevent XSS. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Returns today's date formatted as "25 March 2026" (en-IN long). */
function formatToday(): string {
  return new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Indian number-to-words conversion (supports up to Crore)
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
}

/** Converts a number to Indian-style words (Lakh, Crore). */
function numberToWords(n: number): string {
  if (n === 0) return "Zero";
  if (n < 0) return "Minus " + numberToWords(-n);
  n = Math.floor(n);
  const parts: string[] = [];
  if (n >= 1_00_00_000) { parts.push(numberToWords(Math.floor(n / 1_00_00_000)) + " Crore"); n %= 1_00_00_000; }
  if (n >= 1_00_000) { parts.push(twoDigits(Math.floor(n / 1_00_000)) + " Lakh"); n %= 1_00_000; }
  if (n >= 1_000) { parts.push(twoDigits(Math.floor(n / 1_000)) + " Thousand"); n %= 1_000; }
  if (n >= 100) { parts.push(ONES[Math.floor(n / 100)] + " Hundred"); n %= 100; }
  if (n > 0) parts.push(twoDigits(n));
  return parts.join(" ");
}

// ────────────────────────────────────────────────────────────
//  Rendering Pipeline (called in order)
// ────────────────────────────────────────────────────────────
//
//  1. preProcessTags()       — expands <tpl-rows>, <tpl-if>,
//                              <tpl-each>, <tpl-date>
//                              (creates/removes placeholders)
//
//  2. renderTemplate()       — replaces {{key|Label}} with values
//                              (text → escaped, textarea/markdown → marked)
//
//  3. postProcessTemplate()  — DOM-level processing:
//                              translateInlineTags() then row cleanup,
//                              currency, format, sum/count/words, page breaks
// ────────────────────────────────────────────────────────────

/**
 * Entry point for rendering. Calls preProcessTags() first to expand
 * block-level tags, then replaces all {{placeholder}} tokens with values.
 *
 * - {{TODAY}} → formatted date
 * - {{key|Label}} → escaped text value
 * - {{key|Label|textarea}} or |markdown → value run through marked (→ HTML)
 * - Empty values → <span class="placeholder-empty">[Label]</span>
 */
export function renderTemplate(
  html: string,
  values: Record<string, string>
): string {
  html = preProcessTags(html, values);
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
 * Post-processes rendered HTML via DOM manipulation.
 * Handles the 7 custom template tags (see TEMPLATE_TAGS.md for full reference).
 *
 * Tags are split into two phases:
 * - Block tags (tpl-if, tpl-each, tpl-rows, tpl-date) run in preProcessTags()
 * - Inline tags (tpl-n, tpl-val, tpl-sum) are translated to data-* attrs here,
 *   then processed via DOM queries below.
 */
export function postProcessTemplate(
  html: string,
): string {
  html = translateInlineTags(html);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;

  // ── Row groups: remove empty rows, renumber survivors, alternate stripe ──
  const groups = new Set<string>();
  body.querySelectorAll<HTMLElement>("[data-row-group]").forEach((el) => {
    const g = el.getAttribute("data-row-group");
    if (g) groups.add(g);
  });

  for (const group of groups) {
    const rows = Array.from(
      body.querySelectorAll<HTMLElement>(`[data-row-group="${group}"]`)
    );
    let visible = 0;
    for (const row of rows) {
      const hasEmpty = row.innerHTML.includes("placeholder-empty");
      const filledCells = Array.from(row.querySelectorAll("td")).filter(
        (td) => {
          const text = td.textContent?.trim() ?? "";
          return text !== "" && !td.querySelector(".placeholder-empty") && !td.hasAttribute("data-n");
        }
      );
      if (filledCells.length === 0 && hasEmpty) {
        row.remove();
      } else {
        visible++;
        const idx = row.querySelector<HTMLElement>("[data-n]");
        if (idx) idx.textContent = String(visible);
        row.style.background = visible % 2 === 0 ? "#f8f8f8" : "";
      }
    }
  }

  // ── Currency: add ₹ prefix to [data-currency] elements ──
  body.querySelectorAll<HTMLElement>("[data-currency]").forEach((el) => {
    const raw = el.textContent?.trim() ?? "";
    if (raw && !raw.startsWith("\u20B9") && !el.querySelector(".placeholder-empty")) {
      el.textContent = `\u20B9 ${raw}`;
    }
  });

  // ── Format: uppercase / locale date / locale number ──
  body.querySelectorAll<HTMLElement>("[data-format]").forEach((el) => {
    const fmt = el.getAttribute("data-format");
    const raw = el.textContent?.trim() ?? "";
    if (!raw || el.querySelector(".placeholder-empty")) return;
    if (fmt === "upper") {
      el.style.textTransform = "uppercase";
    } else if (fmt === "date") {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        el.textContent = d.toLocaleDateString("en-IN", {
          year: "numeric", month: "long", day: "numeric",
        });
      }
    } else if (fmt === "number") {
      const num = parseFloat(raw.replace(/[₹,\s]/g, ""));
      if (!isNaN(num)) {
        el.textContent = num.toLocaleString("en-IN");
      }
    }
  });

  // ── Sum / Count / Words: aggregate values from a row group ──
  body.querySelectorAll<HTMLElement>("[data-sum]").forEach((el) => {
    const group = el.getAttribute("data-sum");
    if (!group) return;

    if (el.hasAttribute("data-count")) {
      const count = body.querySelectorAll(`[data-row-group="${group}"]`).length;
      el.textContent = String(count);
    } else {
      let total = 0;
      body.querySelectorAll<HTMLElement>(`[data-val-group="${group}"]`).forEach((v) => {
        const raw = (v.textContent ?? "").replace(/[₹,\s]/g, "");
        const num = parseFloat(raw);
        if (!isNaN(num)) total += num;
      });
      if (el.hasAttribute("data-words")) {
        el.textContent = total > 0 ? "Rupees " + numberToWords(total) : "";
      } else {
        el.textContent = total > 0 ? `\u20B9 ${total.toLocaleString("en-IN")}` : "";
      }
    }
  });

  // ── Page break: CSS page-break-before for PDF export ──
  body.querySelectorAll<HTMLElement>("[data-tpl-break]").forEach((el) => {
    el.style.pageBreakBefore = "always";
  });

  return body.innerHTML;
}

/**
 * Phase 1: Pre-processes block-level tags on raw HTML string.
 * Runs BEFORE renderTemplate() because these tags create, remove,
 * or duplicate {{placeholder}} tokens.
 *
 * Handles: <tpl-date />, <tpl-if>, <tpl-each>, <tpl-rows>
 */
function preProcessTags(
  html: string,
  values: Record<string, string>
): string {
  // <tpl-date /> → insert today's date (long or short format)
  html = html.replace(
    /<tpl-date(?:\s+format="(short|long)")?\s*\/>/gi,
    (_match, fmt?: string) => {
      if (fmt === "short") {
        return new Date().toLocaleDateString("en-IN", {
          year: "numeric", month: "short", day: "numeric",
        });
      }
      return formatToday();
    }
  );

  // <tpl-if> → conditional block (show/hide/fallback based on value)
  html = html.replace(
    /<tpl-if\s+key="(\w+)"(?:\s+eq="([^"]*)")?(?:\s+default="([^"]*)")?\s*>([\s\S]*?)<\/tpl-if>/gi,
    (_match, key: string, eq: string | undefined, def: string | undefined, content: string) => {
      const val = values[key] ?? "";
      const show = eq !== undefined ? val === eq : !!val;
      if (show) return content;
      return def !== undefined ? escapeHtml(def) : "";
    }
  );

  // <tpl-each> → repeat block per line of a textarea value ($item = line)
  html = html.replace(
    /<tpl-each\s+key="(\w+)"\s*>([\s\S]*?)<\/tpl-each>/gi,
    (_match, key: string, template: string) => {
      const val = values[key] ?? "";
      const lines = val.split("\n").filter((l) => l.trim());
      return lines.map((line) => template.replace(/\$item/g, escapeHtml(line))).join("");
    }
  );

  // <tpl-rows> → clone single template row N times, suffix keys with _1, _2…
  html = html.replace(
    /<tpl-rows\s+group="([^"]+)"\s*>([\s\S]*?)<\/tpl-rows>/gi,
    (_match, group: string, content: string) => {
      const countKey = `__rows_${group}`;
      const count = Math.max(1, parseInt(values[countKey] ?? "1", 10));
      const rows: string[] = [];
      for (let i = 1; i <= count; i++) {
        const row = content.replace(
          /\{\{(\w+)\|([^|}]+)(\|[^}]+)?\}\}/g,
          (_m, key: string, label: string, rest: string = "") =>
            `{{${key}_${i}|${label}${rest}}}`
        );
        rows.push(row.replace(/<tr(\s|>)/gi, `<tr data-row-group="${group}"$1`));
      }
      return rows.join("\n");
    }
  );

  return html;
}

/**
 * Phase 3a: Translates remaining inline <tpl-*> tags to data-* attributes.
 * These are then picked up by the DOM queries in postProcessTemplate().
 *
 * Handles: <tpl-n />, <tpl-val>, <tpl-sum />, tpl-break attribute
 */
function translateInlineTags(html: string): string {
  // <tpl-n /> → auto serial number (renumbered after empty-row removal)
  html = html.replace(/<tpl-n\s*\/>/gi, '<span data-n></span>');

  // <tpl-val> → value wrapper with optional group/currency/format attrs
  html = html.replace(
    /<tpl-val(\s[^>]*)>([\s\S]*?)<\/tpl-val>/gi,
    (_match, attrs: string, content: string) => {
      const parts: string[] = [];
      const groupMatch = attrs.match(/group="([^"]+)"/i);
      if (groupMatch) parts.push(`data-val-group="${groupMatch[1]}"`);
      if (/\bcurrency\b/i.test(attrs)) parts.push('data-currency');
      const fmtMatch = attrs.match(/format="([^"]+)"/i);
      if (fmtMatch) parts.push(`data-format="${fmtMatch[1]}"`);
      return `<span ${parts.join(" ")}>${content}</span>`;
    }
  );

  // <tpl-sum /> → aggregate display (₹ total, count, or amount in words)
  html = html.replace(
    /<tpl-sum\s+group="([^"]+)"((?:\s+(?:count|words))*)\s*\/>/gi,
    (_match, group: string, flags: string) => {
      const extras: string[] = [];
      if (/\bcount\b/i.test(flags)) extras.push(' data-count');
      if (/\bwords\b/i.test(flags)) extras.push(' data-words');
      return `<span data-sum="${group}"${extras.join('')}></span>`;
    }
  );

  // tpl-break attr → data-tpl-break (triggers page-break-before in CSS)
  html = html.replace(/\btpl-break\b/gi, 'data-tpl-break');

  return html;
}
