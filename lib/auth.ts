export type ProfileRole = "client" | "cleaner";

export function roleHomePath(role: string): string {
  if (role === "cleaner") {
    return "/cleaner/dashboard";
  }
  return "/client/cleaners";
}

export function parseProfileRole(value: FormDataEntryValue | null): ProfileRole {
  if (value === "cleaner") {
    return "cleaner";
  }
  return "client";
}
