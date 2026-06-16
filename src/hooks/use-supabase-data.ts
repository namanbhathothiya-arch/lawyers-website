import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface DBDoctor {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  photo?: string | null;
  bio?: string | null;
  created_at?: string;
}

export interface DBService {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  created_at?: string;
}

export function useDoctors() {
  return useQuery<DBDoctor[]>({
    queryKey: ["doctors"],
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
