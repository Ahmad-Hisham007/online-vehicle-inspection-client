"use server";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface UploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  fileKey: string;
  contentType: string;
}

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  "video/webm": "webm",
};

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  heic: "image/heic",
  webp: "image/webp",
  bmp: "image/bmp",
  tiff: "image/tiff",
  mp4: "video/mp4",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  webm: "video/webm",
};

function resolveExtension(fileType: string): string {
  if (EXTENSION_BY_MIME[fileType]) return EXTENSION_BY_MIME[fileType];
  const fromMime = fileType.split("/").pop();
  if (fromMime) return fromMime;
  return "bin";
}

function resolveContentType(fileType: string, extension: string): string {
  if (fileType) return fileType;
  return CONTENT_TYPE_BY_EXTENSION[extension] ?? "application/octet-stream";
}

export async function generateUploadUrl(
  fileType: string,
  fileSize: number,
): Promise<UploadUrlResponse> {
  const zoneName = process.env.BUNNY_STORAGE_ZONE_NAME;
  const zonePassword = process.env.BUNNY_STORAGE_PASSWORD;
  const region = process.env.BUNNY_STORAGE_REGION;
  const pullZoneHost = process.env.BUNNY_PULL_ZONE_HOSTNAME;

  if (!zoneName || !zonePassword || !region || !pullZoneHost) {
    throw new Error(
      "Bunny Storage is not fully configured. Set BUNNY_STORAGE_ZONE_NAME, BUNNY_STORAGE_PASSWORD, BUNNY_STORAGE_REGION and BUNNY_PULL_ZONE_HOSTNAME.",
    );
  }

  const fileKey = `${crypto.randomUUID()}-${Date.now()}`;
  const extension = resolveExtension(fileType);
  const key = `uploads/${fileKey}.${extension}`;
  const contentType = resolveContentType(fileType, extension);

  const client = new S3Client({
    region,
    endpoint: `https://${region}-s3.storage.bunnycdn.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: zoneName,
      secretAccessKey: zonePassword,
    },
  });

  const command = new PutObjectCommand({
    Bucket: zoneName,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

  return {
    uploadUrl,
    publicUrl: `https://${pullZoneHost}/${key}`,
    fileKey,
    contentType,
  };
}