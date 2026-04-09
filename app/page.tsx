"use client";

import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

type Risk = "low" | "moderate" | "high";
type Decision = "SEND" | "REVIEW" | "BLOCK";

interface ModelDiagnostic {
  provider?: string;
  quality_score?: number;
  duration_ms?: number;
  timed_out?: boolean;
  used_fallback?: boolean;
}

interface VerifyResult {
  trust: number;
  risk: Risk;
  decision: Decision;
  verified_answer: string | null;
  shared_conclusion: string | null;
  key_disagreement: string | null;
  decision_rule: string | null;
  decision_reason: string | null;
  consensus: "high" | "medium" | "low" | null;
  semantic_label: string | null;
  disagreement_type: string | null;
  final_conclusion_aligned: boolean | null;
  model_diagnostics: ModelDiagnostic[] | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const DECISION_COLORS: Record<Decision, string> = {
  SEND: "#16a34a",
  REVIEW: "#d97706",
  BLOCK: "#dc2626"
};

const RISK_COLORS: Record<Risk, string> = {
  low: "#16a34a",
  moderate: "#d97706",
  high: "#dc2626"
};

function decisionLabel(decision: Decision): string {
  if (decision === "SEND") return "SEND RESPONSE";
  if (decision === "REVIEW") return "ESCALATE TO HUMAN";
  return "BLOCK EXECUTION";
}

function decisionExplanation(result: VerifyResult): string | null {
  if (result.decision === "SEND") {
    if (result.decision_rule) return result.decision_rule;
    if (result.decision_reason) return result.decision_reason;
    return "No execution risk detected. Approved for execution.";
  }
  if (result.decision === "REVIEW") {
    const agreementTerms = /disagree|agreement|aligned|alignment|no meaningful/i;
    if (result.decision_rule && !agreementTerms.test(result.decision_rule)) return result.decision_rule;
    if (result.decision_reason && !agreementTerms.test(result.decision_reason)) return result.decision_reason;
    return "Policy or edge-case condition detected. Automated execution blocked pending human review.";
  }
  // BLOCK
  if (result.decision_reason) return result.decision_reason;
  if (result.decision_rule) return result.decision_rule;
  return "Execution blocked. Action would trigger real-world impact without verified context.";
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .trim();
}

function clampSentences(text: string, max = 2): string {
  const cleaned = stripMarkdown(text);
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) ?? [];
  return sentences.slice(0, max).join(" ").trim() || cleaned.slice(0, 220).trim();
}

// ── ExecutionFailureDemo ───────────────────────────────────────────────────────

