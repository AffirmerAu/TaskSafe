import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const CHAT_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || "text-embedding-004";

function client() {
  if (!genAI) throw new Error("GEMINI_API_KEY is not set");
  return genAI;
}

/** Embed a single piece of text → 768-dim vector. */
export async function embed(text: string): Promise<number[]> {
  const model = client().getGenerativeModel({ model: EMBED_MODEL });
  const res = await model.embedContent(text);
  return res.embedding.values;
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
