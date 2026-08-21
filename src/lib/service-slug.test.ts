import { describe, expect, it } from "vitest";
import {
  findServiceBySlugParam,
  findServiceSectionBySlugParam,
  getServiceDescriptionParagraphs,
  getServicePathSlug,
  getServiceSectionPathSlug,
  getServiceSummary,
  slugifyServiceName,
} from "./service-slug";

describe("service slugs", () => {
  it("creates readable slugs from service names", () => {
    expect(slugifyServiceName("Corporate Law")).toBe("corporate-law");
    expect(slugifyServiceName("Criminal Law")).toBe("criminal-law");
    expect(slugifyServiceName("Family Law")).toBe("family-law");
  });

  it("disambiguates duplicate names with a short id", () => {
    const services = [
      { id: "aaaaaaaa-1111", name: "Corporate Law" },
      { id: "bbbbbbbb-2222", name: "Corporate Law" },
    ];

    expect(getServicePathSlug(services[0], services)).toBe("corporate-law-aaaaaaaa");
    expect(getServicePathSlug(services[1], services)).toBe("corporate-law-bbbbbbbb");
  });

  it("keeps section slugs distinct from service slugs", () => {
    const sections = [{ id: "sec-1", name: "Property Law" }];
    const services = [{ id: "svc-1", name: "Property Law" }];

    expect(getServiceSectionPathSlug(sections[0], sections, services)).toBe("property-law-sec1");
    expect(getServicePathSlug(services[0], services, sections)).toBe("property-law-svc1");
  });

  it("resolves a service by slug or id", () => {
    const services = [
      { id: "svc-1", name: "Family Law" },
      { id: "svc-2", name: "Criminal Law" },
    ];

    expect(findServiceBySlugParam(services, "family-law")?.id).toBe("svc-1");
    expect(findServiceBySlugParam(services, "svc-2")?.name).toBe("Criminal Law");
  });

  it("resolves a service section by slug or id", () => {
    const sections = [
      { id: "sec-1", name: "Property Law" },
      { id: "sec-2", name: "Criminal Law" },
    ];

    expect(findServiceSectionBySlugParam(sections, "property-law")?.id).toBe("sec-1");
    expect(findServiceSectionBySlugParam(sections, "sec-2")?.name).toBe("Criminal Law");
  });

  it("summarises existing descriptions without inventing copy", () => {
    expect(getServiceSummary("")).toBe("");
    expect(getServiceSummary("Short note")).toBe("Short note");
    expect(getServiceDescriptionParagraphs("One.\n\nTwo.")).toEqual(["One.", "Two."]);
  });
});
