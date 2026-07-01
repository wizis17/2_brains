"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import LessonView from "@/components/LessonView";
import WelcomeScreen from "@/components/WelcomeScreen";
import SettingsView from "@/components/SettingsView";
import NewLessonModal from "@/components/NewLessonModal";
import { getLessons, deleteLesson } from "@/lib/store";
import { Lesson } from "@/lib/types";

export default function Home() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const refreshLessons = useCallback(() => {
    setLessons(getLessons());
  }, []);

  useEffect(() => {
    setMounted(true);
    refreshLessons();
  }, [refreshLessons]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [activeLessonId, showSettings]);

  function handleDeleteLesson(id: string) {
    deleteLesson(id);
    if (activeLessonId === id) setActiveLessonId(null);
    refreshLessons();
  }

  function handleLessonCreated(lesson: Lesson) {
    refreshLessons();
    setActiveLessonId(lesson.id);
    setShowSettings(false);
  }

  function handleSelectLesson(id: string) {
    setActiveLessonId(id);
    setShowSettings(false);
    refreshLessons();
  }

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0e0f11]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#c8f565] animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 rounded-full bg-[#c8f565] animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 rounded-full bg-[#c8f565] animate-bounce" />
        </div>
      </div>
    );
  }

  function renderMain() {
    if (showSettings) {
      return <SettingsView onMenuOpen={() => setSidebarOpen(true)} />;
    }
    if (activeLessonId) {
      return (
        <LessonView
          key={activeLessonId}
          lessonId={activeLessonId}
          onMenuOpen={() => setSidebarOpen(true)}
        />
      );
    }
    return (
      <WelcomeScreen
        lessons={lessons}
        onNewLesson={() => setShowModal(true)}
        onSelect={handleSelectLesson}
        onMenuOpen={() => setSidebarOpen(true)}
      />
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 z-40
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <Sidebar
          lessons={lessons}
          activeLessonId={activeLessonId}
          onSelect={handleSelectLesson}
          onDelete={handleDeleteLesson}
          onNewLesson={() => setShowModal(true)}
          onHome={() => { setActiveLessonId(null); setShowSettings(false); }}
          onSettings={() => { setShowSettings(true); setActiveLessonId(null); }}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main area */}
      <main className="flex-1 flex overflow-hidden bg-[#0e0f11] min-w-0">
        {renderMain()}
      </main>

      {/* Modal */}
      {showModal && (
        <NewLessonModal
          onClose={() => setShowModal(false)}
          onCreated={handleLessonCreated}
        />
      )}
    </>
  );
}
