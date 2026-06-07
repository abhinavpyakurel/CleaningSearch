import type { SupabaseClient } from "@supabase/supabase-js";

export const BOOKING_PHOTOS_BUCKET = "booking-photos";
export const MAX_BOOKING_PHOTOS = 2;
export const MAX_BOOKING_PHOTO_BYTES = 5 * 1024 * 1024;
export const ALLOWED_BOOKING_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedBookingPhotoType =
  (typeof ALLOWED_BOOKING_PHOTO_TYPES)[number];

export const BOOKING_PHOTO_ACCEPT = ALLOWED_BOOKING_PHOTO_TYPES.join(",");

export function buildBookingPhotoStoragePath(
  userId: string,
  bookingId: string,
  fileName: string
): string {
  return `${userId}/${bookingId}/${fileName}`;
}

export function getExtensionFromMimeType(mimeType: string): string | null {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

export function validateBookingPhotoFile(file: File): string | null {
  if (
    !ALLOWED_BOOKING_PHOTO_TYPES.includes(file.type as AllowedBookingPhotoType)
  ) {
    return "Photos must be JPEG, PNG, or WebP.";
  }

  if (file.size > MAX_BOOKING_PHOTO_BYTES) {
    return "Each photo must be 5MB or smaller.";
  }

  return null;
}

export type BookingPhotoSignedUrl = {
  id: string;
  signedUrl: string;
};

export async function createSignedBookingPhotoUrls(
  supabase: SupabaseClient,
  photos: { id: string; storage_path: string }[],
  expiresInSeconds = 3600
): Promise<BookingPhotoSignedUrl[]> {
  const signedPhotos: BookingPhotoSignedUrl[] = [];

  for (const photo of photos) {
    const { data, error } = await supabase.storage
      .from(BOOKING_PHOTOS_BUCKET)
      .createSignedUrl(photo.storage_path, expiresInSeconds);

    if (error || !data?.signedUrl) {
      continue;
    }

    signedPhotos.push({
      id: photo.id,
      signedUrl: data.signedUrl,
    });
  }

  return signedPhotos;
}

export async function uploadBookingPhotosForBooking(
  supabase: SupabaseClient,
  bookingId: string,
  userId: string,
  files: File[]
): Promise<{ error?: string }> {
  for (const file of files) {
    const validationError = validateBookingPhotoFile(file);
    if (validationError) {
      return { error: validationError };
    }

    const extension = getExtensionFromMimeType(file.type);
    if (!extension) {
      return { error: "Photos must be JPEG, PNG, or WebP." };
    }

    const fileName = `${crypto.randomUUID()}.${extension}`;
    const storagePath = buildBookingPhotoStoragePath(
      userId,
      bookingId,
      fileName
    );

    const { error: uploadError } = await supabase.storage
      .from(BOOKING_PHOTOS_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return {
        error: `Photo upload failed: ${uploadError.message}`,
      };
    }

    const { error: insertError } = await supabase.from("booking_photos").insert({
      booking_id: bookingId,
      uploaded_by: userId,
      storage_path: storagePath,
    });

    if (insertError) {
      await supabase.storage.from(BOOKING_PHOTOS_BUCKET).remove([storagePath]);
      return {
        error: `Saving photo metadata failed: ${insertError.message}`,
      };
    }
  }

  return {};
}
