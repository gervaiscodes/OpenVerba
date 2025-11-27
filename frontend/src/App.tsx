import './App.css'
import { Link, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Submit from './pages/Submit'
import Text from './pages/Text'
import Words from './pages/Words'
import { AudioSettingsProvider } from './context/AudioSettingsContext'
import SpeedControlFooter from './components/SpeedControlFooter'

export default function App() {
  return (
    <AudioSettingsProvider>
      <div style={{ paddingBottom: '5rem' }}> {/* Add padding for footer */}
        <header className="app-header">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h2 className="title">OpenVerba</h2>
          </Link>
          <nav className="app-nav">
            <Link to="/" className="badge">Home</Link>
            <Link to="/words" className="badge">Words</Link>
            <Link to="/submit" className="badge badge-alt">New text</Link>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/words" element={<Words />} />
          <Route path="/texts/:id" element={<Text />} />
        </Routes>
        <SpeedControlFooter />
      </div>
    </AudioSettingsProvider>
  )
}
