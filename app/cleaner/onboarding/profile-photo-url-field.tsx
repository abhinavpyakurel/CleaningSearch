"use client";

import { useState } from "react";

import { ProfilePhotoPreview } from "@/app/cleaner/onboarding/profile-photo-preview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfilePhotoUrlFieldProps = {
  defaultValue: string;
};

export function ProfilePhotoUrlField({ defaultValue }: ProfilePhotoUrlFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const previewUrl = value.trim();

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="profile_photo_url">Profile photo URL</Label>
      <Input
        id="profile_photo_url"
        name="profile_photo_url"
        type="url"
        placeholder="https://example.com/photo.jpg"
        required
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      {previewUrl ? (
        <ProfilePhotoPreview src={previewUrl} />
      ) : null}
    </div>
  );
}
