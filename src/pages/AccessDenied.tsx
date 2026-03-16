import type { GoogleUser } from '../App'

interface AccessDeniedProps {
  user: GoogleUser
  onSignOut: () => void
}

export default function AccessDenied({ user, onSignOut }: AccessDeniedProps) {
  return (
    <div className="access-denied-screen">
      <div className="access-denied-card">
        <div className="access-denied-icon">🚫</div>
        <h1 className="access-denied-title">Access Denied</h1>
        <p className="access-denied-message">
          You are not authorized to access this application.
        </p>
        <div className="access-denied-user">
          <img src={user.picture} alt={user.name} className="access-denied-avatar" />
          <div>
            <div className="access-denied-name">{user.name}</div>
            <div className="access-denied-email">{user.email}</div>
          </div>
        </div>
        <button className="access-denied-btn" onClick={onSignOut}>
          Sign out &amp; try another account
        </button>
      </div>
    </div>
  )
}
