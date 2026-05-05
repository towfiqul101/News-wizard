const GEMINI_MODEL = "gemini-2.5-flash";

export async function callGemini(systemPrompt, userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `Gemini API Error: ${res.status}`;
    if (res.status === 429) throw new Error("রেট লিমিট — এক মিনিট পর আবার চেষ্টা করুন");
    throw new Error(msg);
  }

  const data = await res.json();

  // Check if response was truncated
  const finishReason = data?.candidates?.[0]?.finishReason;
  if (finishReason === "MAX_TOKENS") {
    throw new Error("উত্তর অসম্পূর্ণ — ছোট টেক্সট দিয়ে আবার চেষ্টা করুন");
  }

  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const clean = raw.replace(/```json|```/g, "").trim();

  // Robust JSON parsing — try to fix truncated JSON
  try {
    return JSON.parse(clean);
  } catch (e) {
    let fixed = clean;
    const quoteCount = (fixed.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) fixed += '"';
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    const openBraces = (fixed.match(/{/g) || []).length;
    const closeBraces = (fixed.match(/}/g) || []).length;
    for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += "]";
    for (let i = 0; i < openBraces - closeBraces; i++) fixed += "}";
    try {
      return JSON.parse(fixed);
    } catch {
      throw new Error("AI থেকে সঠিক উত্তর পাওয়া যায়নি — আবার চেষ্টা করুন");
    }
  }
}

export const SPELL_CHECK_PROMPT = `তুমি একজন বিশেষজ্ঞ বাংলা ভাষাবিদ। বাংলা একাডেমি অভিধানের নিয়ম অনুসরণ করে বানান যাচাই করো।

নিয়ম:
১. ণ-ত্ব: ঋ/র/ষ পরে ণ (কারণ, ঘণ্টা)
২. ষ-ত্ব: ই/ঈ পরে ষ
৩. অ-তৎসমে ই-কার (দাবি, শাড়ি), তৎসমে ঈ (নদী)
৪. কী=প্রশ্ন, কি=অব্যয়
৫. সংখ্যা বাংলায়: ১২৩
৬. America→যুক্তরাষ্ট্র, England→যুক্তরাজ্য

উত্তর সংক্ষিপ্ত রাখো। explanation সর্বোচ্চ ১৫ শব্দ।

{"errors":[{"wrong":"ভুল","correct":"সঠিক","rule":"নিয়ম","explanation":"ব্যাখ্যা"}]}
ভুল না থাকলে: {"errors":[]}`;

export const REWRITE_PROMPT = `তুমি একজন অভিজ্ঞ বাংলা সংবাদ সম্পাদক। সংবাদটি পেশাদার রীতিতে পুনর্লিখন করো ও ইংরেজি অনুবাদ দাও।

রীতি: আকর্ষণীয় শিরোনাম, 5W1H লিড, সক্রিয় বাক্য, বাংলা সংখ্যা, বাংলা একাডেমি বানান।

editorial_notes সর্বোচ্চ ৩ বাক্য।

{"headline":"শিরোনাম","rewritten_bangla":"সংবাদ","english_headline":"Headline","english_version":"Translation","editorial_notes":"মন্তব্য"}`;
