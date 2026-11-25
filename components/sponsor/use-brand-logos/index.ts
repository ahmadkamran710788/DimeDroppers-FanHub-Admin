"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { sponsorRequest, type SponsorApiResult } from "@/components/sponsor/sponsor-api";
import { checkBrandLogo } from "@/components/sponsor/data";
import { loadLogoImage, type LogoImage } from "@/components/sponsor/logo-fit/render";
import { routes } from "@/utils/routes";
import type {
  BrandAsset,
  BrandAssetList,
  BrandAssetOptions,
  LogoVariant,
  MainLogo,
  VariantSpec,
} from "@/utils/types/sponsor-brand-assets";

// An uploaded logo open in the editor (LogoFitModal, from Edit on its card), with its file decoded.
export interface LogoEditing {
  id: number;
  asset: BrandAsset;
  spec: VariantSpec;
  image: LogoImage;
  maxBytes: number;
}

// The extension of a logo's type, for the file the editor opens ("image/svg+xml" → "svg").
const EXTENSIONS: Record<string, string> = { "image/svg+xml": "svg", "image/png": "png", "image/jpeg": "jpg" };

// The rules and the logos, with the load they answer, so an older one never shows after Retry.
interface Loaded {
  key: number;
  options?: BrandAssetOptions;
  list?: BrandAssetList;
  error?: string;
}

export type BrandLogos = ReturnType<typeof useBrandLogos>;

// The sponsor's logos (Brand Assets and Brand Placements): the rules per kind (GET /options), the logos with
// a state per kind and the main logo (GET /), and every change to them. After a change the list is loaded again,
// since making the white logo and icon, moving the default or deleting the last circular logo (which switches the
// main logo back to landscape) changes several things at once.
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
  // The logo in the editor, and a count that keys each edit.
  const [editing, setEditing] = useState<LogoEditing | null>(null);
  const edits = useRef(0);

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
  // LANDSCAPE until the list says otherwise. The white logo and icon are only made from a landscape main logo.
  const mainLogo: MainLogo = list?.mainLogo ?? options?.defaultMainLogo ?? "LANDSCAPE";
  const canRegenerate = mainLogo === "LANDSCAPE";

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

  // A new logo of this kind, the picked file as it is. The first landscape one also makes the white logo and icon
  // (while the main logo is landscape); a white logo or icon replaces the made one of its kind and becomes the
  // default.
  async function upload(variant: LogoVariant, file: File, { name, isDefault }: { name?: string; isDefault?: boolean } = {}) {
    if (await rejected(file, variant)) return false;
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
      () => `${file.name} added as your ${labelOf(variant)}${made}`
    );
  }

  // A new image for a logo (a picked file as it is, or an edited one); every slot using it shows the new one.
  // Replacing the default landscape logo makes the auto-made white logo and icon again (backend).
  async function replace(asset: BrandAsset, file: File, done = `${asset.name} replaced`) {
    if (await rejected(file, asset.variant)) return false;
    const body = new FormData();
    body.append("file", file);
    return run(asset.id, () => sponsorRequest<BrandAsset>("PUT", routes.api.sponsorBrandAssetFile(asset.id), { body }), done);
  }

  // Opens the editor on an uploaded logo. Its file comes through our own route (proxySponsorLogo), as the
  // browser can't draw the logo's S3 link on a canvas. `edit:<id>` waits meanwhile.
  async function edit(asset: BrandAsset) {
    const spec = specOf(asset.variant);
    if (!spec || !options) return;
    setBusy(`edit:${asset.id}`);
    const image = await logoImage(asset);
    setBusy(null);
    if (!image) {
      toast.error("Couldn't open this logo for editing, please try again.");
      return;
    }
    edits.current += 1;
    setEditing({ id: edits.current, asset, spec, image, maxBytes: options.limits.maxBytes });
  }

  function closeEdit() {
    if (editing) URL.revokeObjectURL(editing.image.url);
    setEditing(null);
  }

  // Saves the edited logo over the uploaded one: true once it's saved (the editor closes); false keeps it open.
  async function saveEdit(file: File) {
    if (!editing) return false;
    const saved = await replace(editing.asset, file, `${editing.asset.name} updated`);
    if (saved) closeEdit();
    return saved;
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

  // Makes the white logo and icon again from a landscape logo (only while it's the main logo).
  const regenerate = (asset: BrandAsset) =>
    run(
      asset.id,
      () => sponsorRequest<BrandAssetList>("POST", routes.api.sponsorBrandAssetGenerate(asset.id)),
      `${capitalize(labelOf("WHITE"))} and ${labelOf("ICON")} made again from ${asset.name}`
    );

  // Which logo the versions follow. CIRCULAR removes the made white logo and icon (and the slot choices that
  // used them); LANDSCAPE makes them again. Answers the list, which is kept as it is.
  async function setMainLogo(value: MainLogo) {
    const option = options?.mainLogos.find((o) => o.value === value);
    setBusy("main-logo");
    const r = await sponsorRequest<BrandAssetList>("PUT", routes.api.sponsorBrandAssetMainLogo, {
      body: { mainLogo: value },
    });
    if (!r.view) {
      setBusy(null);
      toast.error(r.message ?? "Couldn't change your main logo, please try again.");
      return false;
    }
    setFresh({ key: reloads, list: r.view });
    setBusy(null);
    setVersion((n) => n + 1);
    toast.success(`Your ${(option?.label ?? "logo").toLowerCase()} is now your main logo`);
    return true;
  }

  return {
    list,
    options,
    loading: !current,
    error: current?.error,
    retry: () => setReloads((n) => n + 1),
    busy,
    version,
    specOf,
    upload,
    replace,
    editing,
    edit,
    saveEdit,
    cancelEdit: closeEdit,
    rename,
    makeDefault,
    remove,
    regenerate,
    mainLogo,
    canRegenerate,
    setMainLogo,
  };
}

// A logo's file, decoded for the editor; null when it can't be loaded or read.
async function logoImage(asset: BrandAsset): Promise<LogoImage | null> {
  try {
    const res = await fetch(routes.api.proxySponsorLogo(asset.id), { cache: "no-store" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const type = blob.type || asset.mimeType;
    return await loadLogoImage(new File([blob], `${asset.name}.${EXTENSIONS[type] ?? "png"}`, { type }));
  } catch {
    return null;
  }
}

// "White logo" from "white logo".
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
