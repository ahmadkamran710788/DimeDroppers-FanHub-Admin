"use client";

import { useEffect, useState } from "react";
import { Check, Clock, X } from "lucide-react";
import Button from "@/components/common/button";
import type { ConfirmBlock as ConfirmBlockData } from "@/utils/types/organiser-agent";

interface ConfirmBlockProps {
  block: ConfirmBlockData;
  // Only the newest reply's confirmation can be answered, and not while a reply is due.
  active: boolean;
  // The API already called it expired.
  expired: boolean;
  onAnswer: (token: string, decision: "CONFIRM" | "CANCEL") => Promise<boolean>;
}

// Confirm / Cancel for a change the agent previewed. Nothing changes until Confirm; the buttons go after
// expiresAt (10 minutes).
export default function ConfirmBlock({ block, active, expired, onAnswer }: ConfirmBlockProps) {
  const [timedOut, setTimedOut] = useState(false);
  const [sending, setSending] = useState<"CONFIRM" | "CANCEL" | null>(null);

  useEffect(() => {
    if (!active) return;
    const left = Date.parse(block.expiresAt) - Date.now();
    const timer = setTimeout(() => setTimedOut(true), Number.isNaN(left) ? 0 : Math.max(0, left));
    return () => clearTimeout(timer);
  }, [active, block.expiresAt]);

  const answer = async (decision: "CONFIRM" | "CANCEL") => {
    setSending(decision);
    await onAnswer(block.token, decision);
    setSending(null);
  };

  const gone = expired || timedOut;
  const live = active && !gone;

  return (
    <div className="w-full rounded-[8px] border border-[#8b6dff]/40 bg-[#2a2148]/60 p-3 flex flex-col gap-3">
      <p className="text-sm text-white break-words">{block.summary}</p>
      {live ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="cta"
            size="sm"
            label={sending === "CONFIRM" ? "Confirming…" : "Confirm"}
            icon={<Check className="size-4" />}
            onClick={() => void answer("CONFIRM")}
            disabled={sending !== null}
            className="h-9 px-4 text-sm"
          />
          <Button
            size="sm"
            label={sending === "CANCEL" ? "Cancelling…" : "Cancel"}
            icon={<X className="size-4" />}
            onClick={() => void answer("CANCEL")}
            disabled={sending !== null}
            className="h-9 px-4 text-sm"
          />
        </div>
      ) : (
        active &&
        gone && (
          <p className="flex items-center gap-1.5 text-xs text-white/60">
            <Clock className="size-3.5" aria-hidden="true" />
            This confirmation expired. Ask again to make the change.
          </p>
        )
      )}
    </div>
  );
}
