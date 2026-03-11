import { useState, useEffect, useRef } from 'react'
import NetworkCanvas from './NetworkCanvas'

const SECTIONS = [
  {
    color: '#ff3366',
    image: '/images/seg01.jpg',
    text: `To meet the right person at the right time could be life-changing. What if once-in-a-decade encounters could happen every week? Can AI improve on our current human connection stack of happenstance, word-of-mouth, plus LinkedIn?`,
    effect: 'parallax',
  },
  {
    color: '#00ff88',
    image: '/images/seg02.jpg',
    text: `How many tokens does it take for an LLM to generate a high-resolution map of what makes you productive? Could we compute the highest expected synergy for sets of human interactions across hundreds of profiles in one context?`,
    effect: 'reveal',
  },
  {
    color: '#8866ff',
    image: '/images/seg03.jpg',
    text: `Frontier LLMs can juggle rich preference manifolds of hundreds of people in their context, enabling high-dimensional instant sorting. SOTA LLMs with quality context engineering are the approximation algorithm killers. NP-hard no more.`,
    effect: 'zoom',
  },
  {
    color: '#ffaa00',
    image: '/images/seg04.jpg',
    text: `Opus scores your productivity, synergy, and complementarity across dozens of dimensions with SOUL.md's of other, pre-selected users and computes your highest scoring ideal monthly routing schedule.`,
    effect: 'parallax',
  },
  {
    color: '#00ff88',
    image: '/images/seg05.jpg',
    text: `The more data about you, the higher the routing resolution. Want your personal agent to handle your profile creation? Or do you have 10 minutes to talk to our curious agent per text or voice? Wanna do both? Let us get who you are and we'll email your ideal routing for next month.`,
    effect: 'reveal',
  },
  {
    color: '#8866ff',
    image: '/images/seg06.jpg',
    text: `This is alpha, so just do a quick interview and recommend to 2 friends who you think would benefit from CarbonRouter. You'll hear from us when we know where to route you.`,
    effect: 'slideUp',
  },
  {
    color: '#ff3366',
    image: '/images/seg07.jpg',
    text: `1.0 will give you great recommendations. v2.0 will route you better than you could. v3.0 will be your exocortex's motor neurons to his meat puppet.`,
    effect: 'zoom',
  },
]

function FullSection({ section, index }) {
  const ref = useRef(null)
  const [progress, setProgress] = useState(0) // 0 = not visible, 1 = fully visible

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      // progress: 0 when section enters from bottom, 1 when fully covering viewport
      const p = Math.max(0, Math.min(1, 1 - rect.top / vh))
      setProgress(p)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const { effect, color, image, text } = section

  // Different transform styles based on effect type
  let sectionStyle = {}
  let bgStyle = {}
  let textStyle = {}

  if (effect === 'parallax') {
    // Background moves at half speed (parallax), content fades in
    sectionStyle = { position: 'relative', zIndex: index + 1 }
    bgStyle = {
      transform: `translateY(${(1 - progress) * 30}%)`,
    }
    textStyle = {
      opacity: Math.max(0, (progress - 0.3) / 0.5),
      transform: `translateY(${(1 - progress) * 60}px)`,
    }
  } else if (effect === 'reveal') {
    // Section is sticky/fixed, next section scrolls over it
    sectionStyle = { position: 'sticky', top: 0, zIndex: index }
    bgStyle = {}
    textStyle = {
      opacity: Math.max(0, (progress - 0.2) / 0.4),
      transform: `scale(${0.9 + progress * 0.1})`,
    }
  } else if (effect === 'zoom') {
    // Zooms in from far away
    sectionStyle = { position: 'relative', zIndex: index + 1 }
    const scale = 0.6 + progress * 0.4
    bgStyle = {
      transform: `scale(${scale})`,
    }
    textStyle = {
      opacity: Math.max(0, (progress - 0.4) / 0.4),
      transform: `translateY(${(1 - progress) * 40}px)`,
    }
  } else if (effect === 'slideUp') {
    // Slides up from below with momentum
    sectionStyle = { position: 'relative', zIndex: index + 1 }
    bgStyle = {}
    textStyle = {
      opacity: Math.max(0, (progress - 0.2) / 0.5),
      transform: `translateY(${(1 - progress) * 100}px)`,
    }
  }

  return (
    <div
      ref={ref}
      data-section={index + 1}
      style={{
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        ...sectionStyle,
      }}
    >
      {/* Background image */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.25,
        transition: 'transform 0.1s linear',
        ...bgStyle,
      }} />

      {/* Color gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at center, ${color}08 0%, #0a0a1a 70%)`,
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, #0a0a1a 100%)',
      }} />

      {/* Text content */}
      <div style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 10vw',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
        ...textStyle,
      }}>
        <div style={{ maxWidth: 800, textAlign: 'center' }}>
          {/* Section accent line */}
          <div style={{
            width: 40,
            height: 2,
            background: color,
            margin: '0 auto 28px',
            boxShadow: `0 0 20px ${color}66`,
          }} />

          <p style={{
            fontSize: 'clamp(20px, 3.2vw, 36px)',
            lineHeight: 1.6,
            color: '#e0e0e0',
            fontWeight: 300,
            letterSpacing: 0.5,
          }}>
            {text}
          </p>

          {/* Section indicator */}
          <div style={{
            marginTop: 32,
            fontFamily: 'var(--mono)',
            fontSize: 9,
            letterSpacing: 4,
            color: color,
            opacity: 0.5,
          }}>
            {String(index + 1).padStart(2, '0')} / {String(SECTIONS.length).padStart(2, '0')}
          </div>
        </div>
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

