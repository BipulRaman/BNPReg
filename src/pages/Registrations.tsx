import { useState, useMemo, useCallback, useRef } from 'react'
import type { Registration } from '../types'
import { useCSVData } from '../useCSVData'

const defaultColumns: { key: keyof Registration; label: string }[] = [
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'gender', label: 'Gender' },
  { key: 'phone', label: 'Phone' },
  { key: 'location', label: 'Location' },
  { key: 'pinCode', label: 'PIN Code' },
  { key: 'entryJNV', label: 'Entry JNV' },
  { key: 'entryYear', label: 'Entry Year' },
  { key: 'entryClass', label: 'Entry Class' },
  { key: 'currentProfile', label: 'Profile' },
  { key: 'organization', label: 'Organization' },
  { key: 'designation', label: 'Designation' },
  { key: 'participationRole', label: 'Role' },
  { key: 'foodPreference', label: 'Food' },
  { key: 'bloodDonation', label: 'Blood Donation' },
  { key: 'startupAid', label: 'Startup Aid' },
  { key: 'donationAmount', label: 'Donation' },
]

function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"'
  }
  return value
}

export default function Registrations() {
  const { data, loading, error, refresh } = useCSVData()
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<string>('timestamp')
  const [sortAsc, setSortAsc] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<Registration | null>(null)
  const [colFilters, setColFilters] = useState<Record<string, string>>({})
  const [columns, setColumns] = useState(defaultColumns)
  const dragCol = useRef<number | null>(null)
  const dragOverCol = useRef<number | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [exportCols, setExportCols] = useState<Set<keyof Registration>>(
    () => new Set(defaultColumns.map(c => c.key))
  )

  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    dragCol.current = idx
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    dragOverCol.current = idx
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (dragCol.current === null || dragOverCol.current === null || dragCol.current === dragOverCol.current) return
    const from = dragCol.current
    const to = dragOverCol.current
    setColumns(prev => {
      const updated = [...prev]
      const [dragged] = updated.splice(from, 1)
      updated.splice(to, 0, dragged)
      return updated
    })
    dragCol.current = null
    dragOverCol.current = null
  }, [])

  const filteredData = useMemo(() => {
    let result = data
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.timestamp.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.gender.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.pinCode.includes(q) ||
          r.entryJNV.toLowerCase().includes(q) ||
          String(r.entryYear).includes(q) ||
          String(r.entryClass).includes(q) ||
          r.currentProfile.toLowerCase().includes(q) ||
          r.organization.toLowerCase().includes(q) ||
          r.designation.toLowerCase().includes(q) ||
          r.participationRole.toLowerCase().includes(q) ||
          r.foodPreference.toLowerCase().includes(q) ||
          r.bloodDonation.toLowerCase().includes(q) ||
          r.startupAid.toLowerCase().includes(q) ||
          String(r.donationAmount).includes(q)
      )
    }
    for (const [key, val] of Object.entries(colFilters)) {
      if (!val) continue
      const q = val.toLowerCase()
      result = result.filter((r) => String(r[key as keyof Registration]).toLowerCase().includes(q))
    }
    return result
  }, [data, search, colFilters])

  const sortedData = useMemo(() => {
    const sorted = [...filteredData]
    sorted.sort((a, b) => {
      const aVal = String(a[sortCol as keyof typeof a] ?? '')
      const bVal = String(b[sortCol as keyof typeof b] ?? '')
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true })
      return sortAsc ? cmp : -cmp
    })
    return sorted
  }, [filteredData, sortCol, sortAsc])

  const handleSort = (col: string) => {
    if (sortCol === col) setSortAsc(!sortAsc)
    else { setSortCol(col); setSortAsc(true) }
  }

  const toggleExportCol = (key: keyof Registration) => {
    setExportCols(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const handleExportCsv = () => {
    const selectedCols = defaultColumns.filter(c => exportCols.has(c.key))
    if (selectedCols.length === 0) return
    const header = selectedCols.map(c => escapeCsvCell(c.label)).join(',')
    const rows = sortedData.map(r =>
      selectedCols.map(c => escapeCsvCell(String(r[c.key] ?? ''))).join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExport(false)
  }

  if (loading) {
    return (
      <div className="page">
        <div className="data-loading">
          <div className="spinner" />
          <p>Loading registration data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <div className="data-error">
          <h2>Failed to load data</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Registrations ({filteredData.length})</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="refresh-btn" onClick={() => setShowExport(true)}>
            ⬇ Export CSV
          </button>
          <button className="refresh-btn" onClick={refresh} disabled={loading}>
            {loading ? '↻ Refreshing…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      <div className="table-container">
        <input
          className="search-bar"
          type="text"
          placeholder="Search by name, JNV, location, profile, or organization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={col.key}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e)}
                    onClick={() => handleSort(col.key)}
                    className="th-draggable"
                  >
                    {col.label} {sortCol === col.key ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                ))}
              </tr>
              <tr>
                {columns.map((col) => (
                  <th key={`filter-${col.key}`} className="filter-th">
                    <input
                      className="col-filter"
                      type="text"
                      placeholder="Filter..."
                      value={colFilters[col.key] ?? ''}
                      onChange={(e) => setColFilters(prev => ({ ...prev, [col.key]: e.target.value }))}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((r, i) => (
                <tr key={i}>
                  {columns.map((col) => {
                    const val = r[col.key]
                    if (col.key === 'name') return <td key={col.key}><a href="#" className="name-link" onClick={(e) => { e.preventDefault(); setSelectedPerson(r) }}>{r.name}</a></td>
                    if (col.key === 'gender') return <td key={col.key}><span className={`badge badge-${r.gender.toLowerCase()}`}>{r.gender}</span></td>
                    if (col.key === 'foodPreference') return <td key={col.key}><span className={`badge badge-${r.foodPreference === 'Veg' ? 'veg' : 'nonveg'}`}>{r.foodPreference}</span></td>
                    if (col.key === 'bloodDonation') return <td key={col.key}>{r.bloodDonation && <span className={`badge badge-${r.bloodDonation.toLowerCase()}`}>{r.bloodDonation}</span>}</td>
                    if (col.key === 'donationAmount') return <td key={col.key}>{r.donationAmount > 0 ? `₹${r.donationAmount.toLocaleString('en-IN')}` : '-'}</td>
                    if (col.key === 'entryYear' || col.key === 'entryClass') return <td key={col.key}>{val || '-'}</td>
                    return <td key={col.key}>{String(val)}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showExport && (
        <div className="modal-overlay" onClick={() => setShowExport(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowExport(false)}>&times;</button>
            <h2>Export CSV</h2>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '12px' }}>
              {filteredData.length} rows (filtered) &middot; {exportCols.size} columns selected
            </p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                className="refresh-btn"
                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                onClick={() => setExportCols(new Set(defaultColumns.map(c => c.key)))}
              >Select All</button>
              <button
                className="refresh-btn"
                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                onClick={() => setExportCols(new Set())}
              >Select None</button>
            </div>
            <div className="export-col-grid">
              {defaultColumns.map(col => (
                <label key={col.key} className="export-col-item">
                  <input
                    type="checkbox"
                    checked={exportCols.has(col.key)}
                    onChange={() => toggleExportCol(col.key)}
                  />
                  {col.label}
                </label>
              ))}
            </div>
            <button
              className="refresh-btn"
              style={{ marginTop: '16px', width: '100%', padding: '10px', fontWeight: 600 }}
              onClick={handleExportCsv}
              disabled={exportCols.size === 0}
            >
              ⬇ Download CSV ({exportCols.size} columns)
            </button>
          </div>
        </div>
      )}

      {selectedPerson && (
        <div className="modal-overlay" onClick={() => setSelectedPerson(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPerson(null)}>&times;</button>
            <h2>{selectedPerson.name}</h2>
            <div className="modal-grid">
              <div className="modal-field"><span className="modal-label">Timestamp</span><span>{selectedPerson.timestamp}</span></div>
              <div className="modal-field"><span className="modal-label">Email</span><span>{selectedPerson.email}</span></div>
              <div className="modal-field"><span className="modal-label">Gender</span><span>{selectedPerson.gender}</span></div>
              <div className="modal-field"><span className="modal-label">Phone</span><span>{selectedPerson.phone}</span></div>
              <div className="modal-field"><span className="modal-label">Location</span><span>{selectedPerson.location}</span></div>
              <div className="modal-field"><span className="modal-label">PIN Code</span><span>{selectedPerson.pinCode}</span></div>
              <div className="modal-field"><span className="modal-label">Entry JNV</span><span>{selectedPerson.entryJNV}</span></div>
              <div className="modal-field"><span className="modal-label">Entry Year</span><span>{selectedPerson.entryYear || '-'}</span></div>
              <div className="modal-field"><span className="modal-label">Entry Class</span><span>{selectedPerson.entryClass || '-'}</span></div>
              <div className="modal-field"><span className="modal-label">Current Profile</span><span>{selectedPerson.currentProfile}</span></div>
              <div className="modal-field"><span className="modal-label">Organization</span><span>{selectedPerson.organization}</span></div>
              <div className="modal-field"><span className="modal-label">Designation</span><span>{selectedPerson.designation}</span></div>
              <div className="modal-field"><span className="modal-label">Participation Role</span><span>{selectedPerson.participationRole}</span></div>
              <div className="modal-field"><span className="modal-label">Food Preference</span><span>{selectedPerson.foodPreference}</span></div>
              <div className="modal-field"><span className="modal-label">Blood Donation</span><span>{selectedPerson.bloodDonation || '-'}</span></div>
              <div className="modal-field"><span className="modal-label">Startup Aid</span><span>{selectedPerson.startupAid || '-'}</span></div>
              <div className="modal-field"><span className="modal-label">Donation Amount</span><span>{selectedPerson.donationAmount > 0 ? `₹${selectedPerson.donationAmount.toLocaleString('en-IN')}` : '-'}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
