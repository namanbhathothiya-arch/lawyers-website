import {
  BookOpen,
  Briefcase,
  FileText,
  Gavel,
  Landmark,
  Scale,
  type LucideIcon,
} from "lucide-react";

export function getServiceIcon(name: string): LucideIcon {
  const normalizedName = name.toLowerCase();

  if (/(property|real estate|land|housing)/.test(normalizedName)) return Landmark;
  if (/(family|divorce|custody|marriage)/.test(normalizedName)) return BookOpen;
  if (/(corporate|business|company|commercial)/.test(normalizedName)) return Briefcase;
  if (/(criminal|defence|defense|bail)/.test(normalizedName)) return Gavel;
  if (/(civil|litigation|dispute|arbitration)/.test(normalizedName)) return Scale;
  if (/(document|draft|contract|agreement|registration)/.test(normalizedName)) return FileText;

  return Scale;
}
