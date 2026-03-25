export interface LetterTemplate {
  id: string;
  name: string;
  title?: string;
  html: string;
  width?: number;
  height?: number;
}

export interface PlaceholderField {
  key: string;
  label: string;
  type: "text" | "date" | "textarea" | "markdown";
}

export interface RowGroup {
  group: string;
  fields: { key: string; label: string; type: PlaceholderField["type"] }[];
}
