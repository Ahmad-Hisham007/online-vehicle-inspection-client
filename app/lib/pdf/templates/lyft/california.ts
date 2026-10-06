import type { TemplateMapper } from "../../types";

/**
 * Lyft certificate template for California.
 *
 * Coordinates source: `app/lib/pdf-coordinates/lyft_usa_ca.json`
 */
export const lyft_ca: TemplateMapper = {
  key: "lyft_usa_ca",
  blankPdfPath: "lyft_usa_ca.pdf",
  page: 0,
  placements: [
    // Driver info
    { path: "driver.name", x: 62, y: 702, size: 12 },
    { path: "driver.email", x: 372, y: 702, size: 11 },
    
    // Vehicle info (from driverInfo section)
    { path: "registration.licensePlate", x: 62, y: 660, size: 12 },
    { path: "vehicle.vin", x: 372, y: 660, size: 12 },
    { path: "vehicle.make", x: 62, y: 626, size: 12 },
    { path: "vehicle.model", x: 302, y: 626, size: 12 },
    { path: "vehicle.year", x: 482, y: 626, size: 12 },
    
    // Handler signature
    { path: "handler.signature", x: 62, y: 592, size: 12, kind: "signature" },
    
    // Checklist pass marks - using brake fields as proxies for now
    { path: "brakes.frontLeft", x: 234, y: 516 },
    { path: "brakes.frontRight", x: 234, y: 497 },
    { path: "brakes.rearLeft", x: 234, y: 478 },
    { path: "brakes.rearRight", x: 234, y: 460 },
    
    // Inspector info
    { path: "arn", x: 302, y: 86, size: 11 },
    { path: "facility.address", x: 58, y: 116, size: 11 },
    { path: "inspection.date", x: 302, y: 116, size: 11 },
    { path: "vehicle.mileage", x: 58, y: 86, size: 12 },
    { path: "handler.name", x: 62, y: 146, size: 12 },
    { path: "host.name", x: 302, y: 146, size: 12 },
  ],
};