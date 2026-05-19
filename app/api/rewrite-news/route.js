import { NextResponse } from "next/server";
import { callGemini, REWRITE_PROMPT } from "../gemini";

export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text?.trim()) return NextResponse.json({ error: "টেক্সট দিন" }, { status: 400 });
    if (text.length > 10000) return NextResponse.json({ error: "টেক্সট খুব বড় — ১০,০০০ অক্ষরের মধ্যে রাখুন" }, { status: 400 });
    const result = await callGemini(REWRITE_PROMPT, `এই সংবাদটি পুনর্লিখন করো ও ইংরেজি অনুবাদ দাও:\n\n${text}`);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Rewrite error:", err.message);
    return NextResponse.json({ error: err.message || "সার্ভারে সমস্যা হয়েছে" }, { status: 500 });
  }
}
