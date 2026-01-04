import './App.css'
import { Link, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Submit from './pages/Submit'
import Text from './pages/Text'
import Words from './pages/Words'
import Stats from './pages/Stats'
import Login from './pages/Login'
import Signup from './pages/Signup'
import { AudioSettingsProvider } from './context/AudioSettingsContext'
import SpeedControlFooter from './components/SpeedControlFooter'
import { StreakCounter } from './components/StreakCounter'
import { CoinsCounter } from './components/CoinsCounter'
import { CoinProvider } from './context/CoinContext'
import { StreakProvider } from './context/StreakContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

// Extract AppLayout to avoid duplication
function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <>
      <header className="app-header">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h2 className="title">OpenVerba</h2>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <nav className="app-nav">
            <Link to="/stats" className="badge">
              <StreakCounter />
              <CoinsCounter />
            </Link>
            <Link to="/words" className="badge">Words</Link>
            <Link to="/submit" className="badge badge-alt">New text</Link>
            <button
              onClick={logout}
              className="badge"
              style={{ cursor: 'pointer', background: 'transparent', border: 'none' }}
              title={`Logout (${user?.email})`}
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      {children}
      <SpeedControlFooter />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AudioSettingsProvider>
        <CoinProvider>
          <StreakProvider>
            <div style={{ paddingBottom: '5rem' }}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Home />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/submit"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Submit />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/words"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Words />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/texts/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Text />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/stats"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Stats />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </StreakProvider>
        </CoinProvider>
      </AudioSettingsProvider>
    </AuthProvider>
  )
}
