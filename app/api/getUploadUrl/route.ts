import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../../../lib/S3";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { fileName, contentType, prefix = "models" } = await req.json();

    if (!fileName || !contentType) {
      return NextResponse.json({ error: "Missing fileName or contentType" }, { status: 400 });
    }

    // Bezpečnostní kontrola prefixu
    const allowedPrefixes = ["models", "renders"];
    const safePrefix = allowedPrefixes.includes(prefix) ? prefix : "models";

    const ext = fileName.split(".").pop() || "bin";
    const uniqueFileName = `${crypto.randomUUID()}.${ext}`;
    const key = `${safePrefix}/${userId}/${uniqueFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({ uploadUrl, key });
  } catch (err) {
    console.error("GET UPLOAD URL ERROR:", err);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}