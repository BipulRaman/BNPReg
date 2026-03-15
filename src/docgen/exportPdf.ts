/**
 * Opens the browser print dialog with only the letter content visible.
 * The browser's native PDF renderer preserves real selectable text.
 * Document title (used as filename) is managed by the Docgen page via useEffect.
 */
export function exportToPdf(): void {
  window.print();
}
