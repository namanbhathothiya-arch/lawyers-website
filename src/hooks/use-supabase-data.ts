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

export interface DBDoctor {
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

export interface HeroGalleryImage {
  id: string;
  image_url: string;
  title?: string | null;
  description?: string | null;
  is_hero_image: boolean;
}

export interface DBService {
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
  patient_name: string;
  patient_label?: string | null;
  review: string;
  rating: number;
  image_url?: string | null;
  sort_order: number;
  is_published: boolean;
  created_at?: string;
}

export function useDoctors() {
  return useQuery<DBDoctor[]>({
    queryKey: ["doctors"],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }
      return data || [];
    },
  });
}

export function useServices() {
  return useQuery<DBService[]>({
    queryKey: ["services"],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }
      return data || [];
    },
  });
}

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
      return data || [];
    },
  });
}

export function useHeroContent() {
  return useQuery<{
    doctor: DBDoctor | null;
    image: HeroGalleryImage | null;
  }>({
    queryKey: ["hero-content"],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    queryFn: async () => {
      const [doctorResult, imageResult] = await Promise.all([
        supabase
          .from("doctors")
          .select("id, name, specialization, experience, photo, bio, is_featured_hero")
          .eq("is_featured_hero", true)
          .limit(1),
        supabase
          .from("gallery_images")
          .select("id, image_url, title, description, is_hero_image")
          .eq("is_hero_image", true)
          .limit(1),
      ]);

      if (doctorResult.error) {
        console.warn("Unable to load featured hero doctor:", doctorResult.error.message);
      }
      if (imageResult.error) {
        console.warn("Unable to load featured hero image:", imageResult.error.message);
      }

      let doctor = (doctorResult.data?.[0] as DBDoctor | undefined) || null;
      let image = (imageResult.data?.[0] as HeroGalleryImage | undefined) || null;

      if (!doctor) {
        const { data: legacyDoctors } = await supabase
          .from("doctors")
          .select("id, name, specialization, experience, photo, bio");
        const legacyDoctor = (legacyDoctors || []).find((item) => isLegacyHeroDoctor(item.photo));
        if (legacyDoctor) {
          doctor = { ...legacyDoctor, photo: cleanDoctorPhoto(legacyDoctor.photo) };
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

      return { doctor, image };
    },
  });
}

export function useDoctorHoliday(doctorId: string, dateStr: string) {
  return useQuery<boolean>({
    queryKey: ["doctor-holiday", doctorId, dateStr],
    queryFn: async () => {
      if (!doctorId || !dateStr) return false;
      const { data, error } = await supabase
        .from("doctor_holidays")
        .select("id")
        .eq("doctor_id", doctorId)
        .eq("date", dateStr);

      if (error) throw error;
      return (data || []).length > 0;
    },
    enabled: !!doctorId && !!dateStr,
  });
}

export function useDoctorBookings(doctorId: string, dateStr: string) {
  return useQuery<string[]>({
    queryKey: ["doctor-bookings", doctorId, dateStr],
    queryFn: async () => {
      if (!doctorId || !dateStr) return [];
      const { data, error } = await supabase
        .from("public_bookings")
        .select("time_slot")
        .eq("doctor_id", doctorId)
        .eq("date", dateStr)
        .neq("status", "cancelled");

      if (error) throw error;
      return (data || []).map((b) => b.time_slot);
    },
    enabled: !!doctorId && !!dateStr,
  });
}

export function useDoctorIdsForService(serviceId: string) {
  return useQuery<string[]>({
    queryKey: ["service-doctors", serviceId],
    queryFn: async () => {
      if (!serviceId) return [];
      const { data, error } = await supabase
        .from("doctor_services")
        .select("doctor_id")
        .eq("service_id", serviceId);

      if (error) throw error;
      return (data || []).map((row) => row.doctor_id);
    },
    enabled: !!serviceId,
  });
}

export interface DBAvailability {
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

export function useDoctorAvailability(doctorId: string, dayOfWeek: number | undefined) {
  return useQuery<DBAvailability[]>({
    queryKey: ["doctor-availability", doctorId, dayOfWeek],
    queryFn: async () => {
      if (!doctorId || dayOfWeek === undefined) return [];
      const { data, error } = await supabase
        .from("availability")
        .select("start_time, end_time, slot_duration_minutes")
        .eq("doctor_id", doctorId)
        .eq("day_of_week", dayOfWeek);

      if (error) throw error;
      return data || [];
    },
    enabled: !!doctorId && dayOfWeek !== undefined,
  });
}
