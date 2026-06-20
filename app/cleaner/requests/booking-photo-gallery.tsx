"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BookingPhotoSignedUrl } from "@/lib/booking-photos";

type BookingPhotoGalleryProps = {
  photos: BookingPhotoSignedUrl[];
  compact?: boolean;
};

export function BookingPhotoGallery({
  photos,
  compact = false,
}: BookingPhotoGalleryProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activePhoto, setActivePhoto] = useState<BookingPhotoSignedUrl | null>(
    null
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (activePhoto) {
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [activePhoto]);

  if (photos.length === 0) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Camera className="size-3.5 shrink-0" />
        No photos added
      </p>
    );
  }

  const label =
    photos.length === 1 ? "1 photo" : `${photos.length} photos`;

  return (
    <>
      {compact ? (
        <div className="flex items-center gap-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Camera className="size-3.5 shrink-0" />
            {label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {photos.slice(0, 3).map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setActivePhoto(photo)}
                className="overflow-hidden rounded-md border border-border transition hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="View booking photo larger"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.signedUrl}
                  alt="Booking reference photo"
                  className="size-10 object-cover"
                />
              </button>
            ))}
            {photos.length > 3 ? (
              <span className="flex size-10 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                +{photos.length - 3}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setActivePhoto(photo)}
              className="overflow-hidden rounded-lg border border-border transition hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="View booking photo larger"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.signedUrl}
                alt="Booking reference photo"
                className="size-20 object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-50 m-0 max-h-none max-w-none border-0 bg-black/80 p-4 backdrop:bg-black/80 open:flex open:items-center open:justify-center"
        onClose={() => setActivePhoto(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            setActivePhoto(null);
          }
        }}
      >
        {activePhoto ? (
          <div className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="shrink-0"
              aria-label="Close photo"
              onClick={() => setActivePhoto(null)}
            >
              <X className="size-4" />
            </Button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhoto.signedUrl}
              alt="Booking reference photo enlarged"
              className="max-h-[calc(90vh-3rem)] max-w-[90vw] rounded-lg object-contain"
            />
          </div>
        ) : null}
      </dialog>
    </>
  );
}
