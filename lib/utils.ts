import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { propertyColors } from "@/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getPropertyColor = (propertyType: string) => {
  return propertyColors[propertyType as keyof typeof propertyColors] ?? "#f5f5f5";
};