"use client";

import type { NominatimResult, LinkStatus } from "@/components/checkin/useLocationPicker";

type Props = {
  id: string;
  label: string;
  placeText: string;
  onPlaceChange: (value: string) => void;
  suggestions: NominatimResult[];
  onSelectSuggestion: (result: NominatimResult) => void;
  searching: boolean;
  linkStatus: LinkStatus;
  located: boolean;
  placeholder?: string;
};

export default function LocationField({
  id,
  label,
  placeText,
  onPlaceChange,
  suggestions,
  onSelectSuggestion,
  searching,
  linkStatus,
  located,
  placeholder = "search a name or paste a Google Maps link",
}: Props) {
  return (
    <div className="pixel-field relative">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="pixel-input"
        value={placeText}
        onChange={(e) => onPlaceChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        required
      />
      {searching ? <p className="mt-1 text-[0.625rem] text-ink-soft">searching…</p> : null}
      {linkStatus === "resolving" ? (
        <p className="mt-1 text-[0.625rem] text-ink-soft">resolving Google Maps link…</p>
      ) : null}
      {linkStatus === "error" ? (
        <p className="mt-1 text-[0.625rem] text-accent">couldn&apos;t resolve that link</p>
      ) : null}
      {located && !searching && suggestions.length === 0 && linkStatus === "idle" ? (
        <p className="mt-1 text-[0.625rem] text-mint">📍 location set</p>
      ) : null}
      {suggestions.length > 0 ? (
        <ul className="mt-1 flex flex-col gap-1">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onSelectSuggestion(s)}
                className="w-full border-2 border-dashed border-ink-soft bg-panel-2 px-2 py-1.5 text-left text-[0.6875rem] text-ink-soft hover:text-ink cursor-pointer"
              >
                📍 {s.display_name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
