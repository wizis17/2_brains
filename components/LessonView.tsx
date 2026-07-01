"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
} from "react";
import {
  FileText,
  Upload,
  Send,
  X,
  Bot,
  User,
  BookOpen,
  Lightbulb,
  HelpCircle,
  List,
  AlertCircle,
  Menu,
} from "lucide-react";
import { Lesson, Doc, ChatMessage } from "@/lib/types";
import {
  addDoc,
  removeDoc,
  addMessage,
  updateLastAssistantMessage,
  getLesson,
} from "@/lib/store";
import { NIM_KEY_STORAGE } from "@/components/SettingsView";

/* ── PDF parser (lazy) ─────────────────────────────────────────────── */
async function parsePdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => (item as { str?: string }).str ?? "").join(" "));
  }
  return pages.join("\n\n");
}

/* ── Suggestion chips ───────────────────────────────────────────────── */
const SUGGESTIONS = [
  { icon: List, label: "Summarize" },
  { icon: HelpCircle, label: "Make exam questions" },
  { icon: Lightbulb, label: "Key concepts" },
  { icon: BookOpen, label: "Explain in simple terms" },
];

/* ── Simple markdown-like formatter ────────────────────────────────── */
function formatMessage(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hul])(.+)/gm, "$1")
    .split("\n")
    .join(" ");
}

interface Props {
  lessonId: string;
  onMenuOpen?: () => void;
}

