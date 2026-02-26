import React, { useState } from 'react'

export default function PreferencesFile() {
  const [preferences, setPreferences] = useState({
    carbonLimit: 100,
    unit: 'kg',
    alertsEnabled: true,
  })

  function handleChange(key, value) {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: '1rem', minWidth: 280 }}>
      <h2>Preferences</h2>
      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        Carbon Limit:
        <input
          type="number"
          value={preferences.carbonLimit}
          onChange={(e) => handleChange('carbonLimit', Number(e.target.value))}
          style={{ marginLeft: '0.5rem', width: 80 }}
        />
      </label>
      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        Unit:
        <select
          value={preferences.unit}
          onChange={(e) => handleChange('unit', e.target.value)}
          style={{ marginLeft: '0.5rem' }}
        >
          <option value="kg">kg CO₂</option>
          <option value="lb">lb CO₂</option>
        </select>
      </label>
      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
        <input
          type="checkbox"
          checked={preferences.alertsEnabled}
          onChange={(e) => handleChange('alertsEnabled', e.target.checked)}
        />{' '}
        Enable Alerts
      </label>
      <pre style={{ background: '#f5f5f5', padding: '0.5rem', borderRadius: 4, fontSize: 12 }}>
        {JSON.stringify(preferences, null, 2)}
      </pre>
    </div>
  )
}
