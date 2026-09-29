"use client";

import { useState } from "react";
import { Info, Link2, Play, RefreshCw, Ticket } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import ConnectionStatus, { type ConnectionState } from "@/components/external-links/ConnectionStatus";
import { THEME, type ExternalLinkConfig } from "@/components/external-links/data";
import { useSetup } from "@/context/setup";
import { cn } from "@/utils/cn";
import { routes } from "@/utils/routes";

interface ExternalLinkCardProps {
  config: ExternalLinkConfig;
}

// One provider section (Ticketing / Streaming): header strip, logo, link field,
// Test Connection, result box and Save.
export default function ExternalLinkCard({ config }: ExternalLinkCardProps) {
  const { savedSchool, refreshSchool } = useSetup();
  const theme = THEME[config.theme];
  const Icon = config.id === "ticketing" ? Ticket : Play;

  const savedUrl = (savedSchool?.[config.savedField] as string | null | undefined) ?? "";
  const [url, setUrl] = useState(savedUrl);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState<ConnectionState>({ kind: "idle" });
  const [saving, setSaving] = useState(false);

  // Prefill once the saved school arrives (React's "adjust state on prop change" pattern).
  const [syncedUrl, setSyncedUrl] = useState(savedUrl);
  if (savedUrl !== syncedUrl) {
    setSyncedUrl(savedUrl);
    if (!url) setUrl(savedUrl);
  }

  const validate = (): string | null => {
    const value = url.trim();
    if (!value) return `${config.label} is required.`;
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "https:") return "Link must start with https://";
    } catch {
      return "Enter a valid URL, e.g. " + config.placeholder;
    }
    return null;
  };

  const testConnection = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setConnection({ kind: "checking" });
    try {
      const res = await fetch(routes.api.proxyCheckExternalLink, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; status?: number; message?: string };
      setConnection(
        json.ok
          ? { kind: "success", checkedAt: new Date() }
          : {
              kind: "error",
              checkedAt: new Date(),
              message:
                json.message ??
                `Your ${config.providerName} link returned an error${json.status ? ` (${json.status})` : ""}.`,
            }
      );
    } catch {
      setConnection({ kind: "error", checkedAt: new Date(), message: "Couldn't test the link. Please try again." });
    }
  };

  const save = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    const schoolId = sessionStorage.getItem("fanhub:schoolId");
    if (!schoolId) {
      toast.error("No school found. Please sign in again.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(routes.api.proxyFeatureLinks, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, [config.payloadKey]: url.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.message || `Couldn't save your ${config.title.toLowerCase()} link.`);
        return;
      }
      toast.success(`${config.title} link saved.`);
      await refreshSchool();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={cn("rounded-xl border p-3 lg:p-4 flex flex-col gap-6 backdrop-blur-[48px]", theme.card)}>
      {/* Header strip */}
      <div className={cn("rounded-[8px] p-3 lg:p-4 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6", theme.strip)}>
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <span className={cn("size-[90px] shrink-0 rounded-full flex items-center justify-center", theme.badge)}>
            <Icon
              className={cn("size-11 text-white", config.id === "ticketing" ? "-rotate-45" : "fill-white ml-1")}
              strokeWidth={2}
            />
          </span>
          <div className="flex flex-col gap-2 min-w-0">
            <h2 className="font-display font-black text-[28px] lg:text-[36px] text-white leading-none">{config.title}</h2>
            <p className="text-base lg:text-lg text-white/85">{config.description}</p>
          </div>
        </div>
        <div className={cn("lg:w-[370px] shrink-0 rounded-[8px] border px-4 py-4 flex items-center gap-4", theme.infoBox)}>
          <Info className={cn("size-8 shrink-0", theme.infoIcon)} strokeWidth={1.75} />
          <p className="text-base text-white/80 leading-relaxed">{config.info}</p>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[226px_minmax(0,1fr)_253px] gap-x-6 gap-y-4 px-1 lg:px-3 pb-2">
        <div className="lg:row-span-2 self-start h-[120px] rounded-[8px] border border-white/15 bg-black/60 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={config.logo} alt={config.logoAlt} className="max-h-[92px] max-w-[190px] object-contain" />
        </div>

        <Input
          variant="dark"
          label={config.label}
          name={config.id}
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError("");
            if (connection.kind !== "idle") setConnection({ kind: "idle" });
          }}
          placeholder={config.placeholder}
          icon={<Link2 className="size-6 -rotate-45" strokeWidth={1.75} />}
          error={error}
          hint={config.hint}
          labelClassName="text-lg font-medium text-white"
        />

        <Button
          variant="outline"
          label="Test Connection"
          icon={<RefreshCw className="size-5" strokeWidth={2} />}
          onClick={testConnection}
          disabled={connection.kind === "checking"}
          className="lg:mt-[36px] h-[52px] w-full"
        />

        <ConnectionStatus state={connection} providerName={config.providerName} className="lg:col-start-2" />

        <Button
          variant="cta"
          label={saving ? "Saving…" : config.saveLabel}
          onClick={save}
          disabled={saving}
          className="lg:col-start-3 h-[60px] w-full text-lg"
        />
      </div>
    </section>
  );
}