function ExecutionFailureDemo() {
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRun = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setError("");
    setDraft("");
    setVerifyResult(null);

    try {
      // Step 1: Generate draft
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || "Failed to generate response");

      const generatedDraft: string = genData.draft;
      setDraft(generatedDraft);

      // Step 2: Verify the SAME draft
      const verifyRes = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: generatedDraft, raw_prompt: message })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Failed to verify response");

      setVerifyResult(verifyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Scenario input */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
          Scenario
        </label>

        {/* Preset scenario buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {[
            { label: "Safe response (ALLOW)", message: "Where can I find my order tracking number?" },
            { label: "Needs review (REVIEW)", message: "A customer wants to return an item after 45 days. Our policy says 30 days." },
            { label: "High risk (BLOCK)", message: "Customer says they never received their order and wants a full refund.\nWe have not confirmed delivery status yet.\nWrite a response." }
          ].map(({ label, message: preset }) => (
            <button
              key={label}
              onClick={() => setMessage(preset)}
              style={{
                padding: "4px 12px",
                fontSize: 13,
                fontWeight: 500,
                background: "#f3f4f6",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: 20,
                cursor: "pointer"
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#e5e7eb")}
              onMouseLeave={e => (e.currentTarget.style.background = "#f3f4f6")}
            >
              {label}
            </button>
          ))}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. I was charged twice for my order and I want a refund immediately."
          rows={4}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 15,
            border: "1px solid #d1d5db",
            borderRadius: 6,
            boxSizing: "border-box",
            resize: "vertical"
          }}
        />
        <button
          onClick={handleRun}
          disabled={loading || !message.trim()}
          style={{
            marginTop: 10,
            padding: "10px 20px",
            fontSize: 15,
            fontWeight: 600,
            background: loading ? "#9ca3af" : "#1d4ed8",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: loading || !message.trim() ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Processing..." : "Run Through Decision Layer"}
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: 12, background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 6, color: "#991b1b" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* AI Draft (shared) */}
      {draft && (
        <div style={{ marginBottom: 28, padding: 16, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              AI Output — Unverified
            </div>
            <div style={{ fontSize: 12, color: "#92400e", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 4, padding: "2px 8px" }}>
              ⚠️ Not yet validated
            </div>
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.6, color: "#111" }}>
            {draft}
          </div>
        </div>
      )}

      {/* Side-by-side comparison */}
      {draft && verifyResult && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* WITHOUT VERIFICATION */}
            <div style={{ border: "2px solid #dc2626", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: "#dc2626", color: "#fff", padding: "10px 16px" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Without Verification</div>
                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
                  AI output is executed without validation. No decision layer applied.
                </div>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Message:</div>
                  <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>{draft}</div>
                </div>
                <div style={{
                  padding: "16px",
                  background: "#16a34a",
                  color: "#fff",
                  borderRadius: 6,
                  fontWeight: 800,
                  fontSize: 22,
                  textAlign: "center",
                  letterSpacing: "0.08em"
                }}>
                  Sent
                </div>
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #fecaca" }}>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
                    Response matches the request. No validation performed.
                  </div>
                </div>
              </div>
            </div>

            {/* WITH ZORELAN */}
            <div style={{ border: "2px solid #1d4ed8", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: "#1d4ed8", color: "#fff", padding: "10px 16px" }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Execution Gate (Zorelan)</div>
                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>AI output enters — execution decision exits</div>
              </div>
              <div style={{ padding: 20 }}>

                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>AI → DECISION → EXECUTION</div>

                {/* Decision badge */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Decision</div>
                  <div style={{
                    padding: "16px",
                    background: DECISION_COLORS[verifyResult.decision],
                    color: "#fff",
                    borderRadius: 6,
                    fontWeight: 800,
                    fontSize: 22,
                    textAlign: "center",
                    letterSpacing: "0.08em"
                  }}>
                    {verifyResult.decision === "SEND" && "ALLOW"}
                    {verifyResult.decision === "REVIEW" && "REVIEW REQUIRED"}
                    {verifyResult.decision === "BLOCK" && "BLOCKED"}
                  </div>
                  {verifyResult.decision === "SEND" && (
                    <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>
                      No execution risk detected. Approved for execution.
                    </p>
                  )}
                  {verifyResult.decision === "REVIEW" && (
                    <p style={{ fontSize: 13, color: "#fdba74", marginTop: 8 }}>
                      Execution requires human approval. Policy or edge-case detected.
                    </p>
                  )}
                  {verifyResult.decision === "BLOCK" && (
                    <p style={{ fontSize: 13, color: "#fca5a5", marginTop: 8 }}>
                      Execution blocked. Action would trigger real-world impact without verified context.
                    </p>
                  )}
                </div>

                {/* Decision basis */}
                {decisionExplanation(verifyResult) && (
                  <div style={{ marginBottom: 20, padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                      DECISION BASIS
                    </div>
                    <div style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.6 }}>
                      {decisionExplanation(verifyResult)}
                    </div>
                  </div>
                )}

                {/* Trust score */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#e5e7eb" }}>
                    {verifyResult.trust >= 75 ? "High" : verifyResult.trust >= 55 ? "Moderate" : "Low"} confidence ({verifyResult.trust} / 100)
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>Based on cross-model verification</div>
                <div style={{ height: 8, background: "#e5e7eb", borderRadius: 4, marginBottom: 20 }}>
                  <div style={{
                    height: "100%",
                    width: `${verifyResult.trust}%`,
                    background: verifyResult.trust >= 75 ? "#16a34a" : verifyResult.trust >= 55 ? "#d97706" : "#dc2626",
                    borderRadius: 4,
                    transition: "width 0.4s ease"
                  }} />
                </div>

                {/* Reasoning fields */}
                <div style={{ marginBottom: 20, border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
                  {verifyResult.verified_answer && (
                    <div style={{ padding: "12px 14px", borderBottom: "1px solid #e2e8f0", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px 6px 0 0" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Verified answer (synthesized)</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#e5e7eb", lineHeight: 1.7 }}>{clampSentences(verifyResult.verified_answer)}</div>
                    </div>
                  )}
                  {verifyResult.shared_conclusion && (
                    <div style={{ padding: "12px", marginTop: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Shared conclusion</div>
                      <div style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.6 }}>{verifyResult.shared_conclusion}</div>
                    </div>
                  )}
                  {verifyResult.key_disagreement && (
                    <div style={{ padding: "12px", marginTop: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Key difference</div>
                      <div style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.6 }}>{verifyResult.key_disagreement}</div>
                    </div>
                  )}
                  {verifyResult.decision_rule && (
                    <div style={{ padding: "12px", marginTop: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Decision rule</div>
                      <div style={{ fontSize: 13, color: "#d1d5db", lineHeight: 1.6 }}>{verifyResult.decision_rule}</div>
                    </div>
                  )}
                </div>

                {/* Risk */}
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#e5e7eb" }}>
                    Action risk:{" "}
                    <span style={{ color: RISK_COLORS[verifyResult.risk], textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {verifyResult.risk}
                    </span>
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
                  {verifyResult.risk === "low" && "Correctness does not guarantee safe execution."}
                  {verifyResult.risk === "moderate" && "Execution may introduce risk if context is incomplete."}
                  {verifyResult.risk === "high" && "Execution introduces significant real-world risk."}
                </div>

                {/* Execution state */}
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                  {verifyResult.decision === "SEND" && "EXECUTION: AUTOMATED"}
                  {verifyResult.decision === "REVIEW" && "EXECUTION: PENDING HUMAN APPROVAL"}
                  {verifyResult.decision === "BLOCK" && "EXECUTION: PREVENTED"}
                </div>

                {/* Decision dominant element */}
                <div style={{
                  padding: "20px 16px",
                  background: DECISION_COLORS[verifyResult.decision],
                  color: "#fff",
                  borderRadius: 6,
                  fontWeight: 900,
                  fontSize: 24,
                  textAlign: "center",
                  letterSpacing: "0.08em"
                }}>
                  {decisionLabel(verifyResult.decision)}
                </div>

                {/* Warning banner */}
                <div style={{ marginTop: 10, padding: "10px 14px", background: "#422006", borderLeft: "5px solid #f59e0b", borderRadius: 4, lineHeight: 1.6 }}>
                  <span style={{ fontSize: 13, color: "#fef3c7", fontWeight: 600 }}>Without Zorelan, this executes automatically.</span>
                </div>
              </div>
            </div>

          </div>

          {/* Insight line */}
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, fontSize: 14, color: "#1e40af", lineHeight: 1.6 }}>
            Zorelan doesn't just verify answers — it verifies whether it's safe to act on them.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Home() {
  const sectionStyle: React.CSSProperties = {
    marginBottom: 80,
  };

  const dividerStyle: React.CSSProperties = {
    borderTop: "1px solid #e5e7eb",
    marginBottom: 80,
  };

  return (
    <main style={{ padding: "48px 32px 80px", fontFamily: "system-ui, Arial, sans-serif", maxWidth: 1100, margin: "0 auto" }}>

      {/* ── 1. HERO ────────────────────────────────────────────────────────── */}
      <div style={{ ...sectionStyle, maxWidth: 720 }}>
        <h1 style={{ fontSize: 38, fontWeight: 800, margin: "0 0 16px", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          Ship AI safely — or don't ship it at all.
        </h1>
        <p style={{ fontSize: 18, color: "#374151", lineHeight: 1.6, margin: "0 0 12px" }}>
          Zorelan is the decision layer that determines whether AI output is safe to execute — before it reaches users or systems.
        </p>
        <p style={{ fontSize: 15, color: "#6b7280", margin: "0 0 28px", lineHeight: 1.6 }}>
          AI can be correct and still unsafe. Zorelan decides what happens next.
        </p>
        <a
          href="/docs"
          style={{
            display: "inline-block",
            padding: "11px 24px",
            background: "#1d4ed8",
            color: "#fff",
            fontWeight: 600,
            fontSize: 15,
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          View API Docs
        </a>
      </div>

      <div style={dividerStyle} />

      {/* ── 2. WHAT ZORELAN IS ─────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 12px" }}>What Zorelan Actually Does</h2>
        <p style={{ fontSize: 15, color: "#6b7280", margin: "0 0 28px", maxWidth: 600 }}>
          Zorelan is infrastructure, not a model. It sits in the execution path and returns a decision.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 36 }}>
          {[
            { label: "Sits between model output and execution", icon: "→" },
            { label: "Verifies agreement across models", icon: "✓" },
            { label: "Detects disagreement and uncertainty", icon: "≠" },
            { label: "Assigns trust score and risk level", icon: "⚖" },
            { label: "Returns a single decision: allow, review, or block", icon: "⬛" },
          ].map(({ label, icon }) => (
            <div
              key={label}
              style={{ padding: "16px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8 }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.5 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Flow diagram */}
        <div style={{
          padding: "20px 24px",
          background: "#111827",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          gap: 0,
          flexWrap: "wrap",
          fontFamily: "monospace",
          fontSize: 14,
          overflowX: "auto",
        }}>
          {[
            { text: "User Input", bg: "#1e3a5f", color: "#93c5fd" },
            { text: "→", bg: "transparent", color: "#6b7280" },
            { text: "Models", bg: "#1e3a5f", color: "#93c5fd" },
            { text: "→", bg: "transparent", color: "#6b7280" },
            { text: "Zorelan", bg: "#1e40af", color: "#fff" },
            { text: "→", bg: "transparent", color: "#6b7280" },
            { text: "Decision", bg: "#166534", color: "#86efac" },
            { text: "→", bg: "transparent", color: "#6b7280" },
            { text: "Execute / Block", bg: "#7f1d1d", color: "#fca5a5" },
          ].map(({ text, bg, color }, i) => (
            <span
              key={i}
              style={{
                padding: bg === "transparent" ? "0 8px" : "6px 14px",
                background: bg,
                color,
                borderRadius: bg === "transparent" ? 0 : 4,
                fontWeight: bg === "transparent" ? 400 : 600,
                whiteSpace: "nowrap",
              }}
            >
              {text}
            </span>
          ))}
        </div>
      </div>

      <div style={dividerStyle} />

      {/* ── 3. DEMO ────────────────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 8px" }}>AI can be right — and still unsafe to act on.</h2>
        <p style={{ fontSize: 15, color: "#6b7280", margin: "0 0 28px", maxWidth: 640, lineHeight: 1.6 }}>
          This example shows how a reasonable AI response can trigger a bad real-world action — and how Zorelan prevents it.
        </p>
        <ExecutionFailureDemo />
      </div>

      <div style={dividerStyle} />

      {/* ── 4. DECISION MODEL ─────────────────────────────────────────────── */}
      <div style={{ ...sectionStyle, maxWidth: 760 }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 12px" }}>Zorelan Returns a Decision — Not Just an Answer</h2>
        <p style={{ fontSize: 15, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.6 }}>
          Every call returns a structured verdict your system can gate on directly.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
          {[
            { field: "decision", values: "allow | review | block", desc: "The execution verdict" },
            { field: "trust_score", values: "0 – 100", desc: "Cross-model confidence" },
            { field: "risk_level", values: "low | moderate | high", desc: "Execution risk assessment" },
          ].map(({ field, values, desc }) => (
            <div key={field} style={{ padding: 16, border: "1px solid #e5e7eb", borderRadius: 8, background: "#f9fafb" }}>
              <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#1d4ed8", marginBottom: 4 }}>{field}</div>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#374151", marginBottom: 6 }}>{values}</div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Code example */}
        <div style={{ background: "#111827", borderRadius: 8, padding: "20px 24px", fontFamily: "monospace", fontSize: 14, lineHeight: 1.8, marginBottom: 16 }}>
          <div style={{ color: "#9ca3af", marginBottom: 8, fontSize: 12 }}>// Gate execution on result.decision — not on raw model output</div>
          <div>
            <span style={{ color: "#c084fc" }}>if</span>
            <span style={{ color: "#e5e7eb" }}> (result.decision === </span>
            <span style={{ color: "#86efac" }}>"allow"</span>
            <span style={{ color: "#e5e7eb" }}>) {"{"}</span>
          </div>
          <div style={{ paddingLeft: 24 }}>
            <span style={{ color: "#7dd3fc" }}>execute</span>
            <span style={{ color: "#e5e7eb" }}>(result.output)</span>
          </div>
          <div>
            <span style={{ color: "#e5e7eb" }}>{"}"} </span>
            <span style={{ color: "#c084fc" }}>else</span>
            <span style={{ color: "#e5e7eb" }}> {"{"}</span>
          </div>
          <div style={{ paddingLeft: 24 }}>
            <span style={{ color: "#7dd3fc" }}>block</span>
            <span style={{ color: "#e5e7eb" }}>()</span>
          </div>
          <div><span style={{ color: "#e5e7eb" }}>{"}"}</span></div>
        </div>

        <div style={{ padding: "12px 16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, fontSize: 14, color: "#1e40af" }}>
          Your system gates execution on <code style={{ fontFamily: "monospace", background: "#dbeafe", padding: "1px 5px", borderRadius: 3 }}>result.decision</code> — not on raw model output.
        </div>
      </div>

      <div style={dividerStyle} />

      {/* ── 5. WHY THIS MATTERS ───────────────────────────────────────────── */}
      <div style={{ ...sectionStyle, maxWidth: 720 }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 12px" }}>Without a Decision Layer, AI Systems Fail Quietly</h2>
        <p style={{ fontSize: 15, color: "#6b7280", margin: "0 0 20px", lineHeight: 1.6 }}>
          Most AI failures in production aren't dramatic. They're quiet — and expensive.
        </p>

        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px" }}>
          {[
            "Reasonable answers triggering incorrect actions",
            "Financial actions executed without verification",
            "Confident but unsafe outputs reaching users",
            "Silent hallucination risk with no detection layer",
          ].map((item) => (
            <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
              <span style={{ color: "#dc2626", fontWeight: 700, marginTop: 1, flexShrink: 0 }}>×</span>
              <span style={{ fontSize: 15, color: "#374151", lineHeight: 1.5 }}>{item}</span>
            </li>
          ))}
        </ul>

        <div style={{ padding: "14px 18px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, fontSize: 15, color: "#166534", fontWeight: 600 }}>
          Zorelan prevents these failures before execution.
        </div>
      </div>

      <div style={dividerStyle} />

      {/* ── 6. FINAL CTA ──────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", padding: "8px 0 0" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.01em" }}>
          Gate AI execution in production
        </h2>
        <p style={{ fontSize: 16, color: "#6b7280", margin: "0 0 28px" }}>
          Add a decision layer between your AI output and your users.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="/docs"
            style={{
              padding: "12px 28px",
              background: "#1d4ed8",
              color: "#fff",
              fontWeight: 600,
              fontSize: 15,
              borderRadius: 6,
              textDecoration: "none",
            }}
          >
            View API Docs
          </a>
          <a
            href="/get-started"
            style={{
              padding: "12px 28px",
              background: "#fff",
              color: "#1d4ed8",
              fontWeight: 600,
              fontSize: 15,
              borderRadius: 6,
              textDecoration: "none",
              border: "1px solid #1d4ed8",
            }}
          >
            Get Started
          </a>
        </div>
      </div>

    </main>
  );
}
