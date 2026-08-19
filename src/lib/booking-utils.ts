export const INDIAN_PHONE_REGEX = /^(?:\+91[\s-]?|91[\s-]?|0)?[6-9]\d{9}$/;

export function normalizeIndianPhone(phone: string) {
  return phone.replace(/[\s()-]/g, "");
}

export function isValidIndianPhone(phone: string) {
  return INDIAN_PHONE_REGEX.test(normalizeIndianPhone(phone));
}

export function getAmountInPaise(priceStr: string, fallbackRupees = 500): number {
  const cleanStr = priceStr.replace(/[^\d]/g, "");
  const amountInRupees = parseInt(cleanStr, 10) || fallbackRupees;
  return amountInRupees * 100;
}

export function generateSlotsFromAvailability(
  startTimeStr: string,
  endTimeStr: string,
  durationMinutes: number,
): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTimeStr.split(":").map(Number);
  const [endH, endM] = endTimeStr.split(":").map(Number);

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedHours = String(displayHours).padStart(2, "0");
    const formattedMins = String(mins).padStart(2, "0");

    slots.push(`${formattedHours}:${formattedMins} ${period}`);
    currentMinutes += durationMinutes;
  }

  return slots;
}

export type LawyerLike = {
  id: string;
};

export type DoctorLike = LawyerLike;

export function getLawyersForService<TLawyer extends LawyerLike>(
  lawyers: TLawyer[],
  mappedLawyerIds: string[] | undefined,
): TLawyer[] {
  if (!mappedLawyerIds || mappedLawyerIds.length === 0) {
    return lawyers;
  }

  return lawyers.filter((lawyer) => mappedLawyerIds.includes(lawyer.id));
}

export const getDoctorsForService = getLawyersForService;

export function canBookLawyerForService(
  lawyerId: string,
  serviceId: string,
  mappedLawyerIds: string[] | undefined,
): boolean {
  if (!lawyerId || !serviceId) {
    return false;
  }

  if (!mappedLawyerIds || mappedLawyerIds.length === 0) {
    return true;
  }

  return mappedLawyerIds.includes(lawyerId);
}

export const canBookDoctorForService = canBookLawyerForService;

export function resetLawyerSelectionForServiceChange() {
  return {
    lawyer: "",
    doctor: "",
    slot: "",
  };
}

export function resetDoctorSelectionForServiceChange() {
  return {
    doctor: "",
    slot: "",
  };
}
