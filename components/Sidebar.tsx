"use client";

import { BookOpen, Trash2, Plus, Brain, FileText, X, Settings } from "lucide-react";
import { Lesson } from "@/lib/types";

interface Props {
  lessons: Lesson[];
  activeLessonId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewLesson: () => void;
  onHome: () => void;
  onSettings: () => void;
  onClose?: () => void;
}

export default function Sidebar({
  lessons,
  activeLessonId,
  onSelect,
  onDelete,
  onNewLesson,
  onHome,
  onSettings,
  onClose,
}: Props) {
  return (
    <aside className="flex flex-col w-[260px] min-w-[260px] h-full bg-[#0e0f11] border-r border-[#2a2d35]">
      {/* Logo + mobile close */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-[#2a2d35]">
        <button
          onClick={onHome}
          className="flex items-center gap-3 hover:opacity-80 active:scale-95 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-[#c8f565] flex items-center justify-center flex-shrink-0">
            <Brain size={17} className="text-[#0e0f11]" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-bold text-[#f0f2f5] text-sm tracking-wide">Study</span>
            <span className="font-bold text-[#c8f565] text-sm tracking-wide">Brain</span>
          </div>
        </button>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5f6e] hover:text-[#f0f2f5] hover:bg-[#2a2d35] transition-all"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Lessons list */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {lessons.length === 0 && (
          <div className="px-3 py-8 text-center">
            <BookOpen size={24} className="text-[#5a5f6e] mx-auto mb-2" />
            <p className="text-xs text-[#5a5f6e]">No lessons yet</p>
            <p className="text-xs text-[#5a5f6e]">Create one below</p>
          </div>
        )}
        {lessons.map((lesson) => {
          const isActive = lesson.id === activeLessonId;
          return (
            <div
              key={lesson.id}
              className={`group relative flex items-center gap-2.5 px-3 py-3 rounded-lg cursor-pointer transition-all ${
                isActive
                  ? "bg-[#c8f565]/10 border border-[#c8f565]/25"
                  : "hover:bg-[#16181c] border border-transparent"
              }`}
              onClick={() => onSelect(lesson.id)}
            >
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                  isActive ? "bg-[#c8f565]/20" : "bg-[#16181c]"
                }`}
              >
                <FileText
                  size={12}
                  className={isActive ? "text-[#c8f565]" : "text-[#8a8f9e]"}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    isActive ? "text-[#c8f565]" : "text-[#f0f2f5]"
                  }`}
                >
                  {lesson.name}
                </p>
                {lesson.docs.length > 0 && (
                  <p className="text-xs text-[#5a5f6e] font-mono">
                    {lesson.docs.length} doc{lesson.docs.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>

              {/* Delete — always visible on mobile (no hover), hover-only on desktop */}
              <button
                id={`delete-lesson-${lesson.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(lesson.id);
                }}
                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 w-7 h-7 rounded-md flex items-center justify-center text-[#5a5f6e] hover:text-red-400 hover:bg-red-400/10 active:bg-red-400/20 transition-all flex-shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div className="p-3 border-t border-[#2a2d35] flex gap-2">
        <button
          onClick={onSettings}
          title="Settings"
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#2a2d35] text-[#8a8f9e] hover:text-[#c8f565] hover:border-[#c8f565]/30 hover:bg-[#c8f565]/5 active:scale-95 transition-all flex-shrink-0"
        >
          <Settings size={16} />
        </button>
        <button
          id="new-lesson-btn"
          onClick={onNewLesson}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#c8f565] text-[#0e0f11] text-sm font-bold hover:bg-[#a8d94a] active:scale-95 transition-all shadow-lg shadow-[#c8f565]/10"
        >
          <Plus size={16} strokeWidth={2.5} />
          New Lesson
        </button>
      </div>
    </aside>
  );
}
