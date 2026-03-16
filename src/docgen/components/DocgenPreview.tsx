import { useMemo, useRef, useState, useEffect, useCallback } from "react";
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

  const scalerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const updateScale = useCallback(() => {
    const scaler = scalerRef.current;
    const page = pageRef.current;
    if (!scaler || !page) return;
    const containerWidth = scaler.clientWidth;
    const pageWidth = page.scrollWidth;
    const s = pageWidth > containerWidth ? containerWidth / pageWidth : 1;
    setScale(s);
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [updateScale]);

  const pageHeight = pageRef.current?.scrollHeight ?? 0;

  return (
    <div className="docgen-preview-wrapper">
      <div className="docgen-preview-toolbar">
        <span className="docgen-preview-title">{template.name} — Preview</span>
        <button className="docgen-btn-export" onClick={exportToPdf} type="button">
          Export PDF
        </button>
      </div>

      <div
        ref={scalerRef}
        className="docgen-letter-scaler"
        style={scale < 1 ? { height: pageHeight * scale } : undefined}
      >
        <div
          ref={pageRef}
          className="docgen-letter-page"
          style={scale < 1 ? { transform: `scale(${scale})`, transformOrigin: "top left" } : undefined}
        >
          <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
        </div>
      </div>
    </div>
  );
}
