"use client";

import Button from "@/components/common/Button";
import CheckCircle from "@/components/common/CheckCircle";
import Modal from "@/components/common/Modal";
import SchedulePreviewModal, {
  type ScrapedSchool,
} from "@/components/common/SchedulePreviewModal";
import SectionCard from "@/components/common/SectionCard";
import StepIndicator from "@/components/common/StepIndicator";
import Toggle from "@/components/common/Toggle";
import WizardFooter from "@/components/common/WizardFooter";
import { cn } from "@/utils/cn";
import { getSavedSchool } from "@/utils/fanhub/getSavedSchool";
import { routes } from "@/utils/routes";
import {
  Calendar,
  CalendarDays,
  CheckCircle as CheckCircleIcon,
  ChevronDown,
  Circle,
  CloudUpload,
  Database,
  Download,
  Eye,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Loader2,
  MapPin,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const ACCEPTED_UPLOAD_EXTENSIONS = ["pdf", "jpg", "jpeg", "png"] as const;

type PlatformLogo = { type: "image"; src: string } | { type: "color"; bg: string };

const PLATFORMS: {
  id: string;
  name: string;
  logo: PlatformLogo;
}[] = [
  {
    id: "exposure",
    name: "Exposure Events",
    logo: { type: "image", src: "/images/platforms/platform-exposure.png" },
  },
  {
    id: "teamsnap",
    name: "Team Snap",
    logo: { type: "image", src: "/images/platforms/platform-teamsnap-v2.png" },
  },
  {
    id: "sportsengine",
    name: "Sports Engine",
    logo: { type: "image", src: "/images/platforms/platform-sportsengine.png" },
  },
  {
    id: "leagueapps",
    name: "LeagueApps",
    logo: { type: "image", src: "/images/platforms/platform-leagueapps.png" },
  },
];

// ICS calendar sources — pre-filled to match the Figma reference (editable).
const ICS_SOURCES: { id: string; logo: PlatformLogo }[] = [
  { id: "gamechanger", logo: { type: "image", src: "/images/platforms/platform-gamechanger.svg" } },
  { id: "teamsnap", logo: { type: "image", src: "/images/platforms/platform-teamsnap-v2.png" } },
  { id: "sportsengine", logo: { type: "image", src: "/images/platforms/platform-sportsengine.png" } },
  { id: "leagueapps", logo: { type: "image", src: "/images/platforms/platform-leagueapps.png" } },
];

const ICS_DEFAULTS = [
  "https://gamechanger.com/team/tlam/feed.ics",
  "https://teamsnap.com/team/tlam/feed.ics",
  "https://sportsengine.com/team/tlam/feed.ics",
  "",
];

// Wired ICS platforms. Add a row here to enable preview→import for that source.
// `keyword` drives the green-check validation; `platform` is the import label.
const ICS_WIRED: {
  sourceId: string;
  keyword: string;
  platform: string;
  previewProxy: string;
  requiresTeamNameMatch?: boolean;
}[] = [
  { sourceId: "sportsengine", keyword: "sportngin", platform: "SportsEngine", previewProxy: routes.api.proxyIcsSportsEngine },
  { sourceId: "teamsnap", keyword: "teamsnap", platform: "TeamSnap", previewProxy: routes.api.proxyIcsTeamSnap, requiresTeamNameMatch: true },
];

const SUMMARY_STATS = [
  { label: "Data Quality Score", value: "98% Excelent", icon: Database, progress: 98 },
  {
    label: "Schedule Source",
    value: "SportsEngine",
    image: "/images/platforms/summary-schedule-source.png",
    tileBg: "#231F20",
  },
  { label: "Sport Detected", value: "Basketball", iconImg: "/icons/icon-dribbble.svg" },
  { label: "Season Detected", value: "2026-2027", icon: Calendar },
  { label: "Total Games", value: "32 Games", icon: ListChecks },
  { label: "Date Range", value: "Nov 15, 2026 - Mar 15, 2027", icon: CalendarDays },
  { label: "Locations", value: "3 (Home, Away, Neutral)", icon: MapPin },
  { label: "Sync Type", value: "One-way Sync", icon: RefreshCw },
] as const;

type ConnectionStatus = "connected" | "not-connected";

// True if any event title in the preview response has a side (split on "vs")
// that exactly matches the team name (case-insensitive, trimmed). TeamSnap-only gate.
function teamNameMatchesPreview(previewJson: unknown, teamName: string): boolean {
  const target = teamName.trim().toLowerCase();
  if (!target) return false;
  const groups = (previewJson as { data?: { events?: { title?: string }[] }[] })?.data ?? [];
  for (const g of groups) {
    for (const ev of g.events ?? []) {
      const sides = (ev.title ?? "").split(/\s+vs\.?\s+/i);
      if (sides.some((s) => s.trim().toLowerCase() === target)) return true;
    }
  }
  return false;
}

// Build the Import Summary cards from a scraped school. Each item uses the `{ label,
// value, icon }` variant of the SUMMARY_STATS union, so the existing summary `.map`
// renders real data after an upload with no extra branching.
type SummaryStat = { label: string; value: string; icon: typeof Database };

function summaryFromSchool(school: ScrapedSchool): SummaryStat[] {
  const times = school.scheduleEvents
    .map((e) => new Date(e.start).getTime())
    .filter((t) => !Number.isNaN(t));
  const fmt = (t: number) =>
    new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const dateRange =
    times.length > 0 ? `${fmt(Math.min(...times))} - ${fmt(Math.max(...times))}` : "—";

  return [
    { label: "Schedule Source", value: "MaxPreps", icon: Database },
    { label: "Sport Detected", value: school.sportsType || "—", icon: ListChecks },
    { label: "Season Detected", value: school.season || "—", icon: Calendar },
    { label: "Total Games", value: `${school.scheduleEvents.length} Games`, icon: ListChecks },
    { label: "Date Range", value: dateRange, icon: CalendarDays },
    { label: "Overall Record", value: school.overallRecord || "—", icon: RefreshCw },
  ];
}

/** 48×48 / 64×64 logo circle used in the ICS rows and API cards. */
function PlatformBadge({ logo, size }: { logo: PlatformLogo; size: 48 | 64 }) {
  const dim = size === 48 ? "w-12 h-12" : "w-16 h-16";
  if (logo.type === "image") {
    return (
      <span className={`${dim} shrink-0 rounded-full border border-[rgba(255,255,255,0.5)] overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo.src} alt="" className="w-full h-full object-cover" />
      </span>
    );
  }
  return (
    <span
      className={`${dim} shrink-0 rounded-full border border-[rgba(255,255,255,0.5)]`}
      style={{ background: logo.bg }}
    />
  );
}

export default function ImportSchedulePage() {
  const router = useRouter();
  const [icsUrls, setIcsUrls] = useState<string[]>(ICS_DEFAULTS);
  const [autoSync, setAutoSync] = useState(true);
  const [connections, setConnections] = useState<Record<string, ConnectionStatus>>({
    exposure: "not-connected",
    teamsnap: "connected",
    sportsengine: "not-connected",
    leagueapps: "not-connected",
  });
  const [showModal, setShowModal] = useState(false);
  const [activePlatform, setActivePlatform] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [infoOpen, setInfoOpen] = useState(true);
  const [icsConnecting, setIcsConnecting] = useState(false);

  // Section A — MaxPreps file upload (pdf/jpg/png).
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scrapeDragging, setScrapeDragging] = useState(false);
  const [scrapeFileName, setScrapeFileName] = useState<string | null>(null);
  const [scraping, setScraping] = useState(false);
  const [scrapedSchool, setScrapedSchool] = useState<ScrapedSchool | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const setIcsUrl = (i: number, val: string) => {
    setIcsUrls((prev) => prev.map((u, idx) => (idx === i ? val : u)));
  };

  // On mount, if the saved school already has imported games, show them in the Import
  // Summary + Preview so navigating Back to this step reflects the previously-saved
  // schedule. SavedSchool is a structural superset of ScrapedSchool.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const school = await getSavedSchool();
      if (cancelled || !school || school.scheduleEvents.length === 0) return;
      // Map SavedSchool → ScrapedSchool (the Import Summary/Preview shape). `name` is
      // non-null in ScrapedSchool, so fall back to "" if the saved school lacks one.
      setScrapedSchool({
        id: school.id,
        name: school.name ?? "",
        teamName: school.teamName,
        mascot: school.mascot,
        sportsType: school.sportsType,
        season: school.season,
        overallRecord: school.overallRecord,
        logoUrl: school.logoUrl,
        scheduleEvents: school.scheduleEvents,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Section A — upload a schedule image/PDF to the MaxPreps scrape endpoint, which
  // parses it and attaches the games to the school. Mirrors handleIcsConnect: read the
  // schoolId from sessionStorage (set in Step 1), POST to the internal proxy (which
  // injects x-fanhub-key), and surface the result via toast + preview.
  const handleScrapeUpload = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED_UPLOAD_EXTENSIONS.includes(ext as (typeof ACCEPTED_UPLOAD_EXTENSIONS)[number])) {
      toast.error("Upload a PDF, JPG, or PNG file.");
      return;
    }

    const schoolId = sessionStorage.getItem("fanhub:schoolId");
    if (!schoolId) {
      toast.error("No school found. Please complete Step 1 first.");
      return;
    }

    setScrapeFileName(file.name);
    setScraping(true);
    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch(
        `${routes.api.proxyScrapeMaxpreps}?schoolId=${encodeURIComponent(schoolId)}`,
        { method: "POST", body }
      );
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.message || "Couldn't read that schedule. Please try again.");
        return;
      }

      const school = (json?.data?.[0]?.school ?? null) as ScrapedSchool | null;
      if (!school) {
        toast.error("No schedule could be extracted from that file.");
        return;
      }

      setScrapedSchool(school);
      toast.success(json?.message || "Schedule imported.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setScraping(false);
    }
  };

  const handleScrapeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setScrapeDragging(false);
    if (scraping) return;
    const file = e.dataTransfer.files[0];
    if (file) handleScrapeUpload(file);
  };

  // Per-row validation. A wired source (SportsEngine, TeamSnap) only needs to contain its
  // keyword — e.g. webcal://...sportngin.com/... has no .ics suffix but is still valid.
  // Unwired rows keep the generic .ics check until they're wired.
  const isValidIcsFor = (sourceId: string, url: string) => {
    const wired = ICS_WIRED.find((w) => w.sourceId === sourceId);
    return wired
      ? url.toLowerCase().includes(wired.keyword)
      : url.startsWith("https://") && url.endsWith(".ics");
  };

  // ICS card "Connect". Loops over the wired platforms: for each filled, valid row, preview
  // the feed upstream and on success import it into the school. Empty rows are skipped.
  const handleIcsConnect = async () => {
    // Map each wired platform to its current input URL (by row index in ICS_SOURCES).
    const candidates = ICS_WIRED.map((w) => ({
      ...w,
      url: (icsUrls[ICS_SOURCES.findIndex((s) => s.id === w.sourceId)] ?? "").trim(),
    })).filter((w) => w.url.length > 0); // skip empty rows silently

    if (candidates.length === 0) {
      toast.error("Enter a calendar URL to connect.");
      return;
    }

    const invalid = candidates.find((c) => !isValidIcsFor(c.sourceId, c.url));
    if (invalid) {
      toast.error(`Enter a valid ${invalid.platform} calendar URL.`);
      return;
    }

    const schoolId = sessionStorage.getItem("fanhub:schoolId");
    if (!schoolId) {
      toast.error("No school found. Please complete Step 1 first.");
      return;
    }

    setIcsConnecting(true);
    try {
      const imported: string[] = [];
      for (const c of candidates) {
        // 1) Preview — validate the feed upstream.
        const previewRes = await fetch(c.previewProxy, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: c.url }),
        });
        const previewJson = await previewRes.json().catch(() => null);
        if (!previewRes.ok) {
          toast.error(previewJson?.message || `Could not read that ${c.platform} calendar.`);
          return;
        }

        // TeamSnap-only gate: import only if an event title matches the user's team name.
        if (c.requiresTeamNameMatch) {
          const teamName = sessionStorage.getItem("fanhub:teamName") ?? "";
          if (!teamNameMatchesPreview(previewJson, teamName)) {
            toast.error(`No ${c.platform} games match your team "${teamName || "—"}". Skipped.`);
            continue; // skip ONLY this row; other rows keep processing
          }
        }

        // 2) Import into the school.
        const importRes = await fetch(routes.api.proxyImportIcs, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schoolId, url: c.url, platform: c.platform }),
        });
        if (!importRes.ok) {
          const j = await importRes.json().catch(() => null);
          toast.error(j?.message || `Failed to import the ${c.platform} schedule.`);
          return;
        }
        imported.push(c.platform);
      }

      if (imported.length > 0) {
        toast.success(`${imported.join(" & ")} schedule imported.`);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIcsConnecting(false);
    }
  };

  const openConnect = (platformId: string) => {
    setActivePlatform(platformId);
    setApiKey("");
    setShowModal(true);
  };

  const handleConnect = () => {
    if (activePlatform) {
      setConnections((prev) => ({ ...prev, [activePlatform]: "connected" }));
    }
    setShowModal(false);
  };

  const handleDisconnect = (platformId: string) => {
    setConnections((prev) => ({ ...prev, [platformId]: "not-connected" }));
  };

  const activePlatformName = PLATFORMS.find((p) => p.id === activePlatform)?.name ?? "Platform";

  return (
    <div className="flex flex-col gap-6 pb-24">
      <StepIndicator currentStep={2} />

      <div className="flex flex-col gap-2 -mt-2">
        <h2 className="font-display font-black text-[56px] uppercase text-white leading-none">
          Import Schedule
        </h2>
        <p className="text-base text-white/80">
          Bring in your games and events to power your Fan Hub.
        </p>
      </div>

      <div className="flex gap-10 items-start">
        {/* LEFT COLUMN */}
        <div className="w-[639px] shrink-0 flex flex-col gap-10">
          {/* A — Schedule file upload (pdf/jpg/png) → MaxPreps scrape */}
          <SectionCard
            badge="A"
            title="Upload your (pdf, jpg, png) file"
            description="Best for schools, leagues, and tournaments with exported schedules."
          >
            <div
              role="button"
              tabIndex={0}
              aria-disabled={scraping}
              onDragOver={(e) => {
                e.preventDefault();
                if (!scraping) setScrapeDragging(true);
              }}
              onDragLeave={() => setScrapeDragging(false)}
              onDrop={handleScrapeDrop}
              onClick={() => !scraping && fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && !scraping && fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-[8px] border-2 border-dashed border-border-dashed px-4 py-6 transition-colors",
                scraping
                  ? "cursor-wait opacity-80"
                  : "cursor-pointer hover:border-[rgba(255,255,255,0.5)]",
                scrapeDragging && "border-white bg-[rgba(255,255,255,0.04)]"
              )}
              style={{ boxShadow: "inset 0px 1px 0px 0px rgba(255,255,255,0.16)", backdropFilter: "blur(64px)" }}
            >
              {scraping ? (
                <>
                  <Loader2 className="w-6 h-6 text-white animate-spin" strokeWidth={1.5} />
                  <p className="text-base font-medium text-white text-center">
                    Reading your schedule…
                  </p>
                  {scrapeFileName && (
                    <p className="text-sm text-white/40 text-center truncate max-w-full">
                      {scrapeFileName}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <CloudUpload className="w-6 h-6 text-white" strokeWidth={1.5} />
                  <p className="text-base font-medium text-white text-center">
                    {scrapeFileName ?? "Drag & Drop your file here."}
                  </p>
                  <p className="text-sm text-white/40 text-center">or</p>
                  <Button variant="ghost" label="Choose File" onClick={() => fileInputRef.current?.click()} className="w-[120px] h-8 px-3" />
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleScrapeUpload(file);
                e.target.value = "";
              }}
            />
            <div className="flex items-center gap-6">
              <button
                type="button"
                className="flex items-center gap-2 text-base font-semibold text-white/80 hover:text-white transition-colors"
              >
                <Download className="w-6 h-6" strokeWidth={1.5} />
                Download CSV Template
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                disabled={!scrapedSchool}
                className="flex items-center gap-2 text-base font-semibold text-white/80 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-white/80"
              >
                <Eye className="w-6 h-6" strokeWidth={1.5} />
                Preview Data
              </button>
            </div>
          </SectionCard>

          {/* B — ICS Sync */}
          <SectionCard
            badge="B"
            title="Sync from calendar link (.ics)"
            description="Paste a public .ics calendar URL and we'll automatically import and update games."
          >
            <p className="text-sm text-white/40 -mt-2">
              Examples: Game Changer (.ics), Team Snap (.ics), Sports Engine (.ics), League Apps (.ics)
            </p>
            <div className="flex flex-col gap-3">
              {ICS_SOURCES.map((source, i) => {
                const url = icsUrls[i];
                const valid = isValidIcsFor(source.id, url);
                const hasValue = url.length > 0;
                return (
                  <div key={source.id} className="flex items-center gap-6">
                    <PlatformBadge logo={source.logo} size={48} />
                    <div className="relative flex items-center flex-1 min-w-0">
                      <input
                        value={url}
                        onChange={(e) => setIcsUrl(i, e.target.value)}
                        placeholder="https://"
                        style={{
                          boxShadow: "inset 0px 1px 0px 0px rgba(255,255,255,0.16)",
                          backdropFilter: "blur(64px)",
                        }}
                        className={[
                          "w-full h-12 rounded-[8px] bg-white text-midnight-navy text-base font-medium px-4 py-3 pr-10",
                          "border-2 outline-none transition-colors placeholder:text-[rgba(11,28,45,0.4)]",
                          hasValue && valid
                            ? "border-success-bright"
                            : hasValue && !valid
                              ? "border-error"
                              : "border-border-input",
                        ].join(" ")}
                      />
                      {hasValue && (
                        <span className="absolute right-3">
                          {valid ? (
                            <CheckCircleIcon className="w-5 h-5 text-success-bright" />
                          ) : (
                            <XCircle className="w-5 h-5 text-error" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                label={icsConnecting ? "Connecting…" : "Connect"}
                onClick={handleIcsConnect}
                disabled={icsConnecting}
              />
              <div className="flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-white" strokeWidth={1.5} />
                <Toggle label="Auto Sync" checked={autoSync} onChange={setAutoSync} labelPosition="right" />
              </div>
            </div>
          </SectionCard>

          {/* C — API Connections */}
          <SectionCard
            badge="C"
            title="Sync via API Connection"
            description="Connect your account and import teams and schedule."
          >
            <div className="grid grid-cols-2 gap-6">
              {PLATFORMS.map((p) => {
                const isConnected = connections[p.id] === "connected";
                return (
                  <div
                    key={p.id}
                    className="flex flex-col gap-4 p-4 rounded-[8px]"
                    style={{ background: isConnected ? "rgba(101,193,98,0.05)" : "rgba(255,255,255,0.05)" }}
                  >
                    <div className="flex items-center gap-4">
                      <PlatformBadge logo={p.logo} size={64} />
                      <div className="flex flex-col gap-2.5 min-w-0">
                        <p className="text-base font-semibold text-white truncate">{p.name}</p>
                        <div className="flex items-center gap-2">
                          {isConnected ? (
                            <CheckCircle size={24} />
                          ) : (
                            <Circle className="w-6 h-6 text-white shrink-0" strokeWidth={1.5} />
                          )}
                          <span className={`text-base ${isConnected ? "text-success" : "text-white"}`}>
                            {isConnected ? "Connected" : "Not Connected"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isConnected ? (
                      <Button variant="danger" label="Delete" onClick={() => handleDisconnect(p.id)} fullWidth />
                    ) : (
                      <Button variant="ghost" label="Connect" onClick={() => openConnect(p.id)} fullWidth />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="h-[2px] bg-border-subtle" />
            <div className="flex items-center justify-between">
              <p className="text-base text-white">Connect a different platform not listed above.</p>
              <Button variant="ghost" label="Connect" onClick={() => openConnect("")} className="w-[232px]" />
            </div>
          </SectionCard>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 min-w-0 flex flex-col gap-10">
          {/* Import Summary */}
          <div
            className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px]"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <div className="flex flex-col gap-2">
              <h3 className="font-display font-black text-[28px] uppercase text-white leading-tight">
                Import Summary
              </h3>
              <p className="text-base text-white/80">Here&apos;s what we found from your schedule.</p>
            </div>
            <div className="flex flex-col gap-6">
              {(scrapedSchool ? summaryFromSchool(scrapedSchool) : SUMMARY_STATS).map((stat) => {
                const Icon = "icon" in stat ? stat.icon : null;
                return (
                  <div
                    key={stat.label}
                    className="flex items-center gap-4 p-4 rounded-[8px] backdrop-blur-[48px]"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    <span
                      className="w-16 h-16 shrink-0 rounded-full flex items-center justify-center overflow-hidden border border-[rgba(255,255,255,0.5)]"
                      style={{ background: "tileBg" in stat ? stat.tileBg : "rgba(0,0,0,0.4)" }}
                    >
                      {"image" in stat ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={stat.image} alt="" className="w-full h-full object-cover" />
                      ) : "iconImg" in stat ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={stat.iconImg} alt="" className="w-6 h-6" />
                      ) : Icon ? (
                        <Icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                      ) : null}
                    </span>
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <p className="text-sm text-white/40">{stat.label}</p>
                      <p className="text-base font-semibold text-white">{stat.value}</p>
                      {"progress" in stat && (
                        <div className="h-2 w-full rounded-full bg-border-subtle overflow-hidden">
                          <div
                            className="h-full rounded-full bg-success"
                            style={{ width: `${stat.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Information */}
          <div
            className="rounded-[8px] p-6 flex flex-col gap-6 backdrop-blur-[48px]"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <button
              type="button"
              onClick={() => setInfoOpen((o) => !o)}
              className="flex items-center justify-between"
            >
              <h3 className="font-display font-black text-[28px] uppercase text-white leading-tight">
                Information
              </h3>
              <ChevronDown
                className={`w-6 h-6 text-white transition-transform ${infoOpen ? "rotate-180" : ""}`}
              />
            </button>
            {infoOpen && (
              <div className="flex items-start gap-2">
                <Lightbulb className="w-6 h-6 text-white shrink-0" strokeWidth={1.5} />
                <div className="flex flex-col gap-2">
                  <p className="text-2xl font-bold text-white leading-none">Tip</p>
                  <p className="text-base text-white">
                    You can update or re-sync your schedule at any time from the Schedule page.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connect Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Connect ${activePlatformName} API`}>
        <div className="w-full flex flex-col gap-2">
          <label htmlFor="apiKey" className="text-base font-medium text-midnight-navy">
            API Key
          </label>
          <input
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="API Key"
            style={{ boxShadow: "inset 0px 1px 0px 0px rgba(255,255,255,0.16)", backdropFilter: "blur(64px)" }}
            className="w-full h-12 rounded-[8px] bg-white text-midnight-navy text-base font-medium px-4 py-3 border-2 border-border-input outline-none focus:border-steel-blue transition-colors placeholder:text-[rgba(11,28,45,0.4)]"
          />
        </div>
        <div className="w-full flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="flex-1 h-12 rounded-[8px] bg-[rgba(235,235,235,0.8)] text-midnight-navy text-base font-medium transition-opacity hover:opacity-90"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConnect}
            style={{ background: "var(--gradient-cta)" }}
            className="flex-1 h-12 rounded-[8px] text-white text-base font-medium transition-opacity hover:opacity-90"
          >
            Connect
          </button>
        </div>
      </Modal>

      {/* Preview Data — scraped schedule */}
      <SchedulePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        school={scrapedSchool}
      />

      <WizardFooter
        onBack={() => router.push(routes.ui.setupWizard.organizationDetails)}
        onSaveExit={() => {}}
        primaryLabel="Next"
        onPrimary={() => router.push(routes.ui.setupWizard.chooseActivations)}
      />
    </div>
  );
}
