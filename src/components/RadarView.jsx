import { useState, useEffect, useRef, useCallback } from "react";

const TRAITS = [
  { key: "builder_visionary", label: "Builder ↔ Visionary", left: "Builder", right: "Visionary", complementary: true },
  { key: "speed_quality", label: "Speed ↔ Quality", left: "Speed", right: "Quality", complementary: true },
  { key: "risk", label: "Risk Tolerance", left: "Safety net", right: "Pyromaniac", complementary: false },
  { key: "chaos", label: "Chaos Tolerance", left: "Structure", right: "Entropy", complementary: true },
  { key: "social", label: "Social Energy", left: "Deep 1:1", right: "Conference mode", complementary: true },
  { key: "decisions", label: "Decision Style", left: "Data-driven", right: "Intuition", complementary: true },
  { key: "focus", label: "Focus Style", left: "Monomaniac", right: "Parallel threads", complementary: true },
  { key: "conflict", label: "Conflict Style", left: "Harmony", right: "Direct", complementary: false },
  { key: "learning", label: "Learning Mode", left: "Read first", right: "Act first", complementary: true },
  { key: "exploit", label: "Explore ↔ Exploit", left: "Explorer", right: "Finisher", complementary: true },
];

const VALUES = [
  { key: "ai_philosophy", label: "AI Philosophy", left: "Careful", right: "Accelerate" },
  { key: "profit_impact", label: "Profit ↔ Impact", left: "Profit", right: "Impact" },
  { key: "openness", label: "Open ↔ Stealth", left: "Build in public", right: "Stealth mode" },
];

function computeComplement(traits) {
  const comp = {};
  TRAITS.forEach((t) => {
    const val = traits[t.key] || 3;
    if (t.complementary) {
      comp[t.key] = 6 - val;
    } else {
      comp[t.key] = val;
    }
  });
  return comp;
}

function computeMatchScore(a, b) {
  let score = 0;
  let maxScore = 0;
  TRAITS.forEach((t) => {
    const va = a[t.key] || 3;
    const vb = b[t.key] || 3;
    const diff = Math.abs(va - vb);
    if (t.complementary) {
      score += diff;
      maxScore += 4;
    } else {
      score += (4 - diff);
      maxScore += 4;
    }
  });
  return Math.round((score / maxScore) * 100);
}

