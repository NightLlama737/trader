import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../../../lib/S3"; // tvůj S3 klient

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  try {
    // vytvoříme GetObjectCommand pro S3
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!, // název bucketu z .env.local
      Key: key,
    });

    // vygenerujeme presigned URL
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hodina

    // URL bude ve tvaru: https://<bucket>.s3.<region>.amazonaws.com/...
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Failed to generate signed URL:", err);
    return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });
  }
}
