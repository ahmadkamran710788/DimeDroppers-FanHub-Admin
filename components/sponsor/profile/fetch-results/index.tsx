"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { routes } from "@/utils/routes";
import Loader from "@/components/common/loader";
import Pagination from "@/components/common/pagination";
import Tabs from "@/components/common/tabs";
import { sponsorRequest } from "@/components/sponsor/sponsor-api";
import LocationRow from "@/components/sponsor/profile/location-row";
import { PAGE_SIZE } from "@/components/sponsor/profile/data";
import type {
  SponsorFetchArea,
  SponsorFetchAreaResult,
  SponsorLocationFetchResult,
} from "@/utils/types/sponsor-profile";

interface FetchResultsProps {
  // A fetch with the first PAGE_SIZE locations of each area.
  result: SponsorLocationFetchResult;
  // The sponsor's brand, for an area with none of its stores ("No Walmart stores in Acton, CA").
  brandName?: string | null;
}

// What to say for an area with none of the sponsor's locations, and where to look instead.
const emptyAreaNote = (area: SponsorFetchArea, brandName?: string | null) =>
  `No ${brandName ? `${brandName} ` : ""}stores in ${area.label}. ${
    area.kind === "STATE" ? "Try another state." : "Try a nearby city or a whole state."
  }`;

// A fetch's results: one tab per state, city or ZIP code it searched, with every location of the sponsor's in
// that area (the ones this fetch added marked NEW). It opens on the first area with new ones. Each area pages
// on its own (?areaKey=&page=).
export default function FetchResults({ result, brandName }: FetchResultsProps) {
  const [tab, setTab] = useState(
    () => (result.results.find((b) => b.newCount > 0) ?? result.results[0])?.area.key ?? ""
  );
  // Areas moved to another page, by key.
  const [paged, setPaged] = useState<Record<string, SponsorFetchAreaResult>>({});
  const [loadingArea, setLoadingArea] = useState<string | null>(null);

  const blocks = result.results.map((b) => paged[b.area.key] ?? b);
  const block = blocks.find((b) => b.area.key === tab) ?? blocks[0];
  if (!block) return null;

  async function goToPage(page: number) {
    const areaKey = block.area.key;
    setLoadingArea(areaKey);
    const r = await sponsorRequest<SponsorLocationFetchResult>("GET", routes.api.sponsorLocationFetch(result.id), {
      params: { areaKey, page, limit: PAGE_SIZE },
    });
    setLoadingArea(null);
    const next = r.view?.results.find((b) => b.area.key === areaKey);
    if (next) setPaged((prev) => ({ ...prev, [areaKey]: next }));
    else toast.error(r.message ?? "Couldn't load these locations. Try again.");
  }

  const { area, locationCount, newCount, locations, pagination } = block;
  const from = (pagination.page - 1) * pagination.limit;

  return (
    <div className="flex flex-col gap-3">
      <Tabs
        tabs={blocks.map((b) => b.area.key)}
        active={area.key}
        onChange={setTab}
        labels={Object.fromEntries(blocks.map((b) => [b.area.key, b.area.label]))}
        counts={Object.fromEntries(blocks.map((b) => [b.area.key, b.locationCount]))}
        className="flex-wrap gap-y-3"
      />
      <p className="text-sm text-[#a8a8a8]">
        {area.error
          ? `${area.error}. ${area.kind === "ZIP" ? "Check the ZIP code" : "Check the spelling"} and fetch again.`
          : locationCount === 0
            ? emptyAreaNote(area, brandName)
            : `${area.label}: ${locationCount === 1 ? "1 location" : `${locationCount} locations`} (${newCount} new)`}
      </p>
      {loadingArea === area.key ? (
        <Loader />
      ) : (
        locations.map((location) => (
          <LocationRow key={location.id} location={location} isNew={location.fetchRunId === result.id} />
        ))
      )}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <span className="text-xs text-white/80">
            {`Showing ${from + 1} to ${from + locations.length} of ${pagination.total} locations`}
          </span>
          <Pagination page={pagination.page} pageCount={pagination.totalPages} onChange={goToPage} />
        </div>
      )}
    </div>
  );
}
