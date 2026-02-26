import React from 'react'
import PreferencesFile from './components/PreferencesFile'
import RadarView from './components/RadarView'

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>CarbonRouter</h1>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <PreferencesFile />
        <RadarView />
      </div>
    </div>
  )
}
