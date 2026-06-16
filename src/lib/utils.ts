import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export { generateSlotsFromAvailability } from "./booking-utils";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
