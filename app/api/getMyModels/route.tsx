// app/api/models/route.ts
import { NextResponse } from "next/server";
import { s3 } from "../../../lib/S3";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

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

    const models = (s3Objects.Contents || []).map((obj) => ({
      key: obj.Key,
      url: `https://${bucket}.s3.${region}.amazonaws.com/${obj.Key}`,
      lastModified: obj.LastModified,
      size: obj.Size,
    }));

    return NextResponse.json({ models });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("GET MODELS ERROR:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
