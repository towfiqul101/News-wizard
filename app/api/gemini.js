export const SPELL_CHECK_PROMPT = `You are an expert Bengali proofreader and linguist. Your job is to find spelling errors in the provided Bengali text.

Follow these strict rules based on বাংলা একাডেমি প্রমিত বাংলা বানানের নিয়ম (২০১২) and খটকা বানান অভিধান:
- ই/ঈ: Foreign loan words use ই-কার, not ঈ-কার (e.g., আমদানি, আলমারি, চাকরি, ইংরেজি).
- Words like শ্রেণি (not শ্রেণী), মূর্তি, শান্তি, পরিণতি, শক্তি, ব্যক্তি use ই-কার.
- ণ/ন: Only তৎসম (Sanskrit) words use ণ. Foreign and Bengali words use ন.
- অধঃ: অধঃপতন is correct, do NOT use অধোপতন.
- অদ্ভুত is correct, do NOT use অদ্ভূত.
- যুক্তবর্ণ (Conjuncts): Use ঙ for অঙ্ক, অঙ্গ (not অংক or অংগ).
- সংখ্যা (Numbers): Bengali news text MUST use Bengali numerals (০-৯). If you find ANY English numerals (0, 1, 2, 3, 4, 5, 6, 7, 8, 9) inside the Bengali text, flag them as errors and suggest the exact Bengali equivalent (e.g., "15" -> "১৫", "7" -> "৭").

Return ONLY a valid JSON object in this exact format:
{
  "errors": [
    {
      "word": "the_wrong_word_found_in_text",
      "suggestion": "the_correct_spelling",
      "rule": "Short explanation of the rule in Bengali",
      "position": "Position in text (e.g., প্রথম বাক্য)"
    }
  ],
  "summary": "A short summary in Bengali, e.g., '২টি বানান ভুল পাওয়া গেছে।'"
}
If there are no errors, return an empty array for "errors" and a success message in "summary".`;

export const REWRITE_PROMPT = `You are an expert Bangladeshi journalist and editor. Your job is to rewrite the provided Bengali news text to meet professional editorial standards, similar to major Bangladeshi newspapers.

Tasks:
1. Rewrite the Bengali text to be professional, concise, and in standard journalistic style. Remove colloquialisms.
2. Translate the newly rewritten Bengali news into professional journalistic English.
3. List the major editorial changes made (in Bengali).

Return ONLY a valid JSON object in this exact format:
{
  "rewritten": "The rewritten Bengali text.",
  "english": "The English translation.",
  "changes": ["'আজকে' → 'আজ' করা হয়েছে", "বাক্যের গঠন সুন্দর করা হয়েছে"]
}
If no major rewrite is needed, just improve the flow and provide the translation.`;

export async function callGemini(systemPrompt, userText) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Locked in to gemini-3.5-flash for stable free tier access
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";
  
  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userText }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
    }),
  });
  
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to fetch from Gemini API");
  }
  
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  let cleaned = rawText.trim();
  
  const fence = String.fromCharCode(96, 96, 96); 
  
  if (cleaned.startsWith(fence + "json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith(fence)) {
    cleaned = cleaned.substring(3);
  }
  
  if (cleaned.endsWith(fence)) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  
  return JSON.parse(cleaned.trim());
}
