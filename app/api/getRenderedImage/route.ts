import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../../../lib/S3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // If userId provided — show public renders for that user (profile page)
    // Otherwise show current user's renders
    let userId = searchParams.get("userId");

    if (!userId) {
      const cookieStore = await cookies();
      const cookie = cookieStore.get("user")?.value;
      userId = cookie ? JSON.parse(cookie).id : null;
    }

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const images = await prisma.renderedImage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const imagesWithUrl = await Promise.all(
      images.map(async (img) => {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: img.key,
        });
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        return { ...img, url };
      })
    );

    return NextResponse.json({ images: imagesWithUrl });
  } catch (err) {
    console.error("GET RENDERED IMAGES ERROR:", err);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;

    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const image = await prisma.renderedImage.findUnique({ where: { id } });
    if (!image || image.userId !== userId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    await prisma.renderedImage.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE RENDERED IMAGE ERROR:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}