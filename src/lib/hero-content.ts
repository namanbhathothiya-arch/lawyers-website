const HERO_DOCTOR_MARKER = "#hero-doctor";
const HERO_IMAGE_MARKER = "#hero-image";

function setMarker(value: string | null | undefined, marker: string, enabled: boolean) {
  const cleanValue = (value || "").replace(marker, "");
  return enabled ? `${cleanValue}${marker}` : cleanValue || null;
}

export function isLegacyHeroDoctor(photo: string | null | undefined) {
  return Boolean(photo?.includes(HERO_DOCTOR_MARKER));
}

export function setLegacyHeroDoctor(photo: string | null | undefined, enabled: boolean) {
  return setMarker(photo, HERO_DOCTOR_MARKER, enabled);
}

export function cleanDoctorPhoto(photo: string | null | undefined) {
  return photo?.replace(HERO_DOCTOR_MARKER, "") || null;
}

export function isLegacyHeroImage(imageUrl: string | null | undefined) {
  return Boolean(imageUrl?.includes(HERO_IMAGE_MARKER));
}

export function setLegacyHeroImage(imageUrl: string | null | undefined, enabled: boolean) {
  return setMarker(imageUrl, HERO_IMAGE_MARKER, enabled) || "";
}

export function cleanHeroImageUrl(imageUrl: string | null | undefined) {
  return imageUrl?.replace(HERO_IMAGE_MARKER, "") || "";
}
