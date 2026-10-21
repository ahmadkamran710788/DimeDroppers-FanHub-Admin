"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/utils/cn";
import { parseMoney } from "@/utils/helper";
import { validateAndSetErrors } from "@/utils/validation";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Textarea from "@/components/common/textarea";
import { FIELD, PRIMARY_BUTTON, SECTION_LABEL } from "@/components/sponsor/styles";
import { campaignRequestSchema } from "@/components/sponsor/campaign-planner/schema";
import {
  DEFAULT_REQUEST,
  GOAL_OPTIONS,
  PROMPT_MAX_LENGTH,
  SEASON_OPTIONS,
  SUGGESTIONS,
  type CampaignRequest,
} from "@/components/sponsor/campaign-planner/data";

const CONTROL = cn(FIELD, "h-12 text-[16px] min-w-0");

type RequestField = keyof CampaignRequest;
type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface PlanComposerProps {
  // Called with the validated request, its budget parsed to dollars.
  onBuild: (request: Omit<CampaignRequest, "budget"> & { budget: number }) => void;
}

// Where the sponsor describes the campaign for Dime AI to plan.
export default function PlanComposer({ onBuild }: PlanComposerProps) {
  const [form, setForm] = useState(DEFAULT_REQUEST);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(field: RequestField, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  // Change handler for one field; editing it clears its error.
  const setField = (field: RequestField) => (e: React.ChangeEvent<FieldElement>) => update(field, e.target.value);

  function addSuggestion(suggestion: string) {
    const prompt = form.prompt.trim();
    update("prompt", prompt ? `${prompt} ${suggestion}.` : `${suggestion}.`);
  }

  async function build(e: React.FormEvent) {
    e.preventDefault();
    if (!(await validateAndSetErrors(campaignRequestSchema, form, setErrors))) return;
    onBuild({ ...form, budget: parseMoney(form.budget) });
  }

  return (
    <form
      aria-label="Describe your campaign"
      noValidate
      onSubmit={build}
      className="bg-[#141414] border border-[#2c2547] rounded-[8px] p-6 flex flex-col gap-[18px]"
    >
      <Textarea
        label="WHAT DO YOU WANT TO ACHIEVE?"
        name="ai-prompt"
        value={form.prompt}
        onChange={setField("prompt")}
        error={errors.prompt}
        rows={3}
        maxLength={PROMPT_MAX_LENGTH}
        showCounter={false}
        fieldVariant="dark"
        labelClassName={SECTION_LABEL}
        fieldClassName={cn(FIELD, "rounded-[12px] p-4 text-[17px] leading-[1.5] resize-y")}
      />

      <div className="@container grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 items-start">
        <Input
          label="TOTAL BUDGET"
          name="ai-budget"
          value={form.budget}
          onChange={setField("budget")}
          error={errors.budget}
          className="min-w-0"
          labelClassName={SECTION_LABEL}
          inputClassName={cn(CONTROL, "py-0 px-[14px]")}
        />
        <Select
          label="SEASON"
          name="ai-season"
          value={form.season}
          onChange={setField("season")}
          options={SEASON_OPTIONS}
          error={errors.season}
          variant="dark"
          className="min-w-0"
          labelClassName={SECTION_LABEL}
          selectClassName={cn(CONTROL, "px-3")}
        />
        <Select
          label="GOAL"
          name="ai-goal"
          value={form.goal}
          onChange={setField("goal")}
          options={GOAL_OPTIONS}
          error={errors.goal}
          variant="dark"
          className="min-w-0"
          labelClassName={SECTION_LABEL}
          selectClassName={cn(CONTROL, "px-3")}
        />
        {/* A blank label row keeps the button level with the fields, even when an error grows a field's
            cell; it's dropped once the fields stack in one column (under 416px, two 200px columns). */}
        <div className="flex flex-col gap-2">
          <span aria-hidden="true" className={cn(SECTION_LABEL, "invisible hidden @min-[416px]:block")}>
            BUILD
          </span>
          <Button
            type="submit"
            label="Build my plan"
            icon={<Sparkles className="size-[18px]" strokeWidth={2} />}
            fullWidth
            className={cn(PRIMARY_BUTTON, "h-12 px-4 rounded-[10px] text-base")}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-[#a8a8a8]">Try:</span>
        {SUGGESTIONS.map((suggestion) => (
          <Button
            key={suggestion}
            label={suggestion}
            onClick={() => addSuggestion(suggestion)}
            className="h-auto min-h-10 min-w-0 px-[14px] rounded-full bg-[#0b0b0b] border border-[#333] text-[#d4d4d4] text-sm font-normal backdrop-blur-none"
          />
        ))}
      </div>
    </form>
  );
}
