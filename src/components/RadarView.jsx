import React from 'react'

const CATEGORIES = [
  { label: 'Transport', value: 0.7 },
  { label: 'Energy', value: 0.5 },
  { label: 'Food', value: 0.8 },
  { label: 'Goods', value: 0.4 },
  { label: 'Services', value: 0.6 },
]

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) }
}

export default function RadarView() {
  const cx = 120
  const cy = 120
  const maxR = 100
  const angleStep = 360 / CATEGORIES.length

  const points = CATEGORIES.map((cat, i) => {
    const { x, y } = polarToCartesian(cx, cy, maxR * cat.value, i * angleStep)
    return `${x},${y}`
  }).join(' ')

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: '1rem', minWidth: 280 }}>
      <h2>Radar View</h2>
      <svg width={240} height={240} viewBox="0 0 240 240">
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <circle
            key={scale}
            cx={cx}
            cy={cy}
            r={maxR * scale}
            fill="none"
            stroke="#ddd"
            strokeWidth={1}
          />
        ))}
        {CATEGORIES.map((cat, i) => {
          const { x, y } = polarToCartesian(cx, cy, maxR, i * angleStep)
          const labelPos = polarToCartesian(cx, cy, maxR + 14, i * angleStep)
          return (
            <g key={cat.label}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="#ddd" strokeWidth={1} />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fill="#666"
              >
                {cat.label}
              </text>
            </g>
          )
        })}
        <polygon points={points} fill="rgba(59,130,246,0.3)" stroke="#3b82f6" strokeWidth={2} />
      </svg>
    </div>
  )
}
