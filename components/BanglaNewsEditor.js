"use client";

import { useState, useRef, useCallback } from "react";

// Calls our own Next.js API routes (Gemini key is safe on server)
async function callAPI(endpoint, text) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

// ── Colors ──
const C = {
  bg: "#faf8f5", card: "#fff", border: "#e8e0d4",
  accent: "#c62828", accent2: "#1565c0", green: "#2e7d32",
  gold: "#e6a117", text: "#1a1a1a", textMuted: "#8a7e6e",
  textLight: "#b5a898", surface: "#f5f0e8",
};

export default function BanglaNewsEditor() {
  const [text, setText] = useState("");
  const [errors, setErrors] = useState([]);
  const [rewriteResult, setRewriteResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null);
  const [checked, setChecked] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const [activeTab, setActiveTab] = useState("write");
  const [apiError, setApiError] = useState(null);
  const [copyMsg, setCopyMsg] = useState(null);
  const textareaRef = useRef(null);
  const overlayRef = useRef(null);

  const handleScroll = (e) => {
    if (overlayRef.current) overlayRef.current.scrollTop = e.target.scrollTop;
  };

  const checkSpelling = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true); setLoadingType("spell"); setChecked(false);
    setErrors([]); setTooltip(null); setApiError(null);
    try {
      const parsed = await callAPI("/api/check-spelling", text);
      setErrors(parsed.errors || []);
      setChecked(true); setActiveTab("write");
    } catch (err) { setApiError(err.message); setChecked(true); }
    finally { setLoading(false); setLoadingType(null); }
  }, [text]);

  const rewriteNews = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true); setLoadingType("rewrite"); setRewriteResult(null); setApiError(null);
    try {
      const parsed = await callAPI("/api/rewrite-news", text);
      setRewriteResult(parsed); setActiveTab("rewrite");
    } catch (err) { setApiError(err.message); }
    finally { setLoading(false); setLoadingType(null); }
  }, [text]);

  const handleReplace = (wrong, correct) => {
    setText(prev => prev.replace(wrong, correct));
    setTooltip(null);
    // Only remove the fixed error, keep the rest
    setErrors(prev => prev.filter(e => e.wrong !== wrong));
  };

  const handleReplaceAll = () => {
    let t = text;
    errors.forEach(e => { t = t.split(e.wrong).join(e.correct); });
    setText(t); setTooltip(null); setChecked(false); setErrors([]);
  };

  const copy = (content) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopyMsg("কপি হয়েছে!"); setTimeout(() => setCopyMsg(null), 1500);
    }).catch(() => {});
  };

  const applyRewrite = () => {
    if (rewriteResult?.rewritten_bangla) {
      setText(rewriteResult.rewritten_bangla);
      setRewriteResult(null); setChecked(false); setErrors([]); setActiveTab("write");
    }
  };

  const buildSegments = () => {
    if (!checked || errors.length === 0) return null;
    const errMap = {};
    errors.forEach(err => {
      let from = 0;
      while (true) {
        const found = text.indexOf(err.wrong, from);
        if (found === -1) break;
        if (!errMap[found]) { errMap[found] = { ...err, end: found + err.wrong.length }; break; }
        from = found + err.wrong.length;
      }
    });
    const positions = Object.keys(errMap).map(Number).sort((a, b) => a - b);
    const segs = []; let cursor = 0;
    positions.forEach(pos => {
      if (pos < cursor) return;
      if (pos > cursor) segs.push({ type: "text", content: text.slice(cursor, pos) });
      segs.push({ type: "error", content: errMap[pos].wrong, error: errMap[pos] });
      cursor = errMap[pos].end;
    });
    if (cursor < text.length) segs.push({ type: "text", content: text.slice(cursor) });
    return segs;
  };

  const segments = buildSegments();
  const wordCount = text.trim() ? text.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div onClick={() => setTooltip(null)} style={{
      minHeight: "100vh", background: C.bg,
      fontFamily: "'Noto Serif Bengali', 'SolaimanLipi', serif",
      display: "flex", flexDirection: "column", alignItems: "center", padding: 0,
    }}>
      {/* ═══ MASTHEAD ═══ */}
      <header style={{
        width: "100%", background: "#fff", borderBottom: `2px solid ${C.accent}`,
        padding: "18px 0 14px", textAlign: "center",
        boxShadow: "0 2px 20px rgba(0,0,0,0.04)"
      }}>
        <div style={{
          fontSize: "9px", letterSpacing: "5px", color: C.textMuted,
          textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", marginBottom: "4px"
        }}>সাংবাদিকতার ভাষা সেবা</div>
        <h1 style={{ fontSize: "clamp(22px, 5vw, 36px)", color: C.text, margin: 0, fontWeight: 900, lineHeight: 1.2 }}>
          News <span style={{ color: C.accent }}>Wizard</span>
        </h1>
      </header>

      {/* ═══ BODY ═══ */}
      <div style={{ width: "100%", maxWidth: "880px", padding: "20px 16px 60px" }}>

        {/* Error banner */}
        {apiError && (
          <div style={{
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px",
            padding: "10px 16px", marginBottom: "14px", display: "flex",
            alignItems: "center", justifyContent: "space-between", animation: "fadeIn 0.2s ease"
          }}>
            <span style={{ color: C.accent, fontSize: "13px" }}>⚠ {apiError}</span>
            <button onClick={() => setApiError(null)} style={{
              background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: "16px"
            }}>✕</button>
          </div>
        )}

        {/* Copy toast */}
        {copyMsg && (
          <div style={{
            position: "fixed", top: "20px", right: "20px", background: C.green,
            color: "#fff", padding: "8px 18px", borderRadius: "8px", fontSize: "13px",
            fontWeight: 700, zIndex: 2000, animation: "fadeIn 0.2s ease",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
          }}>✓ {copyMsg}</div>
        )}

        {/* ═══ MAIN CARD ═══ */}
        <div style={{
          background: "#fff", borderRadius: "14px", overflow: "hidden",
          border: `1px solid ${C.border}`, boxShadow: "0 4px 30px rgba(0,0,0,0.06)"
        }}>

          {/* Tab Row */}
          <div style={{
            background: C.surface, borderBottom: `1px solid ${C.border}`,
            padding: "0 14px", display: "flex", alignItems: "center",
            justifyContent: "space-between", minHeight: "48px", gap: "6px", overflowX: "auto"
          }}>
            <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
              {[
                { id: "write", icon: "✏️", label: "সংবাদ" },
                { id: "errors", icon: "🔍", label: `ভুল${checked ? ` (${errors.length})` : ""}` },
                { id: "rewrite", icon: "📰", label: "সম্পাদিত" },
              ].map(tab => (
                <button key={tab.id} onClick={e => { e.stopPropagation(); setActiveTab(tab.id); }}
                  style={{
                    padding: "7px 14px", border: "none", borderRadius: "7px",
                    fontSize: "12px", fontWeight: 700, cursor: "pointer",
                    fontFamily: "'Noto Serif Bengali', serif",
                    background: activeTab === tab.id ? C.accent : "transparent",
                    color: activeTab === tab.id ? "#fff" : C.textMuted,
                    transition: "all 0.15s", whiteSpace: "nowrap"
                  }}>{tab.icon} {tab.label}</button>
              ))}
            </div>
            {checked && errors.length > 0 && (
              <button onClick={e => { e.stopPropagation(); handleReplaceAll(); }}
                style={{
                  fontSize: "11px", background: C.green, color: "#fff",
                  border: "none", borderRadius: "6px", padding: "5px 12px",
                  cursor: "pointer", fontWeight: 700, flexShrink: 0
                }}>সব ঠিক করুন</button>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{
            padding: "10px 14px", borderBottom: `1px solid ${C.border}`,
            display: "flex", gap: "8px", flexWrap: "wrap", background: "#fff"
          }}>
            <ActionBtn onClick={checkSpelling} disabled={loading || !text.trim()}
              isLoading={loading && loadingType === "spell"} color={C.accent}
              loadingText="বানান পরীক্ষা হচ্ছে..." text="🔍 বানান পরীক্ষা" />
            <ActionBtn onClick={rewriteNews} disabled={loading || !text.trim()}
              isLoading={loading && loadingType === "rewrite"} color={C.accent2}
              loadingText="সম্পাদনা ও অনুবাদ হচ্ছে..." text="📰 সম্পাদনা + ইংরেজি" />
          </div>

          {/* ─── WRITE TAB ─── */}
          {activeTab === "write" && (
            <div>
              <div style={{ position: "relative" }}>
                {checked && segments && segments.length > 0 && (
                  <div ref={overlayRef} style={{
                    position: "absolute", top: 0, left: 0, right: 0,
                    padding: "18px 20px", fontSize: "16px", lineHeight: 2,
                    wordBreak: "break-word", whiteSpace: "pre-wrap",
                    pointerEvents: "auto", zIndex: 2, overflow: "hidden",
                    boxSizing: "border-box", height: "380px"
                  }}>
                    {segments.map((seg, idx) =>
                      seg.type === "text" ? (
                        <span key={idx} style={{ color: C.text }}>{seg.content}</span>
                      ) : (
                        <span key={idx}
                          style={{
                            color: C.accent, borderBottom: `2px wavy ${C.accent}`,
                            cursor: "pointer", fontWeight: 700,
                            background: tooltip?.error?.wrong === seg.error.wrong
                              ? "rgba(198,40,40,0.15)" : "rgba(198,40,40,0.06)",
                            borderRadius: "2px", padding: "0 1px"
                          }}
                          onClick={e => { e.stopPropagation(); setTooltip({ error: seg.error, x: e.clientX, y: e.clientY }); }}>
                          {seg.content}
                        </span>
                      )
                    )}
                  </div>
                )}
                <textarea
                  ref={textareaRef} value={text}
                  onChange={e => {
                    const newText = e.target.value;
                    setText(newText);
                    setTooltip(null);
                    // Remove errors whose wrong word no longer exists in the text
                    if (checked && errors.length > 0) {
                      setErrors(prev => prev.filter(err => newText.includes(err.wrong)));
                    }
                  }}
                  onScroll={handleScroll}
                  placeholder={"এখানে আপনার সংবাদ লিখুন বা পেস্ট করুন...\n\nউদাহরণ: আজকে ঢাকায় একটি বড় আগুন লেগেছে। ফায়ার সার্ভিস জানিয়েছে যে..."}
                  style={{
                    width: "100%", height: "380px", border: "none", outline: "none",
                    resize: "none", fontSize: "16px", lineHeight: 2,
                    color: (checked && segments && segments.length > 0) ? "transparent" : C.text,
                    background: "transparent", caretColor: C.accent,
                    fontFamily: "'Noto Serif Bengali', serif",
                    position: "relative", zIndex: 3, boxSizing: "border-box",
                    wordBreak: "break-word", padding: "18px 20px", overflowY: "auto"
                  }}
                />
              </div>
              <div style={{
                borderTop: `1px solid ${C.border}`, padding: "8px 20px",
                background: C.surface, display: "flex",
                justifyContent: "space-between", alignItems: "center",
                flexWrap: "wrap", gap: "8px"
              }}>
                <span style={{ fontSize: "11px", color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
                  {text.length > 0 ? `${wordCount} শব্দ · ${text.length} অক্ষর` : "লিখুন বা পেস্ট করুন"}
                </span>
                {checked && errors.length === 0 && text.trim() && (
                  <StatusPill bg="#e8f5e9" color={C.green} text="✓ কোনো ভুল নেই" />
                )}
                {checked && errors.length > 0 && (
                  <div onClick={e => { e.stopPropagation(); setActiveTab("errors"); }} style={{ cursor: "pointer" }}>
                    <StatusPill bg="#fef2f2" color={C.accent} text={`✗ ${errors.length}টি ভুল — বিস্তারিত দেখুন →`} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── ERRORS TAB ─── */}
          {activeTab === "errors" && (
            <div style={{ maxHeight: "500px", overflowY: "auto" }}>
              {!checked && <EmptyState text={`"সংবাদ" ট্যাবে লিখুন এবং "বানান পরীক্ষা" ক্লিক করুন।`} />}
              {checked && errors.length === 0 && (
                <div style={{ padding: "50px 22px", textAlign: "center", animation: "fadeIn 0.3s ease" }}>
                  <div style={{ fontSize: "40px", marginBottom: "10px" }}>✅</div>
                  <div style={{ color: C.green, fontSize: "17px", fontWeight: 700 }}>কোনো ভুল পাওয়া যায়নি!</div>
                  <div style={{ color: C.textMuted, fontSize: "12px", marginTop: "6px" }}>বাংলা একাডেমি বানানরীতি অনুযায়ী সঠিক।</div>
                </div>
              )}
              {checked && errors.length > 0 && errors.map((err, i) => (
                <div key={i} style={{
                  padding: "14px 20px", borderBottom: i < errors.length - 1 ? `1px solid ${C.border}` : "none",
                  animation: `fadeIn 0.3s ease ${i * 0.05}s both`
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <span style={{
                      color: C.accent, fontWeight: 700, fontSize: "15px",
                      background: "rgba(198,40,40,0.08)", padding: "2px 8px",
                      borderRadius: "4px", textDecoration: "line-through",
                      textDecorationColor: "rgba(198,40,40,0.4)"
                    }}>{err.wrong}</span>
                    <span style={{ color: C.textLight }}>→</span>
                    <span style={{
                      color: C.green, fontWeight: 700, fontSize: "15px",
                      background: "rgba(46,125,50,0.08)", padding: "2px 8px", borderRadius: "4px"
                    }}>{err.correct}</span>
                    <button onClick={() => handleReplace(err.wrong, err.correct)} style={{
                      padding: "3px 12px", background: C.green, color: "#fff",
                      border: "none", borderRadius: "5px", fontSize: "11px",
                      cursor: "pointer", fontWeight: 700
                    }}>রিপ্লেস</button>
                  </div>
                  {err.rule && (
                    <div style={{
                      display: "inline-block", background: "#fff8e1", color: "#f57f17",
                      fontSize: "10px", padding: "2px 8px", borderRadius: "12px",
                      marginBottom: "4px", border: "1px solid #fff3c4"
                    }}>📌 {err.rule}</div>
                  )}
                  {err.explanation && (
                    <div style={{ fontSize: "12px", color: C.textMuted, lineHeight: 1.6 }}>{err.explanation}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ─── REWRITE TAB ─── */}
          {activeTab === "rewrite" && (
            <div style={{ maxHeight: "600px", overflowY: "auto" }}>
              {!rewriteResult && !loading && <EmptyState text={`সংবাদ লিখে "📰 সম্পাদনা + ইংরেজি" ক্লিক করুন।`} />}
              {loading && loadingType === "rewrite" && (
                <div style={{ padding: "60px 22px", textAlign: "center" }}>
                  <div style={{
                    width: "28px", height: "28px", border: `3px solid ${C.border}`,
                    borderTopColor: C.accent2, borderRadius: "50%",
                    animation: "spin 0.8s linear infinite", margin: "0 auto 14px"
                  }} />
                  <div style={{ color: C.textMuted, fontSize: "13px", animation: "pulse 1.5s ease infinite" }}>
                    প্রথম আলো/bdnews24 স্টাইলে সম্পাদনা হচ্ছে...
                  </div>
                </div>
              )}
              {rewriteResult && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  {/* Bengali */}
                  <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.border}` }}>
                    <SectionHeader color={C.accent} label="বাংলা সম্পাদিত সংস্করণ" />
                    <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
                      <SmallBtn onClick={() => copy((rewriteResult.headline || "") + "\n\n" + (rewriteResult.rewritten_bangla || ""))} text="📋 কপি" />
                      <SmallBtn onClick={applyRewrite} text="↩ এডিটরে নাও" bg={C.accent} color="#fff" />
                    </div>
                    {rewriteResult.headline && (
                      <h2 style={{
                        fontSize: "21px", color: C.text, fontWeight: 800,
                        margin: "0 0 12px", lineHeight: 1.5,
                        borderLeft: `3px solid ${C.accent}`, paddingLeft: "14px"
                      }}>{rewriteResult.headline}</h2>
                    )}
                    <div style={{ fontSize: "15px", color: "#333", lineHeight: 2, whiteSpace: "pre-wrap" }}>
                      {rewriteResult.rewritten_bangla}
                    </div>
                  </div>

                  {/* English */}
                  <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.border}`, background: "#f8fafc" }}>
                    <SectionHeader color={C.accent2} label="ENGLISH VERSION" />
                    <div style={{ marginBottom: "12px" }}>
                      <SmallBtn onClick={() => copy((rewriteResult.english_headline || "") + "\n\n" + (rewriteResult.english_version || ""))} text="📋 Copy" />
                    </div>
                    {rewriteResult.english_headline && (
                      <h2 style={{
                        fontSize: "19px", color: "#1a2a3a", fontWeight: 700,
                        margin: "0 0 10px", lineHeight: 1.4,
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        borderLeft: `3px solid ${C.accent2}`, paddingLeft: "14px"
                      }}>{rewriteResult.english_headline}</h2>
                    )}
                    <div style={{
                      fontSize: "14px", color: "#4a5568", lineHeight: 1.8,
                      whiteSpace: "pre-wrap", fontFamily: "'Cormorant Garamond', Georgia, serif"
                    }}>{rewriteResult.english_version}</div>
                  </div>

                  {/* Editorial Notes */}
                  {rewriteResult.editorial_notes && (
                    <div style={{ padding: "14px 20px", background: "#f0fdf4" }}>
                      <SectionHeader color={C.green} label="সম্পাদকীয় মন্তব্য" />
                      <div style={{ fontSize: "12px", color: "#4a7c59", lineHeight: 1.7 }}>
                        {rewriteResult.editorial_notes}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{
          marginTop: "18px", textAlign: "center", padding: "0 10px"
        }}>
          <div style={{ fontSize: "10px", color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", marginBottom: "4px" }}>
            Powered by Gemini AI
          </div>
          <div style={{ fontSize: "11px", color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
            Built by <span style={{ color: C.accent, fontWeight: 600 }}>Towfiqul Alam</span>
            {" · "}
            <a href="mailto:towfiqul.pro@gmail.com" style={{ color: C.accent2, textDecoration: "none" }}>towfiqul.pro@gmail.com</a>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div onClick={e => e.stopPropagation()} style={{
          position: "fixed",
          left: Math.min(tooltip.x - 10, (typeof window !== "undefined" ? window.innerWidth : 800) - 280),
          top: Math.min(tooltip.y + 14, (typeof window !== "undefined" ? window.innerHeight : 600) - 220),
          background: "#fff", borderRadius: "10px",
          padding: "12px 16px", zIndex: 1000, maxWidth: "260px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`,
          animation: "fadeIn 0.15s ease"
        }}>
          <div style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ color: C.accent, fontWeight: 700, textDecoration: "line-through" }}>{tooltip.error.wrong}</span>
            <span style={{ color: C.textLight }}>→</span>
            <span style={{ color: C.green, fontWeight: 700 }}>{tooltip.error.correct}</span>
          </div>
          {tooltip.error.rule && <div style={{ fontSize: "10px", color: C.gold, marginBottom: "4px" }}>📌 {tooltip.error.rule}</div>}
          {tooltip.error.explanation && <div style={{ fontSize: "11px", color: C.textMuted, marginBottom: "8px", lineHeight: 1.5 }}>{tooltip.error.explanation}</div>}
          <button onClick={() => handleReplace(tooltip.error.wrong, tooltip.error.correct)} style={{
            width: "100%", padding: "6px", background: C.green, color: "#fff",
            border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: 700
          }}>✓ রিপ্লেস করুন</button>
        </div>
      )}
    </div>
  );
}

// ── Small Components ──

function ActionBtn({ onClick, disabled, isLoading, color, loadingText, text }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        padding: "8px 18px", border: `1px solid ${disabled ? "#e0d8cc" : color}`,
        borderRadius: "8px", fontSize: "12px", fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'Noto Serif Bengali', serif",
        background: isLoading ? "#fafafa" : disabled ? "#fafafa" : color,
        color: disabled ? "#bbb" : isLoading ? color : "#fff",
        transition: "all 0.15s", opacity: disabled && !isLoading ? 0.6 : 1,
      }}>
      {isLoading ? (
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{
            display: "inline-block", width: "12px", height: "12px",
            border: "2px solid #ddd", borderTopColor: color,
            borderRadius: "50%", animation: "spin 0.8s linear infinite"
          }} />
          {loadingText}
        </span>
      ) : text}
    </button>
  );
}

function StatusPill({ bg, color, text }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      background: bg, color, padding: "3px 12px", borderRadius: "20px",
      fontSize: "11px", fontWeight: 700
    }}>{text}</div>
  );
}

function SectionHeader({ color, label }) {
  return (
    <div style={{
      fontSize: "10px", letterSpacing: "3px", color,
      textTransform: "uppercase", fontWeight: 700, marginBottom: "10px",
      fontFamily: "'JetBrains Mono', monospace"
    }}>{label}</div>
  );
}

function SmallBtn({ onClick, text, bg = "#f5f0e8", color = "#8a7e6e" }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 12px", background: bg, color,
      border: `1px solid ${bg === "#f5f0e8" ? "#e8e0d4" : bg}`, borderRadius: "6px",
      fontSize: "11px", cursor: "pointer", fontWeight: 600
    }}>{text}</button>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ padding: "50px 22px", textAlign: "center", color: "#b5a898", fontSize: "13px" }}>{text}</div>
  );
}
