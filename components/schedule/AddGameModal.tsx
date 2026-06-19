"use client";

import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import Select from "@/components/common/Select";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import { GENDER_OPTIONS, SEASON_OPTIONS, SPORTS_OPTIONS, LEVEL_OPTIONS } from "@/utils/constants/schedule";
import type { ScheduleItem, ScheduleItemResponse } from "@/utils/types/schedule";
import { useState, useEffect, useRef } from "react";

interface FormState {
  title: string;
  opponent: string;
  location: string;
  description: string;
  start: string;
  end: string;
  isAllDay: boolean;
  homeAway: string;
  status: string;
  gender: string;
  season: string;
  sports: string;
  level: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  opponent: "",
  location: "",
  description: "",
  start: "",
  end: "",
  isAllDay: false,
  homeAway: "",
  status: "confirmed",
  gender: "",
  season: "",
  sports: "",
  level: "",
};

function toLocalDatetimeValue(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDatetimeValue(local: string): string {
  if (!local) return "";
  return new Date(local).toISOString();
}

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editGame?: ScheduleItem | null;
}

export default function AddGameModal({ isOpen, onClose, onSaved, editGame }: AddGameModalProps) {
  const isEdit = !!editGame;

  const [form, setForm] = useState<FormState>(() =>
    editGame
      ? {
          title: editGame.title ?? "",
          opponent: editGame.opponent ?? "",
          location: editGame.location ?? "",
          description: editGame.description ?? "",
          start: toLocalDatetimeValue(editGame.start),
          end: toLocalDatetimeValue(editGame.end ?? ""),
          isAllDay: editGame.isAllDay,
          homeAway: editGame.homeAway ?? "",
          status: editGame.status ?? "confirmed",
          gender: editGame.gender ?? "",
          season: editGame.season ?? "",
          sports: editGame.sports ?? "",
          level: editGame.level ?? "",
        }
      : EMPTY_FORM
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewUrl = logoFile
    ? URL.createObjectURL(logoFile)
    : (editGame?.opponentLogoUrl ?? null);

  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  // Sync form whenever editGame changes (e.g. opening edit for a different game)
  useEffect(() => {
    if (!isOpen) return;
    const next = editGame
      ? {
          title: editGame.title ?? "",
          opponent: editGame.opponent ?? "",
          location: editGame.location ?? "",
          description: editGame.description ?? "",
          start: toLocalDatetimeValue(editGame.start),
          end: toLocalDatetimeValue(editGame.end ?? ""),
          isAllDay: editGame.isAllDay,
          homeAway: editGame.homeAway ?? "",
          status: editGame.status ?? "confirmed",
          gender: editGame.gender ?? "",
          season: editGame.season ?? "",
          sports: editGame.sports ?? "",
          level: editGame.level ?? "",
        }
      : EMPTY_FORM;
    Promise.resolve().then(() => {
      setForm(next);
      setLogoFile(null);
      setErrors({});
    });
  }, [editGame, isOpen]);

  const handleClose = () => {
    setForm(editGame
      ? {
          title: editGame.title ?? "",
          opponent: editGame.opponent ?? "",
          location: editGame.location ?? "",
          description: editGame.description ?? "",
          start: toLocalDatetimeValue(editGame.start),
          end: toLocalDatetimeValue(editGame.end ?? ""),
          isAllDay: editGame.isAllDay,
          homeAway: editGame.homeAway ?? "",
          status: editGame.status ?? "confirmed",
          gender: editGame.gender ?? "",
          season: editGame.season ?? "",
          sports: editGame.sports ?? "",
          level: editGame.level ?? "",
        }
      : EMPTY_FORM);
    setLogoFile(null);
    setErrors({});
    onClose();
  };

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === "checkbox"
      ? (e.target as HTMLInputElement).checked
      : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const errs: Partial<FormState> = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.start) errs.start = "Start date/time is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    const body: Record<string, unknown> = {
      title: form.title.trim(),
      ...(form.opponent && { opponent: form.opponent.trim() }),
      ...(form.location && { location: form.location.trim() }),
      ...(form.description && { description: form.description.trim() }),
      start: fromLocalDatetimeValue(form.start),
      ...(form.end && { end: fromLocalDatetimeValue(form.end) }),
      isAllDay: form.isAllDay,
      ...(form.homeAway && { homeAway: form.homeAway }),
      ...(form.status && { status: form.status }),
      ...(form.gender && { gender: form.gender }),
      ...(form.season && { season: form.season }),
      ...(form.sports && { sports: form.sports }),
      ...(form.level && { level: form.level }),
    };

    let result;
    if (logoFile) {
      const fd = new FormData();
      Object.entries(body).forEach(([k, v]) => fd.append(k, String(v)));
      fd.append("opponentLogo", logoFile);
      result = await apiCall<ScheduleItemResponse>({
        endpoint: isEdit ? routes.api.proxyUpdateSchedule(editGame!.id) : routes.api.proxyCreateSchedule,
        method: isEdit ? "PATCH" : "POST",
        data: fd as unknown as Record<string, unknown>,
        headers: { "Content-Type": "multipart/form-data" },
      });
    } else {
      result = await apiCall<ScheduleItemResponse>({
        endpoint: isEdit ? routes.api.proxyUpdateSchedule(editGame!.id) : routes.api.proxyCreateSchedule,
        method: isEdit ? "PATCH" : "POST",
        data: body,
        showSuccessToast: true,
        successMessage: isEdit ? "Game updated" : "Game created",
      });
    }

    setLoading(false);
    if (result.success) {
      handleClose();
      onSaved();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit Game" : "Add Game"}
      className="w-full max-w-[540px] max-h-[90vh] overflow-y-auto"
    >
      <div className="w-full flex flex-col gap-4">
        <Input
          label="Title *"
          name="title"
          value={form.title}
          onChange={set("title")}
          placeholder="vs Lincoln High"
          error={errors.title}
        />
        <Input
          label="Opponent"
          name="opponent"
          value={form.opponent}
          onChange={set("opponent")}
          placeholder="Lincoln High"
        />
        <Input
          label="Location"
          name="location"
          value={form.location}
          onChange={set("location")}
          placeholder="Home Gym"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start *"
            name="start"
            type="datetime-local"
            value={form.start}
            onChange={set("start")}
            error={errors.start}
          />
          <Input
            label="End"
            name="end"
            type="datetime-local"
            value={form.end}
            onChange={set("end")}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Home / Away"
            name="homeAway"
            value={form.homeAway}
            onChange={set("homeAway")}
            placeholder="Select..."
            options={[
              { label: "Home", value: "home" },
              { label: "Away", value: "away" },
              { label: "Neutral", value: "neutral" },
            ]}
          />
          <Select
            label="Status"
            name="status"
            value={form.status}
            onChange={set("status")}
            options={[
              { label: "Confirmed", value: "confirmed" },
              { label: "Tentative", value: "tentative" },
              { label: "Cancelled", value: "cancelled" },
            ]}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Gender"
            name="gender"
            value={form.gender}
            onChange={set("gender")}
            placeholder="Select..."
            options={GENDER_OPTIONS}
          />
          <Select
            label="Sports"
            name="sports"
            value={form.sports}
            onChange={set("sports")}
            placeholder="Select..."
            options={SPORTS_OPTIONS}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Season"
            name="season"
            value={form.season}
            onChange={set("season")}
            placeholder="Select..."
            options={SEASON_OPTIONS}
          />
          <Select
            label="Level"
            name="level"
            value={form.level}
            onChange={set("level")}
            placeholder="Select..."
            options={LEVEL_OPTIONS}
          />
        </div>

        {/* All day toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={form.isAllDay}
              onChange={(e) => setForm((prev) => ({ ...prev, isAllDay: e.target.checked }))}
            />
            <div className={`w-10 h-6 rounded-full transition-colors ${form.isAllDay ? "bg-steel-blue" : "bg-midnight-navy/20"}`} />
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isAllDay ? "translate-x-5" : "translate-x-1"}`} />
          </div>
          <span className="text-midnight-navy text-sm font-medium">All-day event</span>
        </label>

        {/* Opponent logo upload */}
        <div className="flex flex-col gap-2">
          <span className="text-base font-medium text-midnight-navy">Opponent Logo</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg"
            className="hidden"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex items-center gap-3">
            {previewUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative shrink-0 group"
                title="Click to change logo"
              >
                <img
                  src={previewUrl}
                  alt="Opponent logo"
                  className="size-16 rounded-full object-cover border border-[rgba(11,28,45,0.12)]"
                />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium">
                  Change
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="size-16 shrink-0 rounded-full bg-[#F5F6F8] border border-[rgba(11,28,45,0.12)] flex items-center justify-center text-midnight-navy/30 hover:bg-[#ECEEF1] transition-colors"
                title="Upload logo"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </button>
            )}
            <label
              className="flex-1 flex items-center gap-3 cursor-pointer h-12 px-4 rounded-[8px] bg-[#F5F6F8] border border-[rgba(11,28,45,0.12)] text-midnight-navy/50 text-sm hover:bg-[#ECEEF1] transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {logoFile ? logoFile.name : previewUrl ? "Click to change logo (PNG, JPG — max 25 MB)" : "Choose file (PNG, JPG — max 25 MB)"}
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button label="Cancel" variant="secondary" onClick={handleClose} fullWidth />
          <Button
            label={loading ? "Saving…" : isEdit ? "Save Changes" : "Add Game"}
            variant="cta"
            onClick={handleSubmit}
            disabled={loading}
            fullWidth
          />
        </div>
      </div>
    </Modal>
  );
}
