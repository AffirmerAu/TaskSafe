import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const CHAT_MODEL  = process.env.GEMINI_MODEL       || "gemini-2.0-flash";
// text-embedding-004 was shut down Jan 2026; gemini-embedding-001 is the replacement.
// We request 768 output dims so it matches the existing vector(768) DB column.
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
const EMBED_DIMS  = 768;

function client() {
  if (!genAI) throw new Error("GEMINI_API_KEY is not set");
  return genAI;
}

/** Embed a single piece of text → 768-dim vector. */
export async function embed(text: string): Promise<number[]> {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  // Call the REST API directly so we can set outputDimensionality (the JS SDK
  // doesn't expose this param yet). This keeps vectors at 768 dims to match
  // the existing pgvector column — no DB migration needed.
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] },
      outputDimensionality: EMBED_DIMS,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini embed failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.embedding.values as number[];
}

const TUTOR_SYSTEM = `You are the Affirmer safety guide — a friendly Work Health & Safety
tutor for construction and civil site workers. Your audience may have low literacy
and may not speak English as a first language.

Rules:
- Answer ONLY from the provided course content. If the content does not cover the
  question, say you can only help with this induction and suggest they ask their
  supervisor.
- Use short, plain sentences. One idea at a time. No jargon.
- Be warm and encouraging. Safety is serious but you are reassuring, never scary.
- Reply in the worker's target language (given below). Keep it natural.
- Never invent facts, procedures, or numbers that are not in the content.`;

/**
 * Answer a learner question, grounded in retrieved course chunks.
 * `lang` is an ISO code (en, zh, vi, ar, es, tl, pa, hi).
 */
export async function answerQuestion(opts: {
  question: string;
  chunks: string[];
  lang: string;
}): Promise<string> {
  const model = client().getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: TUTOR_SYSTEM,
  });

  const context =
    opts.chunks.length > 0
      ? opts.chunks.map((c, i) => `[${i + 1}] ${c}`).join("\n\n")
      : "(no relevant course content found)";

  const prompt = `Target language code: ${opts.lang}

COURSE CONTENT:
${context}

WORKER'S QUESTION:
${opts.question}

Answer in the target language, grounded only in the course content above.`;

  const res = await model.generateContent(prompt);
  return res.response.text().trim();
}
