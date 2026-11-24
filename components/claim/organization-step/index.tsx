"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import Input from "@/components/common/input";
import Button from "@/components/common/button";
import Loader from "@/components/common/loader";
import OrgMonogram from "@/components/sponsor/find-organizations/org-monogram";
import { searchOrganizations, type ClaimOrganization } from "../data";

interface OrganizationStepProps {
  // Called with the organization whose Claim button was pressed; the wizard moves to the email step.
  onClaim: (org: ClaimOrganization) => void;
}

const LABEL = "text-white font-medium";
const FIELD = "bg-[#eef2fb] border-[#d6deef] rounded-[10px]";

// Step 1 — find your organization. The search box queries the school-search API (debounced, cached); each
// row has a Claim button that advances the wizard.
export default function OrganizationStep({ onClaim }: OrganizationStepProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [organizations, setOrganizations] = useState<ClaimOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Debounce typing so a request fires once the user pauses, not on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch results for the current (debounced) query; an AbortController drops a superseded request.
  // Cached queries resolve instantly, so the loader barely flashes when re-typing or backspacing.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);

    searchOrganizations(debouncedQuery, controller.signal)
      .then((results) => {
        setOrganizations(results);
        setLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return; // Superseded by a newer query — ignore.
        setOrganizations([]);
        setError(true);
        setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-white/50">Step 1 of 2</p>
        <h1 className="font-display font-black text-[40px] uppercase leading-none text-white">Claim your hub</h1>
        <p className="text-[#a1a1aa]">Find your organization and claim it to continue.</p>
      </div>

      <Input
        label="Organization"
        name="organizationSearch"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or location"
        icon={<Search className="h-5 w-5" />}
        labelClassName={LABEL}
        inputClassName={FIELD}
      />

      {loading ? (
        <Loader />
      ) : error ? (
        <p className="rounded-[10px] border border-white/10 bg-white/[0.04] px-4 py-6 text-center text-sm text-white/55">
          Couldn&apos;t load organizations. Please try again.
        </p>
      ) : organizations.length === 0 ? (
        <p className="rounded-[10px] border border-white/10 bg-white/[0.04] px-4 py-6 text-center text-sm text-white/55">
          No organizations found.
        </p>
      ) : (
        <ul className="flex max-h-[340px] flex-col gap-2 overflow-y-auto">
          {organizations.map((org) => (
            <li
              key={org.id}
              className="flex items-center justify-between gap-3 rounded-[10px] border border-white/10 bg-white/[0.04] px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <OrgMonogram logoUrl={org.logoUrl} name={org.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-white">{org.name}</p>
                  {org.location && <p className="truncate text-sm text-white/55">{org.location}</p>}
                </div>
              </div>
              <Button size="sm" variant="primary" label="Claim" onClick={() => onClaim(org)} className="shrink-0 px-4" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
