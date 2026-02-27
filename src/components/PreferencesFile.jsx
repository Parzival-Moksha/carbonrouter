import { useState, useEffect, useRef } from "react";
import { checkHealth, saveProfile } from "../api.js";

const LAYERS = {
  0: { name: "HARD CONSTRAINTS", icon: "⚡", color: "#ff3366", desc: "Dealbreakers. Boolean. No ML needed." },
  1: { name: "TRAIT DIMENSIONS", icon: "◈", color: "#00ff88", desc: "Complementarity matching axes." },
  2: { name: "SEMANTIC VIBE", icon: "ॐ", color: "#8866ff", desc: "Free text → embeddings → cosine similarity." },
  3: { name: "VALUES ALIGNMENT", icon: "☯", color: "#ffaa00", desc: "Non-negotiable ethical core. Similarity matching." },
};

const QUESTIONS = [
  // LAYER 0: HARD CONSTRAINTS (7 questions)
  { id: 1, layer: 0, type: "select", q: "Where are you willing to be routed?", options: ["Anywhere on Earth", "My continent only", "My country only", "My city only", "Fully remote — don't move me"] },
  { id: 2, layer: 0, type: "select", q: "Time commitment to a new venture?", options: ["Full-time, all-in, burn the boats", "Part-time now, full-time if it works", "Evenings & weekends only", "Advisory / fractional only"] },
  { id: 3, layer: 0, type: "select", q: "Equity expectations?", options: ["Equal split or bust", "Flexible based on contribution", "I'll take less equity for salary", "Open to creative structures"] },
  { id: 4, layer: 0, type: "select", q: "Funding philosophy?", options: ["Bootstrap forever", "Bootstrap then raise", "Raise immediately — speed matters", "Already have capital to deploy"] },
  { id: 5, layer: 0, type: "select", q: "Timeline to first shipped product?", options: ["This week", "This month", "This quarter", "This year", "When it's ready"] },
  { id: 6, layer: 0, type: "select", q: "What are you bringing?", options: ["Technical skills (I build)", "Domain expertise (I know the market)", "Capital + network", "Vision + leadership", "I figure it out as I go"] },
  { id: 7, layer: 0, type: "select", q: "What do you need from a co-founder?", options: ["Technical co-founder", "Business / GTM co-founder", "Design / product co-founder", "Someone who complements my chaos", "I don't know yet"] },

  // LAYER 1: TRAIT DIMENSIONS (10 questions, 1-5 sliders)
  { id: 8, layer: 1, type: "slider", q: "Builder ←→ Visionary", left: "I ship code at 2am", right: "I see the cathedral before the first brick" },
  { id: 9, layer: 1, type: "slider", q: "Speed ←→ Quality", left: "Ship now, fix later", right: "Do it right or don't do it" },
  { id: 10, layer: 1, type: "slider", q: "Risk tolerance", left: "I need a safety net", right: "I set the net on fire for warmth" },
  { id: 11, layer: 1, type: "slider", q: "Chaos tolerance", left: "I need structure & process", right: "I thrive in beautiful entropy" },
  { id: 12, layer: 1, type: "slider", q: "Social energy", left: "Deep 1:1 only", right: "Route me to every conference" },
  { id: 13, layer: 1, type: "slider", q: "Decision making", left: "Data-driven, show me the numbers", right: "Intuition-driven, I feel the answer" },
  { id: 14, layer: 1, type: "slider", q: "Focus style", left: "One thing, relentlessly", right: "Parallel threads, cross-pollination" },
  { id: 15, layer: 1, type: "slider", q: "Conflict style", left: "Harmony-seeking, avoid friction", right: "Direct confrontation, clear the air fast" },
  { id: 16, layer: 1, type: "slider", q: "Learning mode", left: "Read everything first, then act", right: "Act first, learn from the explosion" },
  { id: 17, layer: 1, type: "slider", q: "Exploration ←→ Exploitation", left: "10th percentile sticktoitability", right: "I finish everything I start" },

  // LAYER 2: SEMANTIC VIBE (7 free-text questions)
  { id: 18, layer: 2, type: "text", q: "Describe your ideal Tuesday in February 2027.", placeholder: "Where are you? What are you building? Who's around you?" },
  { id: 19, layer: 2, type: "text", q: "What problem keeps you awake at 3am?", placeholder: "Not what sounds impressive. What actually haunts you." },
  { id: 20, layer: 2, type: "text", q: "Describe a conflict you navigated well.", placeholder: "Professional, personal, internal — any scale." },
  { id: 21, layer: 2, type: "text", q: "What's the weirdest thing you're deeply knowledgeable about?", placeholder: "The thing that makes people go 'wait, what?'" },
  { id: 22, layer: 2, type: "text", q: "What would you build if money and time were infinite?", placeholder: "The real answer, not the VC-friendly one." },
  { id: 23, layer: 2, type: "text", q: "Describe the last time you were in flow state.", placeholder: "What were you doing? How long did it last? What broke it?" },
  { id: 24, layer: 2, type: "text", q: "Write a 2-sentence bio that your best friend would write about you.", placeholder: "Not LinkedIn. Not Twitter. Your actual human." },

  // LAYER 3: VALUES ALIGNMENT (6 questions)
  { id: 25, layer: 3, type: "select", q: "AI development philosophy?", options: ["Accelerate everything, safety emerges", "Careful acceleration with guardrails", "Pause until alignment is solved", "AI is a tool, not a trajectory"] },
  { id: 26, layer: 3, type: "select", q: "What's more important?", options: ["Individual freedom", "Collective wellbeing", "They're inseparable", "It depends on the context"] },
  { id: 27, layer: 3, type: "slider", q: "Profit ←→ Impact", left: "Build the business, impact follows", right: "Impact first, revenue is a constraint" },
  { id: 28, layer: 3, type: "select", q: "Your relationship with failure?", options: ["Failure is data", "Failure is painful but necessary", "I avoid failure through preparation", "I've failed enough to stop fearing it"] },
  { id: 29, layer: 3, type: "slider", q: "Openness ←→ Privacy", left: "Build in public, share everything", right: "Stealth mode until launch" },
  { id: 30, layer: 3, type: "select", q: "What matters most in a co-founder?", options: ["Shared vision of the future", "Complementary skills", "Trust and communication", "Raw intensity and drive", "Kindness and emotional intelligence"] },
];

