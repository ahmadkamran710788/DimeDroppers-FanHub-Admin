"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, CircleCheck, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/button";
import Tabs from "@/components/common/tabs";
import {
  SAMPLE_PHOTO_TEMPLATES,
  TEMPLATE_CATEGORIES,
  TEMPLATES_SPONSOR,
  type PhotoTemplate,
  type TemplateCategory,
} from "@/components/recognition/photo-templates/data";
import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/helper";

// Fan Wall → Templates: photo booth frames fans can use, grouped by category.
export default function PhotoTemplates() {
  const [category, setCategory] = useState<TemplateCategory>("Game Action");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // In state so removed templates drop out of the list (sample data until the API exists).
  const [all, setAll] = useState<PhotoTemplate[]>(SAMPLE_PHOTO_TEMPLATES);
  const templates = all.filter((t) => t.category === category);
  const selected = all.find((t) => t.id === selectedId);

  const remove = (t: PhotoTemplate) => {
    setAll((prev) => prev.filter((x) => x.id !== t.id));
    if (selectedId === t.id) setSelectedId(null);
    toast.success(`${t.name} removed`);
  };

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        tabs={TEMPLATE_CATEGORIES}
        active={category}
        onChange={(c) => {
          setCategory(c);
          setSelectedId(null);
        }}
      />

      <div className="flex items-center justify-center gap-3 text-base text-white">
        Presented by
        <Image src={TEMPLATES_SPONSOR.logo} alt={TEMPLATES_SPONSOR.name} width={86} height={24} className="h-6 w-auto" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((t) => {
          const isSelected = t.id === selectedId;
          return (
            <div
              key={t.id}
              className={cn(
                "relative rounded-[14px] overflow-hidden border-2 bg-[#151519] transition-colors",
                isSelected ? "border-[#FF34BF]" : "border-white/20 hover:border-white/40"
              )}
            >
              <button
                type="button"
                onClick={() => remove(t)}
                aria-label={`Remove ${t.name}`}
                className="cursor-pointer absolute top-2 left-2 z-10 size-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-error transition-colors"
              >
                <Trash2 className="size-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setSelectedId(isSelected ? null : t.id)}
                aria-pressed={isSelected}
                className="cursor-pointer w-full text-left"
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 z-10 size-6 rounded-full bg-[#FF34BF] flex items-center justify-center">
                    <Check className="size-4 text-white" strokeWidth={3} />
                  </span>
                )}
                <div className="relative aspect-[256/244]">
                  <Image
                    src={t.image}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <div className="px-4 py-3 flex flex-col gap-1">
                  <span className="text-base text-white">{t.name}</span>
                  {t.purchased ? (
                    <span className="flex items-center gap-1.5 text-sm text-success">
                      <CircleCheck className="size-4" strokeWidth={2} />
                      Purchased
                    </span>
                  ) : (
                    <span className="text-sm text-white/70">{formatMoney(t.price)}</span>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
      {templates.length === 0 && (
        <p className="py-10 text-center text-sm text-white/50">No {category.toLowerCase()} templates.</p>
      )}

      <Button
        variant={selected ? "cta" : "ghost"}
        label={selected && !selected.purchased ? `Purchase · ${formatMoney(selected.price)}` : "Continue"}
        fullWidth
        disabled={!selected}
        className="cursor-pointer"
        // Applying or buying a template needs the photo booth API, which doesn't exist yet.
        onClick={() => toast("Coming soon.")}
      />
    </div>
  );
}
