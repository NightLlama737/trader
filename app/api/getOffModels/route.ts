import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/S3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET() {
  try {
    const models = await prisma.offModel.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        name: true,
        description: true,
        price: true,
        key: true,        // uložený S3 key
        createdAt: true,
      },
    });

    // Převod S3 key → presigned URL
    const modelsWithUrl = await Promise.all(
      models.map(async (m) => {
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: m.key,
        });
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hodina
        return { ...m, url };
      })
    );

    return NextResponse.json({ models: modelsWithUrl });
  } catch (err) {
    console.error("Failed to fetch offModels:", err);
    return NextResponse.json({ error: "Failed to fetch offModels" }, { status: 500 });
  }
}
