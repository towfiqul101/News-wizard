"use client";

import { useState, useCallback } from "react";
import styles from "./BanglaNewsEditor.module.css";

export default function BanglaNewsEditor() {
  const [text, setText] = useState("");
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("সংবাদ");
  const [rewritten, setRewritten] = useState("");
  const [english, setEnglish] = useState("");
  const [changes, setChanges] = useState([]);

  // ============================================================
  // বানান পরীক্ষা
  // ============================================================
  const checkSpelling = async () => {
    if (!text.trim()) {
      alert("দয়া করে সংবাদ লিখুন।");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/check-spelling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (data.errors) {
        setErrors(data.errors);
        setActiveTab("ভুল");
      } else if (data.error) {
        alert(`ত্রুটি: ${data.error}`);
      }
    } catch (error) {
      alert(`API ত্রুটি: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // সংবাদ পুনর্লিখন + ইংরেজি অনুবাদ
  // ============================================================
  const rewriteNews = async () => {
    if (!text.trim()) {
      alert("দয়া করে সংবাদ লিখুন।");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/rewrite-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (data.rewritten && data.english) {
        setRewritten(data.rewritten);
        setEnglish(data.english);
        setChanges(data.changes || []);
        setActiveTab("সম্পাদিত");
      } else if (data.error) {
        alert(`ত্রুটি: ${data.error}`);
      }
    } catch (error) {
      alert(`API ত্রুটি: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // সব ত্রুটি সংশোধন
  // ============================================================
  const fixAllErrors = () => {
    if (errors.length === 0) return;

    let correctedText = text;
    // Sort by position descending to avoid offset issues
    const sortedErrors = [...errors].sort((a, b) => {
      const posA = text.indexOf(a.word);
      const posB = text.indexOf(b.word);
      return posB - posA;
    });

    sortedErrors.forEach((error) => {
      correctedText = correctedText.replace(error.word, error.suggestion);
    });

    setText(correctedText);
    setErrors([]);
  };

  // ============================================================
  // একক ত্রুটি সংশোধন
  // ============================================================
  const fixError = (index) => {
    const error = errors[index];
    let correctedText = text.replace(error.word, error.suggestion);
    setText(correctedText);

    // Remove this error from the list
    const newErrors = errors.filter((_, i) => i !== index);
    setErrors(newErrors);
  };

  // ============================================================
  // ত্রুটি হাইলাইট রেন্ডার
  // ============================================================
  const renderTextWithHighlights = () => {
    if (!text || errors.length === 0) return text;

    let result = text;
    const errorWords = errors.map((e) => e.word);

    // Create pattern for highlighting all error words
    errorWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "g");
      result = result.replace(
        regex,
        `<mark class="${styles.error}" title="ত্রুটি: ${word}">${word}</mark>`
      );
    });

    return result;
  };

  // ============================================================
  // ক্লিপবোর্ডে কপি
  // ============================================================
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("কপি হয়েছে!");
    });
  };

  return (
    <div className={styles.container}>
      {/* ============ হেডার ============ */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>📰 News Wizard</h1>
          <p className={styles.subtitle}>বাংলা সংবাদ সম্পাদক</p>
        </div>
      </header>

      {/* ============ মূল এডিটর ============ */}
      <div className={styles.editorSection}>
        <div className={styles.editorWrapper}>
          <div className={styles.editorLabel}>সংবাদ লিখুন</div>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="আপনার সংবাদ এখানে লিখুন..."
            rows="10"
          />
          <div className={styles.charCount}>
            {text.length} অক্ষর • {text.split(/\s+/).filter(Boolean).length}{" "}
            শব্দ
          </div>
        </div>

        {/* ============ বাটন প্যানেল ============ */}
        <div className={styles.buttonPanel}>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={checkSpelling}
            disabled={loading}
          >
            {loading ? "⏳ প্রক্রিয়াধীন..." : "✓ বানান পরীক্ষা"}
          </button>
          <button
            className={`${styles.btn} ${styles.btnSuccess}`}
            onClick={rewriteNews}
            disabled={loading}
          >
            {loading ? "⏳ প্রক্রিয়াধীন..." : "📝 সম্পাদনা + ইংরেজি"}
          </button>
          {errors.length > 0 && (
            <button
              className={`${styles.btn} ${styles.btnQuick}`}
              onClick={fixAllErrors}
            >
              সব ঠিক করুন ({errors.length})
            </button>
          )}
        </div>
      </div>

      {/* ============ ট্যাব নেভিগেশন ============ */}
      <div className={styles.tabNav}>
        <button
          className={`${styles.tab} ${activeTab === "সংবাদ" ? styles.active : ""}`}
          onClick={() => setActiveTab("সংবাদ")}
        >
          📄 সংবাদ
        </button>
        {errors.length > 0 && (
          <button
            className={`${styles.tab} ${activeTab === "ভুল" ? styles.active : ""}`}
            onClick={() => setActiveTab("ভুল")}
          >
            ⚠️ ভুল ({errors.length})
          </button>
        )}
        {rewritten && (
          <button
            className={`${styles.tab} ${activeTab === "সম্পাদিত" ? styles.active : ""}`}
            onClick={() => setActiveTab("সম্পাদিত")}
          >
            ✨ সম্পাদিত
          </button>
        )}
      </div>

      {/* ============ ট্যাব কন্টেন্ট ============ */}
      <div className={styles.tabContent}>
        {/* সংবাদ ট্যাব */}
        {activeTab === "সংবাদ" && (
          <div className={styles.panel}>
            <h2>আপনার সংবাদ</h2>
            {errors.length > 0 && (
              <div className={styles.highlighted}>
                <div
                  dangerouslySetInnerHTML={{
                    __html: renderTextWithHighlights(),
                  }}
                />
              </div>
            )}
            {errors.length === 0 && text && (
              <div className={styles.preview}>
                <p>{text}</p>
              </div>
            )}
            {!text && (
              <p className={styles.placeholder}>
                এখনও কোনো সংবাদ লেখা হয়নি।
              </p>
            )}
          </div>
        )}

        {/* ভুল ট্যাব */}
        {activeTab === "ভুল" && (
          <div className={styles.panel}>
            <h2>⚠️ বানান ভুল ({errors.length})</h2>
            {errors.length > 0 ? (
              <div className={styles.errorList}>
                {errors.map((error, index) => (
                  <div key={index} className={styles.errorItem}>
                    <div className={styles.errorHeader}>
                      <span className={styles.errorWord}>{error.word}</span>
                      <span className={styles.arrow}>→</span>
                      <span className={styles.suggestion}>
                        {error.suggestion}
                      </span>
                    </div>
                    <div className={styles.errorRule}>
                      <strong>নিয়ম:</strong> {error.rule}
                    </div>
                    <div className={styles.errorContext}>
                      <strong>প্রসঙ্গ:</strong> {error.position}
                    </div>
                    <div className={styles.errorActions}>
                      <button
                        className={styles.fixBtn}
                        onClick={() => fixError(index)}
                      >
                        এটি সংশোধন করুন
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.placeholder}>কোনো ভুল পাওয়া যায়নি! ✓</p>
            )}
          </div>
        )}

        {/* সম্পাদিত ট্যাব */}
        {activeTab === "সম্পাদিত" && rewritten && (
          <div className={styles.panel}>
            <div className={styles.rewriteSection}>
              <h3>📝 সম্পাদিত বাংলা সংবাদ</h3>
              <div className={styles.outputBox}>
                <p>{rewritten}</p>
                <button
                  className={styles.copyBtn}
                  onClick={() => copyToClipboard(rewritten)}
                >
                  📋 কপি করুন
                </button>
              </div>
            </div>

            <div className={styles.rewriteSection}>
              <h3>🌐 English Translation</h3>
              <div className={styles.outputBox}>
                <p>{english}</p>
                <button
                  className={styles.copyBtn}
                  onClick={() => copyToClipboard(english)}
                >
                  📋 Copy
                </button>
              </div>
            </div>

            {changes.length > 0 && (
              <div className={styles.rewriteSection}>
                <h3>✏️ পরিবর্তনসমূহ</h3>
                <ul className={styles.changesList}>
                  {changes.map((change, index) => (
                    <li key={index}>{change}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============ ফুটার ============ */}
      <footer className={styles.footer}>
        <p>
          Built by Towfiqul Alam ·{" "}
          <a href="mailto:towfiqul.pro@gmail.com">towfiqul.pro@gmail.com</a>
        </p>
      </footer>
    </div>
  );
}
