"use client"

import { useEffect, useRef, useState } from "react"

// ─── Types ─────────────────────────────────────────────────────────────────────

type TextSize = "normal" | "lg" | "xl" | "xxl"

interface A11ySettings {
  textSize: TextSize
  highContrast: boolean
  highlightLinks: boolean
  noAnimations: boolean
}

const DEFAULT: A11ySettings = {
  textSize: "normal",
  highContrast: false,
  highlightLinks: false,
  noAnimations: false,
}

const STORAGE_KEY = "studio-itai-a11y"

// ─── Helpers ───────────────────────────────────────────────────────────────────

function loadSettings(): A11ySettings {
  if (typeof window === "undefined") return DEFAULT
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {
    return DEFAULT
  }
}

function applySettings(s: A11ySettings) {
  const html = document.documentElement
  // Text size
  html.classList.remove("a11y-text-lg", "a11y-text-xl", "a11y-text-xxl")
  if (s.textSize === "lg") html.classList.add("a11y-text-lg")
  if (s.textSize === "xl") html.classList.add("a11y-text-xl")
  if (s.textSize === "xxl") html.classList.add("a11y-text-xxl")
  // Toggles
  html.classList.toggle("a11y-high-contrast", s.highContrast)
  html.classList.toggle("a11y-highlight-links", s.highlightLinks)
  html.classList.toggle("a11y-no-animations", s.noAnimations)
}

function saveSettings(s: A11ySettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* noop */ }
}

// ─── Widget ────────────────────────────────────────────────────────────────────

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<A11ySettings>(DEFAULT)
  const menuRef = useRef<HTMLDivElement>(null)
  const btnRef  = useRef<HTMLButtonElement>(null)

  // Load from localStorage on mount and apply
  useEffect(() => {
    const s = loadSettings()
    setSettings(s)
    applySettings(s)
  }, [])

  // Apply whenever settings change
  useEffect(() => {
    applySettings(settings)
    saveSettings(settings)
  }, [settings])

  // Close menu on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current  && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); btnRef.current?.focus() }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const update = (patch: Partial<A11ySettings>) =>
    setSettings((prev) => ({ ...prev, ...patch }))

  const reset = () => {
    setSettings(DEFAULT)
    applySettings(DEFAULT)
    saveSettings(DEFAULT)
  }

  const isModified =
    settings.textSize !== "normal" ||
    settings.highContrast ||
    settings.highlightLinks ||
    settings.noAnimations

  const TEXT_SIZES: { value: TextSize; label: string }[] = [
    { value: "normal", label: "רגיל" },
    { value: "lg",    label: "גדול" },
    { value: "xl",    label: "גדול מאוד" },
    { value: "xxl",   label: "ענק" },
  ]

  return (
    <div
      className="fixed bottom-5 start-5 z-50 flex flex-col items-start gap-2"
      dir="rtl"
    >
      {/* Panel */}
      {open && (
        <div
          ref={menuRef}
          role="dialog"
          aria-label="הגדרות נגישות"
          className="w-64 rounded-xl border bg-card text-card-foreground shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-bold">הגדרות נגישות</h2>
            <button
              type="button"
              aria-label="סגור תפריט נגישות"
              onClick={() => setOpen(false)}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4 p-4">
            {/* Text size */}
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-muted-foreground">
                גודל טקסט
              </legend>
              <div className="grid grid-cols-4 gap-1">
                {TEXT_SIZES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={settings.textSize === value}
                    onClick={() => update({ textSize: value })}
                    className={[
                      "rounded-lg border px-1 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      settings.textSize === value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-muted",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Toggle options */}
            <div className="space-y-1.5">
              {[
                {
                  key: "highContrast" as const,
                  label: "ניגודיות גבוהה",
                  icon: "◑",
                },
                {
                  key: "highlightLinks" as const,
                  label: "הדגשת קישורים",
                  icon: "🔗",
                },
                {
                  key: "noAnimations" as const,
                  label: "עצירת אנימציות",
                  icon: "⏸",
                },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  type="button"
                  role="switch"
                  aria-checked={settings[key]}
                  onClick={() => update({ [key]: !settings[key] })}
                  className={[
                    "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    settings[key]
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-border hover:bg-muted",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true">{icon}</span>
                    {label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={[
                      "h-4 w-8 rounded-full border transition-colors",
                      settings[key] ? "bg-primary border-primary" : "bg-muted border-border",
                    ].join(" ")}
                  />
                </button>
              ))}
            </div>

            {/* Reset */}
            {isModified && (
              <button
                type="button"
                onClick={reset}
                className="w-full rounded-lg border border-border py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              >
                איפוס הגדרות
              </button>
            )}
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        ref={btnRef}
        type="button"
        aria-label="פתח תפריט נגישות"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          open
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground hover:bg-muted",
          isModified && !open ? "ring-2 ring-primary ring-offset-1" : "",
        ].join(" ")}
      >
        {/* Accessibility icon (person with arms spread) */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="5" r="1.5" />
          <path d="M6 10h12M12 10v10M9 20l3-5 3 5" />
        </svg>
      </button>
    </div>
  )
}
