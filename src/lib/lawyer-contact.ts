function firstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export type LawyerDirectContact = {
  phoneDisplay: string;
  phoneHref: string;
  whatsappDisplay: string;
  whatsappHref: string;
  email: string;
  emailHref: string;
  hasPhone: boolean;
  hasWhatsApp: boolean;
  hasEmail: boolean;
};

/**
 * Resolves Call / WhatsApp / email from a lawyer record.
 * Phone and WhatsApp fields operate strictly independently.
 */
export function getLawyerDirectContact(
  lawyer: Record<string, unknown> | null | undefined,
): LawyerDirectContact {
  const empty: LawyerDirectContact = {
    phoneDisplay: "",
    phoneHref: "",
    whatsappDisplay: "",
    whatsappHref: "",
    email: "",
    emailHref: "",
    hasPhone: false,
    hasWhatsApp: false,
    hasEmail: false,
  };

  if (!lawyer) return empty;

  const phoneSource = firstNonEmpty(
    lawyer.phone_number,
    lawyer.phone,
    lawyer.mobile,
    lawyer.contact_phone,
  );
  const phoneDigits = digitsOnly(phoneSource);
  const hasPhone = phoneDigits.length >= 7;
  const phoneHref = hasPhone ? `tel:${phoneSource.replace(/[^\d+]/g, "")}` : "";

  const whatsappSource = firstNonEmpty(
    lawyer.whatsapp_number,
    lawyer.whatsapp,
    lawyer.whatsapp_phone,
  );
  const whatsappDigits = digitsOnly(whatsappSource);
  const hasWhatsApp = whatsappDigits.length >= 7;
  const whatsappHref = hasWhatsApp ? `https://wa.me/${whatsappDigits}` : "";

  const email = firstNonEmpty(lawyer.email, lawyer.contact_email);
  const hasEmail = email.includes("@");

  return {
    phoneDisplay: hasPhone ? phoneSource : "",
    phoneHref,
    whatsappDisplay: hasWhatsApp ? whatsappSource : "",
    whatsappHref,
    email: hasEmail ? email : "",
    emailHref: hasEmail ? `mailto:${email}` : "",
    hasPhone,
    hasWhatsApp,
    hasEmail,
  };
}
