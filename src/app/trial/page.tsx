"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

type StartResp = { trial_id: string; pubkey: string; ts_server: number };

const Q_PRESETS = [0.55, 0.6, 0.65, 0.7, 0.8, 0.9];

export default function TrialPage() {
  const [trialId, setTrialId]   = useState<string>("");
  const [pubkey, setPubkey]     = useState<string>("—");
  const [guess, setGuess]       = useState<"L" | "R" | null>(null);
  const [q, setQ]               = useState<number>(0.6);
  const [busy, setBusy]         = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const nextTrial = useCallback(async () => {
    setBusy(true);
    setGuess(null);
    const r = await fetch("/api/trials/start", { method: "POST" });
    const j = (await r.json()) as StartResp;
    setTrialId(j.trial_id);
    setPubkey(j.pubkey);
    setBusy(false);
    // focus wrapper for keyboard capture
    setTimeout(() => wrapRef.current?.focus(), 0);
  }, []);

  const saveAndNext = useCallback(async () => {
    if (!trialId || !guess) return;
    setBusy(true);
    await fetch("/api/trials/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trial_id: trialId, guess, confidence: q }),
    });
    await nextTrial();
  }, [trialId, guess, q, nextTrial]);

  useEffect(() => { nextTrial(); }, [nextTrial]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const k = e.key.toLowerCase();
    if (k === "l") setGuess("L");
    if (k === "r") setGuess("R");
    if (k >= "1" && k <= "6") setQ(Q_PRESETS[Number(k) - 1]);
    if (k === "enter") saveAndNext();
    if (k === "escape") setGuess(null);
  }, [saveAndNext]);

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="min-h-dvh bg-background text-foreground flex items-center justify-center p-6"
    >
      <div className="w-full max-w-2xl space-y-6">
        {/* Pubkey */}
        <div className="rounded-2xl border shadow p-6">
          <div className="text-sm opacity-70 mb-2">Compressed pubkey</div>
          <div className="font-mono text-2xl break-all select-text">{pubkey}</div>
        </div>

        {/* Choice */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className={`h-14 text-lg rounded-2xl ${guess==="L" ? "" : "opacity-90"}`}
            variant={guess==="L" ? "default" : "secondary"}
            onClick={() => setGuess("L")}
            disabled={busy}
          >
            Left (L)
          </Button>
          <Button
            size="lg"
            className={`h-14 text-lg rounded-2xl ${guess==="R" ? "" : "opacity-90"}`}
            variant={guess==="R" ? "default" : "secondary"}
            onClick={() => setGuess("R")}
            disabled={busy}
          >
            Right (R)
          </Button>
        </div>

        {/* Confidence */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm opacity-70">Confidence q</div>
            <div className="text-sm font-medium">{q.toFixed(2)}</div>
          </div>
          <Slider
            value={[q]}
            min={0.5}
            max={1.0}
            step={0.01}
            onValueChange={(v) => setQ(Math.max(0.5, Math.min(1, v[0])))}
          />
          <div className="flex justify-between text-xs mt-2 opacity-70">
            {Q_PRESETS.map((v) => <span key={v}>{String(Math.round(v*100))}</span>)}
          </div>
        </div>

        {/* Save */}
        <div className="flex gap-3">
          <Button
            size="lg"
            className="h-14 text-lg rounded-2xl flex-1"
            onClick={saveAndNext}
            disabled={busy || !guess}
          >
            Save & Next (Enter)
          </Button>
        </div>

        {/* Tiny footer (no scoring) */}
        <div className="text-xs opacity-60 text-center">
          Collection view shows no correctness; analytics come later.
        </div>
      </div>
    </div>
  );
}
