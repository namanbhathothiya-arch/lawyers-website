import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials are missing. Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment or .env file.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
