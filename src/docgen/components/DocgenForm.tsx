import { useMemo, useCallback } from "react";
import type { LetterTemplate } from "../types";
import { extractPlaceholders } from "../placeholders";

interface Props {
  template: LetterTemplate;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

const MD_ACTIONS = [
  { label: "B", md: "**", style: "font-weight:700" },
  { label: "I", md: "*", style: "font-style:italic" },
  { label: "H", md: "### ", block: true },
  { label: "•", md: "- ", block: true },
  { label: "1.", md: "1. ", block: true },
] as const;

function applyMd(
  el: HTMLTextAreaElement,
  md: string,
  block: boolean,
  value: string,
  onChange: (v: string) => void
) {
  const { selectionStart: s, selectionEnd: e } = el;
  const sel = value.substring(s, e);

  let next: string;
  let cursor: number;

  if (block) {
    const prefix = s > 0 && value[s - 1] !== "\n" ? "\n" : "";
    const inserted = prefix + md + sel;
    next = value.substring(0, s) + inserted + value.substring(e);
    cursor = s + inserted.length;
  } else {
    next = value.substring(0, s) + md + sel + md + value.substring(e);
    cursor = sel ? s + md.length + sel.length + md.length : s + md.length;
  }

  onChange(next);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(cursor, cursor);
  });
}

export default function DocgenForm({ template, values, onChange }: Props) {
  const fields = useMemo(
    () => extractPlaceholders(template.html),
    [template.html]
  );

  const handleChange = useCallback(
    (key: string, value: string) => onChange({ ...values, [key]: value }),
    [values, onChange]
  );

  return (
    <form className="docgen-template-form" onSubmit={(e) => e.preventDefault()}>
      <h3 className="docgen-form-title">{template.name}</h3>

      {fields.map((field) => (
        <div className="docgen-form-group" key={field.key}>
          <label htmlFor={`dg-${field.key}`} className="docgen-form-label">
            {field.label}
          </label>

          {field.type === "textarea" ? (
            <>
              <div className="md-toolbar">
                {MD_ACTIONS.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    className="md-toolbar-btn"
                    style={a.style ? { [a.style.split(":")[0]]: a.style.split(":")[1] } : undefined}
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      const ta = document.getElementById(`dg-${field.key}`) as HTMLTextAreaElement | null;
                      if (ta) applyMd(ta, a.md, !!a.block, values[field.key] ?? "", (v) => handleChange(field.key, v));
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              <textarea
                id={`dg-${field.key}`}
                className="docgen-form-input"
                rows={5}
                value={values[field.key] ?? ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            </>
          ) : (
            <input
              id={`dg-${field.key}`}
              className="docgen-form-input"
              type={field.type}
              value={values[field.key] ?? ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
            />
          )}
        </div>
      ))}
    </form>
  );
}
