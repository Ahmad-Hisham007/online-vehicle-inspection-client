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

  const uploadcareKey = process.env.UPLOADCARE_PUBLIC_KEY;
  const awsKey = process.env.AWS_ACCESS_KEY_ID;
  const awsSecret = process.env.AWS_SECRET_ACCESS_KEY;
  const awsBucket = process.env.AWS_BUCKET;

  if (uploadcareKey && !(awsKey && awsSecret && awsBucket)) {
    return {
      uploadUrl: "uploadcare",
      publicUrl: "",
      fileKey,
    };
  }

  if (awsKey && awsSecret && awsBucket) {
    const s3 = new S3Client({
      region: process.env.AWS_REGION ?? "us-east-1",
      credentials: {
        accessKeyId: awsKey,
        secretAccessKey: awsSecret,
      },
    });

    const extension = fileType.split("/").pop() ?? "bin";
    const key = `uploads/${fileKey}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: awsBucket,
      Key: key,
      ContentType: fileType,
      ContentLength: fileSize,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return {
      uploadUrl,
      publicUrl: `https://${awsBucket}.s3.${process.env.AWS_REGION ?? "us-east-1"}.amazonaws.com/${key}`,
      fileKey,
    };
  }

  throw new Error(
    "No upload provider fully configured. Set UPLOADCARE_PUBLIC_KEY, or all of AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET.",
  );
}
