"use client";

import { cn } from "@/utils/cn";
import { Check, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import FloatingPanel, { MENU_ITEM } from "@/components/common/floating-panel";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  icon?: ReactNode;
  error?: string;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  // Extra utilities for the field (e.g. a white fill).
  selectClassName?: string;
  disabled?: boolean;
  // Adds a red asterisk after the label.
  required?: boolean;
  // "light" (default): light-grey field. "dark": translucent field with white text on dark cards.
  variant?: "light" | "dark";
}

// Dropdown field. It draws its own chevron and opens its options in the shared navy panel (the same
// one as the filter chip menus) instead of the browser's list, which can't be styled.
export default function Select({
  label,
  name,
  value,
  onChange,
  options,
  icon,
  error,
  placeholder,
  className,
  labelClassName,
  selectClassName,
  disabled,
  required,
  variant = "light",
}: SelectProps) {
  const dark = variant === "dark";
  const [open, setOpen] = useState(false);
  // Index of the highlighted option while the list is open.
  const [active, setActive] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const nativeRef = useRef<HTMLSelectElement>(null);
  const listId = useId();
  const optionId = (index: number) => `${listId}-${index}`;

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const close = useCallback(() => setOpen(false), []);

  function openList() {
    setActive(Math.max(selectedIndex, 0));
    setOpen(true);
    // Safari doesn't focus a button on click; the keyboard handling below needs the focus.
    // preventScroll: scrolling a half-hidden field into view would close the list straight away.
    triggerRef.current?.focus({ preventScroll: true });
  }

  function pick(index: number) {
    close();
    const next = options[index]?.value;
    const native = nativeRef.current;
    if (next === undefined || next === value || !native) return;
    // The hidden native select holds the value, so callers keep getting a real change event
    // (`e.target.value`, `e.target.name`) exactly as before the custom list.
    native.value = next;
    native.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // Keep the highlighted option in view as the arrow keys move through a long list.
  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);

  // WAI-ARIA "select-only combobox": focus stays on the trigger and the arrow keys move the highlight.
  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    const last = options.length - 1;
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
      case " ":
        e.preventDefault();
        pick(active);
        break;
      case "Escape":
        e.preventDefault();
        // Stops a surrounding Modal (which listens on document) from closing too.
        e.stopPropagation();
        close();
        break;
      case "Tab":
        close();
        break;
      default:
        // Typing a letter jumps to the next option that starts with it.
        if (e.key.length === 1) {
          const key = e.key.toLowerCase();
          const order = options.map((_, i) => (active + 1 + i) % options.length);
          const match = order.find((i) => options[i].label.toLowerCase().startsWith(key));
          if (match !== undefined) setActive(match);
        }
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
          aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
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
          <span
            className={cn("min-w-0 truncate", !selected && (dark ? "text-white/50" : "text-midnight-navy/50"))}
          >
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
        {/* Value holder for the change event (see pick); hidden from view and assistive tech. */}
        <select ref={nativeRef} name={name} value={value} onChange={onChange} disabled={disabled} hidden>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}

      {open && (
        <FloatingPanel anchorRef={triggerRef} onClose={close} align="start">
          <ul id={listId} role="listbox" aria-label={label} className="max-h-[320px] overflow-y-auto">
            {options.map((opt, i) => {
              const isSelected = i === selectedIndex;
              return (
                <li
                  key={opt.value}
                  id={optionId(i)}
                  role="option"
                  aria-selected={isSelected}
                  // Keep focus on the trigger so the keyboard handling keeps working.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(i)}
                  className={cn(
                    MENU_ITEM,
                    "flex items-center justify-between gap-3 cursor-pointer",
                    i === active && "bg-white/10",
                    isSelected && "font-semibold"
                  )}
                >
                  {opt.label}
                  {isSelected && <Check className="size-4 shrink-0" strokeWidth={2.5} />}
                </li>
              );
            })}
          </ul>
        </FloatingPanel>
      )}
    </div>
  );
}
