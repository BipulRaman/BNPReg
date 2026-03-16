import { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import Layout from './components/Layout';
import Home from './pages/Home';
import Registrations from './pages/Registrations';
import Analytics from './pages/Analytics';
import Docgen from './pages/Docgen';
import AccessDenied from './pages/AccessDenied';
import { accessConfig, getAllowedPages, isEmailAllowed } from './access';

const GOOGLE_CLIENT_ID = '611874550622-envgonngfv8fan2i654sr89jpufi3g1v.apps.googleusercontent.com';

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
  const [denied, setDenied] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [allowedPages, setAllowedPages] = useState<string[]>([]);

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => {
          const payload = decodeJwtPayload(response.credential);
          const email = payload.email as string;
          const u: GoogleUser = {
            name: payload.name as string,
            email,
            picture: payload.picture as string,
          };
          if (!isEmailAllowed(accessConfig, email)) {
            setUser(u);
            setDenied(true);
            window.google?.accounts.id.disableAutoSelect();
          } else {
            setDenied(false);
            setAllowedPages(getAllowedPages(accessConfig, email));
            setUser(u);
          }
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
  }, [user]);

  const handleSignOut = useCallback(() => {
    window.google?.accounts.id.disableAutoSelect();
    setUser(null);
    setDenied(false);
  }, []);

  if (!user) {
    return <LoginScreen googleBtnRef={googleBtnRef} authError="" />;
  }

  if (denied) {
    return <AccessDenied user={user} onSignOut={handleSignOut} />;
  }

  return (
    <Routes>
      <Route element={<Layout user={user} onSignOut={handleSignOut} allowedPages={allowedPages} />}>
        <Route path="/" element={<Home />} />
        {allowedPages.includes('registrations') && (
          <Route path="/registrations" element={<Registrations />} />
        )}
        {allowedPages.includes('analytics') && (
          <Route path="/analytics" element={<Analytics />} />
        )}
        {allowedPages.includes('docgen') && (
          <Route path="/docgen" element={<Docgen />} />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
