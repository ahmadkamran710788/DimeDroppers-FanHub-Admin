"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { sponsorRequest, type SponsorApiResult } from "@/components/sponsor/sponsor-api";
import { checkBrandLogo, checkLogoFormat } from "@/components/sponsor/data";
import { loadLogoImage, type LogoImage } from "@/components/sponsor/logo-fit/render";
import { routes } from "@/utils/routes";
import type {
  BrandAsset,
  BrandAssetList,
  BrandAssetOptions,
  LogoVariant,
  VariantSpec,
} from "@/utils/types/sponsor-brand-assets";

// A picked logo waiting in the fit editor (LogoFitModal); `resolve` gets the fitted file, or null on Cancel.
export interface LogoFitting {
  id: number;
  file: File;
  spec: VariantSpec;
  image: LogoImage;
  maxBytes: number;
  resolve: (file: File | null) => void;
}

// The rules and the logos, with the load they answer, so an older one never shows after Retry.
interface Loaded {
  key: number;
  options?: BrandAssetOptions;
  list?: BrandAssetList;
  error?: string;
}

export type BrandLogos = ReturnType<typeof useBrandLogos>;

// The sponsor's logos (Brand Assets and Brand Placements): the rules per kind (GET /options), the logos with
// a state per kind (GET /), and every change to them. After a change the list is loaded again, since making
// the white logo and icon or moving the default changes several logos at once.
export function useBrandLogos() {
  // Bumped by Retry to load both again.
  const [reloads, setReloads] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  // The list after a change, until the next Retry.
  const [fresh, setFresh] = useState<{ key: number; list: BrandAssetList } | null>(null);
  // What's being saved: `upload:<variant>` or a logo's id; its buttons wait.
  const [busy, setBusy] = useState<string | null>(null);
  // Bumped after every change, so the slots showing these logos load again.
  const [version, setVersion] = useState(0);
  // The logo in the fit editor, and a count that keys each one.
  const [fitting, setFitting] = useState<LogoFitting | null>(null);
  const fits = useRef(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      sponsorRequest<BrandAssetOptions>("GET", routes.api.sponsorBrandAssetOptions),
      sponsorRequest<BrandAssetList>("GET", routes.api.sponsorBrandAssets),
    ]).then(([o, l]) => {
      if (cancelled) return;
      if (o.view && l.view) setLoaded({ key: reloads, options: o.view, list: l.view });
      else setLoaded({ key: reloads, error: l.message ?? o.message });
    });
    return () => {
      cancelled = true;
    };
  }, [reloads]);

  // null while loading.
  const current = loaded?.key === reloads ? loaded : null;
  const options = current?.options ?? null;
  const list = (fresh?.key === reloads ? fresh.list : null) ?? current?.list ?? null;

  const specOf = (variant: LogoVariant) => options?.variants.find((v) => v.variant === variant);
  const labelOf = (variant: LogoVariant) => (specOf(variant)?.label ?? "logo").toLowerCase();

  async function refresh() {
    const r = await sponsorRequest<BrandAssetList>("GET", routes.api.sponsorBrandAssets);
    if (r.view) setFresh({ key: reloads, list: r.view });
  }

  // Runs one change: `busyKey` waits meanwhile; on success the list loads again and `done` is shown (a function
  // when the message depends on the answer).
  async function run(busyKey: string, request: () => Promise<SponsorApiResult<unknown>>, done: string | (() => string)) {
    setBusy(busyKey);
    const r = await request();
    if (r.status < 200 || r.status >= 300) {
      setBusy(null);
      toast.error(r.message ?? "Something went wrong, please try again.");
      return false;
    }
    await refresh();
    setBusy(null);
    setVersion((n) => n + 1);
    toast.success(typeof done === "string" ? done : done());
    return true;
  }

  // The problem with a file for this kind (shown as a toast), or null when it can go up.
  async function rejected(file: File, variant: LogoVariant) {
    const spec = specOf(variant);
    const problem = spec && options ? await checkBrandLogo(file, spec, options.limits.maxBytes) : null;
    if (problem) toast.error(problem);
    return problem !== null;
  }

  // Opens the fit editor on a picked file: the fitted file to upload, or null when it's the wrong format, can't be
  // read, or the sponsor cancels. The file itself while the rules haven't loaded.
  async function fit(file: File, variant: LogoVariant): Promise<File | null> {
    const spec = specOf(variant);
    if (!spec || !options) return file;
    const problem = checkLogoFormat(file, spec);
    if (problem) {
      toast.error(problem);
      return null;
    }
    const image = await loadLogoImage(file);
    if (!image) {
      toast.error("The file could not be read as an image");
      return null;
    }
    const { maxBytes } = options.limits;
    fits.current += 1;
    const id = fits.current;
    return new Promise((resolve) => setFitting({ id, file, spec, image, maxBytes, resolve }));
  }

  // Closes the fit editor with what it saved (null: cancelled).
  function finishFit(file: File | null) {
    if (!fitting) return;
    URL.revokeObjectURL(fitting.image.url);
    fitting.resolve(file);
    setFitting(null);
  }

  // A new logo of this kind, fitted to its frame first. The first full-color one also makes the white logo and
  // icon; a white logo or icon replaces the made one of its kind and becomes the default.
  async function upload(variant: LogoVariant, picked: File, { name, isDefault }: { name?: string; isDefault?: boolean } = {}) {
    const file = await fit(picked, variant);
    if (!file || (await rejected(file, variant))) return false;
    const body = new FormData();
    body.append("file", file);
    body.append("variant", variant);
    if (name) body.append("name", name.slice(0, options?.limits.nameMax));
    if (isDefault !== undefined) body.append("isDefault", String(isDefault));
    let made = "";
    return run(
      `upload:${variant}`,
      async () => {
        const r = await sponsorRequest<BrandAsset>("POST", routes.api.sponsorBrandAssets, { body });
        const generated = r.view?.generation?.results.filter((g) => g.state === "GENERATED") ?? [];
        if (generated.length) made = ` · ${generated.map((g) => labelOf(g.variant)).join(" and ")} made from it`;
        return r;
      },
      () => `${picked.name} added as your ${labelOf(variant)}${made}`
    );
  }

  // A new image for a logo, fitted to its frame first; every slot using it shows the new one.
  async function replace(asset: BrandAsset, picked: File) {
    const file = await fit(picked, asset.variant);
    if (!file || (await rejected(file, asset.variant))) return false;
    const body = new FormData();
    body.append("file", file);
    return run(
      asset.id,
      () => sponsorRequest<BrandAsset>("PUT", routes.api.sponsorBrandAssetFile(asset.id), { body }),
      `${asset.name} replaced`
    );
  }

  const rename = (asset: BrandAsset, name: string) =>
    run(asset.id, () => sponsorRequest<BrandAsset>("PATCH", routes.api.sponsorBrandAsset(asset.id), { body: { name } }), "Logo renamed");

  const makeDefault = (asset: BrandAsset) =>
    run(
      asset.id,
      () => sponsorRequest<BrandAsset>("PATCH", routes.api.sponsorBrandAsset(asset.id), { body: { isDefault: true } }),
      `${asset.name} is now your default ${labelOf(asset.variant)}`
    );

  const remove = (asset: BrandAsset) =>
    run(asset.id, () => sponsorRequest("DELETE", routes.api.sponsorBrandAsset(asset.id)), `${asset.name} deleted`);

  // Makes the white logo and icon again from a full-color logo.
  const regenerate = (asset: BrandAsset) =>
    run(
      asset.id,
      () => sponsorRequest<BrandAssetList>("POST", routes.api.sponsorBrandAssetGenerate(asset.id)),
      `White logo and icon made again from ${asset.name}`
    );

  return {
    list,
    options,
    loading: !current,
    error: current?.error,
    retry: () => setReloads((n) => n + 1),
    busy,
    version,
    specOf,
    fitting,
    finishFit,
    upload,
    replace,
    rename,
    makeDefault,
    remove,
    regenerate,
  };
}
