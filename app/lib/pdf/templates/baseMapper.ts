import { radians } from "pdf-lib";
import { hashSeed, mulberry32 } from "@/app/lib/pdf/rng";
import type {
  CertificateData,
  DrawContext,
  TemplateMapper,
} from "@/app/lib/pdf/types";

/**
 * Jitter bounds (spec §5.2): ±0.6pt position, ±0.35pt size, ±0.0125 rad
 * rotation. Values are full ranges; helpers centre them with (rand - 0.5).
 */
const JITTER = { pos: 1.2, size: 0.7, angle: 0.025 } as const;

/** Handwritten-style text with seeded positional/size/rotation jitter. */
export function drawHandwrittenText(
  ctx: DrawContext,
  text: string,
  o: { x: number; y: number; size?: number },
): void {
  if (!text.trim()) return;
  const size = o.size ?? 11;
  ctx.page.drawText(text, {
    x: o.x + (ctx.rand() - 0.5) * JITTER.pos,
    y: o.y + (ctx.rand() - 0.5) * JITTER.pos,
    size: size + (ctx.rand() - 0.5) * JITTER.size,
    font: ctx.font,
    color: ctx.ink,
    rotate: radians((ctx.rand() - 0.5) * JITTER.angle),
  });
}

/** Two-segment checkmark, 1.4–1.8pt strokes (spec §5.2). */
export function drawCheckmark(
  ctx: DrawContext,
  o: { x: number; y: number; size?: number },
): void {
  const size = o.size ?? 12;
  const thickness = () => 1.4 + ctx.rand() * 0.4;
  const mid = { x: o.x + size * 0.35, y: o.y - size * 0.4 };
  ctx.page.drawLine({
    start: { x: o.x, y: o.y },
    end: mid,
    thickness: thickness(),
    color: ctx.ink,
  });
  ctx.page.drawLine({
    start: mid,
    end: { x: o.x + size, y: o.y + size * 0.55 },
    thickness: thickness(),
    color: ctx.ink,
  });
}

/** Jittered ellipse polyline, 1.5–2.0pt, with a slight overshoot (spec §5.2). */
export function drawPassCircle(
  ctx: DrawContext,
  o: { cx: number; cy: number; rx: number; ry: number },
): void {
  const segments = 26;
  const overshoot = 1.06 + ctx.rand() * 0.06;
  const start = ctx.rand() * Math.PI * 2;
  const thickness = 1.5 + ctx.rand() * 0.5;
  let prev: { x: number; y: number } | null = null;
  for (let i = 0; i <= segments; i += 1) {
    const angle = start + (i / segments) * Math.PI * 2 * overshoot;
    const wobble = 1 + (ctx.rand() - 0.5) * 0.1;
    const point = {
      x: o.cx + Math.cos(angle) * o.rx * wobble,
      y: o.cy + Math.sin(angle) * o.ry * wobble,
    };
    if (prev) {
      ctx.page.drawLine({
        start: prev,
        end: point,
        thickness,
        color: ctx.ink,
      });
    }
    prev = point;
  }
}

/**
 * Deterministic signature squiggle (spec §5.2) — seeded from the name alone,
 * so the same handler name always renders identically regardless of the
 * surrounding placement stream.
 */
export function drawSignature(
  ctx: DrawContext,
  name: string,
  o: { x: number; y: number },
): void {
  if (!name.trim()) return;
  const rand = mulberry32(hashSeed(["signature", name]));
  const strokes = 7 + Math.floor(rand() * 3);
  const width = 52 + name.length * 1.2;
  let prev = { x: o.x, y: o.y + 4 + (rand() - 0.5) * 2 };
  for (let i = 1; i <= strokes; i += 1) {
    const point = {
      x: o.x + (width / strokes) * i + (rand() - 0.5) * 3,
      y: o.y + (i % 2 === 0 ? 0 : 9) + (rand() - 0.5) * 5,
    };
    ctx.page.drawLine({
      start: prev,
      end: point,
      thickness: 1.1 + rand() * 0.5,
      color: ctx.ink,
    });
    prev = point;
  }
  ctx.page.drawLine({
    start: prev,
    end: { x: o.x + width * 1.05, y: o.y + 11 },
    thickness: 1 + rand() * 0.4,
    color: ctx.ink,
  });
}

/** Resolve a dotted path against {@link CertificateData}; throws on bad paths. */
export function readPath(data: CertificateData, path: string): string {
  let cursor: unknown = data;
  for (const segment of path.split(".")) {
    if (
      typeof cursor !== "object" ||
      cursor === null
    ) {
      throw new Error(
        `CertificateData has no path "${path}" (failed at "${segment}")`,
      );
    }
    const obj = cursor as Record<string, unknown>;
    if (!(segment in obj)) {
      throw new Error(
        `CertificateData has no path "${path}" (failed at "${segment}")`,
      );
    }
    cursor = obj[segment];
  }
  if (typeof cursor === "string") return cursor;
  if (typeof cursor === "number" || typeof cursor === "boolean") {
    return String(cursor);
  }
  // Handle undefined and null gracefully - return empty string
  if (cursor === undefined || cursor === null) {
    return "";
  }
  throw new Error(
    `CertificateData path "${path}" does not resolve to a scalar`,
  );
}

/**
 * Apply every placement of a mapper to the current page (spec §5.2):
 * skip when `when(data)` is false, run `format` on text values, dispatch on
 * `kind`, and throw on unknown paths (dev-time contract).
 */
export function applyPlacements(
  ctx: DrawContext,
  data: CertificateData,
  mapper: TemplateMapper,
): void {
  for (const placement of mapper.placements) {
    if (placement.when && !placement.when(data)) continue;
    const raw = readPath(data, placement.path);
    const value = placement.format ? placement.format(raw, data) : raw;
    switch (placement.kind ?? "text") {
      case "checkmark":
        drawCheckmark(ctx, {
          x: placement.x,
          y: placement.y,
          size: placement.size,
        });
        break;
      case "passCircle": {
        const rx = placement.size ?? 14;
        drawPassCircle(ctx, {
          cx: placement.x,
          cy: placement.y,
          rx,
          ry: rx * 0.62,
        });
        break;
      }
      case "signature":
        drawSignature(ctx, value, { x: placement.x, y: placement.y });
        break;
      default:
        drawHandwrittenText(ctx, value, {
          x: placement.x,
          y: placement.y,
          size: placement.size,
        });
    }
  }
}