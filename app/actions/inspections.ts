"use server";

import { auth } from "@/auth";
import { wpFetch } from "@/app/lib/wp-auth";
import type {
  InspectionDetail,
  InspectionStatus,
  InspectionSummary,
  MediaItem,
  MediaTab,
  PaymentStatus,
} from "@/app/lib/types";

interface InspectionDetailsNode {
  licensePlateNumber: string;
  vin: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  vehicleMileage: string;
  fuelType: string;
  inspectionCountry: string;
  inspectionStateUsa: string;
  inspectionStateCanada: string;
  inspectionCompanies: string;
  inspectionDate: string;
  expiryDate: string;
  hostName: string;
  hostEmail: string;
  hostPhoneNumber: string;
  orderSubtotal: string;
  inspectionStatus: InspectionStatus;
  paymentStatus: PaymentStatus;
  registrationCardPhoto: string;
  odometerPhoto: string;
  hornVideo: string;
  interiorDriverSidePhoto: string;
  driverSeatAdjustmentPhoto: string;
  interiorPassengerSidePhoto: string;
  passengerSeatAdjustmentPhoto: string;
  interiorBackseatPhoto: string;
  exteriorLeftPhoto: string;
  exteriorRightPhoto: string;
  exteriorFrontVideo: string;
  exteriorRearVideo: string;
  leftFrontTirePhoto: string;
  rightFrontTirePhoto: string;
  leftRearTirePhoto: string;
  rightRearTirePhoto: string;
  lyftCertificate: string;
  uberCertificate: string;
  turoCertificate: string;
}

interface InspectionNode {
  databaseId: number;
  title: string;
  date: string;
  author: {
    node: {
      databaseId: number;
      displayName?: string;
      name?: string;
      email?: string;
    };
  } | null;
  inspectionDetails: InspectionDetailsNode;
}

interface ListInspectionsResponse {
  inspections: {
    nodes: InspectionNode[];
  };
}

interface GetInspectionResponse {
  inspection: InspectionNode | null;
}

const MEDIA_GROUPS: Record<MediaTab, { field: keyof InspectionDetailsNode; label: string; type: "image" | "video" }[]> = {
  general: [
    { field: "registrationCardPhoto", label: "Registration Card", type: "image" },
    { field: "odometerPhoto", label: "Odometer", type: "image" },
    { field: "hornVideo", label: "Horn", type: "video" },
  ],
  interior: [
    { field: "interiorDriverSidePhoto", label: "Interior Driver Side", type: "image" },
    { field: "driverSeatAdjustmentPhoto", label: "Driver Seat Adjustment", type: "image" },
    { field: "interiorPassengerSidePhoto", label: "Interior Passenger Side", type: "image" },
    { field: "passengerSeatAdjustmentPhoto", label: "Passenger Seat Adjustment", type: "image" },
    { field: "interiorBackseatPhoto", label: "Interior Backseat", type: "image" },
  ],
  exterior: [
    { field: "exteriorLeftPhoto", label: "Exterior Left", type: "image" },
    { field: "exteriorRightPhoto", label: "Exterior Right", type: "image" },
    { field: "exteriorFrontVideo", label: "Exterior Front", type: "video" },
    { field: "exteriorRearVideo", label: "Exterior Rear", type: "video" },
  ],
  tires: [
    { field: "leftFrontTirePhoto", label: "Left Front Tire", type: "image" },
    { field: "rightFrontTirePhoto", label: "Right Front Tire", type: "image" },
    { field: "leftRearTirePhoto", label: "Left Rear Tire", type: "image" },
    { field: "rightRearTirePhoto", label: "Right Rear Tire", type: "image" },
  ],
};

function mapMedia(details: InspectionDetailsNode): Record<MediaTab, MediaItem[]> {
  const media: Record<MediaTab, MediaItem[]> = {
    general: [],
    interior: [],
    exterior: [],
    tires: [],
  };

  for (const tab of Object.keys(MEDIA_GROUPS) as MediaTab[]) {
    for (const { field, label, type } of MEDIA_GROUPS[tab]) {
      const url = details[field];
      if (url) {
        media[tab].push({ label, url, type });
      }
    }
  }

  return media;
}

