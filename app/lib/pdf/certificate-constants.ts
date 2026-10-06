export interface FacilityInfo {
  name: string;
  address: string;
}

export interface CertificateConstants {
  /** Approved Repair/Inspection Facility ARD number printed on the certificate. */
  arn: string;
  facility: FacilityInfo;
}

/**
 * Per-company ARD + facility identity (spec §3.6).
 * Values are business TBD — the shape is locked; swap the placeholders
 * before launch. Overridable per render via the reserved override keys
 * (`arn`, `facilityName`, `facilityAddress`) in `buildCertificateData`.
 */
export const CERTIFICATE_CONSTANTS: Record<string, CertificateConstants> = {
  uber: {
    arn: "ARD-00000001",
    facility: {
      name: "RideShare Inspection Center",
      address: "1234 Inspection Blvd, Los Angeles, CA 90001",
    },
  },
  lyft: {
    arn: "ARD-00000002",
    facility: {
      name: "RideShare Inspection Center",
      address: "1234 Inspection Blvd, Los Angeles, CA 90001",
    },
  },
  turo: {
    arn: "ARD-00000003",
    facility: {
      name: "RideShare Inspection Center",
      address: "1234 Inspection Blvd, Los Angeles, CA 90001",
    },
  },
};

/** Constants for a company, or empty values for an unknown one. */
export function getCertificateConstants(
  company: string,
): CertificateConstants {
  return (
    CERTIFICATE_CONSTANTS[company] ?? {
      arn: "",
      facility: { name: "", address: "" },
    }
  );
}