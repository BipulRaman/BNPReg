import { useState, useEffect } from "react";
import { loadTemplates } from "../docgen/templateLoader";
import type { LetterTemplate } from "../docgen/types";
import DocgenForm from "../docgen/components/DocgenForm";
import DocgenPreview from "../docgen/components/DocgenPreview";

const letterTemplates = loadTemplates();

export default function Docgen() {
  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!selectedTemplate) return;
    const titleTemplate = selectedTemplate.title ?? selectedTemplate.name;
    const newTitle = titleTemplate.replace(
      /_#(\w+)#_/g,
      (_, key: string) => (formValues[key] || "").replace(/ /g, "_")
    );
    document.title = newTitle;
    return () => { document.title = "Samagam"; };
  }, [selectedTemplate, formValues]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const template = letterTemplates.find((t) => t.id === e.target.value) ?? null;
    setSelectedTemplate(template);
    setFormValues({});
  };

  return (
    <div className="page docgen-page">
      <div className="docgen-layout">
        {/* Sidebar — template selector + dynamic form */}
        <aside className="docgen-sidebar">
          <label htmlFor="docgen-template-select" className="docgen-label">
            Select a Template
          </label>
          <select
            id="docgen-template-select"
            className="docgen-select"
            value={selectedTemplate?.id ?? ""}
            onChange={handleTemplateChange}
          >
            <option value="" disabled>
              -- Choose a template --
            </option>
            {letterTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {selectedTemplate && (
            <DocgenForm
              template={selectedTemplate}
              values={formValues}
              onChange={setFormValues}
            />
          )}
        </aside>

        {/* Main — A4 live preview */}
        <div className="docgen-preview-panel">
          {selectedTemplate ? (
            <DocgenPreview template={selectedTemplate} values={formValues} />
          ) : (
            <div className="docgen-empty-state">
              <p>Select a template to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
