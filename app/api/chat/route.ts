import { NextRequest, NextResponse } from "next/server";

function getApiKey(clientKey?: string): string {
  const key = clientKey?.trim() || process.env.NVIDIA_NIM_API_KEY;
  if (!key) {
    throw new Error("No API key configured — add one in Settings");
  }
  return key;
}

const MODEL = "meta/llama-3.1-8b-instruct";
const NIM_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { lessonName, question, docs, history, apiKey: clientKey } = await req.json();

    if (!question || !docs || docs.length === 0) {
      return NextResponse.json(
        { error: "question and docs are required" },
        { status: 400 }
      );
    }

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

    const trimmedHistory = (history ?? []).slice(-20);
    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...trimmedHistory
        .filter((msg: { role: string; content: string }) =>
          msg.role === "user" || msg.role === "assistant"
        )
        .map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content,
        })),
      { role: "user", content: question },
    ];

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const apiKey = getApiKey(clientKey);
          const response = await fetch(NIM_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: MODEL,
              messages,
              max_tokens: 2048,
              stream: true,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `NVIDIA NIM API error ${response.status}: ${errorText || response.statusText}`
            );
          }

          if (!response.body) {
            throw new Error("NVIDIA NIM API response has no body");
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;

              const payload = trimmed.slice("data:".length).trim();
              if (payload === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }

              let parsed: any;
              try {
                parsed = JSON.parse(payload);
              } catch {
                continue;
              }

              const text = parsed?.choices?.[0]?.delta?.content ?? "";
              if (text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                );
              }
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err: unknown) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" })}\n\n`
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
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
