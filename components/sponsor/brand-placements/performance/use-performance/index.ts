"use client";

import { useState } from "react";
import { TEMPLATES, type TemplateId } from "@/components/sponsor/brand-placements/purchased-inventory/data";
import {
  DEFAULT_SEED,
  RANGE_OPTIONS,
  RANGE_SCALE,
  SAMPLE_INVENTORY,
  SAMPLE_ORGS,
  SAMPLE_TODAY,
  SEASON_START,
  SLOT_SEEDS,
  historyOf,
  slotKey,
  type PerformanceRange,
  type SampleInventory,
  type SampleOrg,
} from "@/components/sponsor/brand-placements/data";

// Performance of the sample slots: every number comes from the mock seeds and setup history. A slot whose
// setup changed keeps each setup's results apart ("periods"), so rates never mix two setups.

const toDate = (iso: string) => new Date(`${iso}T00:00:00`);
// Calendar days, so a daylight-saving change never shifts a date.
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
// Days from `from` to `to`, both included.
const daysBetween = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
const formatDay = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const sum = <T>(items: T[], value: (item: T) => number) => items.reduce((total, item) => total + value(item), 0);

export const formatCount = (n: number) => Math.round(n).toLocaleString("en-US");
const percent = (n: number) => `${(n * 100).toFixed(1)}%`;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const TODAY = toDate(SAMPLE_TODAY);
const SEASON = toDate(SEASON_START);

export const TEMPLATE_NAME = Object.fromEntries(TEMPLATES.map((t) => [t.id, t.name])) as Record<TemplateId, string>;

type ActionTemplate = Exclude<TemplateId, "SIMPLE_BPA">;
const ACTION_TEMPLATES: ActionTemplate[] = ["VISIT_WEBSITE", "SURVEY", "OFFER_PROMO_CODE"];
const RESULT_WORD: Record<ActionTemplate, string> = {
  VISIT_WEBSITE: "website visits",
  SURVEY: "surveys completed",
  OFFER_PROMO_CODE: "offers redeemed",
};

interface Metrics {
  fans: number;
  // What the setup measures: views for Simple BPA, fans who acted otherwise.
  result: number;
  rateValue: number;
  rate: string;
  rateName: string;
  resultName: string;
}

// One setup's run on a slot.
export interface Period extends Metrics {
  template: TemplateId;
  // The setup running now.
  current: boolean;
  // "Aug 15".
  since: string;
  // "Aug 15 – Oct 12", or "Oct 13 – today".
  label: string;
}

// A slot's metrics with one template; `factor` scales the 30-day fans to the days counted.
function metricsOf(key: string, template: TemplateId, factor: number): Metrics {
  const seed = SLOT_SEEDS[key] ?? DEFAULT_SEED;
  const fans = seed.fans * factor;
  const action = (rateValue: number, rateName: string, resultName: string): Metrics => ({
    fans,
    result: fans * rateValue,
    rateValue,
    rate: percent(rateValue),
    rateName,
    resultName,
  });
  switch (template) {
    case "VISIT_WEBSITE":
      return action(seed.clickRate, "Click-through rate", "Visited your website");
    case "SURVEY":
      return action(seed.surveyRate, "Completion rate", "Completed the survey");
    case "OFFER_PROMO_CODE":
      return action(seed.offerRate, "Redemption rate", "Redeemed the offer");
    default:
      return {
        fans,
        result: fans * seed.viewsPerFan,
        rateValue: Math.min(1, seed.viewsPerFan / 5),
        rate: `${seed.viewsPerFan.toFixed(1)} views per fan`,
        rateName: "Views per fan",
        resultName: "Total views",
      };
  }
}

// The slot's setups that ran from `windowStart` to today; `factorFor(days)` scales each one's fans.
function periodsOf(key: string, windowStart: Date, factorFor: (days: number) => number): Period[] {
  const history = historyOf(key);
  const periods: Period[] = [];
  history.forEach((p, i) => {
    const from = toDate(p.from);
    const last = i === history.length - 1;
    const to = last ? TODAY : addDays(toDate(history[i + 1].from), -1);
    const start = from > windowStart ? from : windowStart;
    if (to < start) return;
    periods.push({
      template: p.template,
      current: last,
      ...metricsOf(key, p.template, factorFor(daysBetween(start, to))),
      since: formatDay(from),
      label: `${formatDay(from)} – ${last ? "today" : formatDay(to)}`,
    });
  });
  return periods;
}

export const lineFor = (p: Period) =>
  p.template === "SIMPLE_BPA"
    ? `${formatCount(p.fans)} fans saw your logo`
    : `${formatCount(p.fans)} fans saw it · ${formatCount(p.result)} ${RESULT_WORD[p.template]} (${p.rate})`;

