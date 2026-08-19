import doc1 from "@/assets/doctor-1.jpg";

export const LAW_FIRM = {
  name: "Sharma & Associates",
  tagline: "Trusted Legal Counsel",
  lawyer: "Adv. Raj Sharma",
  specialization: "Legal Services",
  phone: "+91 9876543210",
  emergencyPhone: "+91 9876543210",
  whatsapp: "919876543210",
  email: "contact@sharmalaw.in",
  address: "123 Law Chambers, New Delhi",
  workingDays: "Monday-Saturday",
  workingHours: "9:00 AM - 6:00 PM",
  mapsEmbed: "https://www.google.com/maps?q=123%20Law%20Chambers%2C%20New%20Delhi&output=embed",
  socials: {
    facebook: "",
    instagram: "",
    linkedin: "",
    youtube: "",
    x: "",
  },
};

export const CLINIC = LAW_FIRM;

export type Lawyer = {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  photo: string;
  bio: string;
};

export type Doctor = Lawyer;

export const LAWYERS: Lawyer[] = [
  {
    id: "adv-raj-sharma",
    name: "Adv. Raj Sharma",
    specialization: "Corporate Law",
    experience: "Experienced legal counsel",
    photo: doc1,
    bio: "Compassionate, advanced legal care with expertise in corporate law.",
  },
];

export const DOCTORS = LAWYERS;

export type LegalService = {
  id: string;
  name: string;
  description: string;
  price: string;
};

export type Service = LegalService;

export const LEGAL_SERVICES: LegalService[] = [
  {
    id: "property-law",
    name: "Property Law Consultation",
    description: "Comprehensive property dispute resolution and documentation.",
    price: "₹1,500",
  },
  {
    id: "family-law",
    name: "Family Law",
    description: "Expert advice on family matters, divorce, and child custody.",
    price: "₹2,200",
  },
  {
    id: "corporate-advisory",
    name: "Corporate Advisory",
    description: "Corporate restructuring, contracts, and compliance.",
    price: "₹3,000",
  },
  {
    id: "criminal-defence",
    name: "Criminal Defence",
    description: "Strong representation in criminal proceedings.",
    price: "₹2,500",
  },
  {
    id: "civil-litigation",
    name: "Civil Litigation",
    description: "Civil dispute resolution and court representation.",
    price: "₹1,800",
  },
  {
    id: "legal-documentation",
    name: "Legal Documentation",
    description: "Drafting of deeds, agreements, and legal notices.",
    price: "From ₹1,000",
  },
];

export const SERVICES = LEGAL_SERVICES;

export const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
];

export const TESTIMONIALS = [
  {
    name: "Priya S.",
    text: "The lawyers took time to actually listen. Booking was effortless and the law firm feels reassuringly professional.",
    role: "Client",
  },
  {
    name: "Rohan K.",
    text: "Clear, modern, and on-time meetings. Adv. Raj Sharma explained every step of my legal case clearly.",
    role: "Client",
  },
  {
    name: "Meera J.",
    text: "From reception to consultation, the experience felt genuinely professional. Highly recommend Sharma & Associates.",
    role: "Client",
  },
];

export const LAWYER_IMAGES: Record<string, string> = {
  "adv-raj-sharma": doc1,
};

export const DOCTOR_IMAGES = LAWYER_IMAGES;

export function getLawyerImage(id: string, dbPhoto?: string | null) {
  if (
    dbPhoto &&
    (dbPhoto.startsWith("http") || dbPhoto.startsWith("/") || dbPhoto.startsWith("data:"))
  ) {
    return dbPhoto;
  }
  const key = id ? id.toLowerCase().replace(/\s+/g, "-") : "";
  return LAWYER_IMAGES[key] || LAWYER_IMAGES[id] || doc1;
}

export const getDoctorImage = getLawyerImage;
