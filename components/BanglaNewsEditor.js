"use client";

import { useState, useEffect } from "react";
import styles from "./BanglaNewsEditor.module.css";

export default function BanglaNewsEditor() {
  const [text, setText] = useState("");
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState("");
  const [activeTab, setActiveTab] = useState("সংবাদ");
  const [rewritten, setRewritten] = useState("");
  const [english, setEnglish] = useState("");
  const [changes, setChanges] = useState([]);
  const [focusMode, setFocusMode] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  // Auto-Save to Local Storage
  useEffect(() => {
    const savedDraft = localStorage.getItem("newsWizardDraft");
    if (savedDraft) setText(savedDraft);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("newsWizardDraft", text);
    }, 1000);
    return () => clearTimeout(timer);
  }, [text]);

  const checkSpelling = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setLoadingType("spell");
    
    try {
      const response = await fetch("/api/check-spelling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      const data = await response.json();
      
      // Defensive check to catch the array no matter how the API structures it
      const errorsList = data.errors || (data.result && data.result.errors) || [];
      
      setErrors(errorsList);
      
      if (errorsList.length === 0) {
        alert(data.summary || "কোনো বানান ভুল পাওয়া যায়নি।");
      } else {
        setActiveTab("ভুল");
      }
      
    } catch (error) {
      console.error("Spell check API failed:", error);
      alert("বানান পরীক্ষা করতে সমস্যা হয়েছে। API সংযোগ চেক করুন।");
    } finally {
      setLoading(false);
      setLoadingType("");
    }
  };

  const rewriteNews = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setLoadingType("rewrite");
    
    try {
      const response = await fetch("/api/rewrite-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      const data = await response.json();
      
      // Defensive checks for the rewrite data
      const newRewritten = data.rewritten || (data.result && data.result.rewritten) || "";
      const newEnglish = data.english || (data.result && data.result.english) || "";
      const newChanges = data.changes || (data.result && data.result.changes) || [];
      
      setRewritten(newRewritten);
      setEnglish(newEnglish);
      setChanges(newChanges);
      
      if (newRewritten) {
        setActiveTab("সম্পাদিত");
      } else {
        alert("সম্পাদনা করা সম্ভব হয়নি।");
      }
      
    } catch (error) {
      console.error("Rewrite API failed:", error);
      alert("সম্পাদনা করতে সমস্যা হয়েছে। API সংযোগ চেক করুন।");
    } finally {
      setLoading(false);
      setLoadingType("");
    }
  };

  const fixAll = () => {
    let newText = text;
    errors.forEach(err => {
      newText = newText.replace(new RegExp(err.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'g'), err.suggestion);
    });
    setText(newText);
    setErrors([]);
    setActiveTab("সংবাদ");
  };

  const fixOne = (index) => {
    const err = errors[index];
    const newText = text.replace(new RegExp(err.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), 'g'), err.suggestion);
    setText(newText);
    const newErrors = [...errors];
    newErrors.splice(index, 1);
    setErrors(newErrors);
    if (newErrors.length === 0) {
      setActiveTab("সংবাদ");
    }
  };

  const handleCopy = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    setCopyMsg("কপি করা হয়েছে!");
    setTimeout(() => setCopyMsg(""), 2000);
  };

  const renderHighlighted = () => {
    if (!errors.length) return text;
    let html = text;
    errors.forEach((e) => {
      html = html.replace(
        new RegExp(e.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        `<mark class="${styles.errorHighlight}" title="${e.suggestion} (${e.rule})">${e.word}</mark>`
      );
    });
    return html;
  };

  return (
    <div className={`${styles.page} ${focusMode ? styles.focusMode : ""}`}>
      {/* Masthead */}
      <header className={styles.masthead}>
        <div className={styles.mastheadInner}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>News<span>Wizard</span></span>
            <span className={styles.logoSub}>| বাংলা সংবাদ সম্পাদক</span>
          </div>
        </div>
      </header>

      <main className={styles.layout}>
        <div className={styles.editorColumn}>
          
          <div className={styles.editorCard}>
            <textarea
              className={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="এখানে সংবাদ লিখুন..."
            />

            <div className={styles.actionBar}>
              <button 
                className={`${styles.btn} ${styles.btnSpell} ${loading || !text.trim() ? styles.btnDisabled : ""}`} 
                onClick={checkSpelling} 
                disabled={loading || !text.trim()}
              >
                {loadingType === "spell" ? "পরীক্ষা চলছে…" : "✓ বানান পরীক্ষা"}
              </button>
              
              <button 
                className={`${styles.btn} ${styles.btnEdit} ${loading || !text.trim() ? styles.btnDisabled : ""}`} 
                onClick={rewriteNews} 
                disabled={loading || !text.trim()}
              >
                {loadingType === "rewrite" ? "সম্পাদনা চলছে…" : "✎ সম্পাদনা + ইংরেজি"}
              </button>
              
              <button className={`${styles.btn} ${styles.btnFocus}`} onClick={() => setFocusMode(!focusMode)}>
                {focusMode ? "⛶ সাধারণ মোড" : "🔍 ফোকাস মোড"}
              </button>
            </div>
          </div>

          {/* Tabs */}
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
              ভুল {errors.length > 0 && `(${errors.length})`}
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

          {/* Panel Content */}
          <div className={styles.panel}>
            {activeTab === "সংবাদ" && (
               <div className={styles.previewBox} dangerouslySetInnerHTML={{ __html: renderHighlighted() }} />
            )}

            {activeTab === "ভুল" && (
              <div>
                {errors.length === 0 ? (
                  <p className={styles.previewBox}>কোনো বানান ভুল পাওয়া যায়নি।</p>
                ) : (
                  <>
                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                       <button className={`${styles.btn} ${styles.btnOutline}`} onClick={fixAll}>
                         সব একসাথে ঠিক করুন
                       </button>
                    </div>
                    <div className={styles.errorList}>
                      {errors.map((err, idx) => (
                        <div key={idx} className={styles.errorItem}>
                          <div className={styles.errorDetails}>
                            <div>
                              <span className={styles.errorWord}>{err.word}</span>
                              <span> → </span>
                              <span className={styles.errorSuggestion}>{err.suggestion}</span>
                            </div>
                            <div className={styles.errorRule}>{err.rule}</div>
                          </div>
                          <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => fixOne(idx)}>
                            ঠিক করুন
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "সম্পাদিত" && rewritten && (
              <div>
                <div className={styles.resultSection}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <h3 className={styles.resultTitle}>সম্পাদিত বাংলা</h3>
                     <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => handleCopy(rewritten)}>
                        {copyMsg || "কপি করুন"}
                     </button>
                  </div>
                  <div className={styles.previewBox}>{rewritten}</div>
                </div>

                {english && (
                  <div className={styles.resultSection}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <h3 className={styles.resultTitle}>English Translation</h3>
                       <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => handleCopy(english)}>
                          {copyMsg || "Copy"}
                       </button>
                     </div>
                    <div className={styles.previewBox}>{english}</div>
                  </div>
                )}

                {changes && changes.length > 0 && (
                  <div className={styles.resultSection}>
                    <h3 className={styles.resultTitle}>পরিবর্তন সমূহ</h3>
                    <ul className={styles.changesList}>
                      {changes.map((change, idx) => (
                        <li key={idx}>{change}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <details className={styles.sideCard} open>
            <summary>📊 পরিসংখ্যান</summary>
            <div className={styles.sideCardBody}>
               <div className={styles.statRow}>
                 <span>শব্দ সংখ্যা:</span>
                 <strong>{wordCount}</strong>
               </div>
               <div className={styles.statRow}>
                 <span>অক্ষর সংখ্যা:</span>
                 <strong>{charCount}</strong>
               </div>
               <div className={styles.statRow}>
                 <span>বানান ভুল:</span>
                 <strong style={{ color: 'var(--accent)' }}>{errors.length}</strong>
               </div>
            </div>
          </details>

          <details className={styles.sideCard}>
            <summary>📖 বানান নির্দেশিকা</summary>
            <div className={styles.sideCardBody}>
              <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)' }}>
                <li style={{ marginBottom: '0.5rem' }}>বিদেশি শব্দে ই-কার ব্যবহার হয় (যেমন: অ্যাকাডেমি, চাকরি)।</li>
                <li style={{ marginBottom: '0.5rem' }}>তৎসম শব্দ ছাড়া 'ণ' ব্যবহৃত হয় না (যেমন: গভর্নর, হর্ন)।</li>
                <li>'শ্রেণি', 'মূর্তি' ইত্যাদিতে ই-কার বসবে।</li>
              </ul>
            </div>
          </details>
        </aside>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>
          Built by <strong>Towfiqul Alam</strong> | Contact:{" "}
          <a href="mailto:towfiqul.pro@gmail.com">towfiqul.pro@gmail.com</a>
        </p>
      </footer>
    </div>
  );
}
