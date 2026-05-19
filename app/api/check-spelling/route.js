import { NextResponse } from "next/server";
import { callGemini, SPELL_CHECK_PROMPT } from "../gemini";

export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text?.trim()) return NextResponse.json({ error: "টেক্সট দিন" }, { status: 400 });
    if (text.length > 10000) return NextResponse.json({ error: "টেক্সট খুব বড় — ১০,০০০ অক্ষরের মধ্যে রাখুন" }, { status: 400 });
    const result = await callGemini(SPELL_CHECK_PROMPT, `নিচের সংবাদের বানান পরীক্ষা করো:\n\n${text}`);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Spell check error:", err.message);
    return NextResponse.json({ error: err.message || "সার্ভারে সমস্যা হয়েছে" }, { status: 500 });
  }
}
