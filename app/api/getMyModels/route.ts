// app/api/getMyModels/route.ts
import { NextResponse } from "next/server";
import { s3 } from "../../../lib/S3";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "../../../lib/prisma";

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get("cookie");
    if (!cookie) return NextResponse.json({ models: [] });

    const parsed = Object.fromEntries(
      cookie.split("; ").map((c) => {
        const [key, val] = c.split("=");
        return [key, decodeURIComponent(val)];
      })
    );

    const userCookie = parsed.user;
    if (!userCookie) return NextResponse.json({ models: [] });

    const user = JSON.parse(userCookie);

    const bucket = process.env.AWS_S3_BUCKET!;
    const prefix = `models/${user.id}/`;

    const s3Objects = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix })
    );

    // Fetch all offModel keys for this user to determine trading status
    const offModels = await prisma.offModel.findMany({
      where: { userId: user.id },
      select: { key: true },
    });
    const tradingKeys = new Set(offModels.map((o) => o.key));

    const models = await Promise.all(
      (s3Objects.Contents || []).map(async (obj) => {
        if (!obj.Key) return null;

        const command = new GetObjectCommand({ Bucket: bucket, Key: obj.Key });
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

        return {
          key: obj.Key,
          id: obj.Key.split("/").pop(),
          url,
          lastModified: obj.LastModified,
          size: obj.Size,
          isTrading: tradingKeys.has(obj.Key),
        };
      })
    );

    return NextResponse.json({ models: models.filter(Boolean) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("GET MY MODELS ERROR:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}