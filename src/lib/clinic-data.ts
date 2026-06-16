import doc1 from "@/assets/doctor-1.jpg";
import doc2 from "@/assets/doctor-2.jpg";
import doc3 from "@/assets/doctor-3.jpg";
import doc4 from "@/assets/doctor-4.jpg";

export const CLINIC = {
  name: "Advanced Care Medical Clinic",
  tagline: "Compassionate care, advanced medicine.",
  phone: "+91 7597677113",
  whatsapp: "91 7597677113",
  email: "nk6225003@gmail.com",
  address: "12 Wellness Avenue, MG Road, Bengaluru, KA 560001",
  mapsEmbed:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.123!2d77.5946!3d12.9716!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDU4JzE3LjgiTiA3N8KwMzUnNDAuNiJF!5e0!3m2!1sen!2sin!4v1700000000000",
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
    id: "dr-aisha-rao",
    name: "Dr. Aisha Rao",
    specialization: "General Physician",
    experience: "8 years",
    photo: doc1,
    bio: "Primary care, preventive health and chronic disease management.",
  },
  {
    id: "dr-michael-chen",
    name: "Dr. Michael Chen",
    specialization: "Cardiologist",
    experience: "12 years",
    photo: doc2,
    bio: "Interventional cardiology, hypertension and heart-health screenings.",
  },
  {
    id: "dr-sofia-martinez",
    name: "Dr. Sofia Martinez",
    specialization: "Dermatologist",
    experience: "9 years",
    photo: doc3,
    bio: "Medical and cosmetic dermatology for all skin types.",
  },
  {
    id: "dr-arjun-mehta",
    name: "Dr. Arjun Mehta",
    specialization: "Orthopedic Surgeon",
    experience: "18 years",
    photo: doc4,
    bio: "Joint replacement, sports injuries and spine care.",
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
    text: "Clean, modern, and on-time appointments. My family now sees Dr. Chen for everything cardiac-related.",
    role: "Patient",
  },
  {
    name: "Meera J.",
    text: "From reception to consultation, the experience felt genuinely caring. Highly recommend Advanced Care.",
    role: "Patient",
  },
];

export const DOCTOR_IMAGES: Record<string, string> = {
  "dr-aisha-rao": doc1,
  "dr-michael-chen": doc2,
  "dr-sofia-martinez": doc3,
  "dr-arjun-mehta": doc4,
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
