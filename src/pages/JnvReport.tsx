import { useMemo } from 'react'
import { FileDown } from 'lucide-react'
import { useCSVData } from '../useCSVData'
import type { Registration } from '../types'

interface JnvGroup {
  label: string
  members: Registration[]
  totalDonation: number
}

function buildGroups(data: Registration[]): JnvGroup[] {
  const biharMap = new Map<string, Registration[]>()
  const others: Registration[] = []

  for (const r of data) {
    const jnv = r.entryJNV
    if (!jnv) continue
    if (jnv.startsWith('BR')) {
      const list = biharMap.get(jnv) ?? []
      list.push(r)
      biharMap.set(jnv, list)
    } else {
      others.push(r)
    }
  }

  const groups: JnvGroup[] = []

  const sortedKeys = [...biharMap.keys()].sort()
  for (const key of sortedKeys) {
    const members = biharMap.get(key)!
    members.sort((a, b) => a.name.localeCompare(b.name))
    groups.push({
      label: key,
      members,
      totalDonation: members.reduce((s, m) => s + m.donationAmount, 0),
    })
  }

  if (others.length > 0) {
    others.sort((a, b) => a.name.localeCompare(b.name))
    groups.push({
      label: 'Other JNVs (Outside Bihar)',
      members: others,
      totalDonation: others.reduce((s, m) => s + m.donationAmount, 0),
    })
  }

  return groups
}

function formatCurrency(n: number): string {
  return '₹' + n.toLocaleString('en-IN')
}

export default function JnvReport() {
  const { data, loading, error } = useCSVData()

  const groups = useMemo(() => buildGroups(data), [data])

  const handleExport = () => window.print()

  if (loading) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <p>Loading registration data…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="page jnvreport-page">
      <div className="jnvreport-toolbar no-print">
        <h2>JNV Report</h2>
        <button className="jnvreport-export-btn" onClick={handleExport}>
          <FileDown size={16} />
          Export PDF
        </button>
      </div>

      <div className="jnvreport-preview">
        {groups.filter(g => g.members.length > 0).map((g, gi) => (
          <div className="jnvreport-sheet" key={gi}>
            <h3 className="jnvreport-sheet-title">{g.label}</h3>
            <table className="jnvreport-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>JNV</th>
                  <th>Mobile</th>
                  <th style={{ textAlign: 'right' }}>Donation</th>
                </tr>
              </thead>
              <tbody>
                {g.members.map((m, mi) => (
                  <tr key={mi}>
                    <td>{mi + 1}</td>
                    <td>{m.name}</td>
                    <td>{m.entryJNV}</td>
                    <td>{m.phone}</td>
                    <td style={{ textAlign: 'right' }}>{m.donationAmount ? formatCurrency(m.donationAmount) : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}
