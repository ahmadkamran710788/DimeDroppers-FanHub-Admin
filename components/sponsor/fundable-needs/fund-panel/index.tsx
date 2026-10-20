"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Textarea from "@/components/common/textarea";
import OrgCrest from "@/components/sponsor/org-crest";
import { BRAND_ASSET_OPTIONS, PRESET_AMOUNTS, type FundableNeed } from "@/components/sponsor/fundable-needs/data";

const SECTION_LABEL = "text-[13px] font-semibold tracking-[1px] text-[#c4c4c4]";
const FIELD = "rounded-[10px] font-normal leading-[normal] bg-[#0b0b0b] text-white border-[#333]";

interface FundPanelProps {
  need: FundableNeed;
  // Index into the preset amounts; the last option funds the rest of the need.
  amountIndex: number;
  onAmountChange: (index: number) => void;
}

export default function FundPanel({ need, amountIndex, onAmountChange }: FundPanelProps) {
  const [customAmount, setCustomAmount] = useState("");
  const [brandAsset, setBrandAsset] = useState(BRAND_ASSET_OPTIONS[0].value);
  const [note, setNote] = useState("");

  const remaining = need.goal - need.raised;
  const amounts = [...PRESET_AMOUNTS, remaining];

  return (
    // box-content: the design's 340px basis is the content box, which sets how the row splits.
    <aside
      aria-label="Fund this need"
      className="box-content flex-[1_1_340px] min-w-0 bg-[#141414] border border-[#2c2547] rounded-[14px] p-[26px] flex flex-col gap-5"
    >
      <div className="flex gap-4 items-start">
        <OrgCrest orgName={need.org} color={need.color} trim={need.trim} width={60} height={70} />
        <div className="min-w-0">
          <div className="text-[13px] tracking-[1px] text-[#a8a8a8] font-semibold">FUND THIS NEED</div>
          <div className="font-bebas text-[32px] leading-[1.05] mt-1">{need.title}</div>
          <div className="text-[15px] text-[#c4c4c4] mt-1">
            {need.org} · {formatMoney(remaining)} still needed
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[10px]">
        <div className={SECTION_LABEL}>AMOUNT</div>
        <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-[10px]">
          {amounts.map((amount, i) => {
            const on = amountIndex === i;
            return (
              <Button
                key={i}
                label={i === amounts.length - 1 ? `Fund rest · ${formatMoney(amount)}` : formatMoney(amount)}
                onClick={() => onAmountChange(i)}
                aria-pressed={on}
                fullWidth
                className={cn(
                  "h-12 min-w-0 px-[6px] rounded-[10px] text-[15px] font-semibold border backdrop-blur-none transition-none",
                  on ? "bg-[#2a2148] text-white border-[#8b6dff]" : "bg-[#0b0b0b] text-[#e0e0e0] border-[#333]"
                )}
              />
            );
          })}
        </div>
        <Input
          label="Or enter an amount"
          name="amt"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          placeholder="$ Custom amount"
          className="gap-[10px] mt-1"
          labelClassName="text-[14px] font-normal text-[#c4c4c4]"
          inputClassName={cn(FIELD, "h-12 py-0 px-[14px] text-[16px] placeholder:text-[#757575]")}
        />
      </div>

      <div className="bg-[#0b0b0b] border border-[#262626] rounded-[12px] p-4 flex flex-col gap-[6px]">
        <div className={SECTION_LABEL}>RECOGNITION</div>
        <div className="text-[15px] leading-[1.45]">{need.recognition}</div>
        <div className="text-[13px] text-[#a8a8a8]">Full recognition at 50% of goal or more; a thank-you mention below that.</div>
      </div>

      <Select
        label="SHOW MY BRAND AS"
        name="asset"
        value={brandAsset}
        onChange={(e) => setBrandAsset(e.target.value)}
        options={BRAND_ASSET_OPTIONS}
        nativeArrow
        labelClassName={SECTION_LABEL}
        selectClassName={cn(FIELD, "h-12 px-3 text-[16px]")}
      />

      <Textarea
        label="NOTE TO THE ORGANIZATION"
        name="msg"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional message"
        rows={3}
        showCounter={false}
        fieldVariant="dark"
        labelClassName={SECTION_LABEL}
        fieldClassName={cn(FIELD, "px-[14px] py-3 text-[15px] resize-y placeholder:text-[#757575]")}
      />

      <Button
        label={`Fund ${formatMoney(amounts[amountIndex])}`}
        fullWidth
        className="h-[54px] min-w-0 px-[6px] bg-[#6a4be6] text-white rounded-[12px] text-[17px] font-bold backdrop-blur-none"
      />
      <div className="text-[13px] text-[#a8a8a8] text-center">Funds are held until the organization confirms the purchase.</div>
    </aside>
  );
}
