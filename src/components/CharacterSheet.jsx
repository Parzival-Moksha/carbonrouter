import { useState, useEffect } from 'react'
import NetworkCanvas from './NetworkCanvas'

function parseSheet(raw) {
  let archetype = 'The Unclassified'
  let profile = raw
  let routingVars = null

  const archMatch = raw.match(/ARCHETYPE:\s*(.+)/)
  if (archMatch) {
    archetype = archMatch[1].trim()
    profile = profile.replace(/ARCHETYPE:\s*.+\n?/, '').trim()
  }

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
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState('mutual') // anonymous | mutual | open
  const [saved, setSaved] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const parsed = parseSheet(sheet)

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true))
  }, [])

  const getSaveData = () => ({
    characterSheet: sheet,
    transcript: transcript.map(m => ({ role: m.role, content: m.content })),
    email: email || null,
    consentTier: consent,
    archetype: parsed.archetype,
    createdAt: new Date().toISOString(),
  })

  const handleSave = () => {
    localStorage.setItem('carbonrouter_profile', JSON.stringify(getSaveData()))
    setSaved(true)
  }

  const handleDownload = () => {
    const data = getSaveData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `carbonrouter-preferences-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const consentOptions = [
    { id: 'anonymous', label: 'ANONYMOUS', desc: 'Include me in routing, but never reveal my identity' },
    { id: 'mutual', label: 'MUTUAL REVEAL', desc: 'Reveal contacts only if both users accept a route' },
    { id: 'open', label: 'OPEN', desc: 'Contact visible to all users with a routing proposal above a certain synergy score' },
  ]

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
                <div key={i} style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                  <span style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    minWidth: 140,
                    letterSpacing: 0.5,
                  }}>
                    {rv.key}
                  </span>
                  <span style={{ color: 'var(--text-dim)', fontWeight: 300 }}>
                    {rv.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact & Consent */}
        <div style={{
          padding: '28px 28px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          marginBottom: 24,
          borderLeft: '3px solid var(--accent)',
        }}>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 9,
            letterSpacing: 4,
            color: 'var(--accent)',
            marginBottom: 20,
          }}>
            JOIN THE NETWORK
          </div>

          {/* Email */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 13,
              color: 'var(--text-dim)',
              marginBottom: 10,
              fontWeight: 300,
            }}>
              Where should we reach you when we find your routes?
            </div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 300,
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={e => e.target.style.borderColor = '#00ff8866'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Consent tiers */}
          <div>
            <div style={{
              fontSize: 13,
              color: 'var(--text-dim)',
              marginBottom: 12,
              fontWeight: 300,
            }}>
              May we include you in other users' routing computations?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {consentOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setConsent(opt.id)}
                  style={{
                    background: consent === opt.id ? '#00ff8812' : 'transparent',
                    border: `1px solid ${consent === opt.id ? '#00ff8844' : 'var(--border)'}`,
                    borderRadius: 8,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: 2,
                    color: consent === opt.id ? 'var(--accent)' : 'var(--text-muted)',
                    marginBottom: 4,
                  }}>
                    {consent === opt.id ? '● ' : '○ '}{opt.label}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: '#666',
                    fontWeight: 300,
                  }}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          marginTop: 32,
          alignItems: 'center',
        }}>
          {!saved ? (
            <button
              onClick={handleSave}
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
              SAVE
            </button>
          ) : (
            <>
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: 2,
                color: 'var(--accent)',
                padding: '14px 0',
              }}>
                ✓ SAVED
              </div>
              <button
                onClick={handleDownload}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  letterSpacing: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.target.style.borderColor = 'var(--accent)'
                  e.target.style.color = 'var(--accent)'
                }}
                onMouseLeave={e => {
                  e.target.style.borderColor = 'var(--border)'
                  e.target.style.color = 'var(--text-muted)'
                }}
              >
                DOWNLOAD JSON
              </button>
            </>
          )}
        </div>

        {/* Confirmation message — appears after save */}
        {saved && (
          <div style={{
            marginTop: 32,
            padding: '24px 28px',
            background: '#00ff8808',
            border: '1px solid #00ff8822',
            borderRadius: 12,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 15,
              color: 'var(--accent)',
              fontWeight: 400,
              marginBottom: 8,
              lineHeight: 1.8,
            }}>
              You're in the network.
            </div>
            <div style={{
              fontSize: 13,
              color: 'var(--text-dim)',
              fontWeight: 300,
              lineHeight: 1.8,
            }}>
              We'll email you as soon as we find your first high-synergy route.<br />
              You can close this window now.
            </div>
          </div>
        )}

        {/* Referral — copy link + CTA */}
        {saved && (
          <div style={{
            marginTop: 24,
            padding: '28px 28px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            borderLeft: '3px solid #8866ff',
          }}>
            <div style={{
              fontFamily: 'var(--mono)',
              fontSize: 9,
              letterSpacing: 4,
              color: '#8866ff',
              marginBottom: 16,
            }}>
              EXPAND THE NETWORK
            </div>
            <div style={{
              fontSize: 13,
              color: 'var(--text-dim)',
              fontWeight: 300,
              lineHeight: 1.8,
              marginBottom: 16,
            }}>
              The more people in the network, the better your routes. Send this to 2 friends who would benefit from CarbonRouter.
            </div>
            <div style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}>
              <input
                readOnly
                value="https://carbonrouter.vercel.app"
                style={{
                  flex: 1,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-dim)',
                  padding: '10px 14px',
                  fontSize: 13,
                  fontFamily: 'var(--mono)',
                  outline: 'none',
                }}
                onClick={e => e.target.select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText('https://carbonrouter.vercel.app')
                  setLinkCopied(true)
                  setTimeout(() => setLinkCopied(false), 2000)
                }}
                style={{
                  background: linkCopied ? '#8866ff22' : 'transparent',
                  border: `1px solid ${linkCopied ? '#8866ff' : 'var(--border)'}`,
                  color: linkCopied ? '#8866ff' : 'var(--text-muted)',
                  padding: '10px 18px',
                  borderRadius: 8,
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  letterSpacing: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: 80,
                }}
              >
                {linkCopied ? 'COPIED' : 'COPY'}
              </button>
            </div>
          </div>
        )}

        {/* Start over — subtle, at bottom */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            onClick={onRestart}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#333',
              fontFamily: 'var(--mono)',
              fontSize: 9,
              letterSpacing: 2,
              cursor: 'pointer',
              padding: '8px 16px',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--text-muted)'}
            onMouseLeave={e => e.target.style.color = '#333'}
          >
            START OVER
          </button>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 40,
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
