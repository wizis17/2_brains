import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://studybrain.app",
    "X-Title": "StudyBrain",
  },
});

// OpenRouter model ID for Claude Sonnet 4
const MODEL = "anthropic/claude-sonnet-4-5";

export async function POST(req: NextRequest) {
  try {
    const { lessonName, question, docs, history } = await req.json();

    if (!question || !docs || docs.length === 0) {
      return NextResponse.json(
        { error: "question and docs are required" },
        { status: 400 }
      );
    }

    // Build doc content string
    const docContent = docs
      .map(
        (doc: { name: string; content: string }) =>
          `--- DOCUMENT: ${doc.name} ---\n${doc.content}\n--- END: ${doc.name} ---`
      )
      .join("\n\n");

    const systemPrompt = `You are a study assistant for the lesson: "${lessonName}".
Your job is to help the student understand the material in their uploaded documents.
Answer ONLY from the documents provided below. Be clear, concise, and educational.
If the question is not covered by the documents, say so explicitly.
When relevant, cite which document supports your answer (e.g. "According to [filename]...").
Format your responses with markdown when it helps clarity (bullet points, bold key terms, etc.).

DOCUMENTS:
${docContent}`;

    // Build message history (last 20 exchanges)
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
    ];

    const trimmedHistory = (history ?? []).slice(-20);
    for (const msg of trimmedHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: "user", content: question });

    // Stream response via SSE
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await client.chat.completions.create({
            model: MODEL,
            max_tokens: 2048,
            messages,
            stream: true,
          });

          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              const data = JSON.stringify({ text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err: any) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: err.message })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
