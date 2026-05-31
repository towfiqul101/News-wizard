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
  const [focusMode, setFocusMode] = useState(false); // 🔥 Focus Mode State

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // 🔥 Auto-Save to Local Storage
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

  const checkSpelling = async () => { /* Same as your existing code */ };
  const rewriteNews = async () => { /* Same as your existing code */ };
  const fixAll = () => { /* Same as your existing code */ };
  const fixOne = (index) => { /* Same as your existing code */ };

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
              <button className={`${styles.btn} ${styles.btnSpell}`} onClick={checkSpelling} disabled={loading || !text.trim()}>
                {loadingType === "spell" ? "পরীক্ষা চলছে…" : "✓ বানান পরীক্ষা"}
              </button>
              <button className={`${styles.btn} ${styles.btnEdit}`} onClick={rewriteNews} disabled={loading || !text.trim()}>
                {loadingType === "rewrite" ? "সম্পাদনা চলছে…" : "✎ সম্পাদনা + ইংরেজি"}
              </button>
              
              {/* 🔥 Focus Mode Toggle */}
              <button className={`${styles.btn} ${styles.btnFocus}`} onClick={() => setFocusMode(!focusMode)}>
                {focusMode ? "⛶ সাধারণ মোড" : "🔍 ফোকাস মোড"}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${activeTab === "সংবাদ" ? styles.tabActive : ""}`} onClick={() => setActiveTab("সংবাদ")}>
              📄 সংবাদ
            </button>
            <button className={`${styles.tab} ${activeTab === "ভুল" ? styles.tabActive : ""}`} onClick={() => setActiveTab("ভুল")}>
              ভুল {errors.length > 0 && `(${errors.length})`}
            </button>
            {rewritten && (
              <button className={`${styles.tab} ${activeTab === "সম্পাদিত" ? styles.tabActive : ""}`} onClick={() => setActiveTab("সম্পাদিত")}>
                ✨ সম্পাদিত
              </button>
            )}
          </div>

          <div className={styles.panel}>
            {activeTab === "সংবাদ" && (
               <div className={styles.previewBox} dangerouslySetInnerHTML={{ __html: renderHighlighted() }} />
            )}
            {/* The rest of your Tabs logic stays exactly the same */}
          </div>
        </div>

        {/* 🔥 Mobile Collapsible Sidebar */}
        <aside className={styles.sidebar}>
          <details className={styles.sideCard} open>
            <summary>📊 পরিসংখ্যান</summary>
            <div className={styles.sideCardBody}>
               {/* Stats content */}
               <p>শব্দ: {wordCount}</p>
            </div>
          </details>

          <details className={styles.sideCard}>
            <summary>📖 বানান নির্দেশিকা</summary>
            <div className={styles.sideCardBody}>
              {/* Rules content */}
            </div>
          </details>
        </aside>
      </main>
    </div>
  );
}
