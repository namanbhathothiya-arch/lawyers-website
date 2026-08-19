import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  cleanDoctorPhoto,
  cleanHeroImageUrl,
  isLegacyHeroDoctor,
  isLegacyHeroImage,
} from "@/lib/hero-content";

export const PUBLIC_CONTENT_QUERY_OPTIONS = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export interface DBLawyer {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  photo?: string | null;
  photos?: string[] | string | null;
  photo_urls?: string[] | string | null;
  image_urls?: string[] | string | null;
  images?: string[] | string | null;
  bio?: string | null;
  is_featured_hero?: boolean;
  created_at?: string;
}

export type DBDoctor = DBLawyer;

export interface HeroGalleryImage {
  id: string;
  image_url: string;
  title?: string | null;
  description?: string | null;
  is_hero_image: boolean;
}

export interface DBLegalService {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  image_url?: string | null;
  image_urls?: string[] | string | null;
  images?: string[] | string | null;
  photos?: string[] | string | null;
  created_at?: string;
}

export type DBService = DBLegalService;

export interface DBFaq {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
  sort_order: number;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DBTestimonial {
  id: string;
  client_name: string;
  client_label?: string | null;
  patient_name?: string;
  patient_label?: string | null;
  review: string;
  rating: number;
  image_url?: string | null;
  sort_order: number;
  is_published: boolean;
  created_at?: string;
}

export function useLawyers() {
  return useQuery<DBLawyer[]>({
    queryKey: ["lawyers"],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lawyers")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }
      return data || [];
    },
  });
}

export const useDoctors = useLawyers;

export function useLegalServices() {
  return useQuery<DBLegalService[]>({
    queryKey: ["legal_services"],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_services")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }
      return data || [];
    },
  });
}

export const useServices = useLegalServices;

export function useFaqs() {
  return useQuery<DBFaq[]>({
    queryKey: ["faqs"],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }
      return data || [];
    },
  });
}

export function useTestimonials() {
  return useQuery<DBTestimonial[]>({
    queryKey: ["testimonials"],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        console.warn(
          "Unable to load testimonials; using homepage fallback content:",
          error.message,
        );
        return [];
      }
      return (data || []).map((t) => ({
        ...t,
        client_name: t.client_name || (t as { patient_name?: string }).patient_name || "",
        client_label: t.client_label || (t as { patient_label?: string }).patient_label || null,
      }));
    },
  });
}

export function useHeroContent() {
  return useQuery<{
    lawyer: DBLawyer | null;
    image: HeroGalleryImage | null;
    doctor?: DBLawyer | null;
  }>({
    queryKey: ["hero-content"],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    queryFn: async () => {
      const [lawyerResult, imageResult] = await Promise.all([
        supabase
          .from("lawyers")
          .select("id, name, specialization, experience, photo, bio, is_featured_hero")
          .eq("is_featured_hero", true)
          .limit(1),
        supabase
          .from("gallery_images")
          .select("id, image_url, title, description, is_hero_image")
          .eq("is_hero_image", true)
          .limit(1),
      ]);

      if (lawyerResult.error) {
        console.warn("Unable to load featured hero lawyer:", lawyerResult.error.message);
      }
      if (imageResult.error) {
        console.warn("Unable to load featured hero image:", imageResult.error.message);
      }

      let lawyer = (lawyerResult.data?.[0] as DBLawyer | undefined) || null;
      let image = (imageResult.data?.[0] as HeroGalleryImage | undefined) || null;

      if (!lawyer) {
        const { data: legacyLawyers } = await supabase
          .from("lawyers")
          .select("id, name, specialization, experience, photo, bio");
        const legacyLawyer = (legacyLawyers || []).find((item) => isLegacyHeroDoctor(item.photo));
        if (legacyLawyer) {
          lawyer = { ...legacyLawyer, photo: cleanDoctorPhoto(legacyLawyer.photo) };
        }
      }

      if (!image) {
        const { data: legacyImages } = await supabase
          .from("gallery_images")
          .select("id, image_url, title, description");
        const legacyImage = (legacyImages || []).find((item) => isLegacyHeroImage(item.image_url));
        if (legacyImage) {
          image = {
            ...legacyImage,
            image_url: cleanHeroImageUrl(legacyImage.image_url),
            is_hero_image: true,
          };
        }
      }

      return { lawyer, image, doctor: lawyer };
    },
  });
}

export function useLawyerUnavailability(lawyerId: string, dateStr: string) {
  return useQuery<boolean>({
    queryKey: ["lawyer-unavailability", lawyerId, dateStr],
    queryFn: async () => {
      if (!lawyerId || !dateStr) return false;
      const { data, error } = await supabase
        .from("lawyer_holidays")
        .select("id")
        .eq("lawyer_id", lawyerId)
        .eq("date", dateStr);

      if (error) throw error;
      return (data || []).length > 0;
    },
    enabled: !!lawyerId && !!dateStr,
  });
}

export const useDoctorHoliday = useLawyerUnavailability;

export function useLawyerBookings(lawyerId: string, dateStr: string) {
  return useQuery<string[]>({
    queryKey: ["lawyer-bookings", lawyerId, dateStr],
    queryFn: async () => {
      if (!lawyerId || !dateStr) return [];
      const { data, error } = await supabase
        .from("public_bookings")
        .select("time_slot")
        .eq("lawyer_id", lawyerId)
        .eq("date", dateStr)
        .neq("status", "cancelled");

      if (error) throw error;
      return (data || []).map((b) => b.time_slot);
    },
    enabled: !!lawyerId && !!dateStr,
  });
}

export const useDoctorBookings = useLawyerBookings;

export function useLawyerIdsForService(serviceId: string) {
  return useQuery<string[]>({
    queryKey: ["service-lawyers", serviceId],
    queryFn: async () => {
      if (!serviceId) return [];
      const { data, error } = await supabase
        .from("lawyer_services")
        .select("lawyer_id")
        .eq("service_id", serviceId);

      if (error) throw error;
      return (data || []).map((row) => row.lawyer_id);
    },
    enabled: !!serviceId,
  });
}

export const useDoctorIdsForService = useLawyerIdsForService;

export interface DBAvailability {
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

export function useLawyerAvailability(lawyerId: string, dayOfWeek: number | undefined) {
  return useQuery<DBAvailability[]>({
    queryKey: ["lawyer-availability", lawyerId, dayOfWeek],
    queryFn: async () => {
      if (!lawyerId || dayOfWeek === undefined) return [];
      const { data, error } = await supabase
        .from("availability")
        .select("start_time, end_time, slot_duration_minutes")
        .eq("lawyer_id", lawyerId)
        .eq("day_of_week", dayOfWeek);

      if (error) throw error;
      return data || [];
    },
    enabled: !!lawyerId && dayOfWeek !== undefined,
  });
}

export const useDoctorAvailability = useLawyerAvailability;
