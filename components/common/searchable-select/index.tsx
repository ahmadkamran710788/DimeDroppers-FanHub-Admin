"use client";

import { cn } from "@/utils/cn";
import { Check, ChevronDown, Search } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import FloatingPanel, { MENU_ITEM } from "@/components/common/floating-panel";

export interface SearchableSelectOption {
  label: string;
  value: string;
  // A muted second line under the label, e.g. a city or state.
  hint?: string;
}

interface SearchableSelectProps {
  label: string;
  name: string;
  value: string;
  // Returns the picked option's value (empty string once nothing is picked).
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  icon?: ReactNode;
  error?: string;
  placeholder?: string;
  // The filter box's hint; "Search" by default.
  searchPlaceholder?: string;
  className?: string;
  labelClassName?: string;
  // Extra utilities for the field itself (e.g. a white fill).
  selectClassName?: string;
  disabled?: boolean;
  // Adds a red asterisk after the label.
  required?: boolean;
  // "light" (default): light-grey field. "dark": translucent field with white text on dark cards.
  variant?: "light" | "dark";
}

// A single-select dropdown with a search box in the panel — like Select, but the list filters as you
// type. The options open in the shared navy panel (FloatingPanel), so the look matches Select / MultiSelect.
export default function SearchableSelect({
  label,
  name,
  value,
  onChange,
  options,
  icon,
  error,
  placeholder,
  searchPlaceholder = "Search",
  className,
  labelClassName,
  selectClassName,
  disabled,
  required,
  variant = "light",
}: SearchableSelectProps) {
  const dark = variant === "dark";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Index of the highlighted match while the list is open.
  const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const optionId = (index: number) => `${listId}-${index}`;

  const selected = options.find((o) => o.value === value);
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? options.filter((o) => `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(needle))
    : options;

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  function openList() {
    setActive(0);
    setOpen(true);
    // Safari doesn't focus a button on click; the keyboard handling below needs the focus.
    triggerRef.current?.focus({ preventScroll: true });
  }

  function pick(index: number) {
    const next = matches[index]?.value;
    close();
    if (next !== undefined && next !== value) onChange(next);
  }

  // Open with the filter box focused, so typing narrows the list straight away.
  useEffect(() => {
    if (open) filterRef.current?.focus({ preventScroll: true });
  }, [open]);

  // Keep the highlighted option in view as the arrow keys move through a long list.
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  // Shared by the trigger and the filter box: the arrow keys move the highlight, Enter picks it.
  function onKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    const last = matches.length - 1;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(i + 1, last));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(last);
        break;
      case "Enter":
        e.preventDefault();
        if (matches.length) pick(active);
        break;
      case "Escape":
        e.preventDefault();
        // Stops a surrounding Modal (which listens on document) from closing too.
        e.stopPropagation();
        close();
        triggerRef.current?.focus();
        break;
      case "Tab":
        close();
        break;
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className={cn("text-base font-medium text-midnight-navy", labelClassName)}>
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      <div className="relative flex items-center">
        {icon && (
          <span
            className={cn(
              "absolute left-3 w-6 h-6 flex items-center justify-center pointer-events-none z-10",
              dark ? "text-white" : "text-[#0B1C2D]"
            )}
          >
            {icon}
          </span>
        )}
        <button
          ref={triggerRef}
          id={name}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && matches.length ? optionId(active) : undefined}
          aria-invalid={error ? true : undefined}
          aria-required={required}
          disabled={disabled}
          onClick={() => (open ? close() : openList())}
          onKeyDown={onKeyDown}
          className={cn(
            "w-full h-12 rounded-[8px] text-base font-medium leading-normal px-4 outline-none border flex items-center text-left",
            dark
              ? "bg-white/[0.06] text-white border-white/15"
              : "bg-[#F5F6F8] text-midnight-navy border-[rgba(11,28,45,0.12)]",
            "focus:border-steel-blue transition-colors cursor-pointer",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            icon && "pl-10",
            selectClassName,
            // Room for the chevron; after selectClassName so a caller's px-* can't take it away.
            "pr-10",
            error && "border-error focus:border-error"
          )}
        >
          <span className={cn("min-w-0 truncate", !selected && (dark ? "text-white/50" : "text-midnight-navy/50"))}>
            {selected?.label ?? placeholder}
          </span>
        </button>
        <ChevronDown
          className={cn(
            "absolute right-3 w-5 h-5 pointer-events-none transition-transform",
            open && "rotate-180",
            dark ? "text-white" : "text-midnight-navy"
          )}
          strokeWidth={2}
        />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}

      {open && (
        <FloatingPanel
          anchorRef={triggerRef}
          onClose={close}
          align="start"
          className="max-w-[min(420px,calc(100vw-16px))]"
        >
          <div className="p-2 border-b border-white/10">
            {/* Inside a common control, so a bare input is fine; it only filters the list. */}
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-white/50 pointer-events-none" />
              <input
                ref={filterRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                aria-label={`Search ${label.toLowerCase()}`}
                aria-controls={listId}
                aria-activedescendant={matches.length ? optionId(active) : undefined}
                className="w-full h-9 rounded-[6px] bg-white/10 pl-9 pr-3 text-sm text-white placeholder:text-white/50 outline-none"
              />
            </div>
          </div>
          <ul id={listId} role="listbox" aria-label={label} className="max-h-[320px] overflow-y-auto">
            {matches.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value}
                  id={optionId(i)}
                  role="option"
                  aria-selected={isSelected}
                  // Keep focus on the filter box so the keyboard handling keeps working.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(i)}
                  className={cn(
                    MENU_ITEM,
                    "flex items-center justify-between gap-3 cursor-pointer whitespace-normal",
                    i === active && "bg-white/10"
                  )}
                >
                  <span className="min-w-0 flex flex-col">
                    <span className={cn(isSelected && "font-semibold")}>{opt.label}</span>
                    {opt.hint && <span className="text-xs text-white/60">{opt.hint}</span>}
                  </span>
                  {isSelected && <Check className="size-4 shrink-0" strokeWidth={2.5} />}
                </li>
              );
            })}
            {matches.length === 0 && <li className={cn(MENU_ITEM, "text-white/60")}>No matches</li>}
          </ul>
        </FloatingPanel>
      )}
    </div>
  );
}
