import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import type { UserSession } from './types/pangan';

export default function App() {
  // Sesi disimpan di memori React saja sesuai ketentuan prototipe
  const [session, setSession] = useState<UserSession | null>(null);

  if (!session) {
    return <LoginPage onLoginSuccess={setSession} />;
  }

  return <DashboardLayout session={session} onLogout={() => setSession(null)} />;
}
