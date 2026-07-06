import { useState } from "react";

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const DIMENSIONS = [
  {
    id: "d1", code: "D1", label: "Development Cost", weight: 0.30, color: "#3B82F6",
    descriptions: ["< 2 developer-days","2–5 developer-days","5–10 developer-days","10–20 developer-days","> 20 developer-days"],
  },
  {
    id: "d2", code: "D2", label: "Integration Complexity", weight: 0.20, color: "#8B5CF6",
    descriptions: ["Standard OData, no custom logic","Standard OData with light customisation","Custom CDS view, single source","Custom CDS with cross-module joins","Side-by-side BTP extension + custom CDS"],
  },
  {
    id: "d3", code: "D3", label: "Upgrade Risk", weight: 0.30, color: "#F59E0B",
    descriptions: ["Clean-core extension (SAP-approved)","Key-user extension via Fiori adaptation","Developer extension with public extension points","Modification touches standard objects (isolated)","Direct modification of standard SAP objects"],
  },
  {
    id: "d4", code: "D4", label: "Lifecycle Maintenance", weight: 0.20, color: "#10B981",
    descriptions: ["< 10 hours per year","10–25 hours per year","25–50 hours per year","50–100 hours per year","> 100 hours per year"],
  },
];

const TREE_QUESTIONS = [
  { id: "q1", label: "Q1", question: "Does a standard SAP Fiori application already cover this requirement?", theory: "TOE — Environment: vendor-supplied alternative set", yes: "outcome-standard", no: "q2" },
  { id: "q2", label: "Q2", question: "Can SAP configuration options (without custom code) close the gap?", theory: "TOE — Organisation: minimum change capacity", yes: "outcome-configure", no: "q3" },
  { id: "q3", label: "Q3", question: "Does this requirement represent a genuine competitive advantage — or is it a legacy habit?", theory: "UET — Executive cognitive base", yes: "q4", no: "outcome-developer" },
  { id: "q4", label: "Q4", question: "Is the Pillar 1 composite score below the RED threshold (≤ 70)?", theory: "Pillar 1 integration gate", yes: "q5", no: "outcome-keyuser" },
  { id: "q5", label: "Q5", question: "Is a clean-core key-user extension technically feasible for this requirement?", theory: "TOE — Technology trajectory + Environment: SAP clean-core mandate", yes: "outcome-keyuser", no: "outcome-custom" },
];

const OUTCOMES = {
  "outcome-standard": { label: "Standard Fiori", color: "#10B981", bg: "#052e16", border: "#166534", description: "An out-of-the-box SAP Fiori application satisfies this requirement. No development required.", risk: "Lowest" },
  "outcome-configure": { label: "Configure", color: "#3B82F6", bg: "#0c1a2e", border: "#1e3a5f", description: "SAP-delivered configuration options close the gap. No custom code required.", risk: "Low" },
  "outcome-developer": { label: "Developer Extension", color: "#F59E0B", bg: "#1c1000", border: "#78350f", description: "A lightweight, clean-core developer extension. Justified by technical need, not competitive advantage.", risk: "Moderate" },
  "outcome-keyuser": { label: "Key-User Extension", color: "#F59E0B", bg: "#1c1000", border: "#78350f", description: "Low-code adaptation via SAP Fiori adaptation tools. Clean-core compliant.", risk: "Moderate" },
  "outcome-custom": { label: "Custom UI5", color: "#EF4444", bg: "#1c0000", border: "#7f1d1d", description: "Custom UI5 development is justified. Requires full governance approval and TCO sign-off.", risk: "Highest" },
};

const HOURLY_RATE = 60;
const FREQ_MULTIPLIERS = { Daily: 250, Weekly: 50, Monthly: 12, Quarterly: 4 };