// A slot in the range: its setups in order, the one now, and fans across all of them.
interface SlotRow {
  key: string;
  inventory: SampleInventory;
  org: SampleOrg;
  periods: Period[];
  current: Period;
  fans: number;
}

export interface MetricCell {
  label: string;
  value: string;
  how: string;
}

// The setup now: fans, and for an action setup the fans who acted and the rate.
function cellsFor(p: Period, howFans: string, howResult: string): MetricCell[] {
  const cells = [{ label: p.template === "SIMPLE_BPA" ? "Fans who saw your logo" : "Fans who saw it", value: formatCount(p.fans), how: howFans }];
  if (p.template !== "SIMPLE_BPA") {
    cells.push({ label: p.resultName, value: formatCount(p.result), how: howResult });
    cells.push({ label: p.rateName, value: p.rate, how: `${formatCount(p.result)} out of ${formatCount(p.fans)} fans` });
  }
  return cells;
}

function tipFor(p: Period) {
  const per100 = Math.max(1, Math.round(p.rateValue * 100));
  switch (p.template) {
    case "SIMPLE_BPA":
      return "Simple BPA is for being seen. To get fans to act, try Visit website, Survey or Offer on this slot.";
    case "VISIT_WEBSITE":
      return `About ${per100} in every 100 fans who saw this went to your website.`;
    case "SURVEY":
      return `About ${per100} in every 100 fans who saw this answered your survey.`;
    default:
      return `About ${Math.max(1, Math.round(p.rateValue * 1000))} in every 1,000 fans who saw this used your code.`;
  }
}

export interface Bar {
  label: string;
  value: string;
  percent: number;
}

const toBars = (items: { label: string; fans: number }[]): Bar[] => {
  const max = Math.max(...items.map((i) => i.fans)) || 1;
  return [...items]
    .sort((a, b) => b.fans - a.fans)
    .map((i) => ({ label: i.label, value: `${formatCount(i.fans)} fans`, percent: Math.max(3, Math.round((i.fans / max) * 100)) }));
};

export interface WeekBar {
  label: string;
  value: string;
  template: TemplateId;
  // The week ran the setup the chart measures.
  active: boolean;
  // Colored even when inactive: a Simple BPA chart counts every week.
  colored: boolean;
  height: number;
}

// The selected slot over its whole tenure: setups before and now, history and a weekly chart of what
// its current setup measures.
function slotDetail(row: SlotRow) {
  const full = periodsOf(row.key, SEASON, (days) => days / 30);
  const now = full[full.length - 1];
  const previous = full.length > 1 ? full[full.length - 2] : null;
  const present = now.template;
  const bpa = present === "SIMPLE_BPA";
  const metricName = bpa ? "Fans who saw your logo" : now.resultName;
  const seed = SLOT_SEEDS[row.key] ?? DEFAULT_SEED;
  const history = historyOf(row.key);
  const presentRate = metricsOf(row.key, present, 1).rateValue;
  const templateOn = (day: Date) => history.filter((p) => toDate(p.from) <= day).pop()?.template ?? history[0].template;

  const weeks: { start: Date; template: TemplateId; value: number; active: boolean }[] = [];
  for (let w = 0; ; w++) {
    const start = addDays(SEASON, w * 7);
    if (start > TODAY) break;
    const end = addDays(start, 6) < TODAY ? addDays(start, 6) : TODAY;
    const days = daysBetween(start, end);
    // A gentle made-up curve so the weeks differ.
    const perDay = (seed.fans / 30) * (0.8 + 0.35 * Math.sin(w * 1.3) + w * 0.025);
    const dayTemplates: Partial<Record<TemplateId, number>> = {};
    for (let d = 0; d < days; d++) {
      const t = templateOn(addDays(start, d));
      dayTemplates[t] = (dayTemplates[t] ?? 0) + 1;
    }
    const presentDays = dayTemplates[present] ?? 0;
    const template = presentDays
      ? present
      : (Object.keys(dayTemplates) as TemplateId[]).sort((a, b) => (dayTemplates[b] ?? 0) - (dayTemplates[a] ?? 0))[0];
    weeks.push({ start, template, value: bpa ? perDay * days : perDay * presentDays * presentRate, active: presentDays > 0 });
  }
  const max = Math.max(...weeks.map((w) => w.value)) || 1;
  const bars: WeekBar[] = weeks.map((w) => ({
    label: formatDay(w.start),
    value: w.active || bpa ? formatCount(w.value) : "–",
    template: w.template,
    active: w.active,
    colored: w.active || bpa,
    height: Math.max(4, Math.round((w.value / max) * 160)),
  }));
  const activeWeeks = weeks.filter((w) => w.active);
  const average = activeWeeks.length ? sum(activeWeeks, (w) => w.value) / activeWeeks.length : 0;
  const name = TEMPLATE_NAME[present];
  const where = `${row.inventory.name} at ${row.org.name}`;

  return {
    kicker: `SELECTED SLOT · ${row.inventory.phase}`,
    title: where,
    previous,
    now,
    cards: cellsFor(row.current, `Since ${row.current.since}, with this setup`, "Fans who took the action"),
    tip: tipFor(row.current),
    history: [...full].reverse(),
    historyNote: `Whole tenure since ${formatDay(SEASON)}. Each setup keeps its own results, and rates only count fans who saw that setup.`,
    chart: {
      title: `${metricName} each week`,
      sub: `${where} · whole tenure (since ${formatDay(SEASON)}) · measured as ${name}, its setup now`,
      legend: full.map((p) => ({ template: p.template, when: p.label, faded: p.template !== present })),
      bars,
      note: bpa
        ? "Every week counts fans who saw your logo. Bar colors show the setup running that week."
        : `Only weeks running ${name} count toward ${metricName.toLowerCase()}. Weeks with an earlier setup show as grey.`,
      average:
        now.since === formatDay(TODAY)
          ? `Switched to ${name} today, so results are just starting to come in.`
          : activeWeeks.length
            ? `Average ${formatCount(average)} a week across ${plural(activeWeeks.length, "week")} as ${name}.`
            : "",
      ariaLabel: `${metricName} each week for ${where}: ${weeks
        .map((w, i) => `${bars[i].label}: ${TEMPLATE_NAME[w.template]}${w.active || bpa ? `, ${bars[i].value}` : `, not running ${name}`}`)
        .join("; ")}`,
    },
  };
}

