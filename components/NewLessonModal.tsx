"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createLesson } from "@/lib/store";
import { Lesson } from "@/lib/types";

interface Props {
  onClose: () => void;
  onCreated: (lesson: Lesson) => void;
}

export default function NewLessonModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    const lesson = createLesson(trimmed);
    onCreated(lesson);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-[#16181c] border border-[#2a2d35] rounded-2xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2d35]">
          <div>
            <h2 className="text-lg font-bold text-[#f0f2f5]">New Lesson</h2>
            <p className="text-sm text-[#8a8f9e] mt-0.5">
              Give your study session a name
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8a8f9e] hover:text-[#f0f2f5] hover:bg-[#2a2d35] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#8a8f9e] mb-2">
              Lesson Name
            </label>
            <input
              id="lesson-name-input"
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Biology Ch4, Math Calculus…"
              className="w-full bg-[#0e0f11] border border-[#2a2d35] rounded-xl px-4 py-3 text-[#f0f2f5] placeholder:text-[#5a5f6e] focus:outline-none focus:border-[#c8f565] focus:ring-1 focus:ring-[#c8f565]/30 transition-all text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#2a2d35] text-[#8a8f9e] text-sm font-medium hover:bg-[#2a2d35] hover:text-[#f0f2f5] transition-all"
            >
              Cancel
            </button>
            <button
              id="create-lesson-btn"
              onClick={handleCreate}
              disabled={!name.trim() || loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#c8f565] text-[#0e0f11] text-sm font-bold hover:bg-[#a8d94a] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Creating…" : "Create Lesson"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
