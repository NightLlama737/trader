import { NextRequest, NextResponse } from "next/server";
import { s3 } from "../../../lib/S3";
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "../../../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("key"); // z query

    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    // vytvoříme id z názvu souboru
    const id = key.split("/").pop()?.replace(".glb", "") || key;

    // presigned URL 1h
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    });
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return NextResponse.json({
      model: { id, key, url: signedUrl },
    });
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

    // delete object from S3
    try {
      const delCmd = new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key });
      await s3.send(delCmd);
    } catch (s3err) {
      console.error("S3 delete failed:", s3err);
      return NextResponse.json({ error: "Failed to delete object from S3" }, { status: 500 });
    }

    // delete Model rows from DB (may be multiple)
    const deletedModel = await prisma.model.deleteMany({ where: { key } });
        const deletedOffModel = await prisma.offModel.deleteMany({ where: { key } });


    return NextResponse.json({ ok: true, deletedModel, deletedOffModel });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete model" }, { status: 500 });
  }
}
