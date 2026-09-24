import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { propertyColors } from "@/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getPropertyColor = (propertyType: string) => {
  return propertyColors[propertyType as keyof typeof propertyColors] ?? "#f5f5f5";
};

export const getCoverPhotoUrl = (listing: { photos?: ListingPhoto[] }) => {
  const photos = listing.photos ?? [];
  return photos.find((photo) => photo.is_cover)?.url ?? photos[0]?.url;
};

export const normalizeWhatsAppPhone = (phone: string | null | undefined) => {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return null;

  const withPrefix = digits.startsWith("00") ? digits.slice(2) : digits;

  if (withPrefix.startsWith("212")) return withPrefix;                       // 212612345678
  if (withPrefix.startsWith("0")) return `212${withPrefix.slice(1)}`;        // 0612345678
  if (withPrefix.length === 9 && /^[5-7]/.test(withPrefix)) return `212${withPrefix}`; // 612345678
  return withPrefix;
}