// Glitch text effect
const glitchChars = "▓▒░█▀▄╔╗╚╝═║◈◉✦❖☯ॐ";
function glitchText(text, intensity = 0.05) {
  return text.split("").map((c, i) => Math.random() < intensity ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : c).join("");
}

function ProgressBar({ current, total, layer }) {
  const pct = (current / total) * 100;
  const layerInfo = LAYERS[layer];
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: 2 }}>
        <span style={{ color: layerInfo.color }}>{layerInfo.icon} LAYER {layer}: {layerInfo.name}</span>
        <span style={{ color: "#666" }}>{current}/30</span>
      </div>
      <div style={{ height: 3, background: "#1a1a2e", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${layerInfo.color}, ${layerInfo.color}88)`, transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)", borderRadius: 2 }} />
      </div>
      <div style={{ fontSize: 10, color: "#555", marginTop: 4, fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>{layerInfo.desc}</div>
    </div>
  );
}

function SelectQuestion({ question, value, onChange }) {
  const layerColor = LAYERS[question.layer].color;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {question.options.map((opt, i) => (
        <button
          key={i}
          onClick={() => onChange(opt)}
          style={{
            background: value === opt ? `${layerColor}15` : "transparent",
            border: `1px solid ${value === opt ? layerColor : "#2a2a3e"}`,
            color: value === opt ? layerColor : "#888",
            padding: "14px 20px",
            borderRadius: 8,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "'Space Mono', monospace",
            fontSize: 13,
            transition: "all 0.2s ease",
            letterSpacing: 0.5,
          }}
          onMouseEnter={(e) => { if (value !== opt) { e.target.style.borderColor = `${layerColor}66`; e.target.style.color = "#ccc"; } }}
          onMouseLeave={(e) => { if (value !== opt) { e.target.style.borderColor = "#2a2a3e"; e.target.style.color = "#888"; } }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function SliderQuestion({ question, value, onChange }) {
  const layerColor = LAYERS[question.layer].color;
  const val = value || 3;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#666" }}>
        <span style={{ maxWidth: "40%", textAlign: "left" }}>{question.left}</span>
        <span style={{ maxWidth: "40%", textAlign: "right" }}>{question.right}</span>
      </div>
      <div style={{ position: "relative", padding: "10px 0" }}>
        <input
          type="range"
          min={1}
          max={5}
          value={val}
          onChange={(e) => onChange(parseInt(e.target.value))}
          style={{
            width: "100%",
            WebkitAppearance: "none",
            appearance: "none",
            height: 3,
            background: `linear-gradient(90deg, ${layerColor} 0%, ${layerColor} ${(val - 1) * 25}%, #2a2a3e ${(val - 1) * 25}%, #2a2a3e 100%)`,
            borderRadius: 2,
            outline: "none",
            cursor: "pointer",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} style={{ fontSize: 10, color: val === n ? layerColor : "#444", fontFamily: "'Space Mono', monospace", fontWeight: val === n ? "bold" : "normal" }}>{n}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TextQuestion({ question, value, onChange }) {
  const layerColor = LAYERS[question.layer].color;
  return (
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder}
      rows={5}
      style={{
        width: "100%",
        background: "#0a0a14",
        border: `1px solid ${value ? layerColor + "44" : "#2a2a3e"}`,
        borderRadius: 8,
        color: "#ddd",
        padding: 16,
        fontFamily: "'Space Mono', monospace",
        fontSize: 13,
        lineHeight: 1.7,
        resize: "vertical",
        outline: "none",
        transition: "border-color 0.3s ease",
        boxSizing: "border-box",
        letterSpacing: 0.3,
      }}
      onFocus={(e) => { e.target.style.borderColor = layerColor + "88"; }}
      onBlur={(e) => { e.target.style.borderColor = value ? layerColor + "44" : "#2a2a3e"; }}
    />
  );
}

