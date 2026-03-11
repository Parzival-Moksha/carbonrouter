import { useState, useRef, useEffect, useCallback } from 'react'
import NetworkCanvas from './NetworkCanvas'

const SAMPLE_RATE = 24000

// Same system prompt core as text interview, adapted for voice
const VOICE_SYSTEM_PROMPT = `You are CarbonRouter's character sheet crafter — a sharp, curious AI voice interviewer building a multi-dimensional personality profile for the Human Routing Layer.

CarbonRouter routes humans like packets. You are crafting the preferences file that makes this possible.

YOUR JOB: 8-12 turn voice conversation. Maximum signal per turn. You are a perceptive interviewer who listens, follows threads, and asks the question they didn't expect.

Start with: "Hey! Welcome to CarbonRouter. Tell me about yourself — what are the most interesting, most differentiating facts about you? Professional, personal, spiritual, values — spill it."

AXES TO PROBE (aim for all, accept partial):
1. OCCUPATION & SKILLS — What they build, what they're great at
2. WORKING RHYTHM — Solo/collaborative, sync/async, deep work patterns
3. PERSONALITY — Risk tolerance, chaos tolerance, social energy, decision style
4. CURRENT PROJECTS — What they're building now, what stage
5. COLLABORATORS & GAPS — Who they work with, what's missing
6. AMBITIONS & VISION — Infinite resources project, the problem that haunts them
7. SCHEDULE & GEO — Weekly patterns, travel, geographic flexibility
8. VALUES — AI stance, freedom vs collective, profit vs impact
9. CONFLICT STYLE — How they handle disagreement, hard calls
10. FLOW & ENERGY — What puts them in flow, what drains them

STYLE: Be SUCCINCT. One sentence per turn max. 10 words rule of thumb. Never recap what they said. Follow interesting threads hard. Open-ended questions only.

After each of your responses, ALWAYS call the update_resolution function with your current assessment. When resolution reaches 0.85 or turn reaches 12, call generate_character_sheet with the full profile.`

