import { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import Layout from './components/Layout';
import Home from './pages/Home';
import Registrations from './pages/Registrations';
import Analytics from './pages/Analytics';
import Docgen from './pages/Docgen';

const GOOGLE_CLIENT_ID = '611874550622-envgonngfv8fan2i654sr89jpufi3g1v.apps.googleusercontent.com';
const ALLOWED_EMAILS_URL = 'https://cdn.bipul.in/bipul.in/sam5.json';

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

export default function App() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [authError, setAuthError] = useState('');
  const [allowedEmails, setAllowedEmails] = useState<string[] | null>(null);

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
        setAuthError('Something went wrong. Please try again later.');
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
            setAuthError('Access denied.');
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

  const handleSignOut = useCallback(() => {
    window.google?.accounts.id.disableAutoSelect();
    setUser(null);
  }, []);

  if (!user) {
    return <LoginScreen googleBtnRef={googleBtnRef} authError={authError} />;
  }

  return (
    <Routes>
      <Route element={<Layout user={user} onSignOut={handleSignOut} />}>
        <Route path="/" element={<Home />} />
        <Route path="/registrations" element={<Registrations />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/docgen" element={<Docgen />} />
      </Route>
    </Routes>
  );
}
