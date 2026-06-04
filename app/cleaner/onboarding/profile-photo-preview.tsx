"use client";

import { useState } from "react";

type ProfilePhotoPreviewProps = {
  src: string;
  alt?: string;
  className?: string;
};

export function ProfilePhotoPreview({
  src,
  alt = "Profile photo preview",
  className = "h-20 w-20 rounded-full border border-gray-200 object-cover",
}: ProfilePhotoPreviewProps) {
  const [hidden, setHidden] = useState(false);

  if (!src.trim() || hidden) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHidden(true)}
    />
  );
}
