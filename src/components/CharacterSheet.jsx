import { useState, useEffect } from 'react'
import NetworkCanvas from './NetworkCanvas'

function parseSheet(raw) {
  let archetype = 'The Unclassified'
  let profile = raw
  let routingVars = null

  // Extract archetype
  const archMatch = raw.match(/ARCHETYPE:\s*(.+)/)
  if (archMatch) {
    archetype = archMatch[1].trim()
    profile = profile.replace(/ARCHETYPE:\s*.+\n?/, '').trim()
  }

  // Extract routing variables
  const routingMatch = profile.match(/ROUTING VARIABLES:\s*\n([\s\S]+)$/i)
  if (routingMatch) {
    routingVars = routingMatch[1].trim().split('\n').map(l => {
      const [key, ...rest] = l.replace(/^-\s*/, '').split(':')
      return { key: key.trim(), value: rest.join(':').trim() }
    }).filter(r => r.key && r.value)
    profile = profile.replace(/ROUTING VARIABLES:\s*\n[\s\S]+$/i, '').trim()
  }

  return { archetype, profile, routingVars }
}

export default function CharacterSheet({ sheet, transcript, onRestart }) {
  const [entered, setEntered] = useState(false)
  const parsed = parseSheet(sheet)

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true))
  }, [])

  const handleSaveToNetwork = () => {
    // For now, save to localStorage
    const data = {
      characterSheet: sheet,
      transcript: transcript.map(m => ({ role: m.role, content: m.content })),
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('carbonrouter_profile', JSON.stringify(data))

    // Also offer download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `carbonrouter-preferences-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <NetworkCanvas opacity={0.3} nodeCount={40} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 680,
        margin: '0 auto',
        padding: '60px 32px 80px',
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 9,
            letterSpacing: 6,
            color: 'var(--text-muted)',
            marginBottom: 16,
          }}>
            YOUR PREFERENCES FILE
          </div>
          <h1 style={{
            fontFamily: 'var(--mono)',
            fontSize: 28,
            fontWeight: 400,
            color: 'var(--accent)',
            letterSpacing: 3,
            marginBottom: 8,
          }}>
            {parsed.archetype}
          </h1>
          <div style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            fontFamily: 'var(--mono)',
            letterSpacing: 1,
          }}>
            crafted by CarbonRouter v0.1.0
          </div>
        </div>

        {/* Profile */}
        <div style={{
          padding: '32px 28px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          marginBottom: 24,
          borderLeft: '3px solid var(--accent2)',
        }}>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 9,
            letterSpacing: 4,
            color: 'var(--accent2)',
            marginBottom: 20,
          }}>
            CHARACTER PROFILE
          </div>
          <div style={{
            fontSize: 14,
            lineHeight: 2,
            color: 'var(--text-dim)',
            fontWeight: 300,
            whiteSpace: 'pre-wrap',
          }}>
            {parsed.profile}
          </div>
        </div>

        {/* Routing Variables */}
        {parsed.routingVars && (
          <div style={{
            padding: '24px 28px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            marginBottom: 24,
            borderLeft: '3px solid var(--accent4)',
          }}>
            <div style={{
              fontFamily: 'var(--mono)',
              fontSize: 9,
              letterSpacing: 4,
              color: 'var(--accent4)',
              marginBottom: 16,
            }}>
              ROUTING VARIABLES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {parsed.routingVars.map((rv, i) => (
                <div key={i} style={{
                  display: 'flex',
                  gap: 12,
                  fontSize: 13,
                }}>
                  <span style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    minWidth: 140,
                    letterSpacing: 0.5,
                  }}>
                    {rv.key}
                  </span>
                  <span style={{
                    color: 'var(--text-dim)',
                    fontWeight: 300,
                  }}>
                    {rv.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Network status */}
        <div style={{
          padding: '24px 28px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          marginBottom: 24,
          borderLeft: '3px solid var(--accent)',
          textAlign: 'center',
        }}>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 9,
            letterSpacing: 4,
            color: 'var(--accent)',
            marginBottom: 12,
          }}>
            NETWORK STATUS
          </div>
          <div style={{
            fontSize: 13,
            color: 'var(--text-dim)',
            lineHeight: 1.8,
            fontWeight: 300,
          }}>
            Your preferences file is ready for the network.<br />
            When enough nodes are connected, we'll compute your first routing schedule.
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          marginTop: 32,
        }}>
          <button
            onClick={handleSaveToNetwork}
            style={{
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
              padding: '14px 32px',
              borderRadius: 8,
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: 3,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.target.style.background = '#00ff8830'
              e.target.style.boxShadow = '0 0 30px #00ff8822'
            }}
            onMouseLeave={e => {
              e.target.style.background = 'var(--accent-dim)'
              e.target.style.boxShadow = 'none'
            }}
          >
            SAVE & DOWNLOAD
          </button>

          <button
            onClick={onRestart}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              padding: '14px 24px',
              borderRadius: 8,
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: 2,
              cursor: 'pointer',
            }}
          >
            START OVER
          </button>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 56,
          textAlign: 'center',
          fontFamily: 'var(--mono)',
          fontSize: 8,
          color: '#333',
          letterSpacing: 2,
          lineHeight: 2.5,
        }}>
          ∙∙·▫▫ᵒᴼᵒ▫ₒₒ▫ᵒᴼᵒ▫▫·∙∙<br />
          the network routes humans like packets<br />
          ∙∙·▫▫ᵒᴼᵒ▫ₒₒ▫ᵒᴼᵒ▫▫·∙∙
        </div>
      </div>
    </div>
  )
}
