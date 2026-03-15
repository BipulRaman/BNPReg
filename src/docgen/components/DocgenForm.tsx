import { useMemo } from "react";
import type { LetterTemplate } from "../types";
import { extractPlaceholders } from "../placeholders";

interface Props {
  template: LetterTemplate;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export default function DocgenForm({ template, values, onChange }: Props) {
  const fields = useMemo(
    () => extractPlaceholders(template.html),
    [template.html]
  );

  const handleChange = (key: string, value: string) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <form className="docgen-template-form" onSubmit={(e) => e.preventDefault()}>
      <h3 className="docgen-form-title">{template.name}</h3>

      {fields.map((field) => (
        <div className="docgen-form-group" key={field.key}>
          <label htmlFor={`dg-${field.key}`} className="docgen-form-label">
            {field.label}
          </label>

          {field.type === "textarea" ? (
            <textarea
              id={`dg-${field.key}`}
              className="docgen-form-input"
              rows={3}
              value={values[field.key] ?? ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
            />
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
