"use client";

import { Brain, Sparkles, Upload, MessageSquare, Menu, BookOpen, FileText, ChevronRight, MessagesSquare } from "lucide-react";
import { Lesson } from "@/lib/types";

interface Props {
  lessons: Lesson[];
  onNewLesson: () => void;
  onSelect: (id: string) => void;
  onMenuOpen?: () => void;
}

function lastActivity(lesson: Lesson): number {
  if (lesson.chat.length > 0) return lesson.chat[lesson.chat.length - 1].timestamp;
  return lesson.createdAt;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export default function WelcomeScreen({ lessons, onNewLesson, onSelect, onMenuOpen }: Props) {
  const hasLessons = lessons.length > 0;

  const totalDocs = lessons.reduce((sum, l) => sum + l.docs.length, 0);
  const totalQuestions = lessons.reduce(
    (sum, l) => sum + l.chat.filter((m) => m.role === "user").length,
    0
  );

  const recentLessons = [...lessons]
    .sort((a, b) => lastActivity(b) - lastActivity(a))
    .slice(0, 3);

  const features = [
    {
      icon: Upload,
      title: "Upload Documents",
      desc: "Import .txt, .md, and .pdf files into any lesson",
    },
    {
      icon: Brain,
      title: "AI-Powered Chat",
      desc: "AI reads your docs and answers questions precisely",
    },
    {
      icon: MessageSquare,
      title: "Persistent Memory",
      desc: "Every lesson and conversation is saved locally forever",
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto relative">

      {/* ── Background layer ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="bg-dot-grid absolute inset-0 opacity-60" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, #0e0f11 100%)",
          }}
        />
        <div className="animate-orb-a absolute top-[18%] left-[20%] w-72 h-72 rounded-full bg-[#c8f565]/8 blur-[80px]" />
        <div className="animate-orb-b absolute bottom-[20%] right-[18%] w-56 h-56 rounded-full bg-[#c8f565]/6 blur-[60px]" />
        <div className="animate-orb-c absolute top-[55%] left-[55%] w-40 h-40 rounded-full bg-[#c8f565]/5 blur-[50px]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 35% at 50% 42%, rgba(200,245,101,0.06) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Mobile topbar */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-4 border-b border-[#2a2d35] md:hidden flex-shrink-0">
        <button
          onClick={onMenuOpen}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#8a8f9e] hover:text-[#f0f2f5] hover:bg-[#16181c] transition-all"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#c8f565] flex items-center justify-center">
            <Brain size={13} className="text-[#0e0f11]" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm">
            <span className="text-[#f0f2f5]">Study</span>
            <span className="text-[#c8f565]">Brain</span>
          </span>
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-10 animate-fade-in flex-1">

        {/* Icon */}
        <div className="relative mb-6">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#c8f565]/10 border border-[#c8f565]/25 flex items-center justify-center">
            <Brain size={32} className="text-[#c8f565] md:hidden" />
            <Brain size={40} className="text-[#c8f565] hidden md:block" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#c8f565] flex items-center justify-center">
            <Sparkles size={10} className="text-[#0e0f11]" />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-[#f0f2f5] mb-3 text-center leading-tight">
          Your AI Study
          <br />
          <span className="text-[#c8f565]">Knowledge Base</span>
        </h1>
        <p className="text-[#8a8f9e] text-center max-w-sm mb-8 leading-relaxed text-sm md:text-base">
          {hasLessons
            ? "Pick up where you left off, or start something new."
            : "Create a lesson, upload your study materials, and let AI help you master any subject — all stored locally, forever."}
        </p>

        <button
          onClick={onNewLesson}
          className="px-7 py-3 rounded-2xl bg-[#c8f565] text-[#0e0f11] font-bold text-sm hover:bg-[#a8d94a] active:scale-95 transition-all shadow-lg shadow-[#c8f565]/20 mb-10"
        >
          {hasLessons ? "+ New Lesson" : "Create Your First Lesson →"}
        </button>

        {/* ── Stats bar (only when lessons exist) ── */}
        {hasLessons && (
          <div className="grid grid-cols-3 gap-3 max-w-lg w-full mb-8">
            {[
              { icon: BookOpen, label: "Lessons", value: lessons.length },
              { icon: FileText, label: "Documents", value: totalDocs },
              { icon: MessagesSquare, label: "Questions", value: totalQuestions },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 bg-[#16181c]/80 border border-[#2a2d35] rounded-xl py-4 px-3 backdrop-blur-sm"
              >
                <Icon size={15} className="text-[#c8f565] mb-1" />
                <span className="text-xl font-extrabold text-[#f0f2f5] leading-none">
                  {value}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#8a8f9e] font-medium">
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Recent lessons (only when lessons exist) ── */}
        {hasLessons && (
          <div className="w-full max-w-2xl mb-8">
            <p className="text-xs uppercase tracking-widest text-[#8a8f9e] font-semibold mb-3 px-1">
              Recent Lessons
            </p>
            <div className="flex flex-col gap-2">
              {recentLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => onSelect(lesson.id)}
                  className="group flex items-center gap-4 bg-[#16181c]/80 border border-[#2a2d35] hover:border-[#c8f565]/30 hover:bg-[#1a1d22] rounded-xl px-4 py-3 text-left transition-all backdrop-blur-sm"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#c8f565]/10 border border-[#c8f565]/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={15} className="text-[#c8f565]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#f0f2f5] truncate group-hover:text-[#c8f565] transition-colors">
                      {lesson.name}
                    </p>
                    <p className="text-xs text-[#8a8f9e] mt-0.5">
                      {lesson.docs.length} doc{lesson.docs.length !== 1 ? "s" : ""}
                      {" · "}
                      {timeAgo(lastActivity(lesson))}
                    </p>
                  </div>
                  <ChevronRight
                    size={15}
                    className="text-[#3a3f4e] group-hover:text-[#c8f565] flex-shrink-0 transition-colors"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feature cards — only shown to new users */}
        {!hasLessons && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl w-full">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="bg-[#16181c] border border-[#2a2d35] rounded-xl p-4 hover:border-[#c8f565]/20 transition-all"
              >
                <feat.icon size={18} className="text-[#c8f565] mb-2" />
                <h3 className="text-sm font-semibold text-[#f0f2f5] mb-1">
                  {feat.title}
                </h3>
                <p className="text-xs text-[#8a8f9e] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
