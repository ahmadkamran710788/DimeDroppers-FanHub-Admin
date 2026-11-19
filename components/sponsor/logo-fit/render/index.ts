// The maths and drawing behind the logo fit editor. The editor, its slot previews and the saved file all place the
// logo with `logoRect`, so what the sponsor sees in the frame is exactly what's uploaded.
//
// Why a fixed frame: the app draws a sponsor logo at a fixed height with BoxFit.contain, its width following the
// file's own shape ("Presented by" banner: 30 px tall, up to 200 wide). Saving every logo of a kind on the same
// canvas (its kind's recommended size, 1000×200 or 512×512) gives it the same box in every slot, so how much of the
// canvas the logo fills is how big fans see it.

import type { VariantSpec } from "@/utils/types/sponsor-brand-assets";

export interface Size {
  width: number;
  height: number;
}

// A box in the file's own pixels.
interface Box extends Size {
  left: number;
  top: number;
}

// A picked logo file, decoded and ready to draw. `url` is an object URL; revoke it when the editor closes.
export interface LogoImage extends Size {
  element: HTMLImageElement;
  url: string;
  // An SVG, which stays sharp at any size.
  vector: boolean;
  // The part with the logo, without the empty or flat-colour margins around it.
  content: Box;
}

// Where the logo sits in its frame: its scale on each axis, as a multiple of the size at which the whole file just
// fits the frame, and its centre's offset from the frame's centre, as a share of the frame's width and height.
export interface LogoView {
  sx: number;
  sy: number;
  x: number;
  y: number;
}

// The file's box inside the frame, as shares of the frame's width and height (0 to 1 is inside it).
export interface LogoRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// The icon's important part goes in its central 80%, the backend's safe zone.
export const ICON_SAFE_ZONE = 0.8;

// A raster logo enlarged more than this may look blurry, so the editor says so.
const BLURRY_ENLARGEMENT = 1.5;
// The longest side an SVG is drawn at, so it stays sharp on the canvas.
const SVG_LONG_SIDE = 2000;
// However far it's dragged, this share of the frame keeps showing part of the file.
const KEEP_VISIBLE = 0.1;
// Finding the margins, as the backend does: corners at most this opaque mean a transparent background…
const EMPTY_ALPHA = 16;
// …where pixels more opaque than this are the logo;
const VISIBLE_ALPHA = 8;
// else four corners within this of one colour are a flat background, and pixels further from it are the logo.
const BACKGROUND_TOLERANCE = 24;
// The longest side the margins are measured at.
const SCAN_SIZE = 512;

// The scale at which the whole file just fits the frame.
const fitScale = (image: Size, frame: Size) => Math.min(frame.width / image.width, frame.height / image.height);

const clamp = (value: number, limit: number) => Math.min(limit, Math.max(-limit, value));

export function logoRect(image: Size, frame: Size, view: LogoView): LogoRect {
  const fit = fitScale(image, frame);
  const width = (image.width * fit * view.sx) / frame.width;
  const height = (image.height * fit * view.sy) / frame.height;
  return { left: 0.5 + view.x - width / 2, top: 0.5 + view.y - height / 2, width, height };
}

// The logo itself (margins left out) centred, either just fitting the frame ("fit", shrunk by `inset`, e.g. into the
// icon's safe zone) or covering it, cut at the edges ("fill").
export function presetView(image: LogoImage, frame: Size, mode: "fit" | "fill", inset = 1): LogoView {
  const { content } = image;
  const pick = mode === "fit" ? Math.min : Math.max;
  const scale = pick(frame.width / content.width, frame.height / content.height) * inset;
  const s = scale / fitScale(image, frame);
  return {
    sx: s,
    sy: s,
    x: -((content.left + content.width / 2 - image.width / 2) * scale) / frame.width,
    y: -((content.top + content.height / 2 - image.height / 2) * scale) / frame.height,
  };
}

// The view at a new scale, zoomed around the frame's centre (so what's in the middle stays there).
export function scaleView(view: LogoView, sx: number, sy: number): LogoView {
  return { sx, sy, x: (view.x * sx) / view.sx, y: (view.y * sy) / view.sy };
}

// The view, with the file kept from being dragged right out of the frame.
export function clampView(view: LogoView, image: Size, frame: Size): LogoView {
  const r = logoRect(image, frame, view);
  return {
    ...view,
    x: clamp(view.x, Math.max(0, 0.5 + r.width / 2 - KEEP_VISIBLE)),
    y: clamp(view.y, Math.max(0, 0.5 + r.height / 2 - KEEP_VISIBLE)),
  };
}

// Whether a PNG or JPG is drawn bigger than its own pixels by enough to look soft in the saved file.
export function looksBlurry(image: LogoImage, spec: VariantSpec, view: LogoView) {
  if (image.vector) return false;
  const out = spec.recommended;
  const r = logoRect(image, out, view);
  return Math.max((r.width * out.width) / image.width, (r.height * out.height) / image.height) > BLURRY_ENLARGEMENT;
}

