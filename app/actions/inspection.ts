"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { calculatePrice } from "@/app/lib/constants";
import { wpFetch } from "@/app/lib/wp-auth";
import type {
  VehicleInfo,
  VinInfo,
  InspectionScope,
  UploadFields,
  ReviewAgreement,
} from "@/app/lib/schemas";

export interface InspectionFormData {
  vehicleInfo: VehicleInfo | null;
  vinInfo: VinInfo | null;
  inspectionScope: InspectionScope | null;
  uploadFields: UploadFields | null;
  reviewAgreement: ReviewAgreement | null;
}

interface CreateInspectionResponse {
  createInspection: {
    inspection: {
      id: string;
      databaseId: number;
    };
  };
}

interface UpdateInspectionResponse {
  updateInspection: {
    inspection: {
      id: string;
      title: string;
    };
  };
}

export async function createInspectionDraft(
  formData: InspectionFormData,
): Promise<{ inspectionId: string }> {
  const session = await auth();
  if (!session?.user?.accessToken) {
    throw new Error("Unauthorized");
  }

  const {
    vehicleInfo,
    vinInfo,
    inspectionScope,
    uploadFields,
    reviewAgreement,
  } = formData;

  if (!vehicleInfo || !vinInfo || !inspectionScope) {
    throw new Error("Required form data missing");
  }

  const now = new Date();
  const title = `Inspection - ${vehicleInfo.licensePlate}`;

  const FILE_FIELD_MAP: Record<string, string> = {
    interiorBackSeatPhoto: "interiorBackseatPhoto",
  };

  const fileFields: Record<string, string> = {};
  if (uploadFields) {
    for (const [key, meta] of Object.entries(uploadFields)) {
      if (meta?.status === "done" && meta.publicUrl) {
        const mappedKey = FILE_FIELD_MAP[key] ?? key;
        fileFields[mappedKey] = meta.publicUrl;
      }
    }
  }

  const price = calculatePrice(inspectionScope.companies);

  const inspectionDetails: Record<string, unknown> = {
    licensePlateNumber: vehicleInfo.licensePlate,
    vehicleMileage: String(vehicleInfo.mileage),
    tncLicensePlatesLast4Digit: vehicleInfo.licensePlate.slice(-4),

    vin: vinInfo.vin,
    vehicleMake: vinInfo.make,
    vehicleModel: vinInfo.model,
    vehicleYear: String(vinInfo.year),
    fuelType: vinInfo.fuelType,

    inspectionCountry: inspectionScope.country.toUpperCase(),
    ...(inspectionScope.country === "usa"
      ? { inspectionStateUsa: inspectionScope.state, inspectionStateCanada: "" }
      : {
          inspectionStateCanada: inspectionScope.state,
          inspectionStateUsa: "",
        }),
    inspectionCompanies: inspectionScope.companies.join(", "),

    tiresOlderThan6Years: String(inspectionScope.tiresOlderThan6Years ?? false),
    batteryOlderThan5Years: String(
      inspectionScope.batteryOlderThan5Years ?? false,
    ),
    voltageGreaterThan12_1V: String(
      inspectionScope.voltageGreaterThan12_1V ?? false,
    ),

    inspectionDate: now.toISOString().split("T")[0],
    inspectionMonth: String(now.getMonth() + 1),
    inspectionDay: String(now.getDate()),
    inspectionYear: String(now.getFullYear()),

    orderSubtotal: String(price.total),

    ...fileFields,

    userAgreement: String(reviewAgreement?.userAgreement ?? false),
    inspectionAgreement: String(reviewAgreement?.inspectionAgreement ?? false),

    paymentStatus: "pending",
    inspectionStatus: "pending",
  };

  const mutation = `
    mutation CreateInspection($input: CreateInspectionInput!) {
      createInspection(input: $input) {
        inspection {
          id
          databaseId
        }
      }
    }
  `;

  const variables = {
    input: {
      title,
      status: "PUBLISH",
      inspectionDetails,
    },
  };

  const data = await wpFetch<CreateInspectionResponse>(mutation, variables);

  const databaseId = data.createInspection.inspection.databaseId.toString();

  // Update title to include the inspection ID
  const updateMutation = `
    mutation UpdateInspection($input: UpdateInspectionInput!) {
      updateInspection(input: $input) {
        inspection { id title }
      }
    }
  `;

  await wpFetch<UpdateInspectionResponse>(updateMutation, {
    input: {
      id: databaseId,
      title: `Inspection #${databaseId} - ${vehicleInfo.licensePlate}`,
    },
  });

  revalidatePath("/dashboard/customer");

  return { inspectionId: databaseId };
}
