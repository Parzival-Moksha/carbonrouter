import { useState, useRef, useEffect, useCallback } from 'react'
import { streamChat } from '../lib/api.js'
import { parseResponse, stripMetaFromStreaming, FIRST_MESSAGE } from '../lib/prompt.js'
import NetworkCanvas from './NetworkCanvas'

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''

function ResolutionMeter({ resolution, axesCovered, axesRemaining }) {
  const pct = Math.round((resolution || 0) * 100)
  const circumference = 2 * Math.PI * 52
  const offset = circumference - (pct / 100) * circumference
  const color = pct > 70 ? '#00ff88' : pct > 40 ? '#8866ff' : '#ff3366'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <svg width={120} height={120} viewBox="0 0 120 120">
          <circle cx={60} cy={60} r={52} fill="none" stroke="var(--border)" strokeWidth={3} />
          <circle
            cx={60} cy={60} r={52} fill="none" stroke={color} strokeWidth={3}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 28, fontWeight: 300, color, fontFamily: 'var(--mono)' }}>{pct}</div>
          <div style={{ fontSize: 7, color: 'var(--text-muted)', letterSpacing: 2, fontFamily: 'var(--mono)' }}>RESOLUTION</div>
        </div>
      </div>

      {axesCovered.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', maxWidth: 200 }}>
          {axesCovered.map((axis, i) => (
            <span key={i} style={{
              fontFamily: 'var(--mono)',
              fontSize: 7,
              letterSpacing: 1,
              color: '#00ff88',
              background: '#00ff8812',
              padding: '2px 6px',
              borderRadius: 3,
              border: '1px solid #00ff8833',
            }}>{axis}</span>
          ))}
          {axesRemaining.map((axis, i) => (
            <span key={`r-${i}`} style={{
              fontFamily: 'var(--mono)',
              fontSize: 7,
              letterSpacing: 1,
              color: 'var(--text-muted)',
              background: 'var(--bg-card)',
              padding: '2px 6px',
              borderRadius: 3,
              border: '1px solid var(--border)',
            }}>{axis}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function Message({ role, text, isStreaming }) {
  const isUser = role === 'user'

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 16,
    }}>
      <div style={{
        maxWidth: '80%',
        padding: '14px 18px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? 'var(--accent2-dim)' : 'var(--bg-elevated)',
        border: `1px solid ${isUser ? 'var(--accent2)' + '33' : 'var(--border)'}`,
        color: 'var(--text)',
        fontSize: 14,
        lineHeight: 1.75,
        fontWeight: 300,
      }}>
        {text}
        {isStreaming && (
          <span style={{
            display: 'inline-block',
            width: 6,
            height: 16,
            background: 'var(--accent)',
            marginLeft: 2,
            animation: 'blink 1s infinite',
            verticalAlign: 'text-bottom',
          }} />
        )}
      </div>
    </div>
  )
}

// Typewriter effect for the hardcoded first message
function TypewriterMessage({ text, onComplete }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        setDone(true)
        onComplete?.()
      }
    }, 9)
    return () => clearInterval(interval)
  }, [text])

  return <Message role="assistant" text={displayed} isStreaming={!done} />
}

