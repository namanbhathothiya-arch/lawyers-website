import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, RefreshCw } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, generateSlotsFromAvailability } from "@/lib/utils";
import { TIME_SLOTS } from "@/lib/clinic-data";
import {
  useDoctorAvailability,
  useDoctorBookings,
  useDoctorHoliday,
  useDoctorIdsForService,
  useDoctors,
  useServices,
} from "@/hooks/use-supabase-data";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  canBookDoctorForService,
  getDoctorsForService,
  isValidIndianPhone,
  normalizeIndianPhone,
  resetDoctorSelectionForServiceChange,
} from "@/lib/booking-utils";

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: {
    description?: string;
  };
};

type RazorpayCheckout = {
  on: (event: "payment.failed", callback: (resp: RazorpayFailureResponse) => void) => void;
  open: () => void;
};

type RazorpayWindow = Window & {
  Razorpay?: new (options: Record<string, unknown>) => RazorpayCheckout;
};

const searchSchema = z.object({
  doctor: z.string().optional(),
  service: z.string().optional(),
});

export const Route = createFileRoute("/appointment")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Book an Appointment — Advanced Care Medical Clinic" },
      {
        name: "description",
        content: "Book your appointment online with a specialist at Advanced Care Medical Clinic.",
      },
      { property: "og:title", content: "Book an Appointment — Advanced Care Medical Clinic" },
      {
        property: "og:description",
        content: "Book your appointment online with a specialist at Advanced Care Medical Clinic.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://advancedcareclinic.com/appointment" },
      { property: "og:image", content: "https://advancedcareclinic.com/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Book an Appointment — Advanced Care Medical Clinic" },
      {
        name: "twitter:description",
        content: "Book your appointment online with a specialist at Advanced Care Medical Clinic.",
      },
      { name: "twitter:image", content: "https://advancedcareclinic.com/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://advancedcareclinic.com/appointment" }],
  }),
  component: AppointmentPage,
});

