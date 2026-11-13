import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn/ui helper: joins class names and lets later Tailwind classes win over earlier ones.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function uid(): string {
  return crypto.randomUUID();
}
