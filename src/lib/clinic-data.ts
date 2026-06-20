import doc1 from "@/assets/doctor-1.jpg";

export const CLINIC = {
  name: "HeartCare Advanced Clinic",
  tagline: "Advanced Cardiac Care with Compassion",
  doctor: "Dr. Raj Sharma",
  specialization: "Interventional Cardiology",
  phone: "+91 9876543210",
  emergencyPhone: "+91 9876543210",
  whatsapp: "919876543210",
  email: "contact@heartcareclinic.com",
  address: "123 Medical Plaza, New Delhi",
  workingDays: "Monday-Saturday",
  workingHours: "9:00 AM - 6:00 PM",
  mapsEmbed: "https://www.google.com/maps?q=123%20Medical%20Plaza%2C%20New%20Delhi&output=embed",
  socials: {
    facebook: "",
    instagram: "",
    linkedin: "",
    youtube: "",
    x: "",
  },
};

export type Doctor = {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  photo: string;
  bio: string;
};

export const DOCTORS: Doctor[] = [
  {
    id: "dr-raj-sharma",
    name: "Dr. Raj Sharma",
    specialization: "Interventional Cardiology",
    experience: "Experienced specialist",
    photo: doc1,
    bio: "Compassionate, advanced cardiac care with expertise in interventional cardiology.",
  },
];

export type Service = {
  id: string;
  name: string;
  description: string;
  price: string;
};

export const SERVICES: Service[] = [
  {
    id: "general-consultation",
    name: "General Consultation",
    description: "Comprehensive checkup with a general physician.",
    price: "₹600",
  },
  {
    id: "cardiac-screening",
    name: "Cardiac Screening",
    description: "ECG, BP and risk-profile assessment with a cardiologist.",
    price: "₹2,200",
  },
  {
    id: "skin-consultation",
    name: "Skin Consultation",
    description: "Diagnosis and treatment plan from a dermatologist.",
    price: "₹900",
  },
  {
    id: "orthopedic-consultation",
    name: "Orthopedic Consultation",
    description: "Joint, bone and sports-injury evaluation.",
    price: "₹1,200",
  },
  {
    id: "full-body-checkup",
    name: "Full Body Health Checkup",
    description: "70+ parameter health screening with report.",
    price: "₹3,500",
  },
  {
    id: "vaccination",
    name: "Vaccination",
    description: "Adult and child vaccination at the clinic.",
    price: "From ₹500",
  },
];

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
    text: "The doctors took time to actually listen. Booking was effortless and the clinic feels reassuringly professional.",
    role: "Patient",
  },
  {
    name: "Rohan K.",
    text: "Clean, modern, and on-time appointments. Dr. Raj Sharma explained every step of my cardiac care clearly.",
    role: "Patient",
  },
  {
    name: "Meera J.",
    text: "From reception to consultation, the experience felt genuinely caring. Highly recommend HeartCare Advanced Clinic.",
    role: "Patient",
  },
];

export const DOCTOR_IMAGES: Record<string, string> = {
  "dr-raj-sharma": doc1,
};

export function getDoctorImage(id: string, dbPhoto?: string | null) {
  if (
    dbPhoto &&
    (dbPhoto.startsWith("http") || dbPhoto.startsWith("/") || dbPhoto.startsWith("data:"))
  ) {
    return dbPhoto;
  }
  const key = id ? id.toLowerCase().replace(/\s+/g, "-") : "";
  return DOCTOR_IMAGES[key] || DOCTOR_IMAGES[id] || doc1;
}
