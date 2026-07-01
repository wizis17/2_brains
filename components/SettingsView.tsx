"use client";

import { useState, useEffect } from "react";
import { Settings, Eye, EyeOff, Check, Key, ExternalLink, Cpu, Menu, Brain } from "lucide-react";

export const NIM_KEY_STORAGE = "studybrain_nim_key";

interface Props {
  onMenuOpen?: () => void;
}

export default function SettingsView({ onMenuOpen }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [storedKey, setStoredKey] = useState<string | null>(null);

  useEffect(() => {
    const k = localStorage.getItem(NIM_KEY_STORAGE);
    setStoredKey(k);
    if (k) setApiKey(k);
  }, []);

  function handleSave() {
    const trimmed = apiKey.trim();
    if (trimmed) {
      localStorage.setItem(NIM_KEY_STORAGE, trimmed);
      setStoredKey(trimmed);
    } else {
      localStorage.removeItem(NIM_KEY_STORAGE);
      setStoredKey(null);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleClear() {
    localStorage.removeItem(NIM_KEY_STORAGE);
    setStoredKey(null);
    setApiKey("");
  }

  const masked = storedKey
    ? storedKey.slice(0, 10) + "••••••••••••••••" + storedKey.slice(-4)
    : null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto relative">

      {/* Background (same as WelcomeScreen) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="bg-dot-grid absolute inset-0 opacity-60" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, #0e0f11 100%)" }}
        />
        <div className="animate-orb-a absolute top-[18%] left-[20%] w-72 h-72 rounded-full bg-[#c8f565]/8 blur-[80px]" />
        <div className="animate-orb-b absolute bottom-[20%] right-[18%] w-56 h-56 rounded-full bg-[#c8f565]/6 blur-[60px]" />
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

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 py-10 flex-1">
        <div className="w-full max-w-lg">

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-[#c8f565]/10 border border-[#c8f565]/25 flex items-center justify-center">
              <Settings size={20} className="text-[#c8f565]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#f0f2f5]">Settings</h1>
              <p className="text-xs text-[#8a8f9e]">Configure your AI provider</p>
            </div>
          </div>

          {/* API Key card */}
          <div className="bg-[#16181c]/90 border border-[#2a2d35] rounded-2xl p-6 mb-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <Key size={14} className="text-[#c8f565]" />
              <h2 className="text-sm font-semibold text-[#f0f2f5]">NVIDIA NIM API Key</h2>
            </div>
            <p className="text-xs text-[#8a8f9e] mb-5 leading-relaxed">
              Stored only in your browser — never sent anywhere except NVIDIA&apos;s servers.{" "}
              <a
                href="https://build.nvidia.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#c8f565] hover:underline inline-flex items-center gap-0.5"
              >
                Get a key at build.nvidia.com <ExternalLink size={10} />
              </a>
            </p>

            {/* Current key status */}
            {storedKey ? (
              <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl bg-[#c8f565]/5 border border-[#c8f565]/20">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c8f565] flex-shrink-0" />
                <span className="text-xs text-[#c8f565] font-mono truncate">{masked}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl bg-[#2a2d35]/50 border border-[#2a2d35]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5a5f6e] flex-shrink-0" />
                <span className="text-xs text-[#5a5f6e]">No key saved — using environment variable if set</span>
              </div>
            )}

            {/* Input */}
            <div className="relative mb-4">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="nvapi-••••••••••••••••••••••••••••••••••"
                className="w-full bg-[#0e0f11] border border-[#2a2d35] focus:border-[#c8f565]/40 rounded-xl px-4 py-3 pr-12 text-sm text-[#f0f2f5] placeholder:text-[#3a3f4e] font-mono outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5f6e] hover:text-[#8a8f9e] transition-colors p-1"
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c8f565] text-[#0e0f11] text-sm font-bold hover:bg-[#a8d94a] active:scale-95 transition-all"
              >
                {saved && <Check size={14} />}
                {saved ? "Saved!" : "Save Key"}
              </button>
              {storedKey && (
                <button
                  onClick={handleClear}
                  className="px-5 py-2.5 rounded-xl border border-[#2a2d35] text-[#8a8f9e] text-sm hover:border-red-400/40 hover:text-red-400 active:scale-95 transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Model info card */}
          <div className="bg-[#16181c]/90 border border-[#2a2d35] rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Cpu size={14} className="text-[#c8f565]" />
              <h2 className="text-sm font-semibold text-[#f0f2f5]">Model</h2>
            </div>
            <p className="text-xs text-[#8a8f9e] mb-1">Currently active</p>
            <p className="text-sm font-mono text-[#c8f565]">meta/llama-3.1-8b-instruct</p>
          </div>

        </div>
      </div>
    </div>
  );
}
