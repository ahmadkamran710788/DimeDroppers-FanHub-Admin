// Field styling for the need form: white labels over white fields with a 2px hairline border, as on the
// other admin forms (e.g. Create Campaign).
export const LABEL = "text-white";
export const FIELD = "bg-white border-2 border-[rgba(11,28,45,0.11)]";

// Muted helper line under a field.
export const HINT = "text-sm text-white/60";

// The form's cards without SectionCard's backdrop blur. Over the layout's already-blurred background they
// look the same, and blurring several tall cards again on every scroll frame made the form lag (~45 fps).
export const FLAT_CARD = "backdrop-blur-none";

// Digits and one decimal point, at most 2 decimals; null when the typed text isn't a valid amount yet.
export function amountInput(text: string): string | null {
  const v = text.replace(/[^\d.]/g, "");
  return /^\d*(\.\d{0,2})?$/.test(v) ? v : null;
}
