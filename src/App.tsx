import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Registration } from './types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts';
import { useCSVData } from './useCSVData';
import {
  countBy, countByRoles, countByJNVDistrict,
  registrationTimeline, registrationByThreeHourWindow, totalDonations, entryYearDistribution,
} from './analytics';

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#ec4899', '#a855f7', '#eab308', '#ef4444', '#06b6d4', '#84cc16', '#f43f5e'];

const GOOGLE_CLIENT_ID = '611874550622-envgonngfv8fan2i654sr89jpufi3g1v.apps.googleusercontent.com';
const ALLOWED_EMAILS_URL = 'https://cdn.bipul.in/bipul.in/sam5.json';

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

type Tab = 'overview' | 'table';

export default function App() {
  const { data, loading, error, refresh } = useCSVData();
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });
  const [user, setUser] = useState<GoogleUser | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [authError, setAuthError] = useState('');
  const [allowedEmails, setAllowedEmails] = useState<string[] | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string>('timestamp');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Registration | null>(null);
  const [colFilters, setColFilters] = useState<Record<string, string>>({});

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
  ];
  const [columns, setColumns] = useState(defaultColumns);
  const dragCol = useRef<number | null>(null);
  const dragOverCol = useRef<number | null>(null);

  useEffect(() => {
    fetch(ALLOWED_EMAILS_URL)
      .then(r => r.text())
      .then(text => {
        // Handle trailing commas in JSON
        const cleaned = text.replace(/,\s*]/g, ']');
        const emails: string[] = JSON.parse(cleaned);
        setAllowedEmails(emails.map(e => e.toLowerCase()));
      })
      .catch(() => {
        setAuthError('Failed to load access list. Please try again later.');
      });
  }, []);

  useEffect(() => {
    if (allowedEmails === null) return; // wait for allowlist to load
    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => {
          const payload = decodeJwtPayload(response.credential);
          const email = payload.email as string;
          if (allowedEmails.length > 0 && !allowedEmails.includes(email.toLowerCase())) {
            setAuthError(`Access denied for ${email}.`);
            return;
          }
          setAuthError('');
          setUser({
            name: payload.name as string,
            email,
            picture: payload.picture as string,
          });
        },
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
        });
      }
    };

    // GSI script may load after component mounts
    if (window.google) {
      initGoogle();
    } else {
      const check = setInterval(() => {
        if (window.google) {
          clearInterval(check);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(check);
    }
  }, [user, allowedEmails]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleSignOut = useCallback(() => {
    window.google?.accounts.id.disableAutoSelect();
    setUser(null);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    dragCol.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverCol.current = idx;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (dragCol.current === null || dragOverCol.current === null || dragCol.current === dragOverCol.current) return;
    const from = dragCol.current;
    const to = dragOverCol.current;
    setColumns(prev => {
      const updated = [...prev];
      const [dragged] = updated.splice(from, 1);
      updated.splice(to, 0, dragged);
      return updated;
    });
    dragCol.current = null;
    dragOverCol.current = null;
  }, []);

  const genderData = useMemo(() => countBy(data, 'gender'), [data]);
  const profileData = useMemo(() => countBy(data, 'currentProfile'), [data]);
  const foodData = useMemo(() => countBy(data, 'foodPreference'), [data]);
  const bloodData = useMemo(() => countBy(data, 'bloodDonation').filter(d => d.name === 'Yes' || d.name === 'No'), [data]);
  const rolesData = useMemo(() => countByRoles(data), [data]);
  const jnvData = useMemo(() => countByJNVDistrict(data), [data]);
  const jnvPieData = useMemo(() => {
    const top10 = jnvData.slice(0, 10);
    const rest = jnvData.slice(10);
    const othersTotal = rest.reduce((sum, d) => sum + d.value, 0);
    if (othersTotal > 0) return [...top10, { name: 'Others', value: othersTotal }];
    return top10;
  }, [jnvData]);
  const timelineData = useMemo(() => registrationTimeline(data), [data]);
  const threeHourData = useMemo(() => registrationByThreeHourWindow(data), [data]);
  const total$ = useMemo(() => totalDonations(data), [data]);
  const yearData = useMemo(() => entryYearDistribution(data), [data]);
  const donors = useMemo(() => data.filter(d => d.donationAmount > 0).length, [data]);
  const startupYes = useMemo(() => data.filter(d => d.startupAid === 'Yes').length, [data]);

  const renderPieLabel = useCallback(({ name, value, percent, x, y, cx: pcx }: {
    name: string; value: number; percent: number; x: number; y: number; cx: number;
  }) => (
    <text className="pie-label-text" x={x} y={y} textAnchor={x > pcx ? 'start' : 'end'} dominantBaseline="central">
      {`${name} - ${value} (${(percent * 100).toFixed(0)}%)`}
    </text>
  ), []);

  const renderTimeWindowLabel = useCallback(({ name, value, percent, x, y, cx: pcx }: {
    name: string; value: number; percent: number; x: number; y: number; cx: number;
  }) => (
    <text className="time-window-label-text" x={x} y={y} textAnchor={x > pcx ? 'start' : 'end'} dominantBaseline="central">
      {`${name} - ${value} (${(percent * 100).toFixed(0)}%)`}
    </text>
  ), []);

  const filteredData = useMemo(() => {
    let result = data;
    // Global search
    if (search) {
      const q = search.toLowerCase();
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
      );
    }
    // Per-column filters
    for (const [key, val] of Object.entries(colFilters)) {
      if (!val) continue;
      const q = val.toLowerCase();
      result = result.filter((r) => String(r[key as keyof Registration]).toLowerCase().includes(q));
    }
    return result;
  }, [data, search, colFilters]);

  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      const aVal = String(a[sortCol as keyof typeof a] ?? '');
      const bVal = String(b[sortCol as keyof typeof b] ?? '');
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [filteredData, sortCol, sortAsc]);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(true); }
  };

  if (!user) {
    return (
      <div className="app lock-wrap">
        <div className="auth-gate">
          <h1>Samagam 2026</h1>
          <p>Sign in with your Google account to access the dashboard.</p>
          {allowedEmails === null
            ? <div className="spinner" />
            : <div ref={googleBtnRef} className="google-btn-wrap" />
          }
          {authError && <p className="auth-error">{authError}</p>}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner" />
          <p>Loading registration data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Failed to load data</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Samagam 2026 — Registration Analytics</h1>
        <div className="header-meta">
          <p>Live data from {data.length} registrations</p>
          <button className="refresh-btn" onClick={refresh} disabled={loading}>
            {loading ? '↻ Refreshing…' : '↻ Refresh Data'}
          </button>
        </div>
        <div className="user-info">
          <img src={user.picture} alt={user.name} className="user-avatar" referrerPolicy="no-referrer" />
          <span className="user-name">{user.name}</span>
          <button className="sign-out-btn" onClick={handleSignOut}>Sign Out</button>
        </div>
      </header>

      <div className="tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Dashboard
        </button>
        <button className={`tab ${activeTab === 'table' ? 'active' : ''}`} onClick={() => setActiveTab('table')}>
          Registrations Table
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
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
              <ResponsiveContainer width="100%" height={isMobile ? 320 : 360}>
                <PieChart margin={{ top: isMobile ? 24 : 28, right: isMobile ? 28 : 96, left: isMobile ? 28 : 96, bottom: isMobile ? 56 : 64 }}>
                  <Pie data={threeHourData} dataKey="value" nameKey="name" cx="50%" cy={isMobile ? '44%' : '46%'} outerRadius={isMobile ? 64 : 108} label={renderTimeWindowLabel}>
                    {threeHourData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" align="center" />
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
                  <Legend />
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
                  <Legend />
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
                  <Legend />
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
                  <Legend />
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
                  {!isMobile && <Legend />}
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'table' && (
        <div className="table-container">
          <h3>All Registrations ({filteredData.length})</h3>
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
                      const val = r[col.key];
                      if (col.key === 'name') return <td key={col.key}><a href="#" className="name-link" onClick={(e) => { e.preventDefault(); setSelectedPerson(r); }}>{r.name}</a></td>;
                      if (col.key === 'gender') return <td key={col.key}><span className={`badge badge-${r.gender.toLowerCase()}`}>{r.gender}</span></td>;
                      if (col.key === 'foodPreference') return <td key={col.key}><span className={`badge badge-${r.foodPreference === 'Veg' ? 'veg' : 'nonveg'}`}>{r.foodPreference}</span></td>;
                      if (col.key === 'bloodDonation') return <td key={col.key}>{r.bloodDonation && <span className={`badge badge-${r.bloodDonation.toLowerCase()}`}>{r.bloodDonation}</span>}</td>;
                      if (col.key === 'donationAmount') return <td key={col.key}>{r.donationAmount > 0 ? `₹${r.donationAmount.toLocaleString('en-IN')}` : '-'}</td>;
                      if (col.key === 'entryYear' || col.key === 'entryClass') return <td key={col.key}>{val || '-'}</td>;
                      return <td key={col.key}>{String(val)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
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
  );
}