export default function LessonView({ lessonId, onMenuOpen }: Props) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Load / refresh lesson from store */
  const refresh = useCallback(() => {
    const l = getLesson(lessonId);
    setLesson(l);
  }, [lessonId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* Auto-scroll */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lesson?.chat, streamContent]);

  /* ── File Upload ─────────────────────────────────────────────────── */
  async function handleFiles(files: FileList | null) {
    if (!files || !lesson) return;
    setUploadError(null);

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["txt", "md", "pdf"].includes(ext ?? "")) {
        setUploadError(`Unsupported: ${file.name}. Use .txt, .md, or .pdf`);
        continue;
      }
      // Check duplicate
      if (lesson.docs.some((d) => d.name === file.name)) {
        setUploadError(`"${file.name}" already added`);
        continue;
      }

      try {
        let content = "";
        if (ext === "pdf") {
          content = await parsePdf(file);
        } else {
          content = await file.text();
        }

        const doc: Doc = {
          name: file.name,
          content,
          size: file.size,
          addedAt: Date.now(),
        };
        addDoc(lessonId, doc);
        refresh();
      } catch {
        setUploadError(`Failed to parse ${file.name}`);
      }
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  /* ── Chat ────────────────────────────────────────────────────────── */
  async function handleSend(overrideText?: string) {
    const question = (overrideText ?? input).trim();
    if (!question || isStreaming || !lesson || lesson.docs.length === 0) return;

    setInput("");
    setIsStreaming(true);
    setStreamContent("");

    // Persist user message
    const userMsg: ChatMessage = {
      role: "user",
      content: question,
      timestamp: Date.now(),
    };
    addMessage(lessonId, userMsg);

    // Persist placeholder assistant message
    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    addMessage(lessonId, assistantMsg);
    refresh();

    try {
      const freshLesson = getLesson(lessonId)!;
      const history = freshLesson.chat.slice(-22, -2); // last 20 before new pair

      const storedKey = localStorage.getItem(NIM_KEY_STORAGE) ?? undefined;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          lessonName: freshLesson.name,
          question,
          docs: freshLesson.docs,
          history,
          apiKey: storedKey,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Empty response stream");
      }
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";
      let receivedDone = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode();
        } else {
          buffer += decoder.decode(value, { stream: true });
        }

        // Parse SSE events by event boundary (\n\n), preserving partial chunks.
        while (true) {
          const eventEnd = buffer.indexOf("\n\n");
          if (eventEnd === -1) break;

          const rawEvent = buffer.slice(0, eventEnd);
          buffer = buffer.slice(eventEnd + 2);

          const data = rawEvent
            .split("\n")
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trimStart())
            .join("\n")
            .trim();

          if (!data) continue;
          if (data === "[DONE]") {
            receivedDone = true;
            break;
          }

          let parsed: { text?: string; error?: string };
          try {
            parsed = JSON.parse(data);
          } catch {
            continue;
          }

          if (parsed.error) {
            throw new Error(parsed.error);
          }

          if (parsed.text) {
            accumulated += parsed.text;
            setStreamContent(accumulated);
          }
        }

        if (receivedDone || done) break;
      }

      updateLastAssistantMessage(lessonId, accumulated);
      refresh();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      updateLastAssistantMessage(lessonId, `⚠️ Error: ${errorMsg}`);
      refresh();
    } finally {
      setIsStreaming(false);
      setStreamContent("");
    }
  }

  /* ── Render ──────────────────────────────────────────────────────── */
  if (!lesson) return null;

  const hasDocs = lesson.docs.length > 0;

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Topbar */}
      <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-b border-[#2a2d35] bg-[#0e0f11] flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {/* Hamburger — mobile only */}
          <button
            onClick={onMenuOpen}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-[#8a8f9e] hover:text-[#f0f2f5] hover:bg-[#16181c] transition-all flex-shrink-0"
          >
            <Menu size={18} />
          </button>
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#c8f565]/10 border border-[#c8f565]/25 flex items-center justify-center flex-shrink-0">
            <BookOpen size={13} className="text-[#c8f565]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-[#f0f2f5] text-sm truncate max-w-[140px] md:max-w-none">{lesson.name}</h2>
            <p className="text-xs text-[#5a5f6e] hidden md:block">
              {lesson.chat.length} messages
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-mono text-[#c8f565] bg-[#c8f565]/10 border border-[#c8f565]/20 px-2 md:px-2.5 py-1 rounded-full">
            {lesson.docs.length} doc{lesson.docs.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Docs bar — horizontally scrollable on mobile */}
      <div className="flex-shrink-0 px-3 md:px-6 py-2.5 border-b border-[#2a2d35] bg-[#16181c]">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {lesson.docs.map((doc) => (
            <div
              key={doc.name}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e0f11] border border-[#2a2d35] hover:border-[#c8f565]/30 transition-all"
            >
              <FileText size={11} className="text-[#8a8f9e]" />
              <span className="text-xs font-mono text-[#f0f2f5] max-w-[120px] truncate">
                {doc.name}
              </span>
              <button
                onClick={() => {
                  removeDoc(lessonId, doc.name);
                  refresh();
                }}
                className="ml-0.5 opacity-0 group-hover:opacity-100 text-[#5a5f6e] hover:text-red-400 transition-all"
              >
                <X size={10} />
              </button>
            </div>
          ))}

          <button
            id="add-docs-btn"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[#2a2d35] text-[#8a8f9e] hover:border-[#c8f565]/40 hover:text-[#c8f565] transition-all text-xs"
          >
            <Upload size={11} />
            Add notes
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {uploadError && (
          <div className="flex items-center gap-2 mt-2 text-xs text-red-400">
            <AlertCircle size={12} />
            {uploadError}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Empty state */}
        {lesson.chat.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 animate-fade-in">
            {hasDocs ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[#c8f565]/10 border border-[#c8f565]/20 flex items-center justify-center mb-4">
                  <Bot size={26} className="text-[#c8f565]" />
                </div>
                <p className="text-[#f0f2f5] font-semibold mb-1">
                  Ready to study!
                </p>
                <p className="text-sm text-[#8a8f9e] mb-6">
                  Ask anything about your uploaded documents
                </p>
                {/* Suggestion chips */}
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => handleSend(s.label)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16181c] border border-[#2a2d35] text-sm text-[#f0f2f5] hover:border-[#c8f565]/30 hover:text-[#c8f565] transition-all"
                    >
                      <s.icon size={13} className="text-[#c8f565]" />
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div
                  className="w-20 h-20 rounded-2xl bg-[#16181c] border-2 border-dashed border-[#2a2d35] flex items-center justify-center mb-4 cursor-pointer hover:border-[#c8f565]/40 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={28} className="text-[#5a5f6e]" />
                </div>
                <p className="text-[#f0f2f5] font-semibold mb-1">
                  No documents yet
                </p>
                <p className="text-sm text-[#8a8f9e]">
                  Upload .txt, .md, or .pdf files to start chatting
                </p>
              </>
            )}
          </div>
        )}

        {/* Chat messages */}
        {lesson.chat.map((msg, i) => {
          const isLast = i === lesson.chat.length - 1;
          const isStreamingThis =
            isLast && msg.role === "assistant" && isStreaming;
          const displayContent = isStreamingThis
            ? streamContent
            : msg.content;

          return (
            <div
              key={i}
              className={`flex gap-2 md:gap-3 animate-slide-up ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar — hidden on mobile to save space */}
              <div
                className={`hidden sm:flex w-7 h-7 rounded-lg items-center justify-center flex-shrink-0 mt-0.5 ${
                  msg.role === "user"
                    ? "bg-[#2a2d35]"
                    : "bg-[#c8f565]/10 border border-[#c8f565]/25"
                }`}
              >
                {msg.role === "user" ? (
                  <User size={13} className="text-[#8a8f9e]" />
                ) : (
                  <Bot size={13} className="text-[#c8f565]" />
                )}
              </div>

              {/* Bubble — wider on mobile */}
              <div
                className={`max-w-[90%] sm:max-w-[75%] rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#c8f565]/10 border border-[#c8f565]/20 text-[#f0f2f5] rounded-tr-sm"
                    : "bg-[#16181c] border border-[#2a2d35] text-[#f0f2f5] rounded-tl-sm"
                }`}
              >
                {isStreamingThis && displayContent === "" ? (
                  /* Thinking dots */
                  <div className="flex items-center gap-1 py-1">
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                  </div>
                ) : (
                  <div
                    className="message-content"
                    dangerouslySetInnerHTML={{
                      __html: `<p>${formatMessage(displayContent)}</p>`,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}

        <div ref={chatEndRef} />
      </div>

      {/* Suggestion chips — horizontally scrollable on mobile */}
      {hasDocs && lesson.chat.length > 0 && !isStreaming && (
        <div className="flex-shrink-0 px-3 md:px-6 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => handleSend(s.label)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#16181c] border border-[#2a2d35] text-xs text-[#8a8f9e] hover:border-[#c8f565]/30 hover:text-[#c8f565] active:bg-[#c8f565]/5 transition-all whitespace-nowrap flex-shrink-0"
            >
              <s.icon size={11} className="text-[#c8f565]" />
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Chat input */}
      <div className="flex-shrink-0 px-3 md:px-6 py-3 md:py-4 border-t border-[#2a2d35] bg-[#0e0f11]">
        {!hasDocs && (
          <p className="text-xs text-[#5a5f6e] text-center mb-2">
            Add at least one document before chatting
          </p>
        )}
        <div
          className={`flex items-end gap-2 md:gap-3 bg-[#16181c] border rounded-2xl px-3 md:px-4 py-2.5 md:py-3 transition-all ${
            hasDocs
              ? "border-[#2a2d35] focus-within:border-[#c8f565]/40"
              : "border-[#2a2d35] opacity-50"
          }`}
        >
          <textarea
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={!hasDocs || isStreaming}
            placeholder={
              hasDocs
                ? "Ask about your docs…"
                : "Upload documents first"
            }
            rows={1}
            className="flex-1 bg-transparent text-[#f0f2f5] placeholder:text-[#5a5f6e] text-sm resize-none focus:outline-none max-h-32 leading-relaxed"
            style={{ fieldSizing: "content" } as unknown as React.CSSProperties}
          />
          <button
            id="send-btn"
            onClick={() => handleSend()}
            disabled={!hasDocs || !input.trim() || isStreaming}
            className="w-9 h-9 md:w-8 md:h-8 rounded-xl bg-[#c8f565] flex items-center justify-center text-[#0e0f11] hover:bg-[#a8d94a] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            <Send size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