function RadarChart({ traits, complement, size = 340, interactive = true, onChange, activeAxis, onAxisHover }) {
  const center = size / 2;
  const radius = size * 0.38;
  const numAxes = TRAITS.length;

  const getPoint = (index, value, r = radius) => {
    const angle = (Math.PI * 2 * index) / numAxes - Math.PI / 2;
    const dist = (value / 5) * r;
    return { x: center + Math.cos(angle) * dist, y: center + Math.sin(angle) * dist };
  };

  const getAxisEnd = (index) => {
    const angle = (Math.PI * 2 * index) / numAxes - Math.PI / 2;
    return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
  };

  const getLabelPos = (index) => {
    const angle = (Math.PI * 2 * index) / numAxes - Math.PI / 2;
    const r = radius + 28;
    return { x: center + Math.cos(angle) * r, y: center + Math.sin(angle) * r };
  };

  const traitPoints = TRAITS.map((t, i) => getPoint(i, traits[t.key] || 3));
  const compPoints = TRAITS.map((t, i) => getPoint(i, complement[t.key] || 3));

  const traitPath = traitPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";
  const compPath = compPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";

  const gridLevels = [1, 2, 3, 4, 5];

  const svgRef = useRef(null);
  const draggingRef = useRef(null);

  const handleMouseDown = (index) => {
    if (!interactive) return;
    draggingRef.current = index;
  };

  const handleMouseMove = useCallback((e) => {
    if (draggingRef.current === null || !interactive || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - center;
    const y = e.clientY - rect.top - center;
    const angle = (Math.PI * 2 * draggingRef.current) / numAxes - Math.PI / 2;
    const projection = x * Math.cos(angle) + y * Math.sin(angle);
    const val = Math.round(Math.max(1, Math.min(5, (projection / radius) * 5)));
    if (onChange) onChange(TRAITS[draggingRef.current].key, val);
  }, [interactive, center, radius, numAxes, onChange]);

  const handleMouseUp = useCallback(() => { draggingRef.current = null; }, []);

  const handleTouchMove = useCallback((e) => {
    if (draggingRef.current === null || !interactive || !svgRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = svgRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left - center;
    const y = touch.clientY - rect.top - center;
    const angle = (Math.PI * 2 * draggingRef.current) / numAxes - Math.PI / 2;
    const projection = x * Math.cos(angle) + y * Math.sin(angle);
    const val = Math.round(Math.max(1, Math.min(5, (projection / radius) * 5)));
    if (onChange) onChange(TRAITS[draggingRef.current].key, val);
  }, [interactive, center, radius, numAxes, onChange]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <svg ref={svgRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible", touchAction: "none" }}>
      {/* Grid */}
      {gridLevels.map((level) => {
        const pts = TRAITS.map((_, i) => getPoint(i, level));
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";
        return <path key={level} d={path} fill="none" stroke="#1a1a2e" strokeWidth={level === 3 ? 1.5 : 0.5} />;
      })}

      {/* Axes */}
      {TRAITS.map((_, i) => {
        const end = getAxisEnd(i);
        return <line key={i} x1={center} y1={center} x2={end.x} y2={end.y} stroke={activeAxis === i ? "#ffffff33" : "#1a1a2e"} strokeWidth={0.5} />;
      })}

      {/* Complement polygon */}
      <path d={compPath} fill="#ff336612" stroke="#ff3366" strokeWidth={1.5} strokeDasharray="6 4" opacity={0.7} />

      {/* User polygon */}
      <path d={traitPath} fill="#00ff8812" stroke="#00ff88" strokeWidth={2} />

      {/* Data points - user */}
      {traitPoints.map((p, i) => (
        <g key={`u-${i}`}>
          <circle
            cx={p.x} cy={p.y} r={interactive ? 8 : 5}
            fill="#00ff88" fillOpacity={0.2} stroke="#00ff88" strokeWidth={1.5}
            style={{ cursor: interactive ? "grab" : "default" }}
            onMouseDown={() => handleMouseDown(i)}
            onTouchStart={() => handleMouseDown(i)}
            onMouseEnter={() => onAxisHover?.(i)}
            onMouseLeave={() => onAxisHover?.(null)}
          />
          <circle cx={p.x} cy={p.y} r={3} fill="#00ff88" />
        </g>
      ))}

      {/* Data points - complement */}
      {compPoints.map((p, i) => (
        <g key={`c-${i}`}>
          <circle cx={p.x} cy={p.y} r={3} fill="#ff3366" opacity={0.7} />
        </g>
      ))}

      {/* Labels */}
      {TRAITS.map((t, i) => {
        const pos = getLabelPos(i);
        const isActive = activeAxis === i;
        return (
          <text
            key={i} x={pos.x} y={pos.y}
            textAnchor="middle" dominantBaseline="middle"
            fill={isActive ? "#fff" : "#555"}
            fontSize={9}
            fontFamily="'Space Mono', monospace"
            letterSpacing="0.5"
            style={{ transition: "fill 0.2s ease" }}
          >
            {t.label.length > 16 ? t.label.slice(0, 14) + "…" : t.label}
          </text>
        );
      })}

      {/* Center dot */}
      <circle cx={center} cy={center} r={2} fill="#333" />
    </svg>
  );
}

function MatchScoreRing({ score }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score > 75 ? "#00ff88" : score > 50 ? "#ffaa00" : "#ff3366";

  return (
    <div style={{ position: "relative", width: 100, height: 100 }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={r} fill="none" stroke="#1a1a2e" strokeWidth={3} />
        <circle
          cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontSize: 22, fontWeight: 300, color, fontFamily: "'Space Mono', monospace" }}>{score}</div>
        <div style={{ fontSize: 7, color: "#555", letterSpacing: 2, fontFamily: "'Space Mono', monospace" }}>MATCH %</div>
      </div>
    </div>
  );
}

function TraitDetail({ trait, userVal, compVal, isComplementary }) {
  const barWidth = 200;
  const userPct = ((userVal - 1) / 4) * 100;
  const compPct = ((compVal - 1) / 4) * 100;

  return (
    <div style={{ marginBottom: 14, padding: "10px 14px", background: "#0a0a14", borderRadius: 6, border: "1px solid #1a1a2e" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: "#888", fontFamily: "'Space Mono', monospace", letterSpacing: 0.5 }}>{trait.label}</span>
        <span style={{ fontSize: 8, color: isComplementary ? "#8866ff" : "#ffaa00", fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>
          {isComplementary ? "COMPLEMENT" : "ALIGN"}
        </span>
      </div>
      <div style={{ position: "relative", height: 6, background: "#1a1a2e", borderRadius: 3 }}>
        {/* User marker */}
        <div style={{
          position: "absolute", width: 10, height: 10, borderRadius: "50%",
          background: "#00ff88", top: -2, left: `calc(${userPct}% - 5px)`,
          boxShadow: "0 0 8px #00ff8844", transition: "left 0.3s ease", zIndex: 2,
        }} />
        {/* Complement marker */}
        <div style={{
          position: "absolute", width: 10, height: 10, borderRadius: "50%",
          background: "#ff3366", top: -2, left: `calc(${compPct}% - 5px)`,
          boxShadow: "0 0 8px #ff336644", transition: "left 0.3s ease", zIndex: 1,
          border: "1px solid #ff336666",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 8, color: "#444" }}>{trait.left}</span>
        <span style={{ fontSize: 8, color: "#444" }}>{trait.right}</span>
      </div>
    </div>
  );
}

function SimulatedMatch({ complement, matchScore, name, archetype }) {
  return (
    <div style={{ background: "#0a0a14", border: "1px solid #ff336622", borderRadius: 10, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
        <MatchScoreRing score={matchScore} />
        <div>
          <div style={{ fontSize: 14, color: "#fff", fontFamily: "'Space Mono', monospace" }}>{name}</div>
          <div style={{ fontSize: 10, color: "#ff3366", letterSpacing: 2, fontFamily: "'Space Mono', monospace", marginTop: 4 }}>{archetype}</div>
          <div style={{ fontSize: 9, color: "#555", marginTop: 4, fontFamily: "'Space Mono', monospace" }}>computed complement profile</div>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_TRAITS = {
  builder_visionary: 3,
  speed_quality: 3,
  risk: 3,
  chaos: 3,
  social: 3,
  decisions: 3,
  focus: 3,
  conflict: 3,
  learning: 3,
  exploit: 3,
};

export default function RadarView({ intakeTraits = {} }) {
  const hasIntakeData = Object.keys(intakeTraits).length > 0;

  // Merge intake traits over defaults — component remounts on tab switch
  // so this initializer always picks up latest intake data
  const [traits, setTraits] = useState(() => ({
    ...DEFAULT_TRAITS,
    ...intakeTraits,
  }));

  const [showComplement, setShowComplement] = useState(true);
  const [activeAxis, setActiveAxis] = useState(null);
  const [view, setView] = useState("radar"); // radar | detail | compare

  const complement = computeComplement(traits);
  const matchScore = computeMatchScore(traits, complement);

  const handleChange = (key, val) => {
    setTraits((prev) => ({ ...prev, [key]: val }));
  };

  // Generate some simulated "matches" with different profiles
  const simulatedMatches = [
    {
      name: "The Disciplined Executor",
      archetype: "BUILDER × FINISHER × STRUCTURE",
      traits: { builder_visionary: 2, speed_quality: 4, risk: 4, chaos: 1, social: 2, decisions: 2, focus: 1, conflict: 2, learning: 2, exploit: 5 },
    },
    {
      name: "The Chaos Catalyst",
      archetype: "VISIONARY × EXPLORER × ENTROPY",
      traits: { builder_visionary: 5, speed_quality: 1, risk: 5, chaos: 5, social: 5, decisions: 5, focus: 5, conflict: 4, learning: 5, exploit: 1 },
    },
    {
      name: "The Steady Architect",
      archetype: "QUALITY × DATA × MONOMANIAC",
      traits: { builder_visionary: 3, speed_quality: 5, risk: 2, chaos: 2, social: 3, decisions: 1, focus: 1, conflict: 3, learning: 1, exploit: 4 },
    },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#08080f", color: "#fff",
      fontFamily: "'Space Mono', monospace", padding: "24px 16px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 9, letterSpacing: 6, color: "#444", marginBottom: 8 }}>HUMAN ROUTING LAYER</div>
        <div style={{ fontSize: 22, fontWeight: 300, letterSpacing: 3, color: "#fff" }}>TRAIT RADAR</div>
        <div style={{ fontSize: 10, color: "#555", marginTop: 6 }}>drag nodes to reshape your polygon · v0.0.3</div>
        {hasIntakeData ? (
          <div style={{ fontSize: 9, color: "#00ff88", marginTop: 8, letterSpacing: 2 }}>
            ⚡ SYNCED FROM INTAKE — {Object.keys(intakeTraits).length}/10 traits loaded
          </div>
        ) : (
          <div style={{ fontSize: 9, color: "#ff336688", marginTop: 8, letterSpacing: 2 }}>
            ○ NO INTAKE DATA — fill Layer 1 sliders to sync
          </div>
        )}
      </div>

      {/* View toggle */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
        {[
          { id: "radar", label: "◈ RADAR" },
          { id: "detail", label: "≡ DETAIL" },
          { id: "compare", label: "⊕ COMPARE" },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            style={{
              background: view === v.id ? "#00ff8815" : "transparent",
              border: `1px solid ${view === v.id ? "#00ff8866" : "#2a2a3e"}`,
              color: view === v.id ? "#00ff88" : "#555",
              padding: "8px 16px", borderRadius: 6, cursor: "pointer",
              fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 1.5,
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "radar" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Legend */}
          <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00ff88" }} />
              <span style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>YOU</span>
            </div>
            {showComplement && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff3366", opacity: 0.7 }} />
                <span style={{ fontSize: 9, color: "#888", letterSpacing: 1 }}>IDEAL COMPLEMENT</span>
              </div>
            )}
          </div>

          {/* Radar */}
          <RadarChart
            traits={traits}
            complement={showComplement ? complement : Object.fromEntries(TRAITS.map((t) => [t.key, 0]))}
            size={340}
            interactive={true}
            onChange={handleChange}
            activeAxis={activeAxis}
            onAxisHover={setActiveAxis}
          />

          {/* Toggle complement */}
          <button
            onClick={() => setShowComplement(!showComplement)}
            style={{
              marginTop: 20, background: "transparent",
              border: `1px solid ${showComplement ? "#ff336644" : "#2a2a3e"}`,
              color: showComplement ? "#ff3366" : "#555",
              padding: "8px 20px", borderRadius: 6, cursor: "pointer",
              fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: 1.5,
            }}
          >
            {showComplement ? "HIDE COMPLEMENT" : "SHOW COMPLEMENT"}
          </button>

          {/* Active axis detail */}
          {activeAxis !== null && (
            <div style={{
              marginTop: 20, padding: 16, background: "#0a0a14",
              border: "1px solid #2a2a3e", borderRadius: 8, width: "100%", maxWidth: 360,
            }}>
              <div style={{ fontSize: 12, color: "#fff", marginBottom: 6 }}>{TRAITS[activeAxis].label}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                <span style={{ color: "#00ff88" }}>You: {traits[TRAITS[activeAxis].key] || 3}/5</span>
                <span style={{ color: "#ff3366" }}>Complement: {complement[TRAITS[activeAxis].key]}/5</span>
              </div>
              <div style={{ fontSize: 9, color: TRAITS[activeAxis].complementary ? "#8866ff" : "#ffaa00", marginTop: 6, letterSpacing: 1 }}>
                {TRAITS[activeAxis].complementary ? "↔ COMPLEMENTARITY AXIS — opposites strengthen" : "↔ ALIGNMENT AXIS — similarity strengthens"}
              </div>
            </div>
          )}

          {/* Match score */}
          <div style={{ marginTop: 24 }}>
            <MatchScoreRing score={matchScore} />
          </div>
          <div style={{ fontSize: 9, color: "#555", marginTop: 8, letterSpacing: 1.5 }}>
            complementarity score with ideal match
          </div>
        </div>
      )}

      {view === "detail" && (
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ fontSize: 10, color: "#00ff88", letterSpacing: 3, marginBottom: 16 }}>
            ◈ TRAIT-BY-TRAIT BREAKDOWN
          </div>
          {TRAITS.map((t) => (
            <TraitDetail
              key={t.key}
              trait={t}
              userVal={traits[t.key] || 3}
              compVal={complement[t.key]}
              isComplementary={t.complementary}
            />
          ))}

          {/* Sliders for adjustment */}
          <div style={{ marginTop: 24, fontSize: 10, color: "#666", letterSpacing: 3, marginBottom: 16 }}>ADJUST TRAITS</div>
          {TRAITS.map((t) => (
            <div key={t.key} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#555", marginBottom: 4 }}>
                <span>{t.left}</span>
                <span style={{ color: "#00ff88" }}>{traits[t.key] || 3}</span>
                <span>{t.right}</span>
              </div>
              <input
                type="range" min={1} max={5} value={traits[t.key] || 3}
                onChange={(e) => handleChange(t.key, parseInt(e.target.value))}
                style={{
                  width: "100%", WebkitAppearance: "none", appearance: "none",
                  height: 3, background: "#1a1a2e", borderRadius: 2, outline: "none", cursor: "pointer",
                }}
              />
            </div>
          ))}
        </div>
      )}

      {view === "compare" && (
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ fontSize: 10, color: "#8866ff", letterSpacing: 3, marginBottom: 16 }}>
            ॐ SIMULATED MATCHES
          </div>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 20, lineHeight: 1.8 }}>
            these are archetype profiles to demonstrate matching.<br />
            in v0.0.4 these will be real users with embedded vibes.
          </div>

          {simulatedMatches.map((match, i) => {
            const score = computeMatchScore(traits, match.traits);
            return (
              <div key={i} style={{ marginBottom: 16 }}>
                <SimulatedMatch
                  complement={match.traits}
                  matchScore={score}
                  name={match.name}
                  archetype={match.archetype}
                />
                {/* Mini radar comparison */}
                <div style={{ display: "flex", justifyContent: "center", marginTop: 8, marginBottom: 8 }}>
                  <RadarChart
                    traits={traits}
                    complement={match.traits}
                    size={200}
                    interactive={false}
                    activeAxis={null}
                  />
                </div>
              </div>
            );
          })}

          <div style={{
            textAlign: "center", padding: 20, marginTop: 16,
            background: "#0a0a14", border: "1px solid #ffaa0022", borderRadius: 8,
          }}>
            <div style={{ fontSize: 10, color: "#ffaa00", letterSpacing: 2, marginBottom: 8 }}>☯ THE ROUTING INSIGHT</div>
            <div style={{ fontSize: 10, color: "#666", lineHeight: 1.8 }}>
              The Disciplined Executor is your computed complement —<br />
              where you explore, they exploit. Where you dream, they ship.<br />
              The network would route you together.
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 40, paddingTop: 20, borderTop: "1px solid #1a1a2e" }}>
        <div style={{ fontSize: 8, color: "#333", letterSpacing: 2, marginBottom: 8 }}>
          ∙∙·▫▫ᵒᴼᵒ▫ₒₒ▫ᵒᴼᵒ▫▫·∙∙
        </div>
        <div style={{ fontSize: 9, color: "#444", letterSpacing: 1.5, lineHeight: 2 }}>
          HUMAN ROUTING LAYER · PREFERENCES FILE v0.0.3<br />
          next → embed semantic layer → real matching → ship to alex
        </div>
        <div style={{ fontSize: 8, color: "#333", letterSpacing: 2, marginTop: 8 }}>
          ∙∙·▫▫ᵒᴼᵒ▫ₒₒ▫ᵒᴼᵒ▫▫·∙∙
        </div>
      </div>
    </div>
  );
}
