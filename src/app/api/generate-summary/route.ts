import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const FALLBACK_SUMMARY = "AI summary could not be generated at this time.";

function looksLikeQuotaError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const m = message.toLowerCase();
  return (
    m.includes("quota") ||
    m.includes("resource_exhausted") ||
    m.includes("too many") ||
    m.includes("rate") ||
    m.includes("429")
  );
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const text = typeof payload?.body === "string" ? payload.body : typeof payload?.text === "string" ? payload.text : "";

  if (!text.trim()) {
    return NextResponse.json({ summary: FALLBACK_SUMMARY }, { status: 200 });
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ summary: FALLBACK_SUMMARY }, { status: 200 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTry = ["gemini-pro", "gemini-1.0-pro"] as const;

  const prompt =
    "Summarize the following blog post in about 200 words. " +
    "Return only the summary text, no title, no markdown, no bullet points.\n\n" +
    text;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const summary = result.response.text().trim();

      if (summary) {
        return NextResponse.json({ summary }, { status: 200 });
      }
    } catch (err) {
      if (looksLikeQuotaError(err)) {
        return NextResponse.json({ summary: FALLBACK_SUMMARY }, { status: 200 });
      }
    }
  }

  return NextResponse.json({ summary: FALLBACK_SUMMARY }, { status: 200 });
}
