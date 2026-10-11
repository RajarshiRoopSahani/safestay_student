
import { AppError } from "../middleware/errorHandler";
import { supabase, PHOTO_BUCKET } from "../config/supabase";

// Checks the actual image bytes.
export function detectImageType(
  buf: Buffer
): "jpeg" | "png" | "webp" | null {
  if (buf.length < 12) return null;

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "jpeg";
  }

  if (
    buf.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    )
  ) {
    return "png";
  }

  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

export async function uploadImage(
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> {
  const type = detectImageType(buffer);

  if (!type) {
    throw new AppError(400, "Please upload a valid JPG, PNG or WebP image");
  }

  const extension = type === "jpeg" ? "jpg" : type;
  const publicId = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(publicId, buffer, {
      contentType:
        type === "jpeg"
          ? "image/jpeg"
          : type === "png"
            ? "image/png"
            : "image/webp",
      upsert: false,
    });

  if (error) {
    console.error("Supabase photo upload failed:", error.message);
    throw new AppError(502, "Image upload failed. Please try again.");
  }

  const { data } = supabase.storage
    .from(PHOTO_BUCKET)
    .getPublicUrl(publicId);

  return { url: data.publicUrl, publicId };
}

export async function deleteImage(publicId: string): Promise<void> {
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .remove([publicId]);

  if (error) {
    console.error("Supabase photo delete failed:", error.message);
  }
}
