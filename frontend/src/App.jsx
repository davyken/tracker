// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import TrackerDashboard from './components/TrackerDashboard'
import BaitPage from './pages/BaitPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main tracker dashboard */}
        <Route path="/"                  element={<TrackerDashboard />} />
        <Route path="/tracker"           element={<TrackerDashboard />} />

        {/* Bait page — this is the link sent to the thief */}
        <Route path="/bait/:sessionId"   element={<BaitPage />} />

        {/* Fallback */}
        <Route path="*"                  element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
