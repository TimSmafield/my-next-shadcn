"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ReloadIcon } from "@radix-ui/react-icons";

type StartResp = { trial_id: string; pubkey: string; ts_server: number };

export default function TrialPage() {
  const [trialId, setTrialId] = useState("");
  const [pubkey, setPubkey] = useState("—");
  const [guess, setGuess] = useState<"L" | "R" | null>(null);
  const [busy, setBusy] = useState(false);
  const [focusLock, setFocusLock] = useState(true);
  const [mmss, setMmss] = useState("00:00");
  const mountRef = useRef<number>(Date.now());
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => {
      const d = Math.floor((Date.now() - mountRef.current) / 1000);
      const m = String(Math.floor(d / 60)).padStart(2, "0");
      const s = String(d % 60).padStart(2, "0");
      setMmss(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const nextTrial = useCallback(async () => {
    setBusy(true);
    setGuess(null);
    const r = await fetch("/api/trials/start", { method: "POST" });
    const j = (await r.json()) as StartResp;
    setTrialId(j.trial_id);
    setPubkey(j.pubkey);
    setBusy(false);
    setTimeout(() => wrapRef.current?.focus(), 0);
  }, []);

  const saveAndNext = useCallback(async () => {
    if (!trialId || !guess) return;
    setBusy(true);
    wrapRef.current?.classList.add("ring-2", "ring-primary/50");
    setTimeout(() => wrapRef.current?.classList.remove("ring-2", "ring-primary/50"), 250);

    await fetch("/api/trials/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trial_id: trialId, guess }),
    });
    await nextTrial();
  }, [trialId, guess, nextTrial]);

  useEffect(() => { nextTrial(); }, [nextTrial]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!focusLock) return;
    const k = e.key.toLowerCase();
    if (k === "l") setGuess("L");
    if (k === "r") setGuess("R");
    if (k === "enter") saveAndNext();
    if (k === "escape") setGuess(null);
  }, [focusLock, saveAndNext]);

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={`min-h-dvh bg-gradient-to-b from-background to-muted/30 text-foreground
                  ${focusLock ? "cursor-none" : ""} flex flex-col`}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b">
        <div className="mx-auto max-w-3xl px-4 h-12 flex items-center justify-between">
          <div className="text-xs sm:text-sm opacity-70">
            Session <span className="font-medium">{trialId ? trialId.slice(0, 8) : "—"}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm tabular-nums opacity-70">{mmss}</span>
            <Button
              variant={focusLock ? "default" : "secondary"}
              size="sm"
              onClick={() => setFocusLock(v => !v)}
              className="rounded-full"
              title="Toggle Focus Lock (keyboard-only)"
            >
              {focusLock ? "Focus: On" : "Focus: Off"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          {/* Pubkey card */}
          <div className="rounded-2xl border shadow-sm bg-card">
            <div className="px-6 pt-5 pb-3 text-xs sm:text-sm text-muted-foreground">Compressed pubkey</div>
            <div className="px-6 pb-6">
              <div className="font-mono text-2xl sm:text-3xl leading-snug tracking-tight select-text break-all">
                {pubkey}
              </div>
            </div>
          </div>

          {/* Choice row */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              size="lg"
              className={`h-16 text-lg rounded-2xl transition-all duration-150
                          ${guess==="L" ? "scale-[1.02]" : "opacity-90"}`}
              variant={guess==="L" ? "default" : "secondary"}
              onClick={() => setGuess("L")}
              disabled={busy}
            >
              Left <span className="ml-2 opacity-70 text-sm">(L)</span>
            </Button>
            <Button
              size="lg"
              className={`h-16 text-lg rounded-2xl transition-all duration-150
                          ${guess==="R" ? "scale-[1.02]" : "opacity-90"}`}
              variant={guess==="R" ? "default" : "secondary"}
              onClick={() => setGuess("R")}
              disabled={busy}
            >
              Right <span className="ml-2 opacity-70 text-sm">(R)</span>
            </Button>
          </div>

          {/* Save strip */}
          <div className="mt-6 flex gap-3">
            <Button
              size="lg"
              className="h-14 text-lg rounded-2xl flex-1"
              onClick={saveAndNext}
              disabled={busy || !guess}
            >
              {busy ? <><ReloadIcon className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save & Next (Enter)"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