// ─── API CALL ──────────────────────────────────────────────────────────────────
async function checkStandardApps(description) {
  const prompt = `You are an SAP S/4HANA Fiori expert. A user has described a UI customisation requirement. Your job is to check whether a standard SAP Fiori application already covers this need.

User requirement: "${description}"

Respond ONLY with a valid JSON object — no markdown, no backticks, no extra text. Use this exact structure:
{
  "matchLevel": "HIGH" or "MEDIUM" or "LOW",
  "matchedApp": "App name and ID if found, or null",
  "appCovers": "What the standard app covers (2-3 sentences)",
  "remainingGap": "What gap remains if any, or null",
  "recommendation": "One clear sentence recommending action",
  "suggestQ1Yes": true or false
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─── SCORE RING ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 120 }) {
  const r = 45;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score, 100) / 100;
  const dash = pct * circ;
  const color = score <= 40 ? "#10B981" : score <= 70 ? "#F59E0B" : "#EF4444";
  const label = score <= 40 ? "GREEN" : score <= 70 ? "AMBER" : "RED";
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1E2D45" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dasharray 0.4s ease, stroke 0.4s ease" }} />
        <text x="50" y="46" textAnchor="middle" fill={color} fontSize="18" fontWeight="700" fontFamily="Inter, sans-serif">{Math.round(score)}</text>
        <text x="50" y="60" textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="Inter, sans-serif">/ 100</text>
      </svg>
      <span style={{ color, fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>
        {score > 0 ? label : "—"}
      </span>
    </div>
  );
}

// ─── AI APP MATCHER ────────────────────────────────────────────────────────────
function AppMatcher({ description, onSuggestQ1 }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheck = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await checkStandardApps(description);
      setResult(data);
      if (data.suggestQ1Yes) onSuggestQ1?.();
    } catch (e) {
      setError("Could not reach AI matcher. Check your API key.");
    } finally {
      setLoading(false);
    }
  };

  const matchColor = result?.matchLevel === "HIGH" ? "#10B981" : result?.matchLevel === "MEDIUM" ? "#F59E0B" : "#EF4444";

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={handleCheck}
        disabled={!description.trim() || loading}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 18px",
          background: description.trim() ? "#1E2D45" : "#111827",
          border: `1px solid ${description.trim() ? "#3B82F6" : "#1E2D45"}`,
          borderRadius: 8, color: description.trim() ? "#3B82F6" : "#64748B",
          fontSize: 13, fontWeight: 600, cursor: description.trim() ? "pointer" : "not-allowed",
          fontFamily: "Inter, sans-serif", transition: "all 0.2s",
        }}
      >
        <span>{loading ? "⏳" : "🔍"}</span>
        {loading ? "Checking standard SAP apps..." : "Check Standard SAP Apps"}
      </button>

      {error && (
        <div style={{ marginTop: 10, padding: "12px 16px", background: "#1c0000", border: "1px solid #7f1d1d", borderRadius: 8, color: "#EF4444", fontSize: 13 }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{
          marginTop: 12, padding: 20,
          background: "#0A0F1E", border: `1px solid ${matchColor}40`,
          borderRadius: 12, borderLeft: `3px solid ${matchColor}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700,
              color: matchColor, letterSpacing: 2,
              background: matchColor + "20", padding: "3px 10px", borderRadius: 4,
            }}>
              {result.matchLevel} MATCH
            </span>
            {result.matchedApp && (
              <span style={{ color: "#64748B", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}>
                {result.matchedApp}
              </span>
            )}
          </div>

          {result.appCovers && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ color: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono, monospace", letterSpacing: 1, marginBottom: 4 }}>STANDARD APP COVERS</div>
              <div style={{ color: "#E2E8F0", fontSize: 13, lineHeight: 1.6 }}>{result.appCovers}</div>
            </div>
          )}

          {result.remainingGap && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ color: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono, monospace", letterSpacing: 1, marginBottom: 4 }}>REMAINING GAP</div>
              <div style={{ color: "#F59E0B", fontSize: 13, lineHeight: 1.6 }}>{result.remainingGap}</div>
            </div>
          )}

          <div style={{ borderTop: "1px solid #1E2D45", paddingTop: 10, marginTop: 10 }}>
            <div style={{ color: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono, monospace", letterSpacing: 1, marginBottom: 4 }}>RECOMMENDATION</div>
            <div style={{ color: "#E2E8F0", fontSize: 13, lineHeight: 1.6 }}>{result.recommendation}</div>
          </div>

          {result.suggestQ1Yes && (
            <div style={{
              marginTop: 12, padding: "10px 14px",
              background: "#10B98115", border: "1px solid #10B981",
              borderRadius: 8, color: "#10B981", fontSize: 12, fontWeight: 600,
            }}>
              ✓ Suggestion: Consider answering Q1 = Yes in the Decision Tree
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── BUSINESS ADVANTAGE PANEL ─────────────────────────────────────────────────
function BusinessAdvantage({ value, onChange }) {
  const { timeSaved, usersAffected, frequency } = value;
  const freqMult = FREQ_MULTIPLIERS[frequency] || 250;
  const annualHours = (Number(timeSaved) || 0) * (Number(usersAffected) || 0) * freqMult;
  const annualValue = annualHours * HOURLY_RATE;

  const handleChange = (field, val) => onChange({ ...value, [field]: val });

  return (
    <div style={{ background: "#111827", border: "1px solid #1E2D45", borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
      <div style={{ color: "#64748B", fontSize: 11, fontFamily: "JetBrains Mono, monospace", letterSpacing: 2, marginBottom: 16 }}>
        BUSINESS ADVANTAGE (optional)
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ color: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono, monospace", letterSpacing: 1, marginBottom: 6 }}>TIME SAVED / TRANSACTION (hrs)</div>
          <input
            type="number" min="0" step="0.5"
            value={timeSaved}
            onChange={(e) => handleChange("timeSaved", e.target.value)}
            placeholder="e.g. 0.5"
            style={{ width: "100%", background: "#0A0F1E", border: "1px solid #1E2D45", borderRadius: 8, padding: "10px 14px", color: "#E2E8F0", fontSize: 14, outline: "none", fontFamily: "JetBrains Mono, monospace", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <div style={{ color: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono, monospace", letterSpacing: 1, marginBottom: 6 }}>USERS AFFECTED</div>
          <input
            type="number" min="0"
            value={usersAffected}
            onChange={(e) => handleChange("usersAffected", e.target.value)}
            placeholder="e.g. 25"
            style={{ width: "100%", background: "#0A0F1E", border: "1px solid #1E2D45", borderRadius: 8, padding: "10px 14px", color: "#E2E8F0", fontSize: 14, outline: "none", fontFamily: "JetBrains Mono, monospace", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <div style={{ color: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono, monospace", letterSpacing: 1, marginBottom: 6 }}>FREQUENCY</div>
          <select
            value={frequency}
            onChange={(e) => handleChange("frequency", e.target.value)}
            style={{ width: "100%", background: "#0A0F1E", border: "1px solid #1E2D45", borderRadius: 8, padding: "10px 14px", color: "#E2E8F0", fontSize: 14, outline: "none", fontFamily: "JetBrains Mono, monospace", boxSizing: "border-box" }}
          >
            {Object.keys(FREQ_MULTIPLIERS).map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {annualValue > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "#0A0F1E", border: "1px solid #1E2D45", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ color: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono, monospace", letterSpacing: 1, marginBottom: 6 }}>ANNUAL HOURS SAVED</div>
            <div style={{ color: "#10B981", fontSize: 22, fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>{annualHours.toLocaleString()} hrs</div>
            <div style={{ color: "#64748B", fontSize: 11, marginTop: 4 }}>{usersAffected} users × {timeSaved}h × {freqMult}x/yr</div>
          </div>
          <div style={{ background: "#0A0F1E", border: "1px solid #1E2D45", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ color: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono, monospace", letterSpacing: 1, marginBottom: 6 }}>ANNUAL VALUE (@ €{HOURLY_RATE}/hr)</div>
            <div style={{ color: "#10B981", fontSize: 22, fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>€{annualValue.toLocaleString()}</div>
            <div style={{ color: "#64748B", fontSize: 11, marginTop: 4 }}>{annualHours.toLocaleString()} hrs × €{HOURLY_RATE}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DIMENSION SLIDER ──────────────────────────────────────────────────────────
function DimensionSlider({ dim, value, onChange }) {
  return (
    <div style={{ background: "#111827", border: "1px solid #1E2D45", borderRadius: 12, padding: "20px 24px", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700, color: dim.color, letterSpacing: 2, background: dim.color + "20", padding: "2px 8px", borderRadius: 4 }}>
            {dim.code} · {Math.round(dim.weight * 100)}% weight
          </span>
          <div style={{ color: "#E2E8F0", fontWeight: 600, fontSize: 15, marginTop: 6 }}>{dim.label}</div>
        </div>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 28, fontWeight: 800, color: value > 0 ? dim.color : "#1E2D45", minWidth: 32, textAlign: "right", transition: "color 0.2s" }}>
          {value || "—"}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {[1, 2, 3, 4, 5].map((v) => (
          <button key={v} onClick={() => onChange(v)} style={{
            flex: 1, height: 40, borderRadius: 8,
            border: value === v ? `2px solid ${dim.color}` : "2px solid #1E2D45",
            background: value === v ? dim.color + "25" : "#0A0F1E",
            color: value === v ? dim.color : "#64748B",
            fontFamily: "JetBrains Mono, monospace", fontSize: 14, fontWeight: 700,
            cursor: "pointer", transition: "all 0.15s ease",
          }}>{v}</button>
        ))}
      </div>
      {value > 0 && (
        <div style={{ color: "#64748B", fontSize: 12, fontStyle: "italic", lineHeight: 1.5, borderTop: "1px solid #1E2D45", paddingTop: 10 }}>
          {dim.descriptions[value - 1]}
        </div>
      )}
    </div>
  );
}

// ─── SCREEN 1: INPUT ───────────────────────────────────────────────────────────
function ScreenInput({ onNext }) {
  const [form, setForm] = useState({ requestId: "REQ-001", description: "", businessUnit: "", devDays: "" });
  const [scores, setScores] = useState({ d1: 0, d2: 0, d3: 0, d4: 0 });
  const [bizAdv, setBizAdv] = useState({ timeSaved: "", usersAffected: "", frequency: "Daily" });
  const [q1Suggested, setQ1Suggested] = useState(false);

  const composite = DIMENSIONS.reduce((sum, d) => sum + (scores[d.id] || 0) * 20 * d.weight, 0);
  const allFilled = form.description && form.businessUnit && form.devDays && Object.values(scores).every((v) => v > 0);

  const annualHours = (Number(bizAdv.timeSaved) || 0) * (Number(bizAdv.usersAffected) || 0) * (FREQ_MULTIPLIERS[bizAdv.frequency] || 250);
  const annualValue = annualHours * HOURLY_RATE;

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: "#64748B", fontSize: 12, fontFamily: "JetBrains Mono, monospace", letterSpacing: 2, marginBottom: 6 }}>STEP 1 OF 4</div>
          <h2 style={{ color: "#E2E8F0", fontSize: 26, fontWeight: 700, margin: 0 }}>Describe the Request</h2>
          <p style={{ color: "#64748B", fontSize: 14, marginTop: 6 }}>Enter details, check for standard apps, quantify the business case, then rate each governance dimension.</p>
        </div>

        {/* Request info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          {[{ label: "Request ID", key: "requestId", placeholder: "REQ-001" }, { label: "Business Unit", key: "businessUnit", placeholder: "Finance, SCM, HR..." }].map(({ label, key, placeholder }) => (
            <div key={key}>
              <div style={{ color: "#64748B", fontSize: 11, fontFamily: "JetBrains Mono, monospace", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
              <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder}
                style={{ width: "100%", background: "#111827", border: "1px solid #1E2D45", borderRadius: 8, padding: "10px 14px", color: "#E2E8F0", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }} />
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ color: "#64748B", fontSize: 11, fontFamily: "JetBrains Mono, monospace", letterSpacing: 1, marginBottom: 6 }}>REQUIREMENT DESCRIPTION</div>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe what the business unit is requesting..." rows={3}
            style={{ width: "100%", background: "#111827", border: "1px solid #1E2D45", borderRadius: 8, padding: "10px 14px", color: "#E2E8F0", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }} />
        </div>

        {/* AI App Matcher */}
        <AppMatcher description={form.description} onSuggestQ1={() => setQ1Suggested(true)} />

        {q1Suggested && (
          <div style={{ marginBottom: 16, padding: "10px 14px", background: "#10B98110", border: "1px solid #10B98140", borderRadius: 8, color: "#10B981", fontSize: 12 }}>
            ℹ Standard app match detected — in Pillar 2 Decision Tree, consider answering Q1 = Yes
          </div>
        )}

        {/* Dev days */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: "#64748B", fontSize: 11, fontFamily: "JetBrains Mono, monospace", letterSpacing: 1, marginBottom: 6 }}>ESTIMATED DEVELOPMENT DAYS</div>
          <input type="number" value={form.devDays} onChange={(e) => setForm({ ...form, devDays: e.target.value })} placeholder="e.g. 10"
            style={{ width: 160, background: "#111827", border: "1px solid #1E2D45", borderRadius: 8, padding: "10px 14px", color: "#E2E8F0", fontSize: 14, outline: "none", fontFamily: "JetBrains Mono, monospace" }} />
        </div>

        {/* Business Advantage */}
        <BusinessAdvantage value={bizAdv} onChange={setBizAdv} />

        {/* Dimension sliders */}
        <div style={{ color: "#64748B", fontSize: 11, fontFamily: "JetBrains Mono, monospace", letterSpacing: 1, marginBottom: 12 }}>GOVERNANCE DIMENSIONS — RATE 1 TO 5</div>
        {DIMENSIONS.map((dim) => (
          <DimensionSlider key={dim.id} dim={dim} value={scores[dim.id]} onChange={(v) => setScores({ ...scores, [dim.id]: v })} />
        ))}

        <button onClick={() => allFilled && onNext({ form, scores, composite, bizAdv, annualValue })} disabled={!allFilled}
          style={{ width: "100%", padding: "14px 0", background: allFilled ? "#3B82F6" : "#1E2D45", color: allFilled ? "#fff" : "#64748B", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: allFilled ? "pointer" : "not-allowed", fontFamily: "Inter, sans-serif", transition: "all 0.2s", marginTop: 8 }}>
          Calculate Score →
        </button>
      </div>

      {/* Live preview sidebar */}
      <div style={{ width: 220, position: "sticky", top: 24, background: "#111827", border: "1px solid #1E2D45", borderRadius: 16, padding: 24 }}>
        <div style={{ color: "#64748B", fontSize: 11, fontFamily: "JetBrains Mono, monospace", letterSpacing: 2, marginBottom: 16, textAlign: "center" }}>LIVE SCORE</div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <ScoreRing score={composite} size={130} />
        </div>
        <div style={{ borderTop: "1px solid #1E2D45", paddingTop: 16 }}>
          {DIMENSIONS.map((dim) => {
            const contribution = (scores[dim.id] || 0) * 20 * dim.weight;
            return (
              <div key={dim.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: dim.color, fontSize: 11, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>{dim.code}</span>
                  <span style={{ color: "#E2E8F0", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>{contribution.toFixed(1)}</span>
                </div>
                <div style={{ height: 4, background: "#1E2D45", borderRadius: 2 }}>
                  <div style={{ height: "100%", borderRadius: 2, background: dim.color, width: `${(contribution / 30) * 100}%`, transition: "width 0.3s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
        {annualValue > 0 && (
          <div style={{ borderTop: "1px solid #1E2D45", paddingTop: 12, marginTop: 4 }}>
            <div style={{ color: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono, monospace", letterSpacing: 1, marginBottom: 6 }}>ANNUAL VALUE</div>
            <div style={{ color: "#10B981", fontSize: 16, fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>€{annualValue.toLocaleString()}</div>
          </div>
        )}
        <div style={{ color: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono, monospace", marginTop: 12, textAlign: "center" }}>
          {Object.values(scores).filter(Boolean).length} / 4 dimensions rated
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN 2: PILLAR 1 RESULTS ────────────────────────────────────────────────
function ScreenPillar1({ data, onNext, onBack }) {
  const { form, scores, composite, annualValue } = data;
  const verdict = composite <= 40 ? "GREEN" : composite <= 70 ? "AMBER" : "RED";
  const verdictColor = verdict === "GREEN" ? "#10B981" : verdict === "AMBER" ? "#F59E0B" : "#EF4444";
  const verdictBg = verdict === "GREEN" ? "#052e16" : verdict === "AMBER" ? "#1c1000" : "#1c0000";
  const verdictBorder = verdict === "GREEN" ? "#166534" : verdict === "AMBER" ? "#78350f" : "#7f1d1d";
  const buildCost = Number(form.devDays) * 1200;
  const annualMaint = buildCost * 0.15;
  const tco5yr = buildCost + annualMaint * 5;
  const value5yr = annualValue * 5;
  const roiPositive = value5yr > tco5yr;
  const verdictText = {
    GREEN: "Proceed as standard or configured. Low financial and architectural risk.",
    AMBER: "Extend with caution. Consider the key-user extension route before custom development.",
    RED: "Reconsider custom UI5. High TCO and upgrade risk require senior sign-off.",
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: "#64748B", fontSize: 12, fontFamily: "JetBrains Mono, monospace", letterSpacing: 2, marginBottom: 6 }}>STEP 2 OF 4</div>
        <h2 style={{ color: "#E2E8F0", fontSize: 26, fontWeight: 700, margin: 0 }}>Pillar 1 — Scoring Result</h2>
        <p style={{ color: "#64748B", fontSize: 14, marginTop: 6 }}>{form.requestId} · {form.businessUnit}</p>
      </div>

      <div style={{ background: verdictBg, border: `1px solid ${verdictBorder}`, borderRadius: 16, padding: 32, marginBottom: 20, display: "flex", alignItems: "center", gap: 32 }}>
        <ScoreRing score={composite} size={140} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 700, color: verdictColor, letterSpacing: 3, marginBottom: 8 }}>VERDICT — {verdict}</div>
          <div style={{ color: "#E2E8F0", fontSize: 16, lineHeight: 1.6 }}>{verdictText[verdict]}</div>
        </div>
      </div>

      <div style={{ background: "#111827", border: "1px solid #1E2D45", borderRadius: 16, padding: 24, marginBottom: 20 }}>
        <div style={{ color: "#64748B", fontSize: 11, fontFamily: "JetBrains Mono, monospace", letterSpacing: 2, marginBottom: 16 }}>DIMENSION BREAKDOWN</div>
        {DIMENSIONS.map((dim) => {
          const raw = scores[dim.id];
          const contribution = raw * 20 * dim.weight;
          const maxContribution = 5 * 20 * dim.weight;
          return (
            <div key={dim.id} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div>
                  <span style={{ color: dim.color, fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 700 }}>{dim.code}</span>
                  <span style={{ color: "#E2E8F0", fontSize: 13, marginLeft: 10 }}>{dim.label}</span>
                </div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", color: "#E2E8F0", fontSize: 12 }}>
                  {contribution.toFixed(1)} / {maxContribution.toFixed(0)}
                  <span style={{ color: "#64748B", marginLeft: 8 }}>({Math.round(dim.weight * 100)}%)</span>
                </div>
              </div>
              <div style={{ height: 6, background: "#1E2D45", borderRadius: 3 }}>
                <div style={{ height: "100%", borderRadius: 3, background: dim.color, width: `${(contribution / maxContribution) * 100}%` }} />
              </div>
              <div style={{ color: "#64748B", fontSize: 11, marginTop: 4 }}>Score {raw}/5 — {dim.descriptions[raw - 1]}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: annualValue > 0 ? "1fr 1fr 1fr 1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { label: "BUILD COST", value: `€${buildCost.toLocaleString()}`, sub: `${form.devDays} days × €1,200` },
          { label: "ANNUAL MAINTENANCE", value: `€${annualMaint.toLocaleString()}`, sub: "15% of build cost" },
          { label: "5-YEAR TCO", value: `€${tco5yr.toLocaleString()}`, sub: "Lifetime cost", highlight: true },
          ...(annualValue > 0 ? [{ label: "5-YEAR VALUE", value: `€${value5yr.toLocaleString()}`, sub: roiPositive ? "✓ ROI positive" : "⚠ ROI negative", valueColor: roiPositive ? "#10B981" : "#EF4444" }] : []),
        ].map(({ label, value, sub, highlight, valueColor }) => (
          <div key={label} style={{ background: highlight ? "#0c1a2e" : "#111827", border: `1px solid ${highlight ? "#1e3a5f" : "#1E2D45"}`, borderRadius: 12, padding: 20 }}>
            <div style={{ color: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono, monospace", letterSpacing: 2, marginBottom: 8 }}>{label}</div>
            <div style={{ color: valueColor || (highlight ? "#3B82F6" : "#E2E8F0"), fontSize: 18, fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>{value}</div>
            <div style={{ color: "#64748B", fontSize: 11, marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {annualValue > 0 && !roiPositive && (
        <div style={{ marginBottom: 20, padding: "12px 16px", background: "#1c0000", border: "1px solid #7f1d1d", borderRadius: 10, color: "#EF4444", fontSize: 13 }}>
          ⚠ The 5-year TCO (€{tco5yr.toLocaleString()}) exceeds the projected business value (€{value5yr.toLocaleString()}). This customisation does not have a positive ROI case.
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onBack} style={{ padding: "12px 24px", background: "transparent", color: "#64748B", border: "1px solid #1E2D45", borderRadius: 10, fontSize: 14, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>← Back</button>
        <button onClick={() => onNext({ ...data, verdict })} style={{ flex: 1, padding: "14px 0", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
          Proceed to Decision Tree →
        </button>
      </div>
    </div>
  );
}

// ─── SCREEN 3: PILLAR 2 TREE ───────────────────────────────────────────────────
function ScreenPillar2({ data, onNext, onBack }) {
  const [current, setCurrent] = useState("q1");
  const [history, setHistory] = useState([]);
  const [outcome, setOutcome] = useState(null);

  const handleAnswer = (answer) => {
    const q = TREE_QUESTIONS.find((q) => q.id === current);
    const next = answer === "yes" ? q.yes : q.no;
    setHistory([...history, { id: current, answer }]);
    if (next.startsWith("outcome-")) setOutcome(next);
    else setCurrent(next);
  };

  const currentQ = TREE_QUESTIONS.find((q) => q.id === current);
  const outcomeData = outcome ? OUTCOMES[outcome] : null;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: "#64748B", fontSize: 12, fontFamily: "JetBrains Mono, monospace", letterSpacing: 2, marginBottom: 6 }}>STEP 3 OF 4</div>
        <h2 style={{ color: "#E2E8F0", fontSize: 26, fontWeight: 700, margin: 0 }}>Pillar 2 — Decision Tree</h2>
        <p style={{ color: "#64748B", fontSize: 14, marginTop: 6 }}>Answer each governance question to determine the appropriate path.</p>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {TREE_QUESTIONS.map((q) => {
          const answered = history.find((h) => h.id === q.id);
          const isActive = current === q.id && !outcome;
          return <div key={q.id} style={{ flex: 1, height: 4, borderRadius: 2, background: answered ? "#3B82F6" : isActive ? "#3B82F640" : "#1E2D45" }} />;
        })}
      </div>

      {history.map((h) => {
        const q = TREE_QUESTIONS.find((q) => q.id === h.id);
        return (
          <div key={h.id} style={{ background: "#111827", border: "1px solid #1E2D45", borderRadius: 10, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ color: "#3B82F6", fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700 }}>{q.label}</span>
              <span style={{ color: "#64748B", fontSize: 13, marginLeft: 10 }}>{q.question}</span>
            </div>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700, color: h.answer === "yes" ? "#10B981" : "#EF4444", background: h.answer === "yes" ? "#10B98120" : "#EF444420", padding: "3px 10px", borderRadius: 4 }}>
              {h.answer.toUpperCase()}
            </span>
          </div>
        );
      })}

      {!outcome && currentQ && (
        <div style={{ background: "#0c1a2e", border: "1px solid #1e3a5f", borderRadius: 16, padding: 28, marginBottom: 16 }}>
          <div style={{ color: "#3B82F6", fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>{currentQ.label} · ACTIVE</div>
          <div style={{ color: "#E2E8F0", fontSize: 18, fontWeight: 600, lineHeight: 1.5, marginBottom: 8 }}>{currentQ.question}</div>
          <div style={{ color: "#64748B", fontSize: 12, fontStyle: "italic", marginBottom: 24 }}>{currentQ.theory}</div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => handleAnswer("yes")} style={{ flex: 1, padding: "14px 0", background: "#10B98120", border: "1px solid #10B981", color: "#10B981", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>✓ Yes</button>
            <button onClick={() => handleAnswer("no")} style={{ flex: 1, padding: "14px 0", background: "#EF444420", border: "1px solid #EF4444", color: "#EF4444", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>✗ No</button>
          </div>
        </div>
      )}

      {outcomeData && (
        <div style={{ background: outcomeData.bg, border: `1px solid ${outcomeData.border}`, borderRadius: 16, padding: 28, marginBottom: 16 }}>
          <div style={{ color: outcomeData.color, fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>OUTCOME DETERMINED</div>
          <div style={{ color: "#E2E8F0", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{outcomeData.label}</div>
          <div style={{ color: "#E2E8F0", fontSize: 15, lineHeight: 1.6, marginBottom: 12 }}>{outcomeData.description}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ color: "#64748B", fontSize: 12 }}>Risk level:</span>
            <span style={{ color: outcomeData.color, fontSize: 12, fontWeight: 700 }}>{outcomeData.risk}</span>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onBack} style={{ padding: "12px 24px", background: "transparent", color: "#64748B", border: "1px solid #1E2D45", borderRadius: 10, fontSize: 14, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>← Back</button>
        {outcomeData && (
          <button onClick={() => onNext({ ...data, outcome, outcomeData })} style={{ flex: 1, padding: "14px 0", background: "#3B82F6", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
            View Recommendation →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN 4: RESULT ──────────────────────────────────────────────────────────
function ScreenResult({ data, onRestart }) {
  const { form, scores, composite, verdict, outcomeData, annualValue } = data;
  const buildCost = Number(form.devDays) * 1200;
  const tco5yr = buildCost + buildCost * 0.15 * 5;
  const value5yr = annualValue * 5;
  const roiPositive = value5yr > tco5yr;
  const verdictColor = verdict === "GREEN" ? "#10B981" : verdict === "AMBER" ? "#F59E0B" : "#EF4444";

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: "#64748B", fontSize: 12, fontFamily: "JetBrains Mono, monospace", letterSpacing: 2, marginBottom: 6 }}>STEP 4 OF 4</div>
        <h2 style={{ color: "#E2E8F0", fontSize: 26, fontWeight: 700, margin: 0 }}>Governance Recommendation</h2>
        <p style={{ color: "#64748B", fontSize: 14, marginTop: 6 }}>{form.requestId} · {form.description}</p>
      </div>

      <div style={{ background: "#111827", border: "1px solid #1E2D45", borderRadius: 16, padding: 28, marginBottom: 20, display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center" }}>
        <div>
          <div style={{ color: "#64748B", fontSize: 11, fontFamily: "JetBrains Mono, monospace", letterSpacing: 2, marginBottom: 8 }}>RECOMMENDED ACTION</div>
          <div style={{ color: outcomeData.color, fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{outcomeData.label}</div>
          <div style={{ color: "#E2E8F0", fontSize: 15, lineHeight: 1.6 }}>{outcomeData.description}</div>
        </div>
        <ScoreRing score={composite} size={110} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#111827", border: "1px solid #1E2D45", borderRadius: 12, padding: 20 }}>
          <div style={{ color: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono, monospace", letterSpacing: 2, marginBottom: 8 }}>PILLAR 1</div>
          <div style={{ color: verdictColor, fontSize: 20, fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>{Math.round(composite)}/100</div>
          <div style={{ color: verdictColor, fontSize: 12, fontWeight: 700, marginTop: 4 }}>{verdict}</div>
        </div>
        <div style={{ background: "#111827", border: "1px solid #1E2D45", borderRadius: 12, padding: 20 }}>
          <div style={{ color: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono, monospace", letterSpacing: 2, marginBottom: 8 }}>PILLAR 2</div>
          <div style={{ color: outcomeData.color, fontSize: 16, fontWeight: 800 }}>{outcomeData.label}</div>
          <div style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>Risk: {outcomeData.risk}</div>
        </div>
        <div style={{ background: "#111827", border: "1px solid #1E2D45", borderRadius: 12, padding: 20 }}>
          <div style={{ color: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono, monospace", letterSpacing: 2, marginBottom: 8 }}>5-YEAR TCO</div>
          <div style={{ color: "#3B82F6", fontSize: 20, fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>€{tco5yr.toLocaleString()}</div>
          <div style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>Full lifetime cost</div>
        </div>
      </div>

      {annualValue > 0 && (
        <div style={{ background: roiPositive ? "#052e16" : "#1c0000", border: `1px solid ${roiPositive ? "#166534" : "#7f1d1d"}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ color: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono, monospace", letterSpacing: 2, marginBottom: 12 }}>BUSINESS CASE ANALYSIS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ color: "#64748B", fontSize: 11, marginBottom: 4 }}>5-Year Value</div>
              <div style={{ color: "#10B981", fontSize: 18, fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>€{value5yr.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ color: "#64748B", fontSize: 11, marginBottom: 4 }}>5-Year TCO</div>
              <div style={{ color: "#EF4444", fontSize: 18, fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>€{tco5yr.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ color: "#64748B", fontSize: 11, marginBottom: 4 }}>Net Position</div>
              <div style={{ color: roiPositive ? "#10B981" : "#EF4444", fontSize: 18, fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>
                {roiPositive ? "+" : ""}€{(value5yr - tco5yr).toLocaleString()}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, color: roiPositive ? "#10B981" : "#EF4444", fontSize: 13, fontWeight: 600 }}>
            {roiPositive ? "✓ Positive ROI — business case supports the investment." : "⚠ Negative ROI — business value does not justify the total cost of ownership."}
          </div>
        </div>
      )}

      <div style={{ background: "#111827", border: "1px solid #1E2D45", borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ color: "#64748B", fontSize: 11, fontFamily: "JetBrains Mono, monospace", letterSpacing: 2, marginBottom: 16 }}>SCORING SUMMARY</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {DIMENSIONS.map((dim) => (
            <div key={dim.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: dim.color, fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 700, minWidth: 24 }}>{dim.code}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#E2E8F0", fontSize: 12 }}>{dim.label}</span>
                  <span style={{ color: dim.color, fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 700 }}>{scores[dim.id]}/5</span>
                </div>
                <div style={{ height: 4, background: "#1E2D45", borderRadius: 2, marginTop: 4 }}>
                  <div style={{ height: "100%", borderRadius: 2, background: dim.color, width: `${(scores[dim.id] / 5) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onRestart} style={{ width: "100%", padding: "14px 0", background: "transparent", color: "#3B82F6", border: "1px solid #3B82F6", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
        + New Assessment
      </button>

      <div style={{ textAlign: "center", marginTop: 24, color: "#64748B", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>
        Governance Toolkit · Yogesh Bhavathankar · CBS International Business School · 2026
      </div>
    </div>
  );
}

// ─── APP SHELL ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState(0);
  const [sessionData, setSessionData] = useState({});
  const screens = ["Input", "Pillar 1", "Pillar 2", "Result"];

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", fontFamily: "Inter, sans-serif", color: "#E2E8F0" }}>
      <div style={{ borderBottom: "1px solid #1E2D45", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, background: "#0A0F1E", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>G</div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#E2E8F0" }}>Governance Toolkit</span>
          <span style={{ color: "#1E2D45", margin: "0 6px" }}>|</span>
          <span style={{ color: "#64748B", fontSize: 13 }}>SAP S/4HANA Customisation Decision</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {screens.map((s, i) => (
            <div key={s} style={{ padding: "4px 12px", borderRadius: 6, background: screen === i ? "#1E2D45" : "transparent", color: screen === i ? "#E2E8F0" : "#64748B", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}>
              {String(i + 1).padStart(2, "0")} {s}
            </div>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {screen === 0 && <ScreenInput onNext={(d) => { setSessionData(d); setScreen(1); }} />}
        {screen === 1 && <ScreenPillar1 data={sessionData} onNext={(d) => { setSessionData(d); setScreen(2); }} onBack={() => setScreen(0)} />}
        {screen === 2 && <ScreenPillar2 data={sessionData} onNext={(d) => { setSessionData(d); setScreen(3); }} onBack={() => setScreen(1)} />}
        {screen === 3 && <ScreenResult data={sessionData} onRestart={() => { setSessionData({}); setScreen(0); }} />}
      </div>
    </div>
  );
}