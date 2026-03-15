import { RefObject } from 'react'

interface LoginScreenProps {
  googleBtnRef: RefObject<HTMLDivElement | null>
  authError: string
}

export default function LoginScreen({ googleBtnRef, authError }: LoginScreenProps) {
  return (
    <div className="login-screen">
      <div className="login-card">
        <img src="/logo-bnp.png" alt="Samagam logo" className="login-logo" />
        <h1 className="login-title">Samagam</h1>
        <p className="login-subtitle">Sign in to continue</p>
        <div ref={googleBtnRef} className="login-btn-container" />
        {authError && <p className="login-error">{authError}</p>}
      </div>
    </div>
  )
}