function AppointmentPage() {
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const { data: doctors, isLoading: loadingDoctors, isError: errorDoctors } = useDoctors();
  const { data: services, isLoading: loadingServices, isError: errorServices } = useServices();

  const [doctor, setDoctor] = useState<string>(search.doctor ?? "");
  const [service, setService] = useState<string>(search.service ?? "");
  const [date, setDate] = useState<Date | undefined>();
  const [slot, setSlot] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const dateStr = useMemo(() => (date ? format(date, "yyyy-MM-dd") : ""), [date]);
  const dayOfWeek = useMemo(() => (date ? date.getDay() : undefined), [date]);

  const { data: isHoliday, isLoading: loadingHoliday } = useDoctorHoliday(doctor, dateStr);
  const { data: bookedSlots, isLoading: loadingBookings } = useDoctorBookings(doctor, dateStr);
  const { data: availability, isLoading: loadingAvailability } = useDoctorAvailability(
    doctor,
    dayOfWeek,
  );
  const { data: serviceDoctorIds, isLoading: loadingServiceDoctors } =
    useDoctorIdsForService(service);

  const filteredDoctors = useMemo(() => {
    if (!service) {
      return [];
    }
    return getDoctorsForService(doctors || [], serviceDoctorIds);
  }, [doctors, service, serviceDoctorIds]);

  const hasDoctorMappings = !!service && !!serviceDoctorIds && serviceDoctorIds.length > 0;
  const selectedDoctorIsAllowed = canBookDoctorForService(doctor, service, serviceDoctorIds);

  useEffect(() => {
    if (doctor && filteredDoctors.length > 0 && !filteredDoctors.some((doc) => doc.id === doctor)) {
      setDoctor("");
      setSlot("");
    }
  }, [doctor, filteredDoctors]);

  const slots = useMemo(() => {
    if (!doctor || !date) return [];
    if (availability && availability.length > 0) {
      const generated = availability.flatMap((avail) =>
        generateSlotsFromAvailability(
          avail.start_time,
          avail.end_time,
          avail.slot_duration_minutes,
        ),
      );
      return Array.from(new Set(generated));
    }
    return TIME_SLOTS;
  }, [doctor, date, availability]);

  const valid =
    doctor &&
    service &&
    date &&
    slot &&
    name &&
    phone &&
    email &&
    isValidIndianPhone(phone) &&
    selectedDoctorIsAllowed &&
    !loadingServiceDoctors &&
    !isHoliday &&
    !loading;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      if (phone && !isValidIndianPhone(phone)) {
        toast.error("Please enter a valid Indian mobile number.");
        return;
      }
      if (doctor && service && !selectedDoctorIsAllowed) {
        toast.error("Please choose a doctor who provides the selected service.");
        return;
      }
      toast.error("Please complete all fields");
      return;
    }

    setLoading(true);
    try {
      // 1. Load Razorpay Checkout SDK
      const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!loaded) {
        toast.error("Razorpay payment gateway failed to initialize. Are you online?");
        setLoading(false);
        return;
      }

      const selectedDoctor = doctors?.find((d) => d.id === doctor);
      const selectedService = services?.find((s) => s.id === service);
      const doctorName = selectedDoctor ? selectedDoctor.name : "Doctor";
      const serviceName = selectedService ? selectedService.name : "Consultation";

      // 2. Call Supabase Edge Function to securely create Razorpay order (fetching service price securely backend-side)
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "create-razorpay-order",
        {
          body: {
            service_id: service,
            receipt: `receipt_appt_${Date.now()}`,
          },
        },
      );

      if (orderError || !orderData?.order_id) {
        toast.error("Payment initialization failed. Please try again.");
        console.error("Order creation error:", orderError);
        setLoading(false);
        return;
      }

      const { order_id, amount, currency } = orderData;

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "",
        amount: amount,
        currency: currency || "INR",
        name: "Advanced Care Clinic",
        description: `Booking: ${serviceName} with ${doctorName}`,
        order_id: order_id,
        theme: {
          color: "#0F766E", // Clinic theme green/teal color
        },
        prefill: {
          name,
          email,
          contact: phone,
        },
        handler: async function (response: RazorpaySuccessResponse) {
          try {
            // 4. Securely verify signature and create appointment backend-side
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              "verify-razorpay-payment",
              {
                body: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  doctor_id: doctor,
                  service_id: service,
                  date: dateStr,
                  time_slot: slot,
                  patient_name: name,
                  patient_phone: normalizeIndianPhone(phone),
                  patient_email: email,
                },
              },
            );

            if (verifyError || !verifyData?.success) {
              const refundMessage = verifyData?.refund_initiated
                ? " A refund was initiated because the slot is no longer available."
                : "";
              toast.error("Payment verification failed." + refundMessage);
              console.error("Verification error:", verifyError);
              setLoading(false);
              return;
            }

            // Invalidate queries to update availability and admin views
            queryClient.invalidateQueries({ queryKey: ["doctor-bookings", doctor, dateStr] });
            queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
            queryClient.invalidateQueries({ queryKey: ["admin-count"] });

            setDone(true);
            toast.success("Appointment booked and payment successful!");
          } catch (err: unknown) {
            console.error("Signature verification routing error:", err);
            toast.error("An error occurred during payment verification. Contact support.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast.info("Payment process cancelled.");
          },
        },
      };

      const Razorpay = (window as RazorpayWindow).Razorpay;
      if (!Razorpay) {
        toast.error("Razorpay payment gateway failed to initialize. Please try again.");
        setLoading(false);
        return;
      }

      const rzp = new Razorpay(options);
      rzp.on("payment.failed", function (resp: RazorpayFailureResponse) {
        setLoading(false);
        toast.error("Payment failed: " + (resp.error?.description || "Please try again."));
      });
      rzp.open();
    } catch (err: unknown) {
      console.error("Payment popup error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to launch payment gateway.");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <section className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-20">
        <Card>
          <CardContent className="p-10 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-success/15 text-success grid place-items-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-2xl font-bold">Appointment requested</h1>
            <p className="mt-2 text-muted-foreground">
              Thank you, {name}. Our team will call {phone} shortly to confirm your slot on{" "}
              {date && format(date, "PPP")} at {slot}.
            </p>
            <Button
              className="mt-6"
              onClick={() => {
                setDone(false);
                setName("");
                setPhone("");
                setEmail("");
                setSlot("");
                setDate(undefined);
              }}
            >
              Book another
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-xl mx-auto">
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Booking</div>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold">Book an appointment</h1>
        <p className="mt-3 text-muted-foreground">
          Choose your doctor, service and a convenient time.
        </p>
      </div>

      <Card className="mt-10">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={submit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Service" id="booking-service">
                <Select
                  value={service}
                  onValueChange={(val) => {
                    setService(val);
                    const nextSelection = resetDoctorSelectionForServiceChange();
                    setDoctor(nextSelection.doctor);
                    setSlot(nextSelection.slot);
                  }}
                  disabled={loadingServices || errorServices}
                >
                  <SelectTrigger id="booking-service">
                    <SelectValue
                      placeholder={
                        errorServices
                          ? "Error loading services"
                          : loadingServices
                            ? "Loading services..."
                            : "Select a service"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} · {s.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Doctor" id="booking-doctor">
                <Select
                  value={doctor}
                  onValueChange={(val) => {
                    setDoctor(val);
                    setSlot("");
                  }}
                  disabled={
                    !service ||
                    loadingDoctors ||
                    loadingServiceDoctors ||
                    errorDoctors ||
                    filteredDoctors.length === 0
                  }
                >
                  <SelectTrigger id="booking-doctor">
                    <SelectValue
                      placeholder={
                        !service
                          ? "Select a service first"
                          : errorDoctors
                            ? "Error loading doctors"
                            : loadingDoctors || loadingServiceDoctors
                              ? "Finding doctors..."
                              : filteredDoctors.length === 0
                                ? "No doctors available"
                                : "Select a doctor"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDoctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} — {d.specialization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {service && loadingServiceDoctors && (
                  <p className="text-sm text-muted-foreground mt-1.5">
                    Checking which doctors provide this service...
                  </p>
                )}
                {service &&
                  !loadingServiceDoctors &&
                  !hasDoctorMappings &&
                  filteredDoctors.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1.5">
                      No service-specific doctor mapping is configured yet, so all doctors are
                      shown.
                    </p>
                  )}
                {service && !loadingServiceDoctors && filteredDoctors.length === 0 && (
                  <p className="text-sm text-destructive mt-1.5 font-medium">
                    No doctor currently provides the selected service.
                  </p>
                )}
              </Field>

              <Field label="Date" id="booking-date">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="booking-date"
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(val) => {
                        setDate(val);
                        setSlot("");
                      }}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              <Field label="Time slot" id="booking-slot">
                <Select
                  value={slot}
                  onValueChange={setSlot}
                  disabled={
                    !doctor ||
                    !date ||
                    loadingHoliday ||
                    isHoliday ||
                    loadingBookings ||
                    loadingAvailability
                  }
                >
                  <SelectTrigger id="booking-slot">
                    <SelectValue
                      placeholder={
                        !doctor || !date
                          ? "Select doctor & date first"
                          : isHoliday
                            ? "Sorry, doctor is on holiday."
                            : loadingHoliday || loadingBookings || loadingAvailability
                              ? "Loading slots..."
                              : "Select a time"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {!isHoliday &&
                      slots.map((t) => {
                        const isBooked = bookedSlots?.includes(t);
                        return (
                          <SelectItem key={t} value={t} disabled={isBooked}>
                            {t} {isBooked ? "— Booked" : ""}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
                {isHoliday && (
                  <p className="text-sm text-destructive mt-1.5 font-medium animate-pulse">
                    Sorry, doctor is on holiday.
                  </p>
                )}
              </Field>
            </div>

            <div className="pt-2 border-t border-border" />

            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Full name" id="booking-name">
                <Input
                  id="booking-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </Field>
              <Field label="Phone" id="booking-phone">
                <Input
                  id="booking-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
                {phone && !isValidIndianPhone(phone) && (
                  <p className="text-xs text-destructive mt-1">
                    Enter a valid 10-digit Indian mobile number.
                  </p>
                )}
              </Field>
              <div className="sm:col-span-2">
                <Field label="Email" id="booking-email">
                  <Input
                    id="booking-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </Field>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Book Appointment"
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              By booking, you agree to our care policy. Your appointment is confirmed after
              successful payment.
            </p>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

// Dynamic script loader for Razorpay checkout SDK
function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
