import { useState, useEffect, useCallback } from 'react'
import PreferencesFile from './components/PreferencesFile'
import RadarView from './components/RadarView'

// Maps intake question IDs (Layer 1 sliders) to radar trait keys
const QUESTION_TO_TRAIT = {
  8: 'builder_visionary',
  9: 'speed_quality',
  10: 'risk',
  11: 'chaos',
  12: 'social',
  13: 'decisions',
  14: 'focus',
  15: 'conflict',
  16: 'learning',
  17: 'exploit',
}

function deriveTraits(answers) {
  const traits = {}
  for (const [qId, traitKey] of Object.entries(QUESTION_TO_TRAIT)) {
    if (answers[qId] !== undefined) {
      traits[traitKey] = answers[qId]
    }
  }
  return traits
}

function loadFromStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

export default function App() {
  const [view, setView] = useState('preferences')
  const [answers, setAnswers] = useState(() => loadFromStorage('carbonrouter_answers', {}))

  // Persist answers to localStorage on every change
  useEffect(() => {
    try { localStorage.setItem('carbonrouter_answers', JSON.stringify(answers)) } catch {}
  }, [answers])

  const handleAnswer = useCallback((questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }, [])

  const intakeTraits = deriveTraits(answers)
  const answeredCount = Object.keys(answers).length
  const traitCount = Object.keys(intakeTraits).length

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
          ⚡ INTAKE{answeredCount > 0 ? ` ${answeredCount}/30` : ''}
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
          ◈ RADAR{traitCount > 0 ? ` ${traitCount}/10` : ''}
        </button>
      </nav>

      {/* Content */}
      <div style={{ paddingTop: 48 }}>
        {view === 'preferences'
          ? <PreferencesFile answers={answers} onAnswer={handleAnswer} />
          : <RadarView intakeTraits={intakeTraits} />
        }
      </div>
    </div>
  )
}
