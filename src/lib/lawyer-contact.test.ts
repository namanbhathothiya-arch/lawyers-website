import { describe, expect, it } from "vitest";
import { getLawyerDirectContact } from "./lawyer-contact";

describe("getLawyerDirectContact", () => {
  it("uses that lawyer's phone_number and whatsapp_number separately", () => {
    const contact = getLawyerDirectContact({
      phone_number: "+91 98765 43210",
      whatsapp_number: "+91 98765 43211",
    });

    expect(contact.hasPhone).toBe(true);
    expect(contact.hasWhatsApp).toBe(true);
    expect(contact.phoneHref).toBe("tel:+919876543210");
    expect(contact.whatsappHref).toBe("https://wa.me/919876543211");
    expect(contact.phoneDisplay).toBe("+91 98765 43210");
    expect(contact.whatsappDisplay).toBe("+91 98765 43211");
  });

  it("keeps phone and WhatsApp strictly independent without cross-fallback", () => {
    const phoneOnly = getLawyerDirectContact({
      phone_number: "+91 98765 43210",
    });

    expect(phoneOnly.hasPhone).toBe(true);
    expect(phoneOnly.hasWhatsApp).toBe(false);
    expect(phoneOnly.phoneHref).toBe("tel:+919876543210");
    expect(phoneOnly.whatsappHref).toBe("");

    const whatsappOnly = getLawyerDirectContact({
      whatsapp_number: "+91 98765 43211",
    });

    expect(whatsappOnly.hasPhone).toBe(false);
    expect(whatsappOnly.hasWhatsApp).toBe(true);
    expect(whatsappOnly.phoneHref).toBe("");
    expect(whatsappOnly.whatsappHref).toBe("https://wa.me/919876543211");
  });

  it("does not create broken links when numbers are empty or null", () => {
    const contact = getLawyerDirectContact({
      name: "Adv. Raj Sharma",
      phone_number: null,
      whatsapp_number: "",
    });

    expect(contact.hasPhone).toBe(false);
    expect(contact.hasWhatsApp).toBe(false);
    expect(contact.phoneHref).toBe("");
    expect(contact.whatsappHref).toBe("");
  });

  it("reads optional email without requiring schema changes", () => {
    const contact = getLawyerDirectContact({
      email: "raj@example.com",
    });

    expect(contact.hasEmail).toBe(true);
    expect(contact.emailHref).toBe("mailto:raj@example.com");
  });
});
