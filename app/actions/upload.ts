"use server";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface UploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  fileKey: string;
}

export async function generateUploadUrl(
  fileType: string,
  fileSize: number,
): Promise<UploadUrlResponse> {
  const fileKey = `${crypto.randomUUID()}-${Date.now()}`;

  if (process.env.UPLOADCARE_PUBLIC_KEY && !process.env.AWS_ACCESS_KEY_ID) {
    return {
      uploadUrl: "uploadcare",
      publicUrl: "",
      fileKey,
    };
  }

  if (process.env.AWS_ACCESS_KEY_ID) {
    const s3 = new S3Client({
      region: process.env.AWS_REGION ?? "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const extension = fileType.split("/").pop() ?? "bin";
    const key = `uploads/${fileKey}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: key,
      ContentType: fileType,
      ContentLength: fileSize,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return {
      uploadUrl,
      publicUrl: `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      fileKey,
    };
  }

  throw new Error(
    "No upload provider configured. Set UPLOADCARE_PUBLIC_KEY or AWS_ACCESS_KEY_ID.",
  );
}
