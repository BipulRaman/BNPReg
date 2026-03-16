import { useState, useRef } from 'react'
import { toPng } from 'html-to-image'
import { loadCardTemplates } from '../cardgen/templateLoader'
import { extractPlaceholders, renderTemplate } from '../docgen/placeholders'
import type { LetterTemplate } from '../docgen/types'

const cardTemplates = loadCardTemplates()

export default function CardGen() {
  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const cardRef = useRef<HTMLDivElement>(null)

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const template = cardTemplates.find(t => t.id === e.target.value) ?? null
    setSelectedTemplate(template)
    setFormValues({})
  }

  const handleFieldChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }))
  }

  const handleExport = async () => {
    if (!cardRef.current) return
    const dataUrl = await toPng(cardRef.current, {
      pixelRatio: 4,
      cacheBust: true,
    })
    const fileName = selectedTemplate?.title
      ?.replace(/_#(\w+)#_/g, (_, key: string) => (formValues[key] || '').replace(/ /g, '_'))
      ?? 'Card'
    const link = document.createElement('a')
    link.download = `${fileName}.png`
    link.href = dataUrl
    link.click()
  }

  const fields = selectedTemplate ? extractPlaceholders(selectedTemplate.html) : []
  const renderedHtml = selectedTemplate ? renderTemplate(selectedTemplate.html, formValues) : ''

  return (
    <div className="page cardgen-page">
      <div className="cardgen-layout">
        <aside className="cardgen-sidebar">
          <label className="cardgen-label">Select a Template</label>
          <select
            className="cardgen-input"
            value={selectedTemplate?.id ?? ''}
            onChange={handleTemplateChange}
          >
            <option value="" disabled>-- Choose a template --</option>
            {cardTemplates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {fields.map(field => (
            <div key={field.key}>
              <label className="cardgen-label">{field.label}</label>
              <input
                className="cardgen-input"
                placeholder={field.label}
                value={formValues[field.key] ?? ''}
                onChange={e => handleFieldChange(field.key, e.target.value)}
              />
            </div>
          ))}

          {selectedTemplate && (
            <button
              className="cardgen-export-btn"
              onClick={handleExport}
            >
              Export as Image
            </button>
          )}
        </aside>

        <div className="cardgen-preview-area">
          {selectedTemplate ? (
            <div ref={cardRef} className="congrats-card">
              <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: renderedHtml }} />
            </div>
          ) : (
            <div className="cardgen-empty">
              <p>Select a template to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