export type SlotDetail = ReturnType<typeof slotDetail>;

export function usePerformance() {
  const [range, setRange] = useState<PerformanceRange>("30");
  const [inventoryId, setInventoryId] = useState(SAMPLE_INVENTORY[0].id);
  // The picked slot of the inventory; its first organization until one is picked.
  const [slot, setSlot] = useState("");

  const rangeLabel = RANGE_OPTIONS.find((o) => o.value === range)?.label ?? "";
  const windowStart = range === "7" ? addDays(TODAY, -6) : range === "30" ? addDays(TODAY, -29) : SEASON;
  const windowDays = daysBetween(windowStart, TODAY);
  const scale = RANGE_SCALE[range];

  const rows: SlotRow[] = SAMPLE_INVENTORY.flatMap((inventory) =>
    inventory.orgs.map((orgId) => {
      const key = slotKey(orgId, inventory.id);
      const periods = periodsOf(key, windowStart, (days) => (scale * days) / windowDays);
      return { key, inventory, org: SAMPLE_ORGS[orgId], periods, current: periods[periods.length - 1], fans: sum(periods, (p) => p.fans) };
    })
  );
  const resultOf = (list: SlotRow[], t: TemplateId) =>
    sum(list, (r) => sum(r.periods.filter((p) => p.template === t), (p) => p.result));
  const slotsRunning = (list: SlotRow[], t: TemplateId) => list.filter((r) => r.periods.some((p) => p.template === t)).length;

  const orgCount = Object.keys(SAMPLE_ORGS).length;
  const totalFans = sum(rows, (r) => r.fans);
  const acted = sum(ACTION_TEMPLATES, (t) => resultOf(rows, t));
  const changed = rows.filter((r) => r.periods.length > 1).length;

  const actionPlain = (t: ActionTemplate) => {
    const n = slotsRunning(rows, t);
    return n
      ? `From ${plural(n, "slot")} that ran ${TEMPLATE_NAME[t]} in this period.`
      : `None yet. Set a slot to ${TEMPLATE_NAME[t]} to start counting.`;
  };
  const kpis = [
    { id: "fans", label: "Fans who saw your ad", value: formatCount(totalFans), plain: `Across ${rows.length} slots at ${orgCount} organizations.` },
    { id: "VISIT_WEBSITE", label: "Visited your website", value: formatCount(resultOf(rows, "VISIT_WEBSITE")), plain: actionPlain("VISIT_WEBSITE") },
    { id: "SURVEY", label: "Completed your survey", value: formatCount(resultOf(rows, "SURVEY")), plain: actionPlain("SURVEY") },
    { id: "OFFER_PROMO_CODE", label: "Used your offer", value: formatCount(resultOf(rows, "OFFER_PROMO_CODE")), plain: actionPlain("OFFER_PROMO_CODE") },
  ] as const;

  const byOrg = Object.values(SAMPLE_ORGS).map((o) => ({ label: o.name, short: o.short, fans: sum(rows.filter((r) => r.org.id === o.id), (r) => r.fans) }));
  const byInventory = SAMPLE_INVENTORY.map((i) => ({ label: i.name, fans: sum(rows.filter((r) => r.inventory.id === i.id), (r) => r.fans) }));

  const topReach = [...rows].sort((a, b) => b.fans - a.fans)[0];
  const topOrg = [...byOrg].sort((a, b) => b.fans - a.fans)[0];
  const bestAction = rows
    .flatMap((r) => r.periods.filter((p) => p.template !== "SIMPLE_BPA" && p.fans > 0).map((p) => ({ r, p })))
    .sort((a, b) => b.p.rateValue - a.p.rateValue)[0];
  const highlights = [
    {
      kicker: "MOST FANS REACHED",
      tone: "text-[#c7d2fe]",
      title: `${topReach.inventory.name} at ${topReach.org.short}`,
      text: `${formatCount(topReach.fans)} fans saw your brand here, more than any other slot.`,
    },
    {
      kicker: "TOP ORGANIZATION",
      tone: "text-[#86efac]",
      title: topOrg.label,
      text: `${formatCount(topOrg.fans)} of its fans saw your brand across all your slots there.`,
    },
    bestAction
      ? {
          kicker: "BEST AT GETTING ACTION",
          tone: "text-[#fdba74]",
          title: `${bestAction.r.inventory.name} at ${bestAction.r.org.short}`,
          text: `${bestAction.p.rate} of fans who saw it took action while it ran ${TEMPLATE_NAME[bestAction.p.template]} (${bestAction.p.label}).`,
        }
      : {
          kicker: "NEXT STEP",
          tone: "text-[#fdba74]",
          title: "All your slots are Simple BPA",
          text: "They’re great for being seen. Switch one to Visit website, Survey or Offer to measure what fans do.",
        },
  ];

  // Performance by inventory.
  const inventory = SAMPLE_INVENTORY.find((i) => i.id === inventoryId) ?? SAMPLE_INVENTORY[0];
  const inventoryRows = rows.filter((r) => r.inventory.id === inventory.id);
  const selected = inventoryRows.find((r) => r.key === slot) ?? inventoryRows[0];
  const inventoryFans = sum(inventoryRows, (r) => r.fans);
  const inventorySummary = [
    { label: `${inventory.name} at`, value: plural(inventoryRows.length, "organization") },
    { label: "Fans who saw it", value: formatCount(inventoryFans) },
    ...ACTION_TEMPLATES.filter((t) => slotsRunning(inventoryRows, t)).map((t) => ({
      label: kpis.find((k) => k.id === t)?.label ?? TEMPLATE_NAME[t],
      value: formatCount(resultOf(inventoryRows, t)),
    })),
  ];
  const orgRows = [...inventoryRows]
    .sort((a, b) => b.fans - a.fans)
    .map((r) => {
      const share = inventoryFans ? r.fans / inventoryFans : 0;
      const changes = r.periods.length - 1;
      return {
        key: r.key,
        org: r.org,
        selected: r.key === selected.key,
        template: r.current.template,
        nowLabel: `Now · since ${r.current.since}${changes ? ` · changed ${changes} ${changes === 1 ? "time" : "times"} in this period` : ""}`,
        cells: cellsFor(r.current, "with this setup", "fans who acted").map((c, i) =>
          i === 2 ? { ...c, how: `${formatCount(r.current.result)} ÷ ${formatCount(r.current.fans)} fans` } : c
        ),
        past: r.periods.slice(0, -1).reverse(),
        share: Math.round(share * 100),
      };
    });

  return {
    range,
    setRange,
    rangeLabel,
    summary: {
      lead: `${rangeLabel},`,
      fans: `${formatCount(totalFans)} fans`,
      rest:
        `saw your brand across ${rows.length} slots at ${orgCount} organizations.` +
        (acted ? ` ${formatCount(acted)} of them took action.` : "") +
        (changed ? ` ${plural(changed, "slot")} changed setup during this period; each setup is measured on its own.` : ""),
    },
    kpis,
    barCharts: [
      { title: "Fans who saw your ad, by organization", sub: "Which organization’s fans saw you most", bars: toBars(byOrg) },
      { title: "Fans who saw your ad, by inventory", sub: "Which kind of slot reached the most fans", bars: toBars(byInventory) },
    ],
    highlights,
    inventories: SAMPLE_INVENTORY,
    inventory,
    pickInventory: setInventoryId,
    inventorySummary,
    orgRows,
    pickSlot: setSlot,
    detail: slotDetail(selected),
  };
}
