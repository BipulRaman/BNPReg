export interface LetterTemplate {
  id: string;
  name: string;
  title?: string;
  html: string;
}

export interface PlaceholderField {
  key: string;
  label: string;
  type: "text" | "date" | "textarea";
}