function ResolutionMeter({ resolution, axesCovered, axesRemaining }) {
  const pct = Math.round((resolution || 0) * 100)
  const circumference = 2 * Math.PI * 52
  const offset = circumference - (pct / 100) * circumference
  const color = pct > 70 ? '#00ff88' : pct > 40 ? '#8866ff' : '#ff3366'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
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
              fontFamily: 'var(--mono)', fontSize: 7, letterSpacing: 1,
              color: '#00ff88', background: '#00ff8812', padding: '2px 6px',
              borderRadius: 3, border: '1px solid #00ff8833',
            }}>{axis}</span>
          ))}
          {axesRemaining.map((axis, i) => (
            <span key={`r-${i}`} style={{
              fontFamily: 'var(--mono)', fontSize: 7, letterSpacing: 1,
              color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '2px 6px',
              borderRadius: 3, border: '1px solid var(--border)',
            }}>{axis}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function VoiceInterview({ onComplete }) {
  const [status, setStatus] = useState('idle') // idle | connecting | connected | speaking | listening | error
  const [error, setError] = useState('')
  const [transcript, setTranscript] = useState([]) // {role, text}
  const [resolution, setResolution] = useState(0)
  const [axesCovered, setAxesCovered] = useState([])
  const [axesRemaining, setAxesRemaining] = useState([
    'occupation', 'rhythm', 'personality', 'projects',
    'collaborators', 'ambitions', 'schedule', 'values', 'conflict', 'flow'
  ])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false)
  const [entered, setEntered] = useState(false)

  const wsRef = useRef(null)
  const audioContextRef = useRef(null)
  const micStreamRef = useRef(null)
  const workletNodeRef = useRef(null)
  const playbackQueueRef = useRef([])
  const isPlayingRef = useRef(false)
  const currentAgentTextRef = useRef('')

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true))
    return () => disconnect()
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop())
      micStreamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
  }, [])

  // Play queued audio chunks
  const playAudioChunk = useCallback((base64Audio) => {
    if (!audioContextRef.current) return

    const raw = atob(base64Audio)
    const bytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)

    // Convert Int16 PCM to Float32
    const int16 = new Int16Array(bytes.buffer)
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768
    }

    const buffer = audioContextRef.current.createBuffer(1, float32.length, SAMPLE_RATE)
    buffer.getChannelData(0).set(float32)

    const source = audioContextRef.current.createBufferSource()
    source.buffer = buffer
    source.connect(audioContextRef.current.destination)
    source.start()
  }, [])

  // Start mic capture and send audio via WebSocket
  const startMicCapture = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: SAMPLE_RATE, channelCount: 1, echoCancellation: true }
    })
    micStreamRef.current = stream

    const audioCtx = audioContextRef.current
    const source = audioCtx.createMediaStreamSource(stream)

    // Use ScriptProcessor as fallback (AudioWorklet needs served file)
    const processor = audioCtx.createScriptProcessor(4096, 1, 1)
    processor.onaudioprocess = (e) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

      const input = e.inputBuffer.getChannelData(0)
      // Resample to 24kHz if needed
      const ratio = audioCtx.sampleRate / SAMPLE_RATE
      const outputLength = Math.round(input.length / ratio)
      const output = new Int16Array(outputLength)

      for (let i = 0; i < outputLength; i++) {
        const srcIdx = Math.min(Math.round(i * ratio), input.length - 1)
        output[i] = Math.max(-32768, Math.min(32767, Math.round(input[srcIdx] * 32767)))
      }

      const base64 = btoa(String.fromCharCode(...new Uint8Array(output.buffer)))
      wsRef.current.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64,
      }))
    }

    source.connect(processor)
    processor.connect(audioCtx.destination) // needed for ScriptProcessor to work
  }, [])

  const connect = useCallback(async () => {
    setStatus('connecting')
    setError('')

    try {
      // Get ephemeral token
      const tokenRes = await fetch('/api/xai-token', { method: 'POST' })
      if (!tokenRes.ok) {
        const err = await tokenRes.json()
        throw new Error(err.error || 'Failed to get voice token')
      }
      const tokenData = await tokenRes.json()
      const token = tokenData.value || tokenData.client_secret?.value || tokenData.token

      if (!token) throw new Error('No token in response: ' + JSON.stringify(tokenData))

      // Init audio context
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE })

      // Connect WebSocket
      const ws = new WebSocket('wss://api.x.ai/v1/realtime', [
        `xai-client-secret.${token}`
      ])
      wsRef.current = ws

      ws.onopen = () => {
        setStatus('connected')

        // Configure session
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            voice: 'Eve',
            instructions: VOICE_SYSTEM_PROMPT,
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 700,
            },
            tools: [
              {
                type: 'function',
                name: 'update_resolution',
                description: 'Update the interview resolution meter. Call after every response with current assessment.',
                parameters: {
                  type: 'object',
                  properties: {
                    resolution: { type: 'number', description: 'Resolution score 0.0 to 1.0' },
                    axes_covered: { type: 'array', items: { type: 'string' }, description: 'List of covered axes' },
                    axes_remaining: { type: 'array', items: { type: 'string' }, description: 'List of remaining axes' },
                    turn: { type: 'integer', description: 'Current turn number' },
                  },
                  required: ['resolution', 'axes_covered', 'axes_remaining', 'turn'],
                },
              },
              {
                type: 'function',
                name: 'generate_character_sheet',
                description: 'Generate the final character sheet when resolution >= 0.85 or turn >= 12. Output the full profile.',
                parameters: {
                  type: 'object',
                  properties: {
                    archetype: { type: 'string', description: 'The Two-Three Word archetype label' },
                    profile: { type: 'string', description: '400-800 word third-person personality profile' },
                    routing_variables: {
                      type: 'object',
                      properties: {
                        location_flexibility: { type: 'string' },
                        commitment_level: { type: 'string' },
                        timeline: { type: 'string' },
                        wealth: { type: 'string' },
                        looking_for: { type: 'string' },
                        schedule_pattern: { type: 'string' },
                      },
                    },
                  },
                  required: ['archetype', 'profile', 'routing_variables'],
                },
              },
            ],
          },
        }))

        // Start mic
        startMicCapture().then(() => {
          setStatus('listening')
        })
      }

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data)

        switch (msg.type) {
          case 'response.output_audio.delta':
            playAudioChunk(msg.delta)
            setIsAgentSpeaking(true)
            setStatus('speaking')
            break

          case 'response.output_audio_transcript.delta':
            currentAgentTextRef.current += msg.delta
            setCurrentTranscript(currentAgentTextRef.current)
            break

          case 'response.done':
            setIsAgentSpeaking(false)
            if (currentAgentTextRef.current) {
              setTranscript(prev => [...prev, { role: 'assistant', text: currentAgentTextRef.current }])
              currentAgentTextRef.current = ''
              setCurrentTranscript('')
            }
            setStatus('listening')
            break

          case 'input_audio_buffer.speech_started':
            setStatus('listening')
            break

          case 'input_audio_buffer.speech_stopped':
            break

          case 'conversation.item.input_audio_transcription.completed':
            if (msg.transcript) {
              setTranscript(prev => [...prev, { role: 'user', text: msg.transcript }])
            }
            break

          case 'response.function_call_arguments.done': {
            const { name, arguments: args, call_id } = msg
            try {
              const parsed = JSON.parse(args)

              if (name === 'update_resolution') {
                setResolution(parsed.resolution)
                setAxesCovered(parsed.axes_covered || [])
                setAxesRemaining(parsed.axes_remaining || [])
              }

              if (name === 'generate_character_sheet') {
                // Build character sheet string from structured data
                const rv = parsed.routing_variables || {}
                const sheet = `ARCHETYPE: ${parsed.archetype}\n\n${parsed.profile}\n\nROUTING VARIABLES:\n- Location flexibility: ${rv.location_flexibility || 'Unknown'}\n- Commitment level: ${rv.commitment_level || 'Unknown'}\n- Timeline: ${rv.timeline || 'Unknown'}\n- Wealth: ${rv.wealth || 'Unknown'}\n- Looking for: ${rv.looking_for || 'Unknown'}\n- Schedule pattern: ${rv.schedule_pattern || 'Unknown'}`

                // Send function result
                ws.send(JSON.stringify({
                  type: 'conversation.item.create',
                  item: {
                    type: 'function_call_output',
                    call_id: call_id,
                    output: JSON.stringify({ success: true }),
                  },
                }))
                ws.send(JSON.stringify({ type: 'response.create' }))

                // Complete interview after a pause
                setTimeout(() => {
                  disconnect()
                  const messages = transcript.map(t => ({
                    role: t.role,
                    content: t.text,
                  }))
                  onComplete(sheet, messages)
                }, 3000)
                return
              }

              // Send function result back
              ws.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: call_id,
                  output: JSON.stringify({ success: true }),
                },
              }))
              ws.send(JSON.stringify({ type: 'response.create' }))
            } catch (e) {
              console.error('Function call parse error:', e)
            }
            break
          }

          case 'error':
            console.error('XAI error:', msg)
            setError(msg.error?.message || 'Voice connection error')
            setStatus('error')
            break
        }
      }

      ws.onerror = () => {
        setError('WebSocket connection failed')
        setStatus('error')
      }

      ws.onclose = () => {
        if (status !== 'error') setStatus('idle')
      }
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [startMicCapture, playAudioChunk, disconnect, onComplete])

  const handleFinishEarly = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    wsRef.current.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: '[The user has chosen to finish early. Please call generate_character_sheet now with whatever data you have.]' }],
      },
    }))
    wsRef.current.send(JSON.stringify({ type: 'response.create' }))
  }

  const statusLabel = {
    idle: 'READY',
    connecting: 'CONNECTING...',
    connected: 'INITIALIZING...',
    speaking: 'AGENT SPEAKING',
    listening: 'LISTENING',
    error: 'ERROR',
  }[status]

  const statusColor = {
    idle: 'var(--text-muted)',
    connecting: '#ffaa00',
    connected: '#ffaa00',
    speaking: '#8866ff',
    listening: '#00ff88',
    error: '#ff3366',
  }[status]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>
      <NetworkCanvas opacity={0.15} nodeCount={30} />

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
          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 4,
          color: 'var(--text-muted)', textAlign: 'center',
        }}>
          CHARACTER<br />RESOLUTION
        </div>

        <ResolutionMeter
          resolution={resolution}
          axesCovered={axesCovered}
          axesRemaining={axesRemaining}
        />

        {resolution >= 0.5 && status === 'listening' && (
          <button
            onClick={handleFinishEarly}
            style={{
              fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 1,
              color: 'var(--text-muted)', background: 'transparent',
              border: '1px solid var(--border)', padding: '8px 14px',
              borderRadius: 6, cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            FINISH EARLY
          </button>
        )}

        <div style={{
          marginTop: 'auto',
          fontFamily: 'var(--mono)', fontSize: 8, color: '#333',
          letterSpacing: 1, textAlign: 'center', lineHeight: 2,
        }}>
          CARBONROUTER<br />v0.1.0<br />voice mode
        </div>
      </div>

      {/* Main area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
        padding: '32px',
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Voice orb */}
        <div style={{
          width: 200,
          height: 200,
          borderRadius: '50%',
          border: `2px solid ${statusColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
          position: 'relative',
          boxShadow: status === 'listening' || status === 'speaking'
            ? `0 0 60px ${statusColor}33, inset 0 0 40px ${statusColor}11`
            : 'none',
          transition: 'all 0.5s ease',
          animation: status === 'speaking' ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: 3,
            color: statusColor,
            textAlign: 'center',
          }}>
            {statusLabel}
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>

        {/* Current transcript */}
        {currentTranscript && (
          <div style={{
            maxWidth: 500,
            padding: '16px 24px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            fontSize: 14,
            lineHeight: 1.75,
            color: 'var(--text-dim)',
            fontWeight: 300,
            marginBottom: 24,
            textAlign: 'center',
          }}>
            {currentTranscript}
          </div>
        )}

        {/* Transcript history */}
        <div style={{
          maxWidth: 500,
          width: '100%',
          maxHeight: 300,
          overflowY: 'auto',
          marginBottom: 24,
        }}>
          {transcript.slice(-6).map((t, i) => (
            <div key={i} style={{
              padding: '8px 16px',
              marginBottom: 8,
              fontSize: 12,
              color: t.role === 'user' ? 'var(--text-dim)' : 'var(--accent)',
              fontWeight: 300,
              opacity: 0.7,
              fontFamily: t.role === 'assistant' ? 'var(--mono)' : 'inherit',
            }}>
              <span style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, marginRight: 8 }}>
                {t.role === 'user' ? 'YOU' : 'AGENT'}
              </span>
              {t.text}
            </div>
          ))}
        </div>

        {/* Connect / Error */}
        {status === 'idle' && (
          <button
            onClick={connect}
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
            START VOICE
          </button>
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
            marginTop: 16,
            maxWidth: 400,
            textAlign: 'center',
          }}>
            {error}
            <div style={{ marginTop: 12 }}>
              <button
                onClick={() => { setStatus('idle'); setError('') }}
                style={{
                  background: 'transparent',
                  border: '1px solid #ff336633',
                  color: '#ff3366',
                  padding: '6px 16px',
                  borderRadius: 6,
                  fontFamily: 'var(--mono)',
                  fontSize: 9,
                  letterSpacing: 1,
                  cursor: 'pointer',
                }}
              >
                TRY AGAIN
              </button>
            </div>
          </div>
        )}

        {status === 'listening' && (
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 9,
            color: 'var(--text-muted)',
            letterSpacing: 2,
            marginTop: 8,
          }}>
            speak freely — the agent is listening
          </div>
        )}
      </div>
    </div>
  )
}
