import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

type CreateOrderBody = {
  service_id?: string;
  receipt?: string;
};

// Clean and convert price strings (e.g., "₹2,200", "From ₹500") into paise
function getAmountInPaise(priceStr: string): number {
  const cleanStr = priceStr.replace(/[^\d]/g, "");
  const amountInRupees = parseInt(cleanStr, 10) || 500;
  return amountInRupees * 100;
}

serve(async (req) => {
  // Handle CORS Preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { service_id, receipt } = (await req.json()) as CreateOrderBody;

    if (!service_id) {
      return new Response(JSON.stringify({ error: "service_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID") || Deno.env.get("VITE_RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!keyId || !keySecret) {
      return new Response(
        JSON.stringify({ error: "Razorpay credentials are not configured on the server." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch service price securely from the database
    const { data: service, error: serviceError } = await supabaseClient
      .from("legal_services")
      .select("price")
      .eq("id", service_id)
      .single();

    if (serviceError || !service) {
      return new Response(
        JSON.stringify({
          error: "Service not found in database: " + (serviceError?.message || ""),
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const amountInPaise = getAmountInPaise(service.price);

    // Call Razorpay API to generate the Order ID
    const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: receipt || `receipt_${Date.now()}`,
        notes: {
          service_id,
        },
      }),
    });

    if (!rzpResponse.ok) {
      const errText = await rzpResponse.text();
      return new Response(
        JSON.stringify({
          error: `Razorpay Order creation failed: ${rzpResponse.status} - ${errText}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const order = await rzpResponse.json();

    return new Response(
      JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: keyId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected order creation error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
