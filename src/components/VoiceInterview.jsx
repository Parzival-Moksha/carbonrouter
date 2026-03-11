import { useState, useRef, useEffect, useCallback } from 'react'
import NetworkCanvas from './NetworkCanvas'

// Based on xai-org/xai-cookbook/voice-examples/agent/web

const VOICE_SYSTEM_PROMPT = `You are CarbonRouter's character sheet crafter — a sharp, curious AI voice interviewer building a multi-dimensional personality profile for the Human Routing Layer.

CarbonRouter routes humans like packets. You are crafting the preferences file that makes this possible.

YOUR JOB: 8-12 turn voice conversation. Maximum signal per turn. You are a perceptive interviewer who listens, follows threads, and asks the question they didn't expect.

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

const CHUNK_DURATION_MS = 100

// --- Audio utilities (from xai cookbook) ---
function float32ToPCM16Base64(float32Array) {
  const pcm16 = new Int16Array(float32Array.length)
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]))
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  const bytes = new Uint8Array(pcm16.buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64PCM16ToFloat32(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const pcm16 = new Int16Array(bytes.buffer)
  const float32 = new Float32Array(pcm16.length)
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7fff)
  }
  return float32
}

// --- Resolution Meter (shared with text interview) ---
function ResolutionMeter({ resolution, axesCovered, axesRemaining }) {
  const pct = Math.round((resolution || 0) * 100)
  const circumference = 2 * Math.PI * 52
  const offset = circumference - (pct / 100) * circumference
  const color = pct > 70 ? '#00ff88' : pct > 40 ? '#8866ff' : '#ff3366'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        <svg width={120} height={120} viewBox="0 0 120 120">
          <circle cx={60} cy={60} r={52} fill="none" stroke="var(--border)" strokeWidth={3} />
          <circle
            cx={60} cy={60} r={52} fill="none" stroke={color} strokeWidth={3}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 60 60)"
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

// --- Main component ---
export default function VoiceInterview({ onComplete }) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [transcript, setTranscript] = useState([])
  const [resolution, setResolution] = useState(0)
  const [axesCovered, setAxesCovered] = useState([])
  const [axesRemaining, setAxesRemaining] = useState([
    'occupation', 'rhythm', 'personality', 'projects',
    'collaborators', 'ambitions', 'schedule', 'values', 'conflict', 'flow'
  ])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [entered, setEntered] = useState(false)

  const wsRef = useRef(null)
  const audioContextRef = useRef(null)
  const micStreamRef = useRef(null)
  const processorRef = useRef(null)
  const sourceNodeRef = useRef(null)
  const currentAgentTextRef = useRef('')
  const sessionConfiguredRef = useRef(false)
  const transcriptRef = useRef([])

  // Playback queue (cookbook pattern: queue + onended chaining)
  const playbackQueueRef = useRef([])
  const isPlayingRef = useRef(false)
  const currentSourceRef = useRef(null)

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true))
    return () => disconnect()
  }, [])

  // Keep transcript ref in sync for use in callbacks
  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  const disconnect = useCallback(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null }
    if (sourceNodeRef.current) { sourceNodeRef.current.disconnect(); sourceNodeRef.current = null }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null }
    stopPlayback()
    sessionConfiguredRef.current = false
  }, [])

  // --- Playback: queue + onended chaining (cookbook pattern) ---
  const stopPlayback = useCallback(() => {
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); currentSourceRef.current.disconnect() } catch {}
      currentSourceRef.current = null
    }
    playbackQueueRef.current = []
    isPlayingRef.current = false
  }, [])

  const playNextChunk = useCallback(() => {
    const ctx = audioContextRef.current
    if (!ctx || playbackQueueRef.current.length === 0) {
      isPlayingRef.current = false
      currentSourceRef.current = null
      return
    }

    const chunk = playbackQueueRef.current.shift()
    const buffer = ctx.createBuffer(1, chunk.length, ctx.sampleRate)
    buffer.getChannelData(0).set(chunk)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    currentSourceRef.current = source

    source.onended = () => {
      if (currentSourceRef.current === source) currentSourceRef.current = null
      playNextChunk()
    }
    source.start()
  }, [])

  const playAudio = useCallback((base64Audio) => {
    if (!audioContextRef.current) return
    const float32 = base64PCM16ToFloat32(base64Audio)
    playbackQueueRef.current.push(float32)

    if (!isPlayingRef.current) {
      isPlayingRef.current = true
      playNextChunk()
    }
  }, [playNextChunk])

  // --- Mic capture (cookbook pattern: native sample rate, chunked) ---
  const startMicCapture = useCallback(async () => {
    const ctx = audioContextRef.current
    const nativeSampleRate = ctx.sampleRate

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: nativeSampleRate,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
    micStreamRef.current = stream

    if (ctx.state === 'suspended') await ctx.resume()

    const source = ctx.createMediaStreamSource(stream)
    sourceNodeRef.current = source

    const processor = ctx.createScriptProcessor(4096, 1, 1)
    let audioBuffer = []
    let totalSamples = 0
    const chunkSizeSamples = (nativeSampleRate * CHUNK_DURATION_MS) / 1000

    processor.onaudioprocess = (e) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
      if (!sessionConfiguredRef.current) return

      const inputData = e.inputBuffer.getChannelData(0)
      audioBuffer.push(new Float32Array(inputData))
      totalSamples += inputData.length

      while (totalSamples >= chunkSizeSamples) {
        const chunk = new Float32Array(chunkSizeSamples)
        let offset = 0

        while (offset < chunkSizeSamples && audioBuffer.length > 0) {
          const buf = audioBuffer[0]
          const needed = chunkSizeSamples - offset
          if (buf.length <= needed) {
            chunk.set(buf, offset)
            offset += buf.length
            totalSamples -= buf.length
            audioBuffer.shift()
          } else {
            chunk.set(buf.subarray(0, needed), offset)
            audioBuffer[0] = buf.subarray(needed)
            offset += needed
            totalSamples -= needed
          }
        }

        const base64 = float32ToPCM16Base64(chunk)
        wsRef.current.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: base64,
        }))
      }
    }

    processorRef.current = processor
    source.connect(processor)
    processor.connect(ctx.destination)

    return nativeSampleRate
  }, [])

  // --- WebSocket connection (cookbook flow) ---
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
      const token = tokenData.value || tokenData.client_secret?.value

      if (!token) throw new Error('No token in response')

      // Init audio context with native sample rate
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const sampleRate = audioContextRef.current.sampleRate
      console.log('Native sample rate:', sampleRate)

      // Start mic capture first (cookbook pattern)
      const detectedRate = await startMicCapture()

      // Connect WebSocket with correct subprotocols (from cookbook)
      const ws = new WebSocket('wss://api.x.ai/v1/realtime', [
        'realtime',
        `openai-insecure-api-key.${token}`,
        'openai-beta.realtime-v1',
      ])
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setStatus('connected')
      }

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data)

        switch (msg.type) {
          // Step 1: conversation created → send session config
          case 'conversation.created':
            if (!sessionConfiguredRef.current) {
              ws.send(JSON.stringify({
                type: 'session.update',
                session: {
                  instructions: VOICE_SYSTEM_PROMPT,
                  voice: 'Eve',
                  audio: {
                    input: { format: { type: 'audio/pcm', rate: detectedRate } },
                    output: { format: { type: 'audio/pcm', rate: detectedRate } },
                  },
                  turn_detection: { type: 'server_vad' },
                  tools: [
                    {
                      type: 'function',
                      name: 'update_resolution',
                      description: 'Update the interview resolution meter. Call after every response.',
                      parameters: {
                        type: 'object',
                        properties: {
                          resolution: { type: 'number' },
                          axes_covered: { type: 'array', items: { type: 'string' } },
                          axes_remaining: { type: 'array', items: { type: 'string' } },
                          turn: { type: 'integer' },
                        },
                        required: ['resolution', 'axes_covered', 'axes_remaining', 'turn'],
                      },
                    },
                    {
                      type: 'function',
                      name: 'generate_character_sheet',
                      description: 'Generate the final character sheet when resolution >= 0.85 or turn >= 12.',
                      parameters: {
                        type: 'object',
                        properties: {
                          archetype: { type: 'string' },
                          profile: { type: 'string', description: '400-800 word personality profile' },
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
            }
            break

          // Step 2: session configured → send initial greeting
          case 'session.updated':
            if (!sessionConfiguredRef.current) {
              sessionConfiguredRef.current = true

              // Commit any buffered audio, then inject greeting trigger
              ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }))
              ws.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'message',
                  role: 'user',
                  content: [{
                    type: 'input_text',
                    text: 'Hey! Please introduce yourself and ask me your first question.',
                  }],
                },
              }))
              ws.send(JSON.stringify({ type: 'response.create' }))
              setStatus('speaking')
            }
            break

          // Audio playback
          case 'response.output_audio.delta':
            playAudio(msg.delta)
            setStatus('speaking')
            break

          // Transcript accumulation
          case 'response.output_audio_transcript.delta':
            currentAgentTextRef.current += msg.delta
            setCurrentTranscript(currentAgentTextRef.current)
            break

          // Response finished
          case 'response.done':
            if (currentAgentTextRef.current) {
              setTranscript(prev => [...prev, { role: 'assistant', text: currentAgentTextRef.current }])
              currentAgentTextRef.current = ''
              setCurrentTranscript('')
            }
            setStatus('listening')
            break

          // User started speaking → interrupt agent
          case 'input_audio_buffer.speech_started':
            stopPlayback()
            setStatus('listening')
            break

          // User transcript finalized
          case 'conversation.item.added':
            if (msg.item?.role === 'user' && msg.item?.content) {
              for (const c of msg.item.content) {
                if (c.type === 'input_audio' && c.transcript) {
                  setTranscript(prev => [...prev, { role: 'user', text: c.transcript }])
                  break
                }
              }
            }
            break

          // Function calls (silent resolution updates + character sheet)
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
                const rv = parsed.routing_variables || {}
                const sheet = `ARCHETYPE: ${parsed.archetype}\n\n${parsed.profile}\n\nROUTING VARIABLES:\n- Location flexibility: ${rv.location_flexibility || 'Unknown'}\n- Commitment level: ${rv.commitment_level || 'Unknown'}\n- Timeline: ${rv.timeline || 'Unknown'}\n- Wealth: ${rv.wealth || 'Unknown'}\n- Looking for: ${rv.looking_for || 'Unknown'}\n- Schedule pattern: ${rv.schedule_pattern || 'Unknown'}`

                ws.send(JSON.stringify({
                  type: 'conversation.item.create',
                  item: { type: 'function_call_output', call_id, output: JSON.stringify({ success: true }) },
                }))
                ws.send(JSON.stringify({ type: 'response.create' }))

                setTimeout(() => {
                  disconnect()
                  onComplete(sheet, transcriptRef.current.map(t => ({ role: t.role, content: t.text })))
                }, 3000)
                return
              }

              // Return function result
              ws.send(JSON.stringify({
                type: 'conversation.item.create',
                item: { type: 'function_call_output', call_id, output: JSON.stringify({ success: true }) },
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
        setStatus('idle')
      }
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }, [startMicCapture, playAudio, stopPlayback, disconnect, onComplete, playNextChunk])

  const handleFinishEarly = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    wsRef.current.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: '[User chose to finish early. Call generate_character_sheet now with whatever data you have.]' }],
      },
    }))
    wsRef.current.send(JSON.stringify({ type: 'response.create' }))
  }

  const statusLabel = {
    idle: 'READY', connecting: 'CONNECTING...', connected: 'INITIALIZING...',
    speaking: 'AGENT SPEAKING', listening: 'LISTENING', error: 'ERROR',
  }[status]

  const statusColor = {
    idle: 'var(--text-muted)', connecting: '#ffaa00', connected: '#ffaa00',
    speaking: '#8866ff', listening: '#00ff88', error: '#ff3366',
  }[status]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>
      <NetworkCanvas opacity={0.15} nodeCount={30} />

      {/* Sidebar */}
      <div style={{
        width: 220, borderRight: '1px solid var(--border)', padding: '32px 16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
        flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', zIndex: 1,
      }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 4, color: 'var(--text-muted)', textAlign: 'center' }}>
          CHARACTER<br />RESOLUTION
        </div>
        <ResolutionMeter resolution={resolution} axesCovered={axesCovered} axesRemaining={axesRemaining} />
        {resolution >= 0.5 && status === 'listening' && (
          <button onClick={handleFinishEarly} style={{
            fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: 1, color: 'var(--text-muted)',
            background: 'transparent', border: '1px solid var(--border)', padding: '8px 14px',
            borderRadius: 6, cursor: 'pointer',
          }}>FINISH EARLY</button>
        )}
        <div style={{ marginTop: 'auto', fontFamily: 'var(--mono)', fontSize: 8, color: '#333', letterSpacing: 1, textAlign: 'center', lineHeight: 2 }}>
          CARBONROUTER<br />v0.1.0<br />voice mode
        </div>
      </div>

      {/* Main area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative', zIndex: 1, padding: '32px',
        opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Voice orb */}
        <div style={{
          width: 200, height: 200, borderRadius: '50%', border: `2px solid ${statusColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32,
          boxShadow: (status === 'listening' || status === 'speaking') ? `0 0 60px ${statusColor}33, inset 0 0 40px ${statusColor}11` : 'none',
          transition: 'all 0.5s ease',
          animation: status === 'speaking' ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: 3, color: statusColor, textAlign: 'center' }}>
            {statusLabel}
          </div>
        </div>

        <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }`}</style>

        {/* Current agent transcript */}
        {currentTranscript && (
          <div style={{
            maxWidth: 500, padding: '16px 24px', background: 'var(--bg-elevated)',
            border: '1px solid var(--border)', borderRadius: 12, fontSize: 14,
            lineHeight: 1.75, color: 'var(--text-dim)', fontWeight: 300, marginBottom: 24, textAlign: 'center',
          }}>
            {currentTranscript}
          </div>
        )}

        {/* Transcript history */}
        <div style={{ maxWidth: 500, width: '100%', maxHeight: 300, overflowY: 'auto', marginBottom: 24 }}>
          {transcript.slice(-6).map((t, i) => (
            <div key={i} style={{
              padding: '8px 16px', marginBottom: 8, fontSize: 12,
              color: t.role === 'user' ? 'var(--text-dim)' : 'var(--accent)',
              fontWeight: 300, opacity: 0.7,
              fontFamily: t.role === 'assistant' ? 'var(--mono)' : 'inherit',
            }}>
              <span style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: 2, marginRight: 8 }}>
                {t.role === 'user' ? 'YOU' : 'AGENT'}
              </span>
              {t.text}
            </div>
          ))}
        </div>

        {/* Connect button */}
        {status === 'idle' && (
          <button onClick={connect} style={{
            background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)',
            padding: '16px 48px', borderRadius: 8, fontFamily: 'var(--mono)', fontSize: 13,
            letterSpacing: 4, cursor: 'pointer', transition: 'all 0.3s ease',
          }}
          onMouseEnter={e => { e.target.style.background = '#00ff8830'; e.target.style.boxShadow = '0 0 30px #00ff8822' }}
          onMouseLeave={e => { e.target.style.background = 'var(--accent-dim)'; e.target.style.boxShadow = 'none' }}
          >START VOICE</button>
        )}

        {error && (
          <div style={{
            padding: '12px 18px', background: '#ff336615', border: '1px solid #ff336633',
            borderRadius: 8, color: '#ff3366', fontSize: 12, fontFamily: 'var(--mono)',
            marginTop: 16, maxWidth: 400, textAlign: 'center',
          }}>
            {error}
            <div style={{ marginTop: 12 }}>
              <button onClick={() => { setStatus('idle'); setError('') }} style={{
                background: 'transparent', border: '1px solid #ff336633', color: '#ff3366',
                padding: '6px 16px', borderRadius: 6, fontFamily: 'var(--mono)', fontSize: 9,
                letterSpacing: 1, cursor: 'pointer',
              }}>TRY AGAIN</button>
            </div>
          </div>
        )}

        {status === 'listening' && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, marginTop: 8 }}>
            speak freely — the agent is listening
          </div>
        )}
      </div>
    </div>
  )
}
