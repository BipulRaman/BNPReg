import { useMemo, useCallback } from "react";
import type { LetterTemplate } from "../types";
import { extractPlaceholders, extractRowGroups } from "../placeholders";

interface Props {
  template: LetterTemplate;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

const MD_ACTIONS: { label: string; md: string; style?: string; block?: boolean }[] = [
  { label: "B", md: "**", style: "font-weight:700" },
  { label: "I", md: "*", style: "font-style:italic" },
  { label: "H", md: "### ", block: true },
  { label: "•", md: "- ", block: true },
  { label: "1.", md: "1. ", block: true },
];

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

function FieldInput({
  field,
  id,
  value,
  onChange,
}: {
  field: { key: string; label: string; type: string };
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.type === "markdown") {
    return (
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
                const ta = document.getElementById(id) as HTMLTextAreaElement | null;
                if (ta) applyMd(ta, a.md, !!a.block, value, onChange);
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
        <textarea id={id} className="docgen-form-input" rows={5} value={value} onChange={(e) => onChange(e.target.value)} />
      </>
    );
  }
  if (field.type === "textarea") {
    return <textarea id={id} className="docgen-form-input" rows={3} value={value} onChange={(e) => onChange(e.target.value)} />;
  }
  return <input id={id} className="docgen-form-input" type={field.type} value={value} onChange={(e) => onChange(e.target.value)} />;
}

export default function DocgenForm({ template, values, onChange }: Props) {
  const fields = useMemo(() => extractPlaceholders(template.html), [template.html]);
  const rowGroups = useMemo(() => extractRowGroups(template.html), [template.html]);

  const handleChange = useCallback(
    (key: string, value: string) => onChange({ ...values, [key]: value }),
    [values, onChange]
  );

  const getRowCount = (group: string) =>
    Math.max(1, parseInt(values[`__rows_${group}`] ?? "1", 10));

  const addRow = (group: string) => {
    const count = getRowCount(group);
    onChange({ ...values, [`__rows_${group}`]: String(count + 1) });
  };

  const removeRow = (group: string) => {
    const count = getRowCount(group);
    if (count <= 1) return;
    const next = { ...values, [`__rows_${group}`]: String(count - 1) };
    // Clean up removed row's values
    const rg = rowGroups.find((r) => r.group === group);
    if (rg) {
      for (const f of rg.fields) {
        delete next[`${f.key}_${count}`];
      }
    }
    onChange(next);
  };

  return (
    <form className="docgen-template-form" onSubmit={(e) => e.preventDefault()}>
      <h3 className="docgen-form-title">{template.name}</h3>

      {fields.map((field) => (
        <div className="docgen-form-group" key={field.key}>
          <label htmlFor={`dg-${field.key}`} className="docgen-form-label">
            {field.label}
          </label>
          <FieldInput
            field={field}
            id={`dg-${field.key}`}
            value={values[field.key] ?? ""}
            onChange={(v) => handleChange(field.key, v)}
          />
        </div>
      ))}

      {rowGroups.map((rg) => {
        const count = getRowCount(rg.group);
        return (
          <div key={rg.group} className="docgen-row-group">
            <div className="docgen-row-group-header">
              <span className="docgen-form-label" style={{ textTransform: "capitalize" }}>
                {rg.group} ({count})
              </span>
              <div className="docgen-row-group-actions">
                <button type="button" className="docgen-row-btn" onClick={() => removeRow(rg.group)} disabled={count <= 1}>−</button>
                <button type="button" className="docgen-row-btn" onClick={() => addRow(rg.group)}>+</button>
              </div>
            </div>
            {Array.from({ length: count }, (_, i) => {
              const idx = i + 1;
              return (
                <div key={idx} className="docgen-row-entry">
                  <span className="docgen-row-num">{idx}</span>
                  <div className="docgen-row-fields">
                    {rg.fields.map((f) => (
                      <input
                        key={f.key}
                        className="docgen-form-input"
                        type="text"
                        placeholder={f.label}
                        value={values[`${f.key}_${idx}`] ?? ""}
                        onChange={(e) => handleChange(`${f.key}_${idx}`, e.target.value)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            <button type="button" className="docgen-row-add" onClick={() => addRow(rg.group)}>
              + Add {rg.group.replace(/s$/, "")}
            </button>
          </div>
        );
      })}
    </form>
  );
}
