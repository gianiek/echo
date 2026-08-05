"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import PixelDialog from "@/components/pixel/PixelDialog";
import { PixelInput } from "@/components/pixel/PixelField";
import PixelButton from "@/components/pixel/PixelButton";

const TABS = [
  { href: "/", label: "Map" },
  { href: "/log", label: "Log" },
  { href: "/stats", label: "Stats" },
  { href: "/budget", label: "Budget" },
];

export default function PixelWindow({
  trackerName,
  children,
}: {
  trackerName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [name, setName] = useState(trackerName);
  const [draft, setDraft] = useState(trackerName);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function saveName() {
    const trimmed = draft.trim();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackerName: trimmed }),
      });
      if (res.ok) {
        setName(trimmed);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pixel-box mx-auto flex w-full max-w-[420px] flex-1 flex-col">
      <div className="flex items-center justify-center gap-2 px-3 py-3 font-display text-xs">
        <span>🦇 ECHO</span>
      </div>

      <button
        type="button"
        onClick={() => {
          setDraft(name);
          setEditing(true);
        }}
        className="flex items-center justify-center gap-1.5 border-t-2 border-ink bg-panel-2 px-3 py-1.5 text-[0.625rem] tracking-wide text-ink-soft uppercase cursor-pointer focus-visible:outline-3 focus-visible:outline-accent-2"
      >
        tracking as{" "}
        <b className="text-ink">{name || "you"}</b>
        <span className="text-accent-2" aria-hidden="true">
          ✎
        </span>
      </button>

      <nav className="grid grid-cols-4 border-y-2 border-ink">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`border-r-2 border-ink px-1 py-2.5 text-center text-[0.625rem] font-bold tracking-wide uppercase last:border-r-0 ${
                active ? "bg-accent text-accent-ink" : "bg-panel-2 text-ink-soft"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1 overflow-y-auto p-4">{children}</div>

      <PixelDialog
        open={editing}
        onClose={() => setEditing(false)}
        title="TRACKING AS"
      >
        <div className="flex flex-col gap-4">
          <PixelInput
            id="tracker-name"
            label="Your name"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={40}
            autoFocus
          />
          <div className="flex gap-2">
            <PixelButton
              variant="accent"
              className="flex-1"
              onClick={saveName}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </PixelButton>
            <PixelButton className="flex-1" onClick={() => setEditing(false)}>
              Cancel
            </PixelButton>
          </div>
        </div>
      </PixelDialog>
    </div>
  );
}
