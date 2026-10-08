"use server";

import { unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { wpFetch } from "@/app/lib/wp-auth";
import { assertSessionActive } from "@/app/lib/refresh-token";
import { canAccessInspection } from "@/app/lib/access";
import { APPROVAL_GROUPS } from "@/app/lib/approval-fields";
import type {
  InspectionDetail,
  InspectionStatus,
  InspectionSummary,
  MediaItem,
  MediaTab,
  PaymentStatus,
  SortDir,
} from "@/app/lib/types";

export interface ListInspectionsParams {
  page?: number;
  perPage?: number;
  status?: InspectionStatus | null;
  sortDir?: SortDir;
}

export interface InspectionsPage {
  items: InspectionSummary[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

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
  inspectionStatus: string | string[];
  paymentStatus: string | string[];
  numberOfDoors: string;
  numberOfSeatbelts: string;
  tncLicensePlatesLast4Digit: string;
  hasRegistrationSticker: string;
  registrationStickerMonthyear: string;
  zip: string;
  tiresOlderThan6Years: string;
  batteryOlderThan5Years: string;
  voltageGreaterThan12_1V: string;
  minPerManufacturerFront: string;
  minPerManufacturerRear: string;
  frontBrakeLeft: string;
  frontBrakeRight: string;
  rearBrakeLeft: string;
  rearBrakeRight: string;
  tireRightFrontDepth: string;
  tireLeftFrontDepth: string;
  tireRightRearDepth: string;
  tireLeftRearDepth: string;
  handlerName: string;
  handlerSignature: string;
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
  assignedInspector: {
    databaseId: number;
    name?: string;
  } | null;
  inspectionDetails: InspectionDetailsNode;
}

interface ListInspectionsResponse {
  inspections: {
    nodes: InspectionNode[];
    pageInfo?: {
      total?: number;
    };
  };
}

interface GetInspectionResponse {
  inspection: InspectionNode | null;
}

const DEFAULT_PER_PAGE = 8;
const LIST_CACHE_REVALIDATE = 300; // seconds (5 min — list freshness)
const DETAIL_CACHE_REVALIDATE = 86400; // seconds (24h — detail is immutable after approval)

const MEDIA_GROUPS: Record<
  MediaTab,
  {
    field: keyof InspectionDetailsNode;
    label: string;
    type: "image" | "video";
  }[]
> = {
  general: [
    {
      field: "registrationCardPhoto",
      label: "Registration Card",
      type: "image",
    },
    { field: "odometerPhoto", label: "Odometer", type: "image" },
    { field: "hornVideo", label: "Horn", type: "video" },
  ],
  interior: [
    {
      field: "interiorDriverSidePhoto",
      label: "Interior Driver Side",
      type: "image",
    },
    {
      field: "driverSeatAdjustmentPhoto",
      label: "Driver Seat Adjustment",
      type: "image",
    },
    {
      field: "interiorPassengerSidePhoto",
      label: "Interior Passenger Side",
      type: "image",
    },
    {
      field: "passengerSeatAdjustmentPhoto",
      label: "Passenger Seat Adjustment",
      type: "image",
    },
    {
      field: "interiorBackseatPhoto",
      label: "Interior Backseat",
      type: "image",
    },
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

function mapMedia(
  details: InspectionDetailsNode,
): Record<MediaTab, MediaItem[]> {
  const media: Record<MediaTab, MediaItem[]> = {
    general: [],
    interior: [],
    exterior: [],
    tires: [],
  };

  for (const tab of Object.keys(MEDIA_GROUPS) as MediaTab[]) {
    for (const { field, label, type } of MEDIA_GROUPS[tab]) {
      const url = asString(details[field]);
      if (url) {
        media[tab].push({ label, url, type });
      }
    }
  }

  return media;
}

function asString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function mapApprovalFields(
  details: InspectionDetailsNode,
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const group of APPROVAL_GROUPS) {
    for (const field of group.fields) {
      fields[field.name] = asString(
        details[field.name as keyof InspectionDetailsNode],
      );
    }
  }
  return fields;
}

function mapSummary(node: InspectionNode): InspectionSummary {
  return {
    id: node.databaseId.toString(),
    licensePlate: node.inspectionDetails.licensePlateNumber,
    dateCreated: node.date,
    inspectionStatus: asString(
      node.inspectionDetails.inspectionStatus,
    ) as InspectionStatus,
    paymentStatus: asString(
      node.inspectionDetails.paymentStatus,
    ) as PaymentStatus,
  };
}

function mapDetail(node: InspectionNode): InspectionDetail {
  const details = node.inspectionDetails;
  const country = details.inspectionCountry.toUpperCase();
  const isUsa = country === "USA";
  const stateCode = isUsa
    ? details.inspectionStateUsa
    : details.inspectionStateCanada;

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
      ? details.inspectionCompanies
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [],
    inspectionDate: details.inspectionDate,
    expiryDate: details.expiryDate,
    hostName: details.hostName,
    hostEmail: details.hostEmail,
    hostPhoneNumber: details.hostPhoneNumber,
    driverName: node.author?.node.name ?? node.author?.node.displayName ?? "",
    driverEmail: node.author?.node.email ?? "",
    media: mapMedia(details),
    certificates: {
      lyft: details.lyftCertificate || undefined,
      uber: details.uberCertificate || undefined,
      turo: details.turoCertificate || undefined,
    },
    orderSubtotal: details.orderSubtotal,
    assignedInspector: node.assignedInspector
      ? {
          databaseId: node.assignedInspector.databaseId,
          name: node.assignedInspector.name ?? "",
        }
      : null,
    approvalFields: mapApprovalFields(details),
  };
}

const LIST_QUERY = `
  query ListMyInspections(
    $author: Int!
    $limit: Int
    $offset: Int
    $inspectionStatus: String
    $order: OrderEnum! = DESC
  ) {
    inspections(
      where: {
        author: $author
        limit: $limit
        offset: $offset
        inspectionStatus: $inspectionStatus
        orderby: { field: DATE, order: $order }
      }
    ) {
      nodes {
        databaseId
        title
        date
        inspectionDetails {
          licensePlateNumber
          inspectionStatus
          paymentStatus
          vehicleMake
          vehicleModel
        }
      }
      pageInfo {
        total
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
      assignedInspector {
        databaseId
        name
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
        numberOfDoors
        numberOfSeatbelts
        tncLicensePlatesLast4Digit
        hasRegistrationSticker
        registrationStickerMonthyear
        zip
        tiresOlderThan6Years
        batteryOlderThan5Years
        voltageGreaterThan12_1V
        minPerManufacturerFront
        minPerManufacturerRear
        frontBrakeLeft
        frontBrakeRight
        rearBrakeLeft
        rearBrakeRight
        tireRightFrontDepth
        tireLeftFrontDepth
        tireRightRearDepth
        tireLeftRearDepth
        handlerName
        handlerSignature
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

interface InspectionsPageParams {
  token: string;
  author: number;
  page: number;
  perPage: number;
  status: InspectionStatus | null;
  sortDir: SortDir;
}

const getInspectionsPageCached = unstable_cache(
  async (params: InspectionsPageParams) => {
    const { token, author, page, perPage, status, sortDir } = params;

    const data = await wpFetch<ListInspectionsResponse>(
      LIST_QUERY,
      {
        author,
        inspectionStatus: status ?? null,
        order: sortDir === "oldest" ? "ASC" : "DESC",
        limit: perPage,
        offset: (page - 1) * perPage,
      },
      { accessToken: token },
    );

    const nodes = data.inspections?.nodes ?? [];
    const total = data.inspections?.pageInfo?.total ?? nodes.length;

    return { items: nodes.map(mapSummary), total };
  },
  ["inspections", "page"],
  { revalidate: LIST_CACHE_REVALIDATE, tags: ["inspections"] },
);

interface InspectionDetailParams {
  token: string;
  id: string;
}

const getInspectionDetailNodeCached = unstable_cache(
  async (params: InspectionDetailParams): Promise<InspectionNode> => {
    const data = await wpFetch<GetInspectionResponse>(
      DETAIL_QUERY,
      { id: params.id },
      { accessToken: params.token },
    );

    if (!data.inspection) {
      throw new Error("Inspection not found");
    }

    return data.inspection;
  },
  ["inspection", "detail"],
  { revalidate: DETAIL_CACHE_REVALIDATE, tags: ["inspection"] },
);

export async function listInspections(
  params: ListInspectionsParams = {},
): Promise<InspectionsPage> {
  const session = await auth();
  if (!session?.user?.accessToken) {
    throw new Error("Unauthorized");
  }
  assertSessionActive(session.error);

  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.max(1, params.perPage ?? DEFAULT_PER_PAGE);

  const { items, total } = await getInspectionsPageCached({
    token: session.user.accessToken,
    author: session.user.wpId,
    page,
    perPage,
    status: params.status ?? null,
    sortDir: params.sortDir ?? "newest",
  });

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);

  return { items, page: safePage, perPage, total, totalPages };
}

export async function fetchInspection(id: string): Promise<InspectionDetail> {
  const session = await auth();
  if (!session?.user?.accessToken) {
    throw new Error("Unauthorized");
  }
  assertSessionActive(session.error);

  const node = await getInspectionDetailNodeCached({
    token: session.user.accessToken,
    id,
  });

  const allowed = canAccessInspection(
    { wpId: session.user.wpId, role: session.user.role },
    {
      authorDatabaseId: node.author?.node?.databaseId ?? null,
      assignedInspectorDatabaseId: node.assignedInspector?.databaseId ?? null,
    },
  );

  if (!allowed) {
    throw new Error("Inspection not found");
  }

  return mapDetail(node);
}
