import { useState, useEffect } from 'react'
import NetworkCanvas from './NetworkCanvas'

const SECTIONS = [
  {
    color: '#00ff88',
    text: `Frontier LLMs can juggle rich preference manifolds of hundreds of people in their context, enabling high-dimensional instant sorting. SOTA LLMs are the approximation algorithm killers. NP-hard no more.`,
  },
  {
    color: '#8866ff',
    text: `Opus can consider your 'character sheet', output productivity scores of hundreds of simulated interactions with other users, rate those interactions for cost/benefit, and compute your ideal spatiotemporal routing for serendipitymaxxing.`,
  },
  {
    color: '#ffaa00',
    text: `The more data about you, the higher the routing resolution. Want your agent to handle our character sheet crafting? Or do you have 10 minutes to talk to our curious agent per text or voice? Wanna do both? Let us get who you are and we'll email your ideal next month's schedule.`,
  },
  {
    color: '#ff3366',
    text: `1.0 will give you great recommendations. v2.0 will route you better than you could. v3.0 will be your exocortex' motor neurons to his meat puppet.`,
  },
]

function GlitchText({ text }) {
  const [display, setDisplay] = useState(text)
  const glitchChars = '▓▒░█▀▄═║◈◉✦❖'

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.12) {
        const glitched = text.split('').map(c =>
          Math.random() < 0.08 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : c
        ).join('')
        setDisplay(glitched)
        setTimeout(() => setDisplay(text), 120)
      }
    }, 2500)
    return () => clearInterval(interval)
  }, [text])

  return <span>{display}</span>
}

function ComingSoonButton({ label }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: 9,
        letterSpacing: 2,
        color: '#666',
        padding: '10px 18px',
        border: '1px solid #2a2a3e',
        borderRadius: 6,
        cursor: 'default',
        transition: 'all 0.2s ease',
        borderColor: hover ? '#444' : '#2a2a3e',
      }}>
        {label}
      </div>
      {hover && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 8,
          padding: '6px 14px',
          background: '#1a1a2e',
          border: '1px solid #2a2a4e',
          borderRadius: 6,
          fontFamily: 'var(--mono)',
          fontSize: 9,
          letterSpacing: 1,
          color: '#8866ff',
          whiteSpace: 'nowrap',
          zIndex: 10,
        }}>
          COMING SOON
        </div>
      )}
    </div>
  )
}

export default function Welcome({ onStart }) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true))
  }, [])

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <NetworkCanvas opacity={0.5} nodeCount={70} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 720,
        margin: '0 auto',
        padding: '80px 32px 60px',
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 64, textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: 6,
            color: 'var(--text-muted)',
            marginBottom: 20,
          }}>
            HUMAN ROUTING LAYER
          </div>
          <h1 style={{
            fontFamily: 'var(--mono)',
            fontSize: 38,
            fontWeight: 400,
            letterSpacing: 6,
            color: '#fff',
            marginBottom: 12,
          }}>
            <GlitchText text="CARBONROUTER" />
          </h1>
          <div style={{
            fontSize: 14,
            color: 'var(--text-dim)',
            lineHeight: 1.8,
            fontWeight: 300,
          }}>
            Nobody has a permanent address anymore.<br />
            They have a subscription and a preferences file.
          </div>
        </div>

        {/* Pitch sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {SECTIONS.map((s, i) => (
            <div
              key={i}
              style={{
                padding: '24px 28px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                borderLeft: `3px solid ${s.color}`,
                opacity: entered ? 1 : 0,
                transform: entered ? 'translateY(0)' : 'translateY(16px)',
                transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + i * 0.15}s`,
              }}
            >
              <p style={{
                fontSize: 14,
                lineHeight: 1.85,
                color: 'var(--text-dim)',
                fontWeight: 300,
              }}>
                {s.text}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 56,
          textAlign: 'center',
          opacity: entered ? 1 : 0,
          transition: 'opacity 1s ease 1.2s',
        }}>
          <button
            onClick={onStart}
            style={{
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
              padding: '16px 48px',
              borderRadius: 8,
              fontFamily: 'var(--mono)',
              fontSize: 13,
              letterSpacing: 4,
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
            TALK TO OUR AGENT
          </button>

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 24 }}>
            <span style={{
              fontFamily: 'var(--mono)',
              fontSize: 9,
              letterSpacing: 2,
              color: '#666',
            }}>
              VOICE MODE — COMING SOON
            </span>
          </div>

          <div style={{
            marginTop: 28,
            display: 'flex',
            justifyContent: 'center',
            gap: 20,
          }}>
            <ComingSoonButton label="CONNECT GOOGLE CALENDAR" />
            <ComingSoonButton label="CONNECT YOUR AI AGENT" />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 64,
          textAlign: 'center',
          fontFamily: 'var(--mono)',
          fontSize: 8,
          color: '#333',
          letterSpacing: 2,
        }}>
          ∙∙·▫▫ᵒᴼᵒ▫ₒₒ▫ᵒᴼᵒ▫▫·∙∙ v0.1.0 ∙∙·▫▫ᵒᴼᵒ▫ₒₒ▫ᵒᴼᵒ▫▫·∙∙
        </div>
      </div>
    </div>
  )
}
