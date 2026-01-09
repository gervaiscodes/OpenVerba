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
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-white sm:text-xl">
              OpenVerba
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/stats"
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 sm:px-3 sm:py-2"
            >
              <StreakCounter />
              <CoinsCounter />
            </Link>

            <Link
              to="/words"
              className="rounded-md px-2 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 sm:px-3 sm:py-2"
            >
              Words
            </Link>

            <Link
              to="/submit"
              className="rounded-md bg-zinc-800 px-2 py-1.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-700 sm:px-3 sm:py-2"
            >
              <span className="hidden sm:inline">New text</span>
              <span className="sm:hidden">+</span>
            </Link>

            <button
              onClick={logout}
              className="rounded-md px-2 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 sm:px-3 sm:py-2"
              title={`Logout (${user?.email})`}
            >
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">↪</span>
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
