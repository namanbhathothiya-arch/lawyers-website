import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { PUBLIC_CONTENT_QUERY_OPTIONS } from "@/hooks/use-supabase-data";

export interface DBAboutContent {
  id: string;
  firm_name: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  mission: string;
  story: string;
  approach: string;
  confidentiality_note: string;
  consultation_note: string;
  primary_cta_label: string;
  primary_cta_url: string;
  secondary_cta_label: string;
  secondary_cta_url: string;
  hero_image_url?: string | null;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Fetch the single published About record for public pages. */
export function useAboutContent() {
  return useQuery<DBAboutContent | null>({
    queryKey: ["about-content"],
    ...PUBLIC_CONTENT_QUERY_OPTIONS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("about_content")
        .select("*")
        .eq("is_published", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn("Unable to load About content from database:", error.message);
        // Return null so the page renders its fallback instead of crashing
        return null;
      }
      return data as DBAboutContent | null;
    },
  });
}

/** Fetch the About record for admin (includes unpublished). */
export function useAdminAboutContent() {
  return useQuery<DBAboutContent | null>({
    queryKey: ["admin-about-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("about_content")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as DBAboutContent | null;
    },
  });
}

/** Save (upsert) an About record from the admin panel. */
export function useSaveAboutContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DBAboutContent> & { id?: string }) => {
      const withTimestamp = { ...payload, updated_at: new Date().toISOString() };

      let result;
      if (payload.id) {
        result = await supabase
          .from("about_content")
          .update(withTimestamp)
          .eq("id", payload.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("about_content")
          .insert([withTimestamp])
          .select()
          .single();
      }

      if (result.error) throw result.error;
      return result.data as DBAboutContent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["about-content"] });
      queryClient.invalidateQueries({ queryKey: ["admin-about-content"] });
    },
  });
}
