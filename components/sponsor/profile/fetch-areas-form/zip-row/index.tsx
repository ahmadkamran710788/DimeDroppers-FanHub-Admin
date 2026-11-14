"use client";

import { MapPin, X } from "lucide-react";
import Button from "@/components/common/button";
import Input from "@/components/common/input";
import { INPUT } from "@/components/sponsor/profile/styles";
import { useZipPlace } from "@/components/sponsor/profile/use-us-places";

// One ZIP code row of the picker.
export interface ZipEntry {
  // Keeps the row (and its focus) when one above it is removed.
  id: number;
  zip: string;
}

interface ZipRowProps {
  index: number;
  entry: ZipEntry;
  error?: string;
  onChange: (zip: string) => void;
  // Several ZIP codes were pasted at once ("33801, 99501 10001"): this row takes the first, new rows the rest.
  onSplit: (zips: string[]) => void;
  onRemove: () => void;
}

// A ZIP code (5 digits, or ZIP+4) with the city and state it belongs to beside it, looked up as it's typed.
// One the ZIP list doesn't have is still sent: the backend places it on the map itself.
export default function ZipRow({ index, entry, error, onChange, onSplit, onRemove }: ZipRowProps) {
  const place = useZipPlace(entry.zip);

  function type(value: string) {
    const parts = value.split(/[\s,;]+/).filter(Boolean);
    if (parts.length > 1) {
      onSplit(parts.map((part) => part.replace(/[^\d-]/g, "").slice(0, 10)).filter(Boolean));
      return;
    }
    onChange((parts[0] ?? "").replace(/[^\d-]/g, "").slice(0, 10));
  }

  return (
    <div className="grid grid-cols-[minmax(0,150px)_minmax(0,1fr)_auto] gap-2 items-start">
      <Input
        label={`ZIP code ${index + 1}`}
        name={`fetch-zip-${entry.id}`}
        value={entry.zip}
        onChange={(e) => type(e.target.value)}
        placeholder="ZIP code"
        inputMode="numeric"
        autoComplete="postal-code"
        error={error}
        variant="dark"
        className="min-w-0"
        labelClassName="sr-only"
        inputClassName={INPUT}
      />
      <div aria-live="polite" className="min-w-0 h-12 flex items-center text-sm">
        {place ? (
          <span className="flex items-center gap-2 text-white min-w-0">
            <MapPin className="size-4 shrink-0 text-[#c9b8ff]" strokeWidth={2} aria-hidden />
            <span className="truncate">{`${place.city}, ${place.state}`}</span>
          </span>
        ) : place === null ? (
          <span className="text-[#a8a8a8]">Not in our ZIP list; it will still be searched</span>
        ) : null}
      </div>
      <Button
        size="icon"
        icon={<X className="size-4" strokeWidth={2} />}
        aria-label={`Remove ${entry.zip.trim() || `ZIP code ${index + 1}`}`}
        onClick={onRemove}
        className="size-12 rounded-[10px] bg-transparent border border-[#3a3a3a] text-[#d4d4d4] backdrop-blur-none"
      />
    </div>
  );
}
