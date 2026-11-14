"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/utils/cn";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import Textarea from "@/components/common/textarea";
import { FIELD, HINT, OUTLINE_BUTTON, SECTION_LABEL } from "@/components/sponsor/styles";
import { campaignPromptSchema } from "@/components/sponsor/campaign-planner/schema";
import { MAX_PROMPT_LENGTH } from "@/components/sponsor/campaign-planner/data";

interface PromptBoxProps {
  // The brief is being read.
  reading: boolean;
  // A plan is being built.
  disabled: boolean;
  // Reads the brief into the form; resolves the API's refusal to show under the box, or null.
  onRead: (prompt: string) => Promise<string | null>;
}

// Prompt mode: the sponsor describes the campaign in their own words (any language) and Dime AI fills the form
// below with it, to check before building. One read per press, never retried by itself (30 an hour).
export default function PromptBox({ reading, disabled, onRead }: PromptBoxProps) {
  const [prompt, setPrompt] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function read() {
    if (reading || disabled) return;
    if (!(await validateAndSetErrors(campaignPromptSchema, { prompt }, setErrors))) return;
    const problem = await onRead(prompt.trim());
    setErrors(problem ? { prompt: problem } : {});
  }

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        label="WHAT DO YOU WANT TO ACHIEVE?"
        name="plan-prompt"
        value={prompt}
        onChange={(e) => {
          setPrompt(e.target.value);
          if (errors.prompt) setErrors({});
        }}
        placeholder="e.g. Back to school: reach families near our Texas and Oklahoma stores through football and basketball. $30,000 budget, to bring more people into the stores."
        maxLength={MAX_PROMPT_LENGTH}
        rows={3}
        counterInLabel
        fieldVariant="dark"
        disabled={disabled}
        error={errors.prompt}
        labelClassName={SECTION_LABEL}
        fieldClassName={cn(
          FIELD,
          "rounded-[12px] p-4 text-[17px] leading-[1.5] resize-y placeholder:text-[#757575]"
        )}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn(HINT, "flex-[1_1_280px]")}>
          {reading
            ? "Dime AI is reading your brief…"
            : "Dime AI fills the form below from your description. Check it, then build your plan."}
        </p>
        <Button
          label={reading ? "Reading your brief…" : "Fill the form"}
          icon={<Sparkles className="size-[18px]" strokeWidth={2} />}
          onClick={read}
          disabled={reading || disabled}
          className={cn(OUTLINE_BUTTON, "h-12 px-6 rounded-[10px] text-base font-semibold")}
        />
      </div>
    </div>
  );
}
