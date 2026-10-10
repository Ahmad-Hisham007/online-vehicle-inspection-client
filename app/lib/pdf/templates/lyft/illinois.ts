import type { TemplateMapper } from "../../types";

/**
 * Lyft certificate template for Illinois (Chicago area).
 *
 * PROOF OF CONCEPT: Uses existing PDF layout.
 */
export const lyft_il: TemplateMapper = {
  key: "lyft_us_il",
  blankPdfPath: "lyft_us_il.pdf",
  page: 0,
  placements: [
    // Driver info
    { path: "host.name", x: 62, y: 708, size: 12 },
    { path: "host.email", x: 375, y: 708, size: 11 },
    { path: "registration.licensePlate", x: 62, y: 678, size: 12 },
    {
      path: "vehicle.vin",
      kind: "vinBoxes", // ← CHANGE TO THIS
      x: 261, // Starting x position
      y: 678, // Y position for all letters
      xStart: 261, // Where first letter starts
      spacing: 18, // Spacing between letters (adjust based font size)
      size: 14, // Font size (we increased this to 14)
    },
    { path: "vehicle.make", x: 62, y: 652, size: 12 },
    { path: "vehicle.model", x: 272, y: 652, size: 12 },
    { path: "vehicle.year", x: 502, y: 652, size: 12 },

    // Handler signature
    { path: "handler.signature", x: 62, y: 594, size: 12, kind: "signature" },
    { path: "host.phone", x: 272, y: 625, size: 11 },

    // Checklist pass marks
    { path: "tires.leftFront", x: 390, y: 430 },
    { path: "tires.leftFront", x: 432, y: 430 },
    { path: "tires.leftFront", x: 475, y: 430 },
    // Checklist pass marks
    { path: "tires.rightFront", x: 390, y: 410 },
    { path: "tires.rightFront", x: 432, y: 410 },
    { path: "tires.rightFront", x: 475, y: 410 },
    // Checklist pass marks
    { path: "tires.leftRear", x: 390, y: 387 },
    { path: "tires.leftRear", x: 432, y: 387 },
    { path: "tires.leftRear", x: 475, y: 387 },
    // Checklist pass marks
    { path: "tires.rightRear", x: 390, y: 365 },
    { path: "tires.rightRear", x: 432, y: 365 },
    { path: "tires.rightRear", x: 475, y: 365 },

    // Inspector info
    { path: "facility.name", x: 58, y: 128, size: 11 },
    { path: "handler.name", x: 320, y: 128, size: 11 },
    { path: "facility.address", x: 58, y: 102, size: 11 },
    { path: "inspection.date", x: 320, y: 102, size: 11 },
    { path: "handler.signature", x: 58, y: 72, size: 11 },
  ],
};
