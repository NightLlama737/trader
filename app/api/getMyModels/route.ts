// app/api/getMyModels/route.ts
import { NextResponse } from "next/server";
import { s3 } from "../../../lib/S3";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get("cookie");
    if (!cookie) return NextResponse.json({ models: [] });

    // Parse cookies
    const parsed = Object.fromEntries(
      cookie.split("; ").map((c) => {
        const [key, val] = c.split("=");
        return [key, decodeURIComponent(val)];
      })
    );

    const userCookie = parsed.user;
    if (!userCookie) return NextResponse.json({ models: [] });

    const user = JSON.parse(userCookie); // { id, nickname }

    const bucket = process.env.AWS_S3_BUCKET!;
    const region = process.env.AWS_REGION!;
    const prefix = `models/${user.id}/`; // složka konkrétního uživatele

    // Načteme všechny soubory z S3 pro daného uživatele
    const s3Objects = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
      })
    );

    // Vygenerujeme presigned URL pro každý soubor
    const models = await Promise.all(
      (s3Objects.Contents || []).map(async (obj) => {
        if (!obj.Key) return null;

        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: obj.Key,
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hodina

        return {
          key: obj.Key,
          id: obj.Key.split("/").pop(),
          url,
          lastModified: obj.LastModified,
          size: obj.Size,
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
