"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import BatMascot from "@/components/pixel/BatMascot";
import PixelButton from "@/components/pixel/PixelButton";
import { PixelInput } from "@/components/pixel/PixelField";

export default function LoginForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [trackerName, setTrackerName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, trackerName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Wrong passphrase");
        return;
      }
      router.push(searchParams.get("next") || "/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="pixel-box w-full max-w-[360px] p-5"
    >
      <div className="mb-5 flex flex-col items-center gap-3 text-center">
        <BatMascot />
        <h1 className="font-display text-lg">ECHO</h1>
        <p className="text-xs text-ink-soft">enter the passphrase to check in</p>
      </div>

      <div className="flex flex-col gap-4">
        <PixelInput
          id="password"
          label="Passphrase"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
        />
        <PixelInput
          id="tracker-name"
          label="Tracking as"
          value={trackerName}
          onChange={(e) => setTrackerName(e.target.value)}
          maxLength={40}
          placeholder="your name"
          hint="shown in the app, not a real login — just labels the data as yours"
        />
        {error ? (
          <p className="text-xs text-accent" role="alert">
            {error}
          </p>
        ) : null}
        <PixelButton type="submit" variant="accent" disabled={loading}>
          {loading ? "Checking…" : "Enter"}
        </PixelButton>
      </div>
    </form>
  );
}
