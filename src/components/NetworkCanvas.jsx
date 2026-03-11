import { useRef, useEffect } from 'react'

// Particle network animation — nodes drifting, connecting when close
// Represents "routing humans like packets"
export default function NetworkCanvas({ opacity = 0.6, nodeCount = 60 }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const nodesRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let w, h

    const resize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Initialize nodes
    if (nodesRef.current.length === 0) {
      for (let i = 0; i < nodeCount; i++) {
        nodesRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 2 + 1,
          // Some nodes are "active" (green), most are dim
          active: Math.random() < 0.15,
          // A few are "routing" (purple pulse)
          routing: Math.random() < 0.06,
          pulse: Math.random() * Math.PI * 2,
        })
      }
    }

    const connectionDist = 160
    const nodes = nodesRef.current

    const draw = () => {
      ctx.clearRect(0, 0, w, h)

      // Update positions
      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        n.pulse += 0.02

        // Wrap around
        if (n.x < -10) n.x = w + 10
        if (n.x > w + 10) n.x = -10
        if (n.y < -10) n.y = h + 10
        if (n.y > h + 10) n.y = -10
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.25
            const isActiveConnection = nodes[i].active || nodes[j].active
            const isRoutingConnection = nodes[i].routing || nodes[j].routing

            if (isRoutingConnection) {
              ctx.strokeStyle = `rgba(136, 102, 255, ${alpha * 1.2})`
            } else if (isActiveConnection) {
              ctx.strokeStyle = `rgba(0, 255, 136, ${alpha})`
            } else {
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.3})`
            }
            ctx.lineWidth = isRoutingConnection ? 1.2 : 0.6
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      for (const n of nodes) {
        const pulseScale = n.routing ? 1 + Math.sin(n.pulse) * 0.5 : 1

        if (n.routing) {
          // Routing nodes: purple glow
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6 * pulseScale)
          glow.addColorStop(0, 'rgba(136, 102, 255, 0.3)')
          glow.addColorStop(1, 'rgba(136, 102, 255, 0)')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r * 6 * pulseScale, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = '#8866ff'
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r * 1.5, 0, Math.PI * 2)
          ctx.fill()
        } else if (n.active) {
          // Active nodes: green
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4)
          glow.addColorStop(0, 'rgba(0, 255, 136, 0.2)')
          glow.addColorStop(1, 'rgba(0, 255, 136, 0)')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = '#00ff88'
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
          ctx.fill()
        } else {
          // Dim nodes
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
          ctx.beginPath()
          ctx.arc(n.x, n.y, n.r * 0.7, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Occasional "routing event" — a bright line between two distant active nodes
      if (Math.random() < 0.003) {
        const activeNodes = nodes.filter(n => n.active || n.routing)
        if (activeNodes.length >= 2) {
          const a = activeNodes[Math.floor(Math.random() * activeNodes.length)]
          const b = activeNodes[Math.floor(Math.random() * activeNodes.length)]
          if (a !== b) {
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
            grad.addColorStop(0, 'rgba(0, 255, 136, 0.6)')
            grad.addColorStop(0.5, 'rgba(136, 102, 255, 0.4)')
            grad.addColorStop(1, 'rgba(0, 255, 136, 0.6)')
            ctx.strokeStyle = grad
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [nodeCount])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        opacity,
        pointerEvents: 'none',
      }}
    />
  )
}
