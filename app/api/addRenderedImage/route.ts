import { prisma } from "../../../lib/prisma";
import { cookies } from "next/headers";
import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../../../lib/S3";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "png";
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const key = `renders/${userId}/${fileName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const renderedImage = await prisma.renderedImage.create({
      data: { userId, key, title: title?.trim() || null },
    });

    return NextResponse.json({ success: true, renderedImage, s3Key: key }, { status: 201 });
  } catch (err) {
    console.error("RENDER UPLOAD ERROR:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}