// The picked file, decoded; null when the browser can't read it as an image.
export async function loadLogoImage(file: File): Promise<LogoImage | null> {
  const vector = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
  const url = URL.createObjectURL(vector ? await sizedSvg(file) : file);
  const element = new Image();
  element.src = url;
  try {
    await element.decode();
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }
  const { naturalWidth: width, naturalHeight: height } = element;
  if (!width || !height) {
    URL.revokeObjectURL(url);
    return null;
  }
  return { element, url, width, height, vector, content: contentBox(element, width, height) };
}

// The SVG with its size set from its viewBox, long side SVG_LONG_SIDE: one without a size can't be drawn, and a
// small one would be drawn blurry. The file itself when it can't be read.
async function sizedSvg(file: File): Promise<Blob> {
  try {
    const doc = new DOMParser().parseFromString(await file.text(), "image/svg+xml");
    const svg = doc.documentElement;
    if (svg.nodeName.toLowerCase() !== "svg" || doc.getElementsByTagName("parsererror").length) return file;
    const box = (svg.getAttribute("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
    // A plain or px length; a % or other unit says nothing about the shape.
    const length = (name: string) => {
      const value = svg.getAttribute(name) ?? "";
      return /^\s*[\d.]+(px)?\s*$/.test(value) ? parseFloat(value) : NaN;
    };
    const [width, height] = box.length === 4 && box[2] > 0 && box[3] > 0 ? [box[2], box[3]] : [length("width"), length("height")];
    if (!(width > 0 && height > 0)) return file;
    if (!svg.hasAttribute("viewBox")) svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const k = SVG_LONG_SIDE / Math.max(width, height);
    svg.setAttribute("width", String(width * k));
    svg.setAttribute("height", String(height * k));
    return new Blob([new XMLSerializer().serializeToString(doc)], { type: "image/svg+xml" });
  } catch {
    return file;
  }
}

// The box around the logo without its margins: a transparent background, or a flat colour in all four corners
// (a JPG on white). The whole file when there's neither, or it can't be read.
function contentBox(element: HTMLImageElement, width: number, height: number): Box {
  const whole = { left: 0, top: 0, width, height };
  const k = Math.min(1, SCAN_SIZE / Math.max(width, height));
  const w = Math.max(1, Math.round(width * k));
  const h = Math.max(1, Math.round(height * k));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return whole;
  let data: Uint8ClampedArray;
  try {
    ctx.drawImage(element, 0, 0, w, h);
    data = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return whole;
  }

  const at = (x: number, y: number) => (y * w + x) * 4;
  const corners = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
  let isLogo: (i: number) => boolean;
  if (corners.every((i) => data[i + 3] <= EMPTY_ALPHA)) {
    isLogo = (i) => data[i + 3] > VISIBLE_ALPHA;
  } else {
    const c = corners[0];
    const background = (i: number) =>
      Math.max(Math.abs(data[i] - data[c]), Math.abs(data[i + 1] - data[c + 1]), Math.abs(data[i + 2] - data[c + 2])) <=
      BACKGROUND_TOLERANCE;
    if (!corners.every(background)) return whole;
    isLogo = (i) => data[i + 3] > VISIBLE_ALPHA && !background(i);
  }

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!isLogo(at(x, y))) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return whole;
  const kx = width / w;
  const ky = height / h;
  return { left: minX * kx, top: minY * ky, width: (maxX - minX + 1) * kx, height: (maxY - minY + 1) * ky };
}

// The recommended size, then the smallest of the same shape the rules allow, for a file over the size limit.
function outputSizes(spec: VariantSpec): Size[] {
  const { width, height } = spec.recommended;
  const k = Math.max(spec.minWidth / width, spec.minHeight / height);
  return k < 1 ? [spec.recommended, { width: Math.ceil(width * k), height: Math.ceil(height * k) }] : [spec.recommended];
}

// The frame drawn as a PNG: transparent around the logo, or on `background` (the icon).
function draw(image: LogoImage, size: Size, view: LogoView, background: string | null): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size.width, size.height);
  }
  ctx.imageSmoothingQuality = "high";
  const r = logoRect(image, size, view);
  ctx.drawImage(image.element, r.left * size.width, r.top * size.height, r.width * size.width, r.height * size.height);
  return new Promise((resolve) => {
    try {
      canvas.toBlob(resolve, "image/png");
    } catch {
      resolve(null);
    }
  });
}

// The fitted logo as the PNG to upload ("northpeak.svg" → "northpeak.png"); null when the browser can't export it.
export async function renderFittedLogo(
  image: LogoImage,
  name: string,
  spec: VariantSpec,
  view: LogoView,
  background: string | null,
  maxBytes: number
): Promise<File | null> {
  let blob: Blob | null = null;
  for (const size of outputSizes(spec)) {
    blob = await draw(image, size, view, background);
    if (!blob || blob.size <= maxBytes) break;
  }
  if (!blob) return null;
  return new File([blob], `${name.replace(/\.[^.]+$/, "") || "logo"}.png`, { type: "image/png" });
}
