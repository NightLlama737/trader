import { prisma } from "../../../lib/prisma";
import { cookies } from "next/headers";
import crypto from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../../../lib/S3";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("user")?.value;
    const userId = cookie ? JSON.parse(cookie).id : null;

    if (!userId) {
      return Response.json({ error: "No userId cookie" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return Response.json({ error: "User does not exist" }, { status: 400 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return Response.json({ error: "No file uploaded" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${crypto.randomUUID()}-${file.name}`;
    const key = `models/${userId}/${fileName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: "model/gltf-binary",
      })
    );

    // ✅ uložíme pouze key a userId, Prisma očekává jen tyto sloupce
    const newObject = await prisma.model.create({
      data: {
        key,
        userId,
      },
    });

    return Response.json({ success: true, object: newObject, s3Key: key }, { status: 201 });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
