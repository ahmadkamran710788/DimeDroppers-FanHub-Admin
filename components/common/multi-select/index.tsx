"use client";

import { cn } from "@/utils/cn";
import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Checkbox from "@/components/common/checkbox";
import FloatingPanel, { MENU_ITEM } from "@/components/common/floating-panel";

// Every option at once, as opposed to a list of picked values.
export const ALL = "ALL";
export type MultiSelectValue = typeof ALL | string[];

export interface MultiSelectOption {
  label: string;
  value: string;
  // A muted second line, e.g. a store's city.
  hint?: string;
}

interface MultiSelectProps {
  label: string;
  name: string;
  value: MultiSelectValue;
  onChange: (value: MultiSelectValue) => void;
  options: MultiSelectOption[];
  // Adds a first row that picks every option at once (e.g. "All my locations").
  allLabel?: string;
  // The most options that can be picked one by one; All has no limit.
  max?: number;
  // The field's text for several picks; "3 selected" by default.
  countLabel?: (count: number) => string;
  error?: string;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  // Extra utilities for the field (e.g. a white fill).
  selectClassName?: string;
  disabled?: boolean;
  // "light" (default): light-grey field. "dark": translucent field with white text on dark cards.
  variant?: "light" | "dark";
}

// A filter box appears above lists longer than this.
const FILTER_FROM = 8;

// Dropdown field for picking several options (or All), with checkboxes in the shared navy panel. It looks
// and works like Select, but the panel stays open while picking. Picking one option while All is on starts
// a new pick from it.
export default function MultiSelect({
  label,
  name,
  value,
  onChange,
  options,
  allLabel,
  max,
  countLabel,
  error,
  placeholder,
  className,
  labelClassName,
  selectClassName,
  disabled,
  variant = "light",
}: MultiSelectProps) {
  const dark = variant === "dark";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // Index of the highlighted row while the list is open (All, when shown, is row 0).
  const [active, setActive] = useState(0);
  // Why the last pick was refused (over `max`).
  const [notice, setNotice] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const rowId = (index: number) => `${listId}-${index}`;

  const all = value === ALL;
  const picked = new Set(all ? [] : value);
  const filterable = options.length > FILTER_FROM;
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? options.filter((o) => `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(needle))
    : options;
  const withAll = Boolean(allLabel) && !needle;
  const rowCount = shown.length + (withAll ? 1 : 0);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setNotice("");
  }, []);

  function openList() {
    setActive(0);
    setOpen(true);
    // Safari doesn't focus a button on click; the keyboard handling below needs the focus.
    triggerRef.current?.focus({ preventScroll: true });
  }

  // A long list opens with the filter box focused, so typing narrows it straight away.
  useEffect(() => {
    if (open && filterable) filterRef.current?.focus({ preventScroll: true });
  }, [open, filterable]);

  // Keep the highlighted row in view as the arrow keys move through a long list.
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  function toggleAll() {
    setNotice("");
    onChange(all ? [] : ALL);
  }

  function toggle(option: MultiSelectOption) {
    if (picked.has(option.value)) {
      setNotice("");
      onChange([...picked].filter((v) => v !== option.value));
      return;
    }
    if (max !== undefined && picked.size >= max) {
      setNotice(`Select up to ${max}${allLabel ? `, or ${allLabel}` : ""}`);
      return;
    }
    setNotice("");
    onChange([...picked, option.value]);
  }

  function pickRow(row: number) {
    if (withAll && row === 0) toggleAll();
    else {
      const option = shown[row - (withAll ? 1 : 0)];
      if (option) toggle(option);
    }
  }

  // WAI-ARIA combobox: the arrow keys move the highlight, Enter (or Space on the field) ticks it. Shared by
  // the field and the filter box, where Space types instead.
  function onKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(i + 1, rowCount - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        pickRow(active);
        break;
      case " ":
        if (e.currentTarget === triggerRef.current) {
          e.preventDefault();
          pickRow(active);
        }
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

  const pickedLabel = options.find((o) => picked.has(o.value))?.label;
  const fieldText = all
    ? allLabel
    : picked.size === 1
      ? pickedLabel
      : picked.size > 1
        ? (countLabel?.(picked.size) ?? `${picked.size} selected`)
        : undefined;

  // Keyed by its value, not its place: filtering moves rows, and a reused row would fade its box between
  // the old row's state and its own.
  const row = (key: string, index: number, checked: boolean, text: string, onPick: () => void, hint?: string) => (
    <li
      key={key}
      id={rowId(index)}
      role="option"
      aria-selected={checked}
      // Keep focus on the field (or the filter box) so the keyboard handling keeps working.
      onMouseDown={(e) => e.preventDefault()}
      onMouseEnter={() => setActive(index)}
      onClick={onPick}
      className={cn(MENU_ITEM, "flex items-center gap-3 cursor-pointer whitespace-normal", index === active && "bg-white/10")}
    >
      <Checkbox variant="violet" checked={checked} />
      <span className="min-w-0 flex flex-col">
        <span className={cn(checked && "font-semibold")}>{text}</span>
        {hint && <span className="text-xs text-white/60">{hint}</span>}
      </span>
    </li>
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={name} className={cn("text-base font-medium text-midnight-navy", labelClassName)}>
        {label}
      </label>
      <div className="relative flex items-center">
        <button
          ref={triggerRef}
          id={name}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && rowCount > 0 ? rowId(active) : undefined}
          aria-invalid={error ? true : undefined}
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
            selectClassName,
            // Room for the chevron; after selectClassName so a caller's px-* can't take it away.
            "pr-10",
            error && "border-error focus:border-error"
          )}
        >
          <span className={cn("min-w-0 truncate", !fieldText && (dark ? "text-white/50" : "text-midnight-navy/50"))}>
            {fieldText ?? placeholder}
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
        <FloatingPanel anchorRef={triggerRef} onClose={close} align="start" className="max-w-[min(420px,calc(100vw-16px))]">
          {filterable && (
            <div className="p-2 border-b border-white/10">
              {/* Inside a common control, so a bare input is fine; it only filters the list. */}
              <input
                ref={filterRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search"
                aria-label={`Search ${label.toLowerCase()}`}
                aria-controls={listId}
                aria-activedescendant={rowCount > 0 ? rowId(active) : undefined}
                className="w-full h-9 rounded-[6px] bg-white/10 px-3 text-sm text-white placeholder:text-white/50 outline-none"
              />
            </div>
          )}
          <ul id={listId} role="listbox" aria-multiselectable aria-label={label} className="max-h-[320px] overflow-y-auto">
            {withAll && allLabel && row(ALL, 0, all, allLabel, toggleAll)}
            {shown.map((o, i) =>
              row(`option-${o.value}`, i + (withAll ? 1 : 0), picked.has(o.value), o.label, () => toggle(o), o.hint)
            )}
            {shown.length === 0 && <li className={cn(MENU_ITEM, "text-white/60")}>No matches</li>}
          </ul>
          {notice && (
            <p role="status" className="px-4 py-2 text-xs text-[#f0c36a] border-t border-white/10">
              {notice}
            </p>
          )}
        </FloatingPanel>
      )}
    </div>
  );
}
