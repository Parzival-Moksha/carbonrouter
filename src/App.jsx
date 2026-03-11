import { useState, useCallback } from 'react'
import Welcome from './components/Welcome'
import Interview from './components/Interview'
import VoiceInterview from './components/VoiceInterview'
import CharacterSheet from './components/CharacterSheet'

export default function App() {
  // view: welcome | interview | voice | sheet
  const [view, setView] = useState('welcome')
  const [transcript, setTranscript] = useState([])
  const [characterSheet, setCharacterSheet] = useState(null)

  const startInterview = useCallback(() => {
    setView('interview')
  }, [])

  const startVoice = useCallback(() => {
    setView('voice')
  }, [])

  const onInterviewComplete = useCallback((sheet, messages) => {
    setCharacterSheet(sheet)
    setTranscript(messages)
    setView('sheet')
  }, [])

  const restart = useCallback(() => {
    setView('welcome')
    setTranscript([])
    setCharacterSheet(null)
  }, [])

  return (
    <>
      {view === 'welcome' && <Welcome onStart={startInterview} onStartVoice={startVoice} />}
      {view === 'interview' && (
        <Interview onComplete={onInterviewComplete} />
      )}
      {view === 'voice' && (
        <VoiceInterview onComplete={onInterviewComplete} />
      )}
      {view === 'sheet' && (
        <CharacterSheet
          sheet={characterSheet}
          transcript={transcript}
          onRestart={restart}
        />
      )}
    </>
  )
}
