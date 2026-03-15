import Card from '../components/Card'

export default function Home() {
  return (
    <div className="page">
      <Card title="Welcome to Samagam 5.0" emoji="🙏">
        <p>
          Samagam is the collaboration platform for <strong>Bihar Navodaya Pariwar</strong> — 
          a unified hub for managing event registrations, tracking analytics, and generating 
          official documents for the Bihar Navodayan Samagam 2026.
        </p>
      </Card>

      <Card title="Registrations" emoji="📋">
        <p>
          View and manage all event registrations in a searchable, sortable data table. 
          Filter by name, JNV district, location, or any other field. Click on any 
          registrant to view their complete details.
        </p>
      </Card>

      <Card title="Analytics Dashboard" emoji="📊">
        <p>
          Explore live analytics powered by registration data — including gender distribution, 
          food preferences, participation roles, JNV district breakdown, donation summaries, 
          registration timeline, and more through interactive charts.
        </p>
      </Card>

      <Card title="Document Generator" emoji="📄">
        <p>
          Generate official documents such as invitation letters using customizable templates. 
          Fill in recipient details, preview the letter in real-time with A4 layout, and 
          export to PDF directly from your browser.
        </p>
      </Card>
    </div>
  )
}
