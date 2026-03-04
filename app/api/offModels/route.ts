// app/api/models/route.ts
import { NextRequest, NextResponse } from "next/server";
import { s3 } from "../../../lib/S3";
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "../../../lib/prisma"; // předpoklad: máte export PrismaClient v lib/prisma.ts

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    // Najdeme OffModel podle key
    const offModel = await prisma.offModel.findUnique({
      where: { key },
      include: { model: true }, // pokud chceš i informace o souvisejícím modelu
    });

    if (!offModel) {
      return NextResponse.json({ error: "OffModel not found" }, { status: 404 });
    }

    // Presigned URL pro S3
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    });
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // Vytvoříme návratový objekt
    const modelData = {
      id: offModel.id,
      key: offModel.key,
      name: offModel.name,
      description: offModel.description,
      price: offModel.price,
      url: signedUrl,
    };

    return NextResponse.json({ model: modelData });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to get model" }, { status: 500 });
  }
}

  export async function DELETE(req: NextRequest) {
    try {
      const url = new URL(req.url);
      const key = url.searchParams.get("key");

      if (!key) {
        return NextResponse.json({ error: "Missing key" }, { status: 400 });
      }

      // 1) delete object from S3
      try {
        const delCmd = new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: key,
        });
        await s3.send(delCmd);
      } catch (s3err) {
        console.error("S3 delete failed:", s3err);
        return NextResponse.json({ error: "Failed to delete object from S3" }, { status: 500 });
      }

      // 2) delete DB record
      const deleted = await prisma.offModel.delete({ where: { key } });

      return NextResponse.json({ ok: true, deleted });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Failed to delete model" }, { status: 500 });
    }
  }
