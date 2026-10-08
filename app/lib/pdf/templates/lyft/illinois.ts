import type { TemplateMapper } from "../../types";

/**
 * Lyft certificate template for Illinois (Chicago area).
 * 
 * PROOF OF CONCEPT: Uses existing PDF layout.
 */
export const lyft_il: TemplateMapper = {
  key: "lyft_usa_il",
  blankPdfPath: "lyft_us_il.pdf",
  page: 0,
  placements: [
    // Driver info
    { path: "driver.name", x: 62, y: 702, size: 12 },
    { path: "driver.email", x: 312, y: 702, size: 11 },
    { path: "registration.licensePlate", x: 62, y: 662, size: 12 },
    { path: "vehicle.vin", x: 312, y: 662, size: 12 },
    { path: "vehicle.make", x: 62, y: 628, size: 12 },
    { path: "vehicle.model", x: 242, y: 628, size: 12 },
    { path: "vehicle.year", x: 452, y: 628, size: 12 },
    
    // Handler signature
    { path: "handler.signature", x: 62, y: 594, size: 12, kind: "signature" },
    { path: "driver.phone", x: 312, y: 594, size: 11 },
    
    // Checklist pass marks
    { path: "brakes.frontLeft", x: 234, y: 520 },
    { path: "brakes.frontRight", x: 234, y: 502 },
    { path: "brakes.rearLeft", x: 234, y: 484 },
    { path: "brakes.rearRight", x: 234, y: 466 },
    
    // Inspector info
    { path: "arn", x: 302, y: 86, size: 11 },
    { path: "facility.address", x: 58, y: 116, size: 11 },
    { path: "inspection.date", x: 302, y: 116, size: 11 },
    { path: "vehicle.mileage", x: 58, y: 86, size: 12 },
    { path: "handler.name", x: 62, y: 146, size: 12 },
    { path: "host.name", x: 302, y: 146, size: 12 },
  ],
};