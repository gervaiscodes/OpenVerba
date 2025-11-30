import './App.css'
import { Link, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Submit from './pages/Submit'
import Text from './pages/Text'
import Words from './pages/Words'
import Stats from './pages/Stats'
import { AudioSettingsProvider } from './context/AudioSettingsContext'
import SpeedControlFooter from './components/SpeedControlFooter'
import { StreakCounter } from './components/StreakCounter'
import { CoinsCounter } from './components/CoinsCounter'
import { CoinProvider } from './context/CoinContext'

export default function App() {
  return (
    <AudioSettingsProvider>
      <CoinProvider>
        <div style={{ paddingBottom: '5rem' }}> {/* Add padding for footer */}
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
              </nav>
            </div>
          </header>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/submit" element={<Submit />} />
            <Route path="/words" element={<Words />} />
            <Route path="/texts/:id" element={<Text />} />
            <Route path="/stats" element={<Stats />} />
          </Routes>
          <SpeedControlFooter />
        </div>
      </CoinProvider>
    </AudioSettingsProvider>
  )
}
