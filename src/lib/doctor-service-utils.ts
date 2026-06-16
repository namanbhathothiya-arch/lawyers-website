export function uniqueServiceIds(serviceIds: string[]) {
  return Array.from(new Set(serviceIds.filter(Boolean)));
}

export function getDoctorServiceSyncChanges(
  currentServiceIds: string[],
  selectedServiceIds: string[],
) {
  const current = new Set(uniqueServiceIds(currentServiceIds));
  const selected = new Set(uniqueServiceIds(selectedServiceIds));

  return {
    add: Array.from(selected).filter((serviceId) => !current.has(serviceId)),
    remove: Array.from(current).filter((serviceId) => !selected.has(serviceId)),
  };
}
