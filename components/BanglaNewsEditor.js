"use client";

import { useState } from "react";
import styles from "./BanglaNewsEditor.module.css";

export default function BanglaNewsEditor() {
  const [text, setText] = useState("");
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(""); // "spell" | "rewrite"
  const [activeTab, setActiveTab] = useState("সংবাদ");
  const [rewritten, setRewritten] = useState("");
  const [english, setEnglish] = useState("");
  const [changes, setChanges] = useState([]);
  const [copyMsg, setCopyMsg] = useState("");

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // ─── Spell Check ─────────────────────────────────────────
  const checkSpelling = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setLoadingType("spell");
    try {
      const res = await fetch("/api/check-spelling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.errors !== undefined) {
        setErrors(data.errors);
        setActiveTab("ভুল");
      }
    } catch (e) {
      alert("API ত্রুটি: " + e.message);
    } finally {
      setLoading(false);
      setLoadingType("");
    }
  };

  // ─── Rewrite ──────────────────────────────────────────────
  const rewriteNews = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setLoadingType("rewrite");
    try {
      const res = await fetch("/api/rewrite-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.rewritten) {
        setRewritten(data.rewritten);
        setEnglish(data.english || "");
        setChanges(data.changes || []);
        setActiveTab("সম্পাদিত");
      }
    } catch (e) {
      alert("API ত্রুটি: " + e.message);
    } finally {
      setLoading(false);
      setLoadingType("");
    }
  };

  // ─── Fix All ──────────────────────────────────────────────
  const fixAll = () => {
    let corrected = text;
    [...errors].reverse().forEach((err) => {
      corrected = corrected.split(err.word).join(err.suggestion);
    });
    setText(corrected);
    setErrors([]);
  };

  // ─── Fix One ──────────────────────────────────────────────
  const fixOne = (index) => {
    const err = errors[index];
    setText((t) => t.split(err.word).join(err.suggestion));
    setErrors((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Copy ─────────────────────────────────────────────────
  const copy = (str, label) => {
    navigator.clipboard.writeText(str).then(() => {
      setCopyMsg(label + " কপি হয়েছে!");
      setTimeout(() => setCopyMsg(""), 2000);
    });
  };

  // ─── Render highlighted text ──────────────────────────────
  const renderHighlighted = () => {
    if (!errors.length) return text;
    let html = text;
    errors.forEach((e) => {
      html = html.replace(
        new RegExp(e.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        `<mark class="${styles.errorHighlight}">${e.word}</mark>`
      );
    });
    return html;
  };

  const today = new Date().toLocaleDateString("bn-BD", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className={styles.page}>

      {/* ──── Masthead ──── */}
      <header className={styles.masthead}>
        <div className={styles.mastheadInner}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>
              News<span>Wizard</span>
            </span>
            <span className={styles.logoDivider} />
            <span className={styles.logoSub}>বাংলা সংবাদ সম্পাদক</span>
          </div>
          <span className={styles.mastheadDate}>{today}</span>
        </div>
        {loading && <div className={styles.loadingBar} />}
      </header>

      {/* ──── Ribbon ──── */}
      <div className={styles.ribbon}>
        <div className={styles.ribbonInner}>
          <span className={styles.ribbonLabel}>AI-চালিত</span>
          <span className={styles.ribbonDot} />
          <span className={styles.ribbonText}>
            বাংলা একাডেমি (২০১২) · খটকা বানান অভিধান · ১০০০+ বাগধারা · ২৬০+ সমার্থক শব্দ
          </span>
        </div>
      </div>

      {/* ──── Main Layout ──── */}
      <main className={styles.layout}>

        {/* ──── Editor Column ──── */}
        <div className={styles.editorColumn}>

          <div className={styles.sectionLabel}>
            <span className={styles.sectionLabelText}>সংবাদ রচনা</span>
            <span className={styles.sectionLabelLine} />
          </div>

          {/* Editor Card */}
          <div className={styles.editorCard}>
            <div className={styles.editorHeader}>
              <div className={styles.editorHeaderLeft}>
                <span className={styles.editorHeaderDot} />
                <span className={styles.editorHeaderDot} />
                <span className={styles.editorHeaderDot} />
                <span className={styles.editorHeaderTitle}>news-draft.bn</span>
              </div>
              <span className={styles.wordCount}>
                {text.length} অক্ষর &middot; {wordCount} শব্দ
              </span>
            </div>

            <textarea
              className={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="এখানে সংবাদ লিখুন বা পেস্ট করুন…"
              rows={10}
            />

            <div className={styles.actionBar}>
              <button
                className={`${styles.btnSpell} ${loading ? styles.btnDisabled : ""}`}
                onClick={checkSpelling}
                disabled={loading || !text.trim()}
              >
                {loadingType === "spell"
                  ? <><span className={styles.spinner} /> পরীক্ষা চলছে…</>
                  : "✓ বানান পরীক্ষা"}
              </button>

              <button
                className={`${styles.btnEdit} ${loading ? styles.btnDisabled : ""}`}
                onClick={rewriteNews}
                disabled={loading || !text.trim()}
              >
                {loadingType === "rewrite"
                  ? <><span className={styles.spinner} /> সম্পাদনা চলছে…</>
                  : "✎ সম্পাদনা + ইংরেজি"}
              </button>

              {errors.length > 0 && (
                <button className={styles.btnFix} onClick={fixAll}>
                  ⚡ সব {errors.length}টি ঠিক করুন
                </button>
              )}

              {copyMsg && (
                <span style={{ fontSize: "0.78rem", color: "var(--teal)", marginLeft: "auto" }}>
                  ✓ {copyMsg}
                </span>
              )}
            </div>
          </div>

          {/* ──── Tabs ──── */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === "সংবাদ" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("সংবাদ")}
            >
              📄 সংবাদ
            </button>

            <button
              className={`${styles.tab} ${activeTab === "ভুল" ? styles.tabActive : ""}`}
              onClick={() => setActiveTab("ভুল")}
            >
              ভুল
              {errors.length > 0 && (
                <span className={styles.tabBadge}>{errors.length}</span>
              )}
            </button>

            {rewritten && (
              <button
                className={`${styles.tab} ${activeTab === "সম্পাদিত" ? styles.tabActive : ""}`}
                onClick={() => setActiveTab("সম্পাদিত")}
              >
                ✨ সম্পাদিত
              </button>
            )}
          </div>

          {/* ──── Tab Panels ──── */}
          <div className={styles.panel}>

            {/* সংবাদ Panel */}
            {activeTab === "সংবাদ" && (
              <>
                {!text ? (
                  <div className={styles.panelEmpty}>
                    <span className={styles.panelEmptyIcon}>📰</span>
                    <span className={styles.panelEmptyText}>সংবাদ লিখুন, তারপর পরীক্ষা করুন</span>
                  </div>
                ) : errors.length > 0 ? (
                  <div
                    className={styles.previewBox}
                    dangerouslySetInnerHTML={{ __html: renderHighlighted() }}
                  />
                ) : (
                  <div className={styles.previewBox}>{text}</div>
                )}
              </>
            )}

            {/* ভুল Panel */}
            {activeTab === "ভুল" && (
              <>
                {errors.length === 0 ? (
                  <div className={styles.panelEmpty}>
                    <span className={styles.panelEmptyIcon}>✅</span>
                    <span className={styles.panelEmptyText}>
                      {text ? "কোনো বানান ভুল পাওয়া যায়নি!" : "প্রথমে বানান পরীক্ষা করুন।"}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className={styles.errorCount}>
                      <span className={styles.errorCountDot} />
                      {errors.length}টি বানান ভুল পাওয়া গেছে
                    </div>
                    <div className={styles.errorList}>
                      {errors.map((err, i) => (
                        <div key={i} className={styles.errorItem}>
                          <div className={styles.errorWords}>
                            <span className={styles.errorWord}>{err.word}</span>
                            <span className={styles.errorArrow}>→</span>
                            <span className={styles.errorSuggestion}>{err.suggestion}</span>
                          </div>
                          <div className={styles.errorRule}>
                            <span className={styles.errorRuleLabel}>নিয়ম: </span>
                            {err.rule}
                          </div>
                          {err.position && (
                            <div className={styles.errorContext}>প্রসঙ্গ: {err.position}</div>
                          )}
                          <button className={styles.btnFixOne} onClick={() => fixOne(i)}>
                            সংশোধন করুন
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* সম্পাদিত Panel */}
            {activeTab === "সম্পাদিত" && (
              <>
                {!rewritten ? (
                  <div className={styles.panelEmpty}>
                    <span className={styles.panelEmptyIcon}>✎</span>
                    <span className={styles.panelEmptyText}>সম্পাদনা + ইংরেজি বাটন চাপুন</span>
                  </div>
                ) : (
                  <>
                    <div className={styles.rewriteBlock}>
                      <div className={styles.rewriteBlockHeader}>
                        <span className={styles.rewriteBlockTitle}>
                          <span className={styles.rewriteBlockTitleAccent} />
                          সম্পাদিত বাংলা সংবাদ
                        </span>
                        <button className={styles.btnCopy} onClick={() => copy(rewritten, "বাংলা")}>
                          📋 কপি
                        </button>
                      </div>
                      <div className={styles.rewriteBox}>{rewritten}</div>
                    </div>

                    <div className={styles.rewriteBlock}>
                      <div className={styles.rewriteBlockHeader}>
                        <span className={styles.rewriteBlockTitle}>
                          <span className={`${styles.rewriteBlockTitleAccent} ${styles.rewriteEnglishAccent}`} />
                          English Translation
                        </span>
                        <button className={styles.btnCopy} onClick={() => copy(english, "English")}>
                          📋 Copy
                        </button>
                      </div>
                      <div className={styles.rewriteBox}>{english}</div>
                    </div>

                    {changes.length > 0 && (
                      <div className={styles.rewriteBlock}>
                        <div className={styles.rewriteBlockHeader}>
                          <span className={styles.rewriteBlockTitle}>
                            <span className={styles.rewriteBlockTitleAccent} />
                            পরিবর্তনসমূহ
                          </span>
                        </div>
                        <ul className={styles.changesList}>
                          {changes.map((c, i) => (
                            <li key={i} className={styles.changesItem}>
                              <span className={styles.changesCheckmark}>✓</span>
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* ──── Sidebar ──── */}
        <aside className={styles.sidebar}>

          {/* Stats */}
          <div className={styles.sideCard}>
            <div className={styles.sideCardHeader}>📊 পরিসংখ্যান</div>
            <div className={styles.sideCardBody}>
              <div className={styles.sideStatRow}>
                <span className={styles.sideStatLabel}>মোট অক্ষর</span>
                <span className={styles.sideStatValue}>{text.length}</span>
              </div>
              <div className={styles.sideStatRow}>
                <span className={styles.sideStatLabel}>মোট শব্দ</span>
                <span className={styles.sideStatValue}>{wordCount}</span>
              </div>
              <div className={styles.sideStatRow}>
                <span className={styles.sideStatLabel}>বানান ভুল</span>
                <span className={`${styles.sideStatValue} ${errors.length ? styles.sideStatError : styles.sideStatOk}`}>
                  {errors.length ? errors.length + "টি ✗" : "শূন্য ✓"}
                </span>
              </div>
              <div className={styles.sideStatRow}>
                <span className={styles.sideStatLabel}>সম্পাদনা</span>
                <span className={`${styles.sideStatValue} ${rewritten ? styles.sideStatOk : ""}`}>
                  {rewritten ? "সম্পন্ন ✓" : "অপেক্ষমান"}
                </span>
              </div>
            </div>
          </div>

          {/* Rules Quick Reference */}
          <div className={styles.sideCard}>
            <div className={`${styles.sideCardHeader} ${styles.sideCardHeaderAccent}`}>
              📖 বানান নির্দেশিকা
            </div>
            <div className={styles.sideCardBody}>
              {[
                "বিদেশি শব্দে ই-কার: আমদানি, আলমারি, চাকরি",
                "শ্রেণি, পরিণতি, মূর্তি — ঈ-কার নয়",
                "অঙ্ক, অঙ্গ — ং নয়, ঙ ব্যবহার করুন",
                "অধঃপতন — অধোপতন নয়",
                "অদ্ভুত — অদ্ভূত নয়",
                "ইংরেজি, হিন্দি — ঈ-কার নয়",
              ].map((rule, i) => (
                <div key={i} className={styles.ruleItem}>
                  <span className={styles.ruleDot} />
                  {rule}
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className={styles.sideCard}>
            <div className={`${styles.sideCardHeader} ${styles.sideCardHeaderGold}`}>
              💡 টিপস
            </div>
            <div className={styles.sideCardBody}>
              {[
                "প্রথমে বানান পরীক্ষা, তারপর সম্পাদনা করুন",
                "\"সব ঠিক করুন\" বাটনে সব ভুল একসাথে সংশোধন করুন",
                "ইংরেজি অনুবাদ স্বয়ংক্রিয়ভাবে তৈরি হয়",
                "সম্পাদিত টেক্সট \"কপি\" বাটনে সরাসরি কপি করুন",
              ].map((tip, i) => (
                <div key={i} className={styles.ruleItem}>
                  <span className={`${styles.ruleDot}`} style={{ background: "var(--gold)" }} />
                  {tip}
                </div>
              ))}
            </div>
          </div>

        </aside>
      </main>

      {/* ──── Footer ──── */}
      <footer className={styles.footer}>
        BUILT BY{" "}
        <a href="mailto:towfiqul.pro@gmail.com">TOWFIQUL ALAM</a>
        {" "}&middot; towfiqul.pro@gmail.com
      </footer>
    </div>
  );
}