function mapSummary(node: InspectionNode): InspectionSummary {
  return {
    id: node.databaseId.toString(),
    licensePlate: node.inspectionDetails.licensePlateNumber,
    dateCreated: node.date,
    inspectionStatus: node.inspectionDetails.inspectionStatus,
    paymentStatus: node.inspectionDetails.paymentStatus,
  };
}

function mapDetail(node: InspectionNode): InspectionDetail {
  const details = node.inspectionDetails;
  const country = details.inspectionCountry.toUpperCase();
  const isUsa = country === "USA";
  const stateCode = isUsa ? details.inspectionStateUsa : details.inspectionStateCanada;

  return {
    ...mapSummary(node),
    vin: details.vin,
    make: details.vehicleMake,
    model: details.vehicleModel,
    year: details.vehicleYear,
    fuelType: details.fuelType,
    mileage: details.vehicleMileage,
    color: details.vehicleColor,
    location: { country, state: stateCode },
    companies: details.inspectionCompanies
      ? details.inspectionCompanies.split(",").map((c) => c.trim()).filter(Boolean)
      : [],
    inspectionDate: details.inspectionDate,
    expiryDate: details.expiryDate,
    hostName: details.hostName,
    hostEmail: details.hostEmail,
    hostPhoneNumber: details.hostPhoneNumber,
    media: mapMedia(details),
    certificates: {
      lyft: details.lyftCertificate || undefined,
      uber: details.uberCertificate || undefined,
      turo: details.turoCertificate || undefined,
    },
    orderSubtotal: details.orderSubtotal,
  };
}

const LIST_QUERY = `
  query ListMyInspections($author: Int!) {
    inspections(where: { author: $author }) {
      nodes {
        databaseId
        title
        date
        author {
          node {
            databaseId
            displayName
          }
        }
        inspectionDetails {
          licensePlateNumber
          inspectionStatus
          paymentStatus
        }
      }
    }
  }
`;

const DETAIL_QUERY = `
  query GetInspectionDetail($id: ID!) {
    inspection(id: $id, idType: DATABASE_ID) {
      databaseId
      title
      date
      author {
        node {
          databaseId
          name
          email
        }
      }
      inspectionDetails {
        licensePlateNumber
        vin
        vehicleMake
        vehicleModel
        vehicleYear
        vehicleColor
        vehicleMileage
        fuelType
        inspectionCountry
        inspectionStateUsa
        inspectionStateCanada
        inspectionCompanies
        inspectionDate
        expiryDate
        hostName
        hostEmail
        hostPhoneNumber
        orderSubtotal
        inspectionStatus
        paymentStatus
        registrationCardPhoto
        odometerPhoto
        hornVideo
        interiorDriverSidePhoto
        driverSeatAdjustmentPhoto
        interiorPassengerSidePhoto
        passengerSeatAdjustmentPhoto
        interiorBackseatPhoto
        exteriorLeftPhoto
        exteriorRightPhoto
        exteriorFrontVideo
        exteriorRearVideo
        leftFrontTirePhoto
        rightFrontTirePhoto
        leftRearTirePhoto
        rightRearTirePhoto
        lyftCertificate
        uberCertificate
        turoCertificate
      }
    }
  }
`;

export async function listInspections(): Promise<InspectionSummary[]> {
  const session = await auth();
  if (!session?.user?.accessToken) {
    throw new Error("Unauthorized");
  }

  const data = await wpFetch<ListInspectionsResponse>(LIST_QUERY, {
    author: session.user.wpId,
  });

  return (data.inspections?.nodes ?? []).map(mapSummary);
}

export async function fetchInspection(id: string): Promise<InspectionDetail> {
  const session = await auth();
  if (!session?.user?.accessToken) {
    throw new Error("Unauthorized");
  }

  const data = await wpFetch<GetInspectionResponse>(DETAIL_QUERY, { id });

  if (!data.inspection) {
    throw new Error("Inspection not found");
  }

  return mapDetail(data.inspection);
}