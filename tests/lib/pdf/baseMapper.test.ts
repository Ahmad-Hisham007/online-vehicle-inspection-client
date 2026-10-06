import { describe, it, expect } from "vitest";
import type { PDFFont, PDFPage } from "pdf-lib";
import { mulberry32 } from "@/app/lib/pdf/rng";
import {
  applyPlacements,
  drawCheckmark,
  drawHandwrittenText,
  drawPassCircle,
  drawSignature,
  readPath,
} from "@/app/lib/pdf/templates/baseMapper";
import type {
  CertificateData,
  DrawContext,
  TemplateMapper,
} from "@/app/lib/pdf/types";

interface TextCall {
  text: string;
  x: number;
  y: number;
  size: number;
  rotateAngle: number;
}

interface LineCall {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
}

function createCtx(seed = 42): {
  ctx: DrawContext;
  texts: TextCall[];
  lines: LineCall[];
} {
  const texts: TextCall[] = [];
  const lines: LineCall[] = [];
  const page = {
    drawText: (
      text: string,
      o: { x?: number; y?: number; size?: number; rotate?: { angle?: number } },
    ) => {
      texts.push({
        text,
        x: o.x ?? 0,
        y: o.y ?? 0,
        size: o.size ?? 0,
        rotateAngle: o.rotate?.angle ?? 0,
      });
    },
    drawLine: (o: {
      start: { x: number; y: number };
      end: { x: number; y: number };
      thickness?: number;
    }) => {
      lines.push({
        startX: o.start.x,
        startY: o.start.y,
        endX: o.end.x,
        endY: o.end.y,
        thickness: o.thickness ?? 0,
      });
    },
  } as unknown as PDFPage;

  const ctx: DrawContext = {
    page,
    font: {} as unknown as PDFFont,
    ink: {} as unknown as DrawContext["ink"],
    rand: mulberry32(seed),
  };
  return { ctx, texts, lines };
}

const sampleData: CertificateData = {
  company: "uber",
  country: "USA",
  state: "CA",
  driver: { name: "John Doe", email: "john@example.com" },
  host: { name: "Host Person", email: "host@example.com", phone: "555-0100" },
  vehicle: {
    make: "Honda",
    model: "Accord",
    year: "2020",
    color: "Silver",
    mileage: "50,000",
    vin: "1HGCM82633A004352",
    doors: "4",
    seatbelts: "5",
    fuelType: "gasoline",
  },
  registration: {
    licensePlate: "ABC123",
    tncLast4: "BC12",
    hasSticker: "pass",
    stickerMonthYear: "08/2026",
    zip: "90001",
  },
  condition: {
    tiresOlderThan6Years: "no",
    batteryOlderThan5Years: "no",
    voltageGreaterThan12_1V: "yes",
  },
  brakes: {
    minFront: "3",
    minRear: "2",
    frontLeft: "pass",
    frontRight: "pass",
    rearLeft: "fail",
    rearRight: "pass",
  },
  tires: { rightFront: "6", leftFront: "6", rightRear: "5", leftRear: "5" },
  inspection: {
    date: "08/15/2026",
    expiryDate: "08/15/2027",
    companiesLabel: "Uber, Lyft",
  },
  handler: { name: "Handler One", signature: "H. One" },
  arn: "ARD-1",
  facility: { name: "Test Facility", address: "1 Test St" },
};

