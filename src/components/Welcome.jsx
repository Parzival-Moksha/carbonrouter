import { useState, useEffect, useRef } from 'react'
import NetworkCanvas from './NetworkCanvas'

const SECTIONS = [
  {
    color: '#ff3366',
    image: '/images/seg01.jpg',
    text: `To meet the right person at the right time could be life-changing. What if once-in-a-decade encounters could happen every week? Can AI improve on our current human connection stack of happenstance, word-of-mouth, plus LinkedIn?`,
    animation: 'slideUp',
  },
  {
    color: '#00ff88',
    image: '/images/seg02.jpg',
    text: `How many tokens does it take for an LLM to generate a high-resolution map of what makes you productive? Could we compute the highest expected synergy for sets of human interactions across hundreds of profiles in one context?`,
    animation: 'slideRight',
  },
  {
    color: '#8866ff',
    image: '/images/seg03.jpg',
    text: `Frontier LLMs can juggle rich preference manifolds of hundreds of people in their context, enabling high-dimensional instant sorting. SOTA LLMs with quality context engineering are the approximation algorithm killers. NP-hard no more.`,
    animation: 'fadeScale',
  },
  {
    color: '#ffaa00',
    image: '/images/seg04.jpg',
    text: `Opus scores your productivity, synergy, and complementarity across dozens of dimensions with SOUL.md's of other, pre-selected users and computes your highest scoring ideal monthly routing schedule.`,
    animation: 'slideLeft',
  },
  {
    color: '#00ff88',
    image: '/images/seg05.jpg',
    text: `The more data about you, the higher the routing resolution. Want your personal agent to handle your profile creation? Or do you have 10 minutes to talk to our curious agent per text or voice? Wanna do both? Let us get who you are and we'll email your ideal routing for next month.`,
    animation: 'slideUp',
  },
  {
    color: '#8866ff',
    image: '/images/seg06.jpg',
    text: `This is alpha, so just do a quick interview and recommend to 2 friends who you think would benefit from CarbonRouter. You'll hear from us when we know where to route you.`,
    animation: 'fadeScale',
  },
  {
    color: '#ff3366',
    image: '/images/seg07.jpg',
    text: `1.0 will give you great recommendations. v2.0 will route you better than you could. v3.0 will be your exocortex's motor neurons to his meat puppet.`,
    animation: 'slideRight',
  },
]

// Scroll-triggered section with background image
function ScrollSection({ section, index }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const transforms = {
    slideUp: visible ? 'translateY(0)' : 'translateY(60px)',
    slideRight: visible ? 'translateX(0)' : 'translateX(-80px)',
    slideLeft: visible ? 'translateX(0)' : 'translateX(80px)',
    fadeScale: visible ? 'scale(1)' : 'scale(0.92)',
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transform: transforms[section.animation],
        transition: `all 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${0.05 * index}s`,
      }}
    >
      {/* Background image */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${section.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.2,
        filter: 'brightness(0.7) saturate(0.8)',
      }} />

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(135deg, ${section.color}10 0%, var(--bg-card) 40%, var(--bg-card) 100%)`,
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        padding: '28px 32px',
        borderLeft: `3px solid ${section.color}`,
        border: '1px solid var(--border)',
        borderRadius: 14,
      }}>
        <p style={{
          fontSize: 14,
          lineHeight: 1.85,
          color: 'var(--text-dim)',
          fontWeight: 300,
        }}>
          {section.text}
        </p>
      </div>
    </div>
  )
}

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

export default function Welcome({ onStart, onStartVoice }) {
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
      }}>
        {/* Header */}
        <div style={{
          marginBottom: 64,
          textAlign: 'center',
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
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

        {/* Pitch sections with scroll animations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {SECTIONS.map((s, i) => (
            <ScrollSection key={i} section={s} index={i} />
          ))}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 56,
          textAlign: 'center',
          opacity: entered ? 1 : 0,
          transition: 'opacity 1s ease 1.4s',
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
            <button
              onClick={onStartVoice}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 9,
                letterSpacing: 2,
                color: '#8866ff',
                background: 'transparent',
                border: '1px solid #8866ff44',
                padding: '10px 24px',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.target.style.background = '#8866ff15'
                e.target.style.borderColor = '#8866ff88'
              }}
              onMouseLeave={e => {
                e.target.style.background = 'transparent'
                e.target.style.borderColor = '#8866ff44'
              }}
            >
              VOICE MODE
            </button>
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

        {/* Roadmap */}
        <div style={{
          marginTop: 56,
          padding: '28px 28px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          borderLeft: '3px solid #ffaa00',
        }}>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 9,
            letterSpacing: 4,
            color: '#ffaa00',
            marginBottom: 20,
          }}>
            ROADMAP
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { v: 'v0.1', label: 'Character sheet crafter (AI interview, text + voice)', active: true },
              { v: 'v0.2', label: 'Multi-profile matching engine' },
              { v: 'v0.3', label: 'Interactive route proposals with one-time email auth and chat' },
              { v: 'v0.4', label: 'Agent-to-agent data gathering' },
              { v: 'v0.5', label: 'Google Calendar + more app integrations' },
              { v: 'v0.6', label: 'Multi-route synergy calculation with high-res simulations' },
              { v: 'v1.0', label: 'Post-encounter feedback loop — character sheets update from interaction data' },
              { v: 'v2.0', label: 'Proactive routing updates so good you accept them by default' },
              { v: 'v3.0', label: 'Exocortex — merging to the Everything App' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
                <span style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: item.active ? '#00ff88' : 'var(--text-muted)',
                  minWidth: 36,
                  letterSpacing: 0.5,
                }}>
                  {item.v}
                </span>
                <span style={{
                  fontSize: 12,
                  color: item.active ? 'var(--text)' : '#555',
                  fontWeight: 300,
                }}>
                  {item.label} {item.active && '←'}
                </span>
              </div>
            ))}
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
