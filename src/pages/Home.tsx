import Card from '../components/Card'

export default function Home() {
  return (
    <div className="page">
      <Card title="Bihar Navodayan Samagam 2026" emoji="🙏">
        <p>
          On behalf of <strong>Bihar Navodaya Pariwar</strong>, we cordially welcome you
          to the <strong>Bihar Navodayan Samagam 2026</strong> — a grand state-level
          gathering of Jawahar Navodaya Vidyalaya alumni from across the country.
        </p>
        <p style={{ marginTop: '0.75rem' }}>
          The Samagam is a platform to reconnect with fellow Navodayans, celebrate shared
          achievements, and foster meaningful collaborations that strengthen our vibrant
          community.
        </p>
      </Card>

      <Card title="Event Details" emoji="📅">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '1.8' }}>
          <li><strong>Date:</strong> April 5, 2026</li>
          <li><strong>Venue:</strong> Urja Auditorium Campus, Shastri Nagar, Patna</li>
          <li><strong>Highlights:</strong> Alumni Meet, Musical Performance, Blood Donation &amp; Networking</li>
        </ul>
      </Card>

      <Card title="What to Expect" emoji="🎉">
        <p>
          The event will feature cultural programmes, felicitation of distinguished alumni,
          networking sessions, and much more. Arrangements for accommodation and local
          assistance will be made for guests traveling from other cities.
        </p>
      </Card>
    </div>
  )
}
