import { useState, useRef, useEffect, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { loadCardTemplates } from '../cardgen/templateLoader'
import { extractPlaceholders, renderTemplate } from '../docgen/placeholders'
import type { LetterTemplate } from '../docgen/types'

const cardTemplates = loadCardTemplates()
const DEFAULT_CARD_W = 600
const DEFAULT_CARD_H = 600

/** Convert a local URL to a base64 data URL */
async function toDataUrl(url: string): Promise<string> {
  const resp = await fetch(url)
  const blob = await resp.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/** Cache so each image is fetched only once */
const dataUrlCache: Record<string, string> = {}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  if (dataUrlCache[url]) return dataUrlCache[url]
  try {
    const d = await toDataUrl(url)
    dataUrlCache[url] = d
    return d
  } catch { return null }
}

/** Replace all local image references in HTML with inline data URLs */
async function inlineImages(html: string): Promise<string> {
  // Collect all unique local URLs from src="..." and url('...') patterns
  const urls = new Set<string>()
  const srcRegex = /src=["'](\/[^"']+)["']/gi
  const bgRegex = /url\(["']?(\/[^"')]+)["']?\)/gi
  let m: RegExpExecArray | null
  while ((m = srcRegex.exec(html)) !== null) urls.add(m[1])
  while ((m = bgRegex.exec(html)) !== null) urls.add(m[1])

  // Fetch all unique URLs in parallel
  const entries = await Promise.all(
    Array.from(urls).map(async (url) => [url, await fetchAsDataUrl(url)] as const)
  )

  // Replace each URL with its data URL
  for (const [url, dataUrl] of entries) {
    if (dataUrl) html = html.replaceAll(url, dataUrl)
  }
  return html
}

export default function CardGen() {
  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [inlinedHtml, setInlinedHtml] = useState('')
  const cardRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const cardW = selectedTemplate?.width ?? DEFAULT_CARD_W
  const cardH = selectedTemplate?.height ?? DEFAULT_CARD_H

  const updateScale = useCallback(() => {
    if (!wrapperRef.current) return
    const available = wrapperRef.current.clientWidth - 32
    setScale(available < cardW ? available / cardW : 1)
  }, [cardW])

  useEffect(() => {
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [updateScale])

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

    // Temporarily remove scale transform so html-to-image captures full size
    const origTransform = cardRef.current.style.transform
    const origTransformOrigin = cardRef.current.style.transformOrigin
    cardRef.current.style.transform = 'none'
    cardRef.current.style.transformOrigin = ''

    const dataUrl = await toPng(cardRef.current, {
      width: cardW,
      height: cardH,
      pixelRatio: 4,
      cacheBust: true,
    })

    // Restore scale transform
    cardRef.current.style.transform = origTransform
    cardRef.current.style.transformOrigin = origTransformOrigin

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

  // Pre-inline images whenever rendered HTML changes
  useEffect(() => {
    if (!renderedHtml) { setInlinedHtml(''); return }
    let cancelled = false
    inlineImages(renderedHtml).then((html) => { if (!cancelled) setInlinedHtml(html) })
    return () => { cancelled = true }
  }, [renderedHtml])

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

        <div className="cardgen-preview-area" ref={wrapperRef}>
          {selectedTemplate ? (
            <div style={scale < 1 ? { width: cardW * scale, height: cardH * scale } : undefined}>
              <div
                ref={cardRef}
                className="congrats-card"
                style={{
                  width: cardW,
                  height: cardH,
                  aspectRatio: 'auto',
                  ...(scale < 1 ? { transform: `scale(${scale})`, transformOrigin: 'top left' } : {}),
                }}
              >
                <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: inlinedHtml || renderedHtml }} />
              </div>
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
