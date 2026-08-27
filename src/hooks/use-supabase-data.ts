import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  cleanDoctorPhoto,
  isLegacyHeroDoctor,
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
  is_active?: boolean;
  created_at?: string;
  phone?: string | null;
  mobile?: string | null;
  contact_phone?: string | null;
  phone_number?: string | null;
  whatsapp?: string | null;
  whatsapp_number?: string | null;
  whatsapp_phone?: string | null;
  email?: string | null;
  contact_email?: string | null;
}

export type DBDoctor = DBLawyer;

export interface DBLegalService {
  id: string;
  name: string;
  slug?: string | null;
  section_id?: string | null;
  description?: string | null;
  short_description?: string | null;
  how_we_help?: string | null;
  important_information?: string | null;
  price: string;
  display_order?: number;
  is_published?: boolean;
  archived_at?: string | null;
  image_url?: string | null;
  image_urls?: string[] | string | null;
  images?: string[] | string | null;
  photos?: string[] | string | null;
  created_at?: string;
  updated_at?: string;
}

export type DBService = DBLegalService;

export interface DBServiceSection {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  display_order?: number;
  is_published?: boolean;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
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
        .or("is_active.eq.true,is_active.is.null")
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }
      return data || [];
    },
  });
}

export const useDoctors = useLawyers;

export function useLawyer(lawyerId: string) {
  return useQuery<DBLawyer | null>({
    queryKey: ["lawyer", lawyerId],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    enabled: Boolean(lawyerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lawyers")
        .select("*")
        .eq("id", lawyerId)
        .maybeSingle();

      if (error) {
        throw error;
      }
      return (data as DBLawyer | null) || null;
    },
  });
}

export function useLawyerPracticeAreas(lawyerId: string) {
  return useQuery<{ id: string; name: string; description?: string | null }[]>({
    queryKey: ["lawyer-practice-areas", lawyerId],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    enabled: Boolean(lawyerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lawyer_services")
        .select("service_id")
        .eq("lawyer_id", lawyerId);

      if (error) {
        throw error;
      }

      const serviceIds = (data || []).map((row) => row.service_id).filter(Boolean);
      if (serviceIds.length === 0) return [];

      const { data: services, error: servicesError } = await supabase
        .from("legal_services")
        .select("id, name, description")
        .in("id", serviceIds)
        .order("name", { ascending: true });

      if (servicesError) {
        throw servicesError;
      }
      return services || [];
    },
  });
}

export function useLegalServices() {
  return useQuery<DBLegalService[]>({
    queryKey: ["legal_services"],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_services")
        .select("*")
        .eq("is_published", true)
        .is("archived_at", null)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }
      return data || [];
    },
  });
}

export const useServices = useLegalServices;

export function useServiceSections() {
  return useQuery<DBServiceSection[]>({
    queryKey: ["service_sections"],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_sections")
        .select("*")
        .eq("is_published", true)
        .is("archived_at", null)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }
      return data || [];
    },
  });
}

export function useServiceSection(sectionId: string) {
  return useQuery<DBServiceSection | null>({
    queryKey: ["service_section", sectionId],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    enabled: Boolean(sectionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_sections")
        .select("*")
        .eq("id", sectionId)
        .maybeSingle();

      if (error) {
        throw error;
      }
      return (data as DBServiceSection | null) || null;
    },
  });
}

export function useServicesBySection(sectionId: string) {
  return useQuery<DBLegalService[]>({
    queryKey: ["legal_services", "section", sectionId],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    enabled: Boolean(sectionId),
    queryFn: async () => {
      if (!sectionId) return [];
      const { data, error } = await supabase
        .from("legal_services")
        .select("*")
        .eq("section_id", sectionId)
        .eq("is_published", true)
        .is("archived_at", null)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }
      return data || [];
    },
  });
}

export function useService(serviceId: string) {
  return useQuery<DBLegalService | null>({
    queryKey: ["legal_service", serviceId],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    enabled: Boolean(serviceId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_services")
        .select("*")
        .eq("id", serviceId)
        .maybeSingle();

      if (error) {
        throw error;
      }
      return (data as DBLegalService | null) || null;
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
    doctor?: DBLawyer | null;
  }>({
    queryKey: ["hero-content"],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lawyers")
        .select("id, name, specialization, experience, photo, bio, is_featured_hero, is_active")
        .eq("is_featured_hero", true)
        .or("is_active.eq.true,is_active.is.null")
        .limit(1);

      if (error) {
        console.warn("Unable to load featured hero lawyer:", error.message);
      }

      let lawyer = (data?.[0] as DBLawyer | undefined) || null;

      if (!lawyer) {
        const { data: legacyLawyers } = await supabase
          .from("lawyers")
          .select("id, name, specialization, experience, photo, bio");
        const legacyLawyer = (legacyLawyers || []).find((item) => isLegacyHeroDoctor(item.photo));
        if (legacyLawyer) {
          lawyer = { ...legacyLawyer, photo: cleanDoctorPhoto(legacyLawyer.photo) };
        }
      }

      return { lawyer, doctor: lawyer };
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

export function useLawyersForService(serviceId: string) {
  return useQuery<DBLawyer[]>({
    queryKey: ["service-lawyers-records", serviceId],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    enabled: Boolean(serviceId),
    queryFn: async () => {
      if (!serviceId) return [];

      const { data, error } = await supabase
        .from("lawyer_services")
        .select("lawyer:lawyers(*)")
        .eq("service_id", serviceId);

      if (error) {
        throw error;
      }

      return (data || [])
        .map((row) => row.lawyer)
        .filter(Boolean)
        .map((lawyer) => lawyer as unknown as DBLawyer)
        .filter((lawyer) => lawyer.is_active !== false);
    },
  });
}

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