describe("drawHandwrittenText", () => {
  it("no-ops on empty or whitespace text", () => {
    const { ctx, texts } = createCtx();
    drawHandwrittenText(ctx, "", { x: 10, y: 10 });
    drawHandwrittenText(ctx, "   ", { x: 10, y: 10 });
    expect(texts).toHaveLength(0);
  });

  it("keeps jitter within spec bounds (±0.6pt pos, ±0.35pt size, ±0.0125 rad)", () => {
    const { ctx, texts } = createCtx(7);
    for (let i = 0; i < 50; i += 1) {
      drawHandwrittenText(ctx, "Hello", { x: 100, y: 200, size: 11 });
    }
    expect(texts).toHaveLength(50);
    for (const t of texts) {
      expect(Math.abs(t.x - 100)).toBeLessThanOrEqual(0.6 + 1e-9);
      expect(Math.abs(t.y - 200)).toBeLessThanOrEqual(0.6 + 1e-9);
      expect(Math.abs(t.size - 11)).toBeLessThanOrEqual(0.35 + 1e-9);
      expect(Math.abs(t.rotateAngle)).toBeLessThanOrEqual(0.0125 + 1e-9);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = createCtx(99);
    const b = createCtx(99);
    drawHandwrittenText(a.ctx, "Same", { x: 10, y: 20 });
    drawHandwrittenText(b.ctx, "Same", { x: 10, y: 20 });
    expect(a.texts).toEqual(b.texts);
  });
});

describe("drawCheckmark", () => {
  it("draws two connected segments with 1.4–1.8pt strokes", () => {
    const { ctx, lines } = createCtx(3);
    drawCheckmark(ctx, { x: 50, y: 60, size: 12 });
    expect(lines).toHaveLength(2);
    expect(lines[0].endX).toBeCloseTo(lines[1].startX);
    expect(lines[0].endY).toBeCloseTo(lines[1].startY);
    for (const l of lines) {
      expect(l.thickness).toBeGreaterThanOrEqual(1.4);
      expect(l.thickness).toBeLessThanOrEqual(1.8 + 1e-9);
    }
  });
});

describe("drawPassCircle", () => {
  it("draws a connected jittered polyline with 1.5–2.0pt strokes", () => {
    const { ctx, lines } = createCtx(5);
    drawPassCircle(ctx, { cx: 100, cy: 100, rx: 16, ry: 10 });
    expect(lines.length).toBeGreaterThanOrEqual(20);
    for (const l of lines) {
      expect(l.thickness).toBeGreaterThanOrEqual(1.5);
      expect(l.thickness).toBeLessThanOrEqual(2.0 + 1e-9);
    }
    for (let i = 1; i < lines.length; i += 1) {
      expect(lines[i].startX).toBeCloseTo(lines[i - 1].endX);
      expect(lines[i].startY).toBeCloseTo(lines[i - 1].endY);
    }
  });
});

describe("drawSignature", () => {
  it("renders the same squiggle for the same name regardless of render seed", () => {
    const a = createCtx(1);
    const b = createCtx(999);
    drawSignature(a.ctx, "Jane Doe", { x: 10, y: 20 });
    drawSignature(b.ctx, "Jane Doe", { x: 10, y: 20 });
    expect(a.lines.length).toBeGreaterThan(0);
    expect(a.lines).toEqual(b.lines);
  });

  it("varies by name", () => {
    const a = createCtx(1);
    const b = createCtx(1);
    drawSignature(a.ctx, "Alice", { x: 0, y: 0 });
    drawSignature(b.ctx, "Bob", { x: 0, y: 0 });
    expect(a.lines).not.toEqual(b.lines);
  });

  it("no-ops on empty name", () => {
    const { ctx, lines } = createCtx(1);
    drawSignature(ctx, "  ", { x: 0, y: 0 });
    expect(lines).toHaveLength(0);
  });
});

describe("readPath", () => {
  it("resolves dotted paths to string leaves", () => {
    expect(readPath(sampleData, "vehicle.vin")).toBe("1HGCM82633A004352");
    expect(readPath(sampleData, "arn")).toBe("ARD-1");
    expect(readPath(sampleData, "condition.voltageGreaterThan12_1V")).toBe(
      "yes",
    );
  });

  it("throws on an unknown path", () => {
    expect(() => readPath(sampleData, "vehicle.bogus")).toThrow(/no path/);
    expect(() => readPath(sampleData, "nope")).toThrow(/no path/);
  });

  it("throws when the path resolves to an object", () => {
    expect(() => readPath(sampleData, "driver")).toThrow(
      /does not resolve to a scalar/,
    );
  });
});

describe("applyPlacements", () => {
  it("applies format to text values and draws signature/checkmark kinds", () => {
    const { ctx, texts, lines } = createCtx(2);
    const mapper: TemplateMapper = {
      key: "test_usa_ca",
      blankPdfPath: "test.pdf",
      placements: [
        {
          path: "inspection.date",
          x: 0,
          y: 0,
          format: (v) => `Date: ${v}`,
        },
        {
          path: "brakes.frontLeft",
          kind: "checkmark",
          x: 0,
          y: 10,
          when: (d) => d.brakes.frontLeft === "pass",
        },
        { path: "handler.signature", kind: "signature", x: 0, y: 20 },
      ],
    };
    applyPlacements(ctx, sampleData, mapper);
    expect(texts).toHaveLength(1);
    expect(texts[0].text).toBe("Date: 08/15/2026");
    // checkmark (2 lines) + signature squiggle (>2 lines)
    expect(lines.length).toBeGreaterThan(2);
  });

  it("skips placements whose when() is false", () => {
    const { ctx, texts, lines } = createCtx(1);
    const mapper: TemplateMapper = {
      key: "k",
      blankPdfPath: "b.pdf",
      placements: [
        { path: "driver.name", x: 0, y: 0, when: () => false },
        {
          path: "brakes.rearLeft",
          kind: "checkmark",
          x: 0,
          y: 0,
          when: (d) => d.brakes.rearLeft === "pass",
        },
      ],
    };
    applyPlacements(ctx, sampleData, mapper);
    expect(texts).toHaveLength(0);
    expect(lines).toHaveLength(0);
  });

  it("throws on an unknown placement path", () => {
    const { ctx } = createCtx(1);
    const mapper: TemplateMapper = {
      key: "k",
      blankPdfPath: "b.pdf",
      placements: [{ path: "nope.deep", x: 0, y: 0 }],
    };
    expect(() => applyPlacements(ctx, sampleData, mapper)).toThrow(/no path/);
  });
});