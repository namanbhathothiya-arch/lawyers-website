const HERO_DOCTOR_MARKER = "#hero-doctor";
const HERO_LAWYER_MARKER = "#hero-lawyer";
const HERO_IMAGE_MARKER = "#hero-image";

function setMarker(value: string | null | undefined, marker: string, enabled: boolean) {
  const cleanValue = (value || "").replace(marker, "");
  return enabled ? `${cleanValue}${marker}` : cleanValue || null;
}

export function isLegacyHeroLawyer(photo: string | null | undefined) {
  return Boolean(photo?.includes(HERO_LAWYER_MARKER) || photo?.includes(HERO_DOCTOR_MARKER));
}

export const isLegacyHeroDoctor = isLegacyHeroLawyer;

export function setLegacyHeroLawyer(photo: string | null | undefined, enabled: boolean) {
  return setMarker(photo, HERO_LAWYER_MARKER, enabled);
}

export const setLegacyHeroDoctor = setLegacyHeroLawyer;

export function cleanLawyerPhoto(photo: string | null | undefined) {
  return photo?.replace(HERO_LAWYER_MARKER, "").replace(HERO_DOCTOR_MARKER, "") || null;
}

export const cleanDoctorPhoto = cleanLawyerPhoto;

export function isLegacyHeroImage(imageUrl: string | null | undefined) {
  return Boolean(imageUrl?.includes(HERO_IMAGE_MARKER));
}

export function setLegacyHeroImage(imageUrl: string | null | undefined, enabled: boolean) {
  return setMarker(imageUrl, HERO_IMAGE_MARKER, enabled) || "";
}

export function cleanHeroImageUrl(imageUrl: string | null | undefined) {
  return imageUrl?.replace(HERO_IMAGE_MARKER, "") || "";
}
