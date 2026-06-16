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

export type DoctorLike = {
  id: string;
};

export function getDoctorsForService<TDoctor extends DoctorLike>(
  doctors: TDoctor[],
  mappedDoctorIds: string[] | undefined,
): TDoctor[] {
  if (!mappedDoctorIds || mappedDoctorIds.length === 0) {
    return doctors;
  }

  return doctors.filter((doctor) => mappedDoctorIds.includes(doctor.id));
}

export function canBookDoctorForService(
  doctorId: string,
  serviceId: string,
  mappedDoctorIds: string[] | undefined,
): boolean {
  if (!doctorId || !serviceId) {
    return false;
  }

  if (!mappedDoctorIds || mappedDoctorIds.length === 0) {
    return true;
  }

  return mappedDoctorIds.includes(doctorId);
}

export function resetDoctorSelectionForServiceChange() {
  return {
    doctor: "",
    slot: "",
  };
}
