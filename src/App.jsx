import { useState } from 'react'
import PreferencesFile from './components/PreferencesFile'
import RadarView from './components/RadarView'

export default function App() {
  const [view, setView] = useState('preferences')

  return (
    <div style={{ background: '#08080f', minHeight: '100vh' }}>
      {/* Navigation */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', justifyContent: 'center', gap: 8,
        padding: '12px 16px',
        background: '#08080fdd', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1a1a2e',
      }}>
        <button
          onClick={() => setView('preferences')}
          style={{
            background: view === 'preferences' ? '#ff336615' : 'transparent',
            border: `1px solid ${view === 'preferences' ? '#ff336666' : '#2a2a3e'}`,
            color: view === 'preferences' ? '#ff3366' : '#555',
            padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
            fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 1.5,
          }}
        >
          ⚡ INTAKE
        </button>
        <button
          onClick={() => setView('radar')}
          style={{
            background: view === 'radar' ? '#00ff8815' : 'transparent',
            border: `1px solid ${view === 'radar' ? '#00ff8866' : '#2a2a3e'}`,
            color: view === 'radar' ? '#00ff88' : '#555',
            padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
            fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 1.5,
          }}
        >
          ◈ RADAR
        </button>
      </nav>

      {/* Content */}
      <div style={{ paddingTop: 48 }}>
        {view === 'preferences' ? <PreferencesFile /> : <RadarView />}
      </div>
    </div>
  )
}