// Pill navigation — fixed left side
function PillNav({ currentSection, totalSections }) {
  // totalSections + 2: hero (0), sections (1..N), CTA (N+1)
  const total = totalSections + 2
  const pills = Array.from({ length: total }, (_, i) => i)

  return (
    <div style={{
      position: 'fixed',
      left: 24,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      zIndex: 100,
    }}>
      {pills.map(i => {
        const isActive = i === currentSection
        const color = i === 0 ? '#fff'
          : i === total - 1 ? '#00ff88'
          : SECTIONS[i - 1]?.color || '#666'

        return (
          <div
            key={i}
            style={{
              width: isActive ? 6 : 4,
              height: isActive ? 24 : 12,
              borderRadius: 3,
              background: isActive ? color : '#333',
              boxShadow: isActive ? `0 0 8px ${color}66` : 'none',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer',
            }}
            onClick={() => {
              const targets = document.querySelectorAll('[data-section]')
              targets[i]?.scrollIntoView({ behavior: 'smooth' })
            }}
          />
        )
      })}
    </div>
  )
}

export default function Welcome({ onStart, onStartVoice }) {
  const [entered, setEntered] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)
  const [showEnterButton, setShowEnterButton] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true))
  }, [])

  // Track which section is currently in view
  useEffect(() => {
    const sections = document.querySelectorAll('[data-section]')
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.getAttribute('data-section'))
            setCurrentSection(idx)
            // Show ENTER button after scrolling past hero
            setShowEnterButton(idx > 0)
          }
        })
      },
      { threshold: 0.5 }
    )

    sections.forEach(s => observer.observe(s))
    return () => observer.disconnect()
  }, [entered])

  return (
    <div style={{ background: '#0a0a1a' }}>
      <PillNav currentSection={currentSection} totalSections={SECTIONS.length} />

      {/* Sticky ENTER button — top right, appears after hero */}
      <div style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 100,
        opacity: showEnterButton ? 1 : 0,
        transform: showEnterButton ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.4s ease',
        pointerEvents: showEnterButton ? 'auto' : 'none',
      }}>
        <button
          onClick={() => {
            const cta = document.querySelector(`[data-section="${SECTIONS.length + 1}"]`)
            cta?.scrollIntoView({ behavior: 'smooth' })
          }}
          style={{
            background: '#00ff8818',
            border: '1px solid #00ff8844',
            color: '#00ff88',
            padding: '10px 24px',
            borderRadius: 6,
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: 3,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(12px)',
          }}
          onMouseEnter={e => {
            e.target.style.background = '#00ff8830'
            e.target.style.boxShadow = '0 0 20px #00ff8822'
          }}
          onMouseLeave={e => {
            e.target.style.background = '#00ff8818'
            e.target.style.boxShadow = 'none'
          }}
        >
          ENTER
        </button>
      </div>
      {/* Hero section — full viewport */}
      <div data-section="0" style={{
        height: '100vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <NetworkCanvas opacity={0.5} nodeCount={70} />

        <div style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '0 32px',
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
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
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 400,
            letterSpacing: 8,
            color: '#fff',
            marginBottom: 16,
          }}>
            <GlitchText text="CARBONROUTER" />
          </h1>
          <div style={{
            fontSize: 16,
            color: 'var(--text-dim)',
            lineHeight: 2,
            fontWeight: 300,
            maxWidth: 500,
            margin: '0 auto',
          }}>
            Nobody has a permanent address anymore.<br />
            They have a subscription and a preferences file.
          </div>

          {/* Scroll indicator */}
          <div style={{
            marginTop: 60,
            opacity: entered ? 0.4 : 0,
            transition: 'opacity 2s ease 1.5s',
            animation: 'scrollBounce 2s ease-in-out infinite',
          }}>
            <div style={{
              fontFamily: 'var(--mono)',
              fontSize: 8,
              letterSpacing: 3,
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}>
              SCROLL
            </div>
            <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>↓</div>
          </div>
        </div>

        <style>{`
          @keyframes scrollBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(8px); }
          }
        `}</style>
      </div>

      {/* Full-page pitch sections */}
      {SECTIONS.map((s, i) => (
        <FullSection key={i} section={s} index={i} />
      ))}

      {/* CTA section — full viewport */}
      <div data-section={SECTIONS.length + 1} style={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: SECTIONS.length + 1,
      }}>
        <NetworkCanvas opacity={0.3} nodeCount={50} />

        <div style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '60px 32px',
          maxWidth: 700,
        }}>
          {/* CTA buttons */}
          <div style={{ marginBottom: 48 }}>
            <div style={{
              fontFamily: 'var(--mono)',
              fontSize: 9,
              letterSpacing: 4,
              color: 'var(--text-muted)',
              marginBottom: 24,
            }}>
              BEGIN YOUR CHARACTER SHEET
            </div>

            <button
              onClick={onStart}
              style={{
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                padding: '18px 56px',
                borderRadius: 8,
                fontFamily: 'var(--mono)',
                fontSize: 14,
                letterSpacing: 5,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => {
                e.target.style.background = '#00ff8830'
                e.target.style.boxShadow = '0 0 40px #00ff8822'
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
            padding: '28px 28px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            borderLeft: '3px solid #ffaa00',
            textAlign: 'left',
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
            marginTop: 48,
            fontFamily: 'var(--mono)',
            fontSize: 8,
            color: '#333',
            letterSpacing: 2,
          }}>
            ∙∙·▫▫ᵒᴼᵒ▫ₒₒ▫ᵒᴼᵒ▫▫·∙∙ v0.1.0 ∙∙·▫▫ᵒᴼᵒ▫ₒₒ▫ᵒᴼᵒ▫▫·∙∙
          </div>
        </div>
      </div>
    </div>
  )
}