export default function Interview({ onComplete }) {
  // Messages include the hardcoded first assistant message from the start
  const [messages, setMessages] = useState([
    { role: 'assistant', content: FIRST_MESSAGE, display: FIRST_MESSAGE },
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [resolution, setResolution] = useState(0)
  const [axesCovered, setAxesCovered] = useState([])
  const [axesRemaining, setAxesRemaining] = useState([
    'occupation', 'rhythm', 'personality', 'projects',
    'collaborators', 'ambitions', 'schedule', 'values', 'conflict', 'flow'
  ])
  const [error, setError] = useState('')
  const [firstMessageDone, setFirstMessageDone] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [messages, streamingText])

  useEffect(() => {
    if (firstMessageDone) {
      inputRef.current?.focus()
    }
  }, [firstMessageDone])

  const sendToAgent = async (chatMessages) => {
    setIsStreaming(true)
    setStreamingText('')
    setError('')

    try {
      const fullText = await streamChat(
        chatMessages.map(m => ({ role: m.role, content: m.content })),
        API_KEY,
        (_delta, full) => {
          // Strip metadata blocks during streaming to prevent jank
          const clean = stripMetaFromStreaming(full)
          setStreamingText(clean)
        }
      )

      const parsed = parseResponse(fullText)

      if (parsed.resolution !== null) {
        setResolution(parsed.resolution)
        setAxesCovered(parsed.axesCovered)
        setAxesRemaining(parsed.axesRemaining)
      }

      const newMessages = [...chatMessages, { role: 'assistant', content: fullText, display: parsed.text }]
      setMessages(newMessages)
      setStreamingText('')
      setIsStreaming(false)

      if (parsed.complete && parsed.characterSheet) {
        setTimeout(() => {
          onComplete(parsed.characterSheet, newMessages)
        }, 2000)
      }
    } catch (err) {
      setError(err.message)
      setIsStreaming(false)
    }
  }

  const handleSend = () => {
    if (!input.trim() || isStreaming) return

    const userMsg = { role: 'user', content: input.trim(), display: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    sendToAgent(newMessages)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFinishEarly = () => {
    const wrapUpMsg = { role: 'user', content: '[The user has chosen to finish early. Please generate the character sheet now with whatever data you have.]' }
    const newMessages = [...messages, wrapUpMsg]
    setMessages(newMessages)
    sendToAgent(newMessages)
  }

  // Display messages — first one gets typewriter, rest are instant
  const displayMessages = messages.map(m => ({
    role: m.role,
    text: m.display || m.content,
  }))

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg)',
      position: 'relative',
    }}>
      <NetworkCanvas opacity={0.15} nodeCount={30} />
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>

      {/* Sidebar */}
      <div style={{
        width: 220,
        borderRight: '1px solid var(--border)',
        padding: '32px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        zIndex: 1,
      }}>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 9,
          letterSpacing: 4,
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          CHARACTER<br />RESOLUTION
        </div>

        <ResolutionMeter
          resolution={resolution}
          axesCovered={axesCovered}
          axesRemaining={axesRemaining}
        />

        {resolution >= 0.5 && (
          <button
            onClick={handleFinishEarly}
            disabled={isStreaming}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 9,
              letterSpacing: 1,
              color: 'var(--text-muted)',
              background: 'transparent',
              border: '1px solid var(--border)',
              padding: '8px 14px',
              borderRadius: 6,
              cursor: isStreaming ? 'default' : 'pointer',
              opacity: isStreaming ? 0.3 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            FINISH EARLY
          </button>
        )}

        <div style={{
          marginTop: 'auto',
          fontFamily: 'var(--mono)',
          fontSize: 8,
          color: '#333',
          letterSpacing: 1,
          textAlign: 'center',
          lineHeight: 2,
        }}>
          CARBONROUTER<br />
          v0.1.0<br />
          character sheet crafter
        </div>
      </div>

      {/* Chat area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 760,
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 32px 16px',
        }}>
          {/* First message: typewriter effect */}
          {displayMessages.length > 0 && displayMessages[0].role === 'assistant' && (
            <TypewriterMessage
              text={displayMessages[0].text}
              onComplete={() => setFirstMessageDone(true)}
            />
          )}

          {/* Subsequent messages: instant render */}
          {displayMessages.slice(1).map((m, i) => (
            <Message key={i + 1} role={m.role} text={m.text} />
          ))}

          {isStreaming && streamingText && (
            <Message role="assistant" text={streamingText} isStreaming={true} />
          )}

          {isStreaming && !streamingText && (
            <div style={{
              display: 'flex',
              gap: 6,
              padding: '14px 18px',
              marginBottom: 16,
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--accent2)',
                  opacity: 0.5,
                  animation: `blink 1.4s infinite ${i * 0.2}s`,
                }} />
              ))}
            </div>
          )}

          {error && (
            <div style={{
              padding: '12px 18px',
              background: '#ff336615',
              border: '1px solid #ff336633',
              borderRadius: 8,
              color: '#ff3366',
              fontSize: 12,
              fontFamily: 'var(--mono)',
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '16px 32px 32px',
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-end',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isStreaming ? 'Agent is thinking...' : firstMessageDone ? 'Type your response...' : ''}
              disabled={isStreaming || !firstMessageDone}
              rows={1}
              style={{
                flex: 1,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                color: 'var(--text)',
                padding: '14px 18px',
                fontSize: 14,
                lineHeight: 1.6,
                resize: 'none',
                outline: 'none',
                fontWeight: 300,
                transition: 'border-color 0.2s ease',
                minHeight: 48,
                maxHeight: 160,
                overflow: 'auto',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent2)' + '66'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
              }}
            />
            <button
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              style={{
                background: input.trim() && !isStreaming ? 'var(--accent)' : 'var(--border)',
                border: 'none',
                color: input.trim() && !isStreaming ? 'var(--bg)' : 'var(--text-muted)',
                width: 48,
                height: 48,
                borderRadius: 10,
                cursor: input.trim() && !isStreaming ? 'pointer' : 'default',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
            >
              ↑
            </button>
          </div>
          <div style={{
            marginTop: 8,
            fontFamily: 'var(--mono)',
            fontSize: 9,
            color: '#333',
            letterSpacing: 1,
            textAlign: 'center',
          }}>
            ENTER to send
          </div>
        </div>
      </div>
    </div>
  )
}
