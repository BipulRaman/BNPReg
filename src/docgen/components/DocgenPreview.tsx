import { useMemo } from "react";
import type { LetterTemplate } from "../types";
import { renderTemplate } from "../placeholders";
import { exportToPdf } from "../exportPdf";

interface Props {
  template: LetterTemplate;
  values: Record<string, string>;
}

export default function DocgenPreview({ template, values }: Props) {
  const renderedHtml = useMemo(
    () => renderTemplate(template.html, values),
    [template.html, values]
  );

  return (
    <div className="docgen-preview-wrapper">
      <div className="docgen-preview-toolbar">
        <span className="docgen-preview-title">{template.name} — Preview</span>
        <button className="docgen-btn-export" onClick={exportToPdf} type="button">
          Export PDF
        </button>
      </div>

      <div className="docgen-letter-scaler">
        <div className="docgen-letter-page">
          <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
        </div>
      </div>
    </div>
  );
}