function ResultsView({ answers }) {
  const [saveState, setSaveState] = useState("idle"); // idle | checking | saving | saved | error
  const [saveResult, setSaveResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSave = async () => {
    setSaveState("checking");
    const health = await checkHealth();
    if (!health) {
      setSaveState("error");
      setErrorMsg("Backend offline — run: npm run server");
      return;
    }
    if (!health.checks.db) {
      setSaveState("error");
      setErrorMsg("Database not connected — check DATABASE_URL in .env");
      return;
    }
    setSaveState("saving");
    try {
      const result = await saveProfile(answers);
      setSaveResult(result);
      setSaveState("saved");
    } catch (err) {
      setSaveState("error");
      setErrorMsg(err.message);
    }
  };

  const layerCompleteness = {};
  Object.values(LAYERS).forEach((_, i) => {
    const layerQs = QUESTIONS.filter((q) => q.layer === i);
    const answered = layerQs.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length;
    layerCompleteness[i] = Math.round((answered / layerQs.length) * 100);
  });

  const traitProfile = QUESTIONS.filter((q) => q.layer === 1 && answers[q.id]).map((q) => ({
    label: q.q,
    value: answers[q.id],
    left: q.left,
    right: q.right,
  }));

  return (
    <div style={{ fontFamily: "'Space Mono', monospace" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 11, color: "#666", letterSpacing: 4, marginBottom: 12 }}>YOUR PREFERENCES FILE</div>
        <div style={{ fontSize: 28, fontWeight: 300, color: "#fff", letterSpacing: 2 }}>v0.0.4</div>
        <div style={{ fontSize: 11, color: "#444", marginTop: 8 }}>save profile · embed vibes · match humans</div>
      </div>

      {/* Layer completeness */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
        {Object.entries(LAYERS).map(([i, layer]) => (
          <div key={i} style={{ background: "#0a0a14", border: `1px solid ${layer.color}22`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 10, color: layer.color, letterSpacing: 2, marginBottom: 8 }}>{layer.icon} L{i}: {layer.name}</div>
            <div style={{ fontSize: 24, color: layerCompleteness[i] === 100 ? layer.color : "#444" }}>{layerCompleteness[i]}%</div>
            <div style={{ height: 2, background: "#1a1a2e", marginTop: 8, borderRadius: 1 }}>
              <div style={{ height: "100%", width: `${layerCompleteness[i]}%`, background: layer.color, borderRadius: 1, transition: "width 0.5s ease" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Trait radar (simplified as bars) */}
      {traitProfile.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: "#00ff88", letterSpacing: 3, marginBottom: 16 }}>◈ TRAIT SIGNATURE</div>
          {traitProfile.map((t, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#666", marginBottom: 6 }}>{t.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, color: "#555", width: 120, textAlign: "right", flexShrink: 0 }}>{t.left?.slice(0, 18)}</span>
                <div style={{ flex: 1, height: 4, background: "#1a1a2e", borderRadius: 2, position: "relative" }}>
                  <div style={{
                    position: "absolute", width: 10, height: 10, borderRadius: "50%",
                    background: "#00ff88", top: -3, left: `${((t.value - 1) / 4) * 100}%`, transform: "translateX(-50%)",
                    boxShadow: "0 0 8px #00ff8844",
                  }} />
                </div>
                <span style={{ fontSize: 9, color: "#555", width: 120, flexShrink: 0 }}>{t.right?.slice(0, 18)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Semantic previews */}
      {QUESTIONS.filter((q) => q.layer === 2 && answers[q.id]).length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: "#8866ff", letterSpacing: 3, marginBottom: 16 }}>ॐ SEMANTIC VIBE FRAGMENTS</div>
          {QUESTIONS.filter((q) => q.layer === 2 && answers[q.id]).map((q) => (
            <div key={q.id} style={{ marginBottom: 16, padding: 16, background: "#0a0a14", border: "1px solid #8866ff22", borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: "#8866ff", marginBottom: 8 }}>{q.q}</div>
              <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.7, fontStyle: "italic" }}>"{answers[q.id]}"</div>
            </div>
          ))}
        </div>
      )}

      {/* Save & embed */}
      <div style={{ textAlign: "center", padding: 24, background: "#0a0a14", border: "1px solid #8866ff22", borderRadius: 8, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#8866ff", letterSpacing: 3, marginBottom: 16 }}>ॐ SAVE & EMBED</div>

        {saveState === "idle" && (
          <button
            onClick={handleSave}
            style={{
              background: "#8866ff15", border: "1px solid #8866ff66",
              color: "#8866ff", padding: "12px 32px", borderRadius: 8,
              fontFamily: "'Space Mono', monospace", fontSize: 11,
              letterSpacing: 2, cursor: "pointer", transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { e.target.style.background = "#8866ff25"; e.target.style.borderColor = "#8866ff"; }}
            onMouseLeave={(e) => { e.target.style.background = "#8866ff15"; e.target.style.borderColor = "#8866ff66"; }}
          >
            SAVE PROFILE & EMBED VIBES
          </button>
        )}

        {saveState === "checking" && (
          <div style={{ fontSize: 11, color: "#8866ff", letterSpacing: 2 }}>connecting to server...</div>
        )}

        {saveState === "saving" && (
          <div style={{ fontSize: 11, color: "#8866ff", letterSpacing: 2 }}>embedding semantic vibe layer...</div>
        )}

        {saveState === "saved" && saveResult && (
          <div>
            <div style={{ fontSize: 11, color: "#00ff88", letterSpacing: 2, marginBottom: 8 }}>PROFILE SAVED</div>
            <div style={{ fontSize: 10, color: "#555", lineHeight: 1.8 }}>
              id: {saveResult.id?.slice(0, 8)}...<br />
              traits: {saveResult.trait_count}/10 · vibe: {saveResult.vibe_length} chars<br />
              embedded: {saveResult.embedded ? "yes — vector stored" : "no — add API key to .env"}
            </div>
          </div>
        )}

        {saveState === "error" && (
          <div>
            <div style={{ fontSize: 11, color: "#ff3366", letterSpacing: 2, marginBottom: 8 }}>{errorMsg}</div>
            <button
              onClick={() => { setSaveState("idle"); setErrorMsg(""); }}
              style={{
                background: "transparent", border: "1px solid #2a2a3e",
                color: "#888", padding: "8px 20px", borderRadius: 6,
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                letterSpacing: 1, cursor: "pointer", marginTop: 8,
              }}
            >
              RETRY
            </button>
          </div>
        )}

        <div style={{ fontSize: 9, color: "#444", marginTop: 12 }}>
          saves profile to PostgreSQL · embeds Layer 2 via OpenRouter
        </div>
      </div>

      {/* Roadmap */}
      <div style={{ textAlign: "center", padding: 24, background: "#0a0a14", border: "1px solid #ffaa0022", borderRadius: 8 }}>
        <div style={{ fontSize: 11, color: "#ffaa00", letterSpacing: 3, marginBottom: 8 }}>☯ ROADMAP</div>
        <div style={{ fontSize: 11, color: "#666", lineHeight: 1.8 }}>
          v0.0.3 ✓ data pipeline + persistence<br />
          v0.0.4 ✓ embed semantic layer via API<br />
          v0.0.5 → cosine similarity + real matching (50 users)<br />
          v0.1.0 → email alexwg@alexwg.org, subject: February 2027
        </div>
      </div>
    </div>
  );
}

export default function PreferencesFile({ answers = {}, onAnswer }) {
  const answeredCount = Object.keys(answers).length;
  const [currentQ, setCurrentQ] = useState(() => {
    // Resume at first unanswered question
    const firstUnanswered = QUESTIONS.findIndex(q => answers[q.id] === undefined || answers[q.id] === "");
    return firstUnanswered >= 0 ? firstUnanswered : 0;
  });
  const [showResults, setShowResults] = useState(false);
  const [headerGlitch, setHeaderGlitch] = useState("THE PREFERENCES FILE");
  const [entered, setEntered] = useState(answeredCount > 0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.15) {
        setHeaderGlitch(glitchText("THE PREFERENCES FILE", 0.12));
        setTimeout(() => setHeaderGlitch("THE PREFERENCES FILE"), 150);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const question = QUESTIONS[currentQ];
  const answered = Object.keys(answers).length;
  const canNext = answers[question?.id] !== undefined && answers[question?.id] !== "";

  const handleAnswer = (val) => {
    onAnswer(question.id, val);
  };

  const next = () => {
    if (currentQ < QUESTIONS.length - 1) setCurrentQ((p) => p + 1);
    else setShowResults(true);
  };

  const prev = () => {
    if (showResults) { setShowResults(false); return; }
    if (currentQ > 0) setCurrentQ((p) => p - 1);
  };

  if (!entered) {
    return (
      <div style={{
        minHeight: "100vh", background: "#08080f", color: "#fff",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Space Mono', monospace", padding: 32,
      }}>
        <div style={{ fontSize: 10, letterSpacing: 6, color: "#444", marginBottom: 24 }}>HUMAN ROUTING LAYER</div>
        <div style={{ fontSize: 32, fontWeight: 300, letterSpacing: 4, marginBottom: 8, textAlign: "center" }}>{headerGlitch}</div>
        <div style={{ fontSize: 12, color: "#555", marginBottom: 48, textAlign: "center", maxWidth: 480, lineHeight: 1.8 }}>
          30 questions across 4 layers.<br />
          Hard constraints. Trait dimensions. Semantic vibe. Values alignment.<br />
          The network will route you to your people.
        </div>

        <div style={{ display: "flex", gap: 24, marginBottom: 48 }}>
          {Object.entries(LAYERS).map(([i, l]) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{l.icon}</div>
              <div style={{ fontSize: 8, color: l.color, letterSpacing: 2 }}>L{i}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setEntered(true)}
          style={{
            background: "transparent", border: "1px solid #ff336666",
            color: "#ff3366", padding: "14px 48px", borderRadius: 8,
            fontFamily: "'Space Mono', monospace", fontSize: 12,
            letterSpacing: 4, cursor: "pointer", transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => { e.target.style.background = "#ff336615"; e.target.style.borderColor = "#ff3366"; }}
          onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.borderColor = "#ff336666"; }}
        >
          BEGIN INTAKE
        </button>

        <div style={{ marginTop: 48, fontSize: 9, color: "#333", letterSpacing: 2 }}>
          ∙∙·▫▫ᵒᴼᵒ▫ₒₒ▫ᵒᴼᵒ▫▫·∙∙ v0.0.4 ∙∙·▫▫ᵒᴼᵒ▫ₒₒ▫ᵒᴼᵒ▫▫·∙∙
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#08080f", color: "#fff",
      fontFamily: "'Space Mono', monospace", padding: "32px 24px",
      maxWidth: 640, margin: "0 auto",
    }}>
      {/* Custom slider styles */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 16px; height: 16px; border-radius: 50%;
          background: #00ff88; cursor: pointer;
          box-shadow: 0 0 12px #00ff8844;
          margin-top: -6px;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: #00ff88; cursor: pointer; border: none;
          box-shadow: 0 0 12px #00ff8844;
        }
        textarea::placeholder { color: #444; }
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');
      `}</style>

      {!showResults ? (
        <>
          <ProgressBar current={currentQ + 1} total={30} layer={question.layer} />

          {/* Question */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, marginBottom: 12 }}>
              Q{question.id.toString().padStart(2, "0")}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 400, color: "#eee", lineHeight: 1.6, marginBottom: 24, letterSpacing: 0.5 }}>
              {question.q}
            </h2>

            {question.type === "select" && <SelectQuestion question={question} value={answers[question.id]} onChange={handleAnswer} />}
            {question.type === "slider" && <SliderQuestion question={question} value={answers[question.id]} onChange={handleAnswer} />}
            {question.type === "text" && <TextQuestion question={question} value={answers[question.id]} onChange={handleAnswer} />}
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
            <button
              onClick={prev}
              disabled={currentQ === 0}
              style={{
                background: "transparent", border: "1px solid #2a2a3e",
                color: currentQ === 0 ? "#333" : "#888", padding: "10px 24px",
                borderRadius: 6, cursor: currentQ === 0 ? "default" : "pointer",
                fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: 2,
              }}
            >
              ← PREV
            </button>

            <div style={{ fontSize: 10, color: "#333" }}>
              {answered}/30 answered
            </div>

            <button
              onClick={next}
              style={{
                background: canNext ? `${LAYERS[question.layer].color}15` : "transparent",
                border: `1px solid ${canNext ? LAYERS[question.layer].color + "66" : "#2a2a3e"}`,
                color: canNext ? LAYERS[question.layer].color : "#333",
                padding: "10px 24px", borderRadius: 6,
                cursor: canNext ? "pointer" : "default",
                fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: 2,
                transition: "all 0.2s ease",
              }}
            >
              {currentQ === QUESTIONS.length - 1 ? "VIEW RESULTS →" : "NEXT →"}
            </button>
          </div>

          {/* Skip to results if enough answered */}
          {answered >= 15 && (
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button
                onClick={() => setShowResults(true)}
                style={{
                  background: "transparent", border: "none",
                  color: "#444", fontSize: 10, cursor: "pointer",
                  fontFamily: "'Space Mono', monospace", letterSpacing: 2,
                  textDecoration: "underline", textUnderlineOffset: 4,
                }}
              >
                SKIP TO RESULTS ({answered}/30 answered)
              </button>
            </div>
          )}

          {/* Quick-nav dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 32, flexWrap: "wrap" }}>
            {QUESTIONS.map((q, i) => (
              <div
                key={i}
                onClick={() => setCurrentQ(i)}
                style={{
                  width: 8, height: 8, borderRadius: 2, cursor: "pointer",
                  background: i === currentQ ? LAYERS[q.layer].color :
                    answers[q.id] !== undefined && answers[q.id] !== "" ? LAYERS[q.layer].color + "44" : "#1a1a2e",
                  transition: "all 0.2s ease",
                }}
                title={`Q${q.id}: ${q.q}`}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <ResultsView answers={answers} />
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button
              onClick={() => setShowResults(false)}
              style={{
                background: "transparent", border: "1px solid #2a2a3e",
                color: "#888", padding: "10px 24px", borderRadius: 6,
                cursor: "pointer", fontFamily: "'Space Mono', monospace",
                fontSize: 11, letterSpacing: 2,
              }}
            >
              ← EDIT ANSWERS
            </button>
          </div>
        </>
      )}
    </div>
  );
}
