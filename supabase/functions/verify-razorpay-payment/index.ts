import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

type VerifyPaymentBody = {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  doctor_id?: string;
  service_id?: string;
  date?: string;
  time_slot?: string;
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
};

type RazorpayOrder = {
  id: string;
  amount: number;
  amount_paid: number;
  currency: string;
  status: string;
  notes?: {
    service_id?: string;
  };
};

type RazorpayPayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
};

function getAmountInPaise(priceStr: string): number {
  const cleanStr = priceStr.replace(/[^\d]/g, "");
  const amountInRupees = parseInt(cleanStr, 10) || 500;
  return amountInRupees * 100;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const text = orderId + "|" + paymentId;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(text);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const generatedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return generatedSignature === signature;
}

async function fetchRazorpayResource<T>(
  path: string,
  keyId: string,
  keySecret: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Razorpay API error ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

async function refundPayment(
  paymentId: string,
  amount: number,
  keyId: string,
  keySecret: string,
  reason: string,
) {
  return await fetchRazorpayResource<Record<string, unknown>>(
    `/payments/${paymentId}/refund`,
    keyId,
    keySecret,
    {
      method: "POST",
      body: JSON.stringify({
        amount,
        speed: "normal",
        notes: { reason },
      }),
    },
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as VerifyPaymentBody;
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      doctor_id,
      service_id,
      date,
      time_slot,
      patient_name,
      patient_phone,
      patient_email,
    } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return jsonResponse({ error: "Missing required Razorpay parameters" }, 400);
    }

    if (
      !doctor_id ||
      !service_id ||
      !date ||
      !time_slot ||
      !patient_name ||
      !patient_phone ||
      !patient_email
    ) {
      return jsonResponse({ error: "Missing booking details parameters" }, 400);
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID") || Deno.env.get("VITE_RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!keyId || !keySecret) {
      return jsonResponse({ error: "Razorpay credentials are not configured on the server." }, 500);
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse(
        { error: "Supabase service credentials are not configured on the server." },
        500,
      );
    }

    const isSignatureValid = await verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret,
    );

    if (!isSignatureValid) {
      return jsonResponse({ error: "Payment verification failed: Signature mismatch." }, 400);
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: service, error: serviceError } = await supabaseClient
      .from("services")
      .select("price")
      .eq("id", service_id)
      .single();

    if (serviceError || !service) {
      return jsonResponse({ error: "Service not found." }, 404);
    }

    const expectedAmount = getAmountInPaise(service.price);
    const [order, payment] = await Promise.all([
      fetchRazorpayResource<RazorpayOrder>(`/orders/${razorpay_order_id}`, keyId, keySecret),
      fetchRazorpayResource<RazorpayPayment>(`/payments/${razorpay_payment_id}`, keyId, keySecret),
    ]);

    if (order.id !== razorpay_order_id || payment.id !== razorpay_payment_id) {
      return jsonResponse({ error: "Razorpay order/payment identity mismatch." }, 400);
    }

    if (payment.order_id !== razorpay_order_id) {
      return jsonResponse({ error: "Payment does not belong to the supplied order." }, 400);
    }

    if (order.notes?.service_id && order.notes.service_id !== service_id) {
      return jsonResponse({ error: "Order service metadata does not match booking service." }, 400);
    }

    if (
      order.amount !== expectedAmount ||
      order.amount_paid !== expectedAmount ||
      payment.amount !== expectedAmount ||
      order.currency !== "INR" ||
      payment.currency !== "INR"
    ) {
      return jsonResponse(
        { error: "Payment amount or currency does not match selected service." },
        400,
      );
    }

    if (order.status !== "paid" || payment.status !== "captured") {
      return jsonResponse({ error: "Payment is not captured and order is not fully paid." }, 400);
    }

    const { data: mappedDoctors, error: mappingError } = await supabaseClient
      .from("doctor_services")
      .select("doctor_id")
      .eq("service_id", service_id);

    if (mappingError) {
      throw mappingError;
    }

    if (mappedDoctors.length > 0 && !mappedDoctors.some((row) => row.doctor_id === doctor_id)) {
      return jsonResponse({ error: "Selected doctor is not mapped to selected service." }, 400);
    }

    const { data: existingAppt, error: checkError } = await supabaseClient
      .from("appointments")
      .select("id")
      .eq("payment_id", razorpay_payment_id)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existingAppt) {
      return jsonResponse({
        success: true,
        message: "Appointment already created.",
        id: existingAppt.id,
      });
    }

    const { data: activeSlot, error: slotCheckError } = await supabaseClient
      .from("appointments")
      .select("id")
      .eq("doctor_id", doctor_id)
      .eq("date", date)
      .eq("time_slot", time_slot)
      .neq("status", "cancelled")
      .maybeSingle();

    if (slotCheckError) {
      throw slotCheckError;
    }

    if (activeSlot) {
      const refund = await refundPayment(
        razorpay_payment_id,
        expectedAmount,
        keyId,
        keySecret,
        "Slot unavailable after payment",
      );
      return jsonResponse(
        {
          success: false,
          error: "Selected slot is no longer available.",
          refund_initiated: true,
          refund,
        },
        409,
      );
    }

    const { data: newAppt, error: insertError } = await supabaseClient
      .from("appointments")
      .insert([
        {
          doctor_id,
          service_id,
          date,
          time_slot,
          patient_name,
          patient_phone,
          patient_email,
          status: "booked",
          payment_status: "paid",
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
        },
      ])
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        const refund = await refundPayment(
          razorpay_payment_id,
          expectedAmount,
          keyId,
          keySecret,
          "Slot conflict during appointment insert",
        );
        return jsonResponse(
          {
            success: false,
            error: "Selected slot was booked before confirmation.",
            refund_initiated: true,
            refund,
          },
          409,
        );
      }
      throw insertError;
    }

    return jsonResponse({
      success: true,
      message: "Payment verified and appointment created successfully.",
      id: newAppt.id,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected payment verification error";
    return jsonResponse({ error: message }, 500);
  }
});
