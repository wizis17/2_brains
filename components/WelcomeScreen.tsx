"use client";

import { Brain, Sparkles, Upload, MessageSquare, Menu } from "lucide-react";

interface Props {
  onNewLesson: () => void;
  onMenuOpen?: () => void;
}

export default function WelcomeScreen({ onNewLesson, onMenuOpen }: Props) {
  const features = [
    {
      icon: Upload,
      title: "Upload Documents",
      desc: "Import .txt, .md, and .pdf files into any lesson",
    },
    {
      icon: Brain,
      title: "AI-Powered Chat",
      desc: "Claude reads your docs and answers questions precisely",
    },
    {
      icon: MessageSquare,
      title: "Persistent Memory",
      desc: "Every lesson and conversation is saved locally forever",
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto">
      {/* Mobile topbar */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#2a2d35] md:hidden flex-shrink-0">
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
      <div className="flex flex-col items-center justify-center px-6 py-10 animate-fade-in flex-1">
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
          Create a lesson, upload your study materials, and let AI help you
          master any subject — all stored locally, forever.
        </p>

        <button
          id="welcome-new-lesson-btn"
          onClick={onNewLesson}
          className="px-7 py-3 rounded-2xl bg-[#c8f565] text-[#0e0f11] font-bold text-sm hover:bg-[#a8d94a] active:scale-95 transition-all shadow-lg shadow-[#c8f565]/20 mb-10"
        >
          Create Your First Lesson →
        </button>

        {/* Feature cards — 1 col on mobile, 3 on sm+ */}
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
      </div>
    </div>
  );
}
