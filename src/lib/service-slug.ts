export type ServiceSlugSource = {
  id: string;
  name: string;
  slug?: string | null;
};

export type ServiceSectionSlugSource = {
  id: string;
  name: string;
  slug?: string | null;
};

export function slugifyServiceName(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "service";
}

function normalizeSlugCandidate(value: string | null | undefined): string {
  const raw = value?.trim() || "";
  if (!raw) return "";
  return slugifyServiceName(raw);
}

function appendStableSuffix(base: string, id: string): string {
  const suffix = id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  return suffix ? `${base}-${suffix}` : base;
}

function buildUniqueSlug(
  base: string,
  currentId: string,
  takenSlugs: Set<string>,
): string {
  if (!base) return appendStableSuffix("service", currentId);

  if (!takenSlugs.has(base)) return base;

  const suffixed = appendStableSuffix(base, currentId);
  if (!takenSlugs.has(suffixed)) return suffixed;

  let counter = 2;
  let next = `${suffixed}-${counter}`;
  while (takenSlugs.has(next)) {
    counter += 1;
    next = `${suffixed}-${counter}`;
  }
  return next;
}

export function getServicePathSlug(
  service: ServiceSlugSource,
  allServices: ServiceSlugSource[],
  allSections: ServiceSectionSlugSource[] = [],
): string {
  const takenSlugs = new Set<string>();
  for (const item of allServices) {
    if (item.id === service.id) continue;
    takenSlugs.add(normalizeSlugCandidate(item.slug) || slugifyServiceName(item.name));
  }
  for (const section of allSections) {
    takenSlugs.add(normalizeSlugCandidate(section.slug) || slugifyServiceName(section.name));
  }

  const base = normalizeSlugCandidate(service.slug) || slugifyServiceName(service.name);
  return buildUniqueSlug(base, service.id, takenSlugs);
}

export function getServiceSectionPathSlug(
  section: ServiceSectionSlugSource,
  allSections: ServiceSectionSlugSource[],
  allServices: ServiceSlugSource[] = [],
): string {
  const takenSlugs = new Set<string>();
  for (const item of allSections) {
    if (item.id === section.id) continue;
    takenSlugs.add(normalizeSlugCandidate(item.slug) || slugifyServiceName(item.name));
  }
  for (const service of allServices) {
    takenSlugs.add(normalizeSlugCandidate(service.slug) || slugifyServiceName(service.name));
  }

  const base = normalizeSlugCandidate(section.slug) || slugifyServiceName(section.name);
  return buildUniqueSlug(base, section.id, takenSlugs);
}

export function findServiceBySlugParam<T extends ServiceSlugSource>(
  services: T[],
  param: string,
  allSections: ServiceSectionSlugSource[] = [],
): T | undefined {
  const decoded = decodeURIComponent(param).trim();
  if (!decoded) return undefined;

  const byId = services.find((service) => service.id === decoded);
  if (byId) return byId;

  const byUniqueSlug = services.find(
    (service) => getServicePathSlug(service, services, allSections) === decoded,
  );
  if (byUniqueSlug) return byUniqueSlug;

  return services.find(
    (service) =>
      (normalizeSlugCandidate(service.slug) || slugifyServiceName(service.name)) === decoded,
  );
}

export function findServiceSectionBySlugParam<T extends ServiceSectionSlugSource>(
  sections: T[],
  param: string,
  allServices: ServiceSlugSource[] = [],
): T | undefined {
  const decoded = decodeURIComponent(param).trim();
  if (!decoded) return undefined;

  const byId = sections.find((section) => section.id === decoded);
  if (byId) return byId;

  const byUniqueSlug = sections.find(
    (section) => getServiceSectionPathSlug(section, sections, allServices) === decoded,
  );
  if (byUniqueSlug) return byUniqueSlug;

  return sections.find(
    (section) =>
      (normalizeSlugCandidate(section.slug) || slugifyServiceName(section.name)) === decoded,
  );
}

export function getServiceSummary(description: string | null | undefined, maxLength = 160): string {
  const text = description?.replace(/\s+/g, " ").trim() || "";
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).replace(/\s+\S*$/, "")}…`;
}

export function getServiceDescriptionParagraphs(description: string | null | undefined): string[] {
  const text = description?.trim() || "";
  if (!text) return [];
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
