import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList,
  PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts'
import { useCSVData } from '../useCSVData'
import {
  countBy, countByRoles, countByJNVDistrict,
  registrationTimeline, registrationByThreeHourWindow, totalDonations, entryYearDistribution,
} from '../analytics'

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#ec4899', '#a855f7', '#eab308', '#ef4444', '#06b6d4', '#84cc16', '#f43f5e']

export default function Analytics() {
  const { data, loading, error, refresh } = useCSVData()
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const genderData = useMemo(() => countBy(data, 'gender'), [data])
  const profileData = useMemo(() => countBy(data, 'currentProfile'), [data])
  const foodData = useMemo(() => countBy(data, 'foodPreference'), [data])
  const bloodData = useMemo(() => countBy(data, 'bloodDonation').filter(d => d.name === 'Yes' || d.name === 'No'), [data])
  const rolesData = useMemo(() => countByRoles(data), [data])
  const jnvData = useMemo(() => countByJNVDistrict(data), [data])
  const jnvPieData = useMemo(() => {
    const top10 = jnvData.slice(0, 10)
    const rest = jnvData.slice(10)
    const othersTotal = rest.reduce((sum, d) => sum + d.value, 0)
    if (othersTotal > 0) return [...top10, { name: 'Others', value: othersTotal }]
    return top10
  }, [jnvData])
  const timelineData = useMemo(() => registrationTimeline(data), [data])
  const threeHourData = useMemo(() => registrationByThreeHourWindow(data), [data])
  const total$ = useMemo(() => totalDonations(data), [data])
  const yearData = useMemo(() => entryYearDistribution(data), [data])
  const donors = useMemo(() => data.filter(d => d.donationAmount > 0).length, [data])
  const startupYes = useMemo(() => data.filter(d => d.startupAid === 'Yes').length, [data])

  const renderPieLabel = useCallback(({ name, value, percent, x, y, cx: pcx }: {
    name: string; value: number; percent: number; x: number; y: number; cx: number;
  }) => (
    <text className="pie-label-text" x={x} y={y} textAnchor={x > pcx ? 'start' : 'end'} dominantBaseline="central">
      {`${name} - ${value} (${(percent * 100).toFixed(0)}%)`}
    </text>
  ), [])

  const renderTimeWindowLabel = useCallback(({ name, value, percent, x, y, cx: pcx }: {
    name: string; value: number; percent: number; x: number; y: number; cx: number;
  }) => (
    <text className="time-window-label-text" x={x} y={y} textAnchor={x > pcx ? 'start' : 'end'} dominantBaseline="central">
      {`${name} - ${value} (${(percent * 100).toFixed(0)}%)`}
    </text>
  ), [])

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
        <h2>Analytics — {data.length} Registrations</h2>
        <button className="refresh-btn" onClick={refresh} disabled={loading}>
          {loading ? '↻ Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="value summary-value-registrations">{data.length}</div>
          <div className="label">Total Registrations</div>
        </div>
        <div className="summary-card">
          <div className="value summary-value-donations">₹{total$.toLocaleString('en-IN')}</div>
          <div className="label">Total Donations</div>
        </div>
        <div className="summary-card">
          <div className="value summary-value-donors">{donors}</div>
          <div className="label">Donors</div>
        </div>
        <div className="summary-card">
          <div className="value summary-value-jnv">{jnvData.length}</div>
          <div className="label">JNV Districts</div>
        </div>
        <div className="summary-card">
          <div className="value summary-value-startup">{startupYes}</div>
          <div className="label">Need Startup Aid</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Registration Timeline */}
        <div className="chart-card full-width">
          <h3>📈 Registration Timeline</h3>
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 250}>
            <AreaChart data={timelineData}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Registrations" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 3-Hour Registration Windows */}
        <div className="chart-card">
          <h3>⏱️ Registrations by 3-Hour Window</h3>
          <ResponsiveContainer width="100%" height={isMobile ? 320 : 400}>
            <PieChart margin={{ top: isMobile ? 24 : 32, right: isMobile ? 28 : 140, left: isMobile ? 28 : 140, bottom: isMobile ? 16 : 20 }}>
              <Pie data={threeHourData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={isMobile ? 64 : 90} label={renderTimeWindowLabel}>
                {threeHourData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gender */}
        <div className="chart-card">
          <h3>👥 Gender Distribution</h3>
          <ResponsiveContainer width="100%" height={isMobile ? 240 : 280}>
            <PieChart>
              <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={isMobile ? 60 : 100} label={renderPieLabel}>
                {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Current Profile */}
        <div className="chart-card">
          <h3>💼 Current Profile</h3>
          <ResponsiveContainer width="100%" height={isMobile ? 240 : 280}>
            <PieChart>
              <Pie data={profileData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={isMobile ? 60 : 100} label={renderPieLabel}>
                {profileData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Food Preferences */}
        <div className="chart-card">
          <h3>🍽️ Food Preferences</h3>
          <ResponsiveContainer width="100%" height={isMobile ? 240 : 280}>
            <PieChart>
              <Pie data={foodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={isMobile ? 60 : 100} label={renderPieLabel}>
                {foodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Blood Donation */}
        <div className="chart-card">
          <h3>🩸 Blood Donation Willingness</h3>
          <ResponsiveContainer width="100%" height={isMobile ? 240 : 280}>
            <PieChart>
              <Pie data={bloodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={isMobile ? 60 : 100} label={renderPieLabel}>
                {bloodData.map((_, i) => <Cell key={i} fill={[COLORS[1], COLORS[6]][i] ?? COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Participation Roles */}
        <div className="chart-card">
          <h3>🎭 Participation Roles</h3>
          <ResponsiveContainer width="100%" height={isMobile ? 240 : 280}>
            <BarChart data={rolesData} layout="vertical">
              <XAxis type="number" stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={isMobile ? 96 : 140} />
              <Tooltip />
              <Bar dataKey="value" fill="#a855f7" radius={[0, 4, 4, 0]} name="Count">
                <LabelList dataKey="value" position="right" fill="#475569" fontSize={11} formatter={(v: number) => isMobile ? `${v}` : `${v} (${((v / data.length) * 100).toFixed(0)}%)`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Entry Year */}
        <div className="chart-card">
          <h3>📅 JNV Entry Year</h3>
          <ResponsiveContainer width="100%" height={isMobile ? 240 : 280}>
            <BarChart data={yearData}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} name="Count">
                <LabelList dataKey="value" position="top" fill="#475569" fontSize={11} formatter={(v: number) => isMobile ? `${v}` : `${v} (${((v / data.length) * 100).toFixed(0)}%)`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* JNV Districts */}
        <div className="chart-card full-width">
          <h3>🏫 JNV District Distribution (Top 10 + Others)</h3>
          <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
            <PieChart>
              <Pie data={jnvPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={isMobile ? 70 : 150} label={renderPieLabel}>
                {jnvPieData.map((_, i) => <Cell key={i} fill={i === 10 ? '#94a3b8' : COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
