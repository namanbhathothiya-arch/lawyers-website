import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Scale,
  ShieldCheck,
} from "lucide-react";
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
import { LAW_FIRM, TIME_SLOTS } from "@/lib/clinic-data";
import {
  useLawyerAvailability,
  useLawyerBookings,
  useLawyerUnavailability,
  useLawyerIdsForService,
  useLawyers,
  useServiceSections,
  useLegalServices,
} from "@/hooks/use-supabase-data";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  canBookLawyerForService,
  getLawyersForService,
  isValidIndianPhone,
  normalizeIndianPhone,
  resetLawyerSelectionForServiceChange,
} from "@/lib/booking-utils";
import { getServicePathSlug } from "@/lib/service-slug";

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
  lawyer: z.string().optional(),
  doctor: z.string().optional(),
  service: z.string().optional(),
});

export const Route = createFileRoute("/appointment")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: `Book a Consultation — ${LAW_FIRM.name}` },
      {
        name: "description",
        content: `Book your legal consultation online with advocates at ${LAW_FIRM.name}.`,
      },
      { property: "og:title", content: `Book a Consultation — ${LAW_FIRM.name}` },
      {
        property: "og:description",
        content: `Book your legal consultation online with advocates at ${LAW_FIRM.name}.`,
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://sharmalaw.in/appointment" }],
  }),
  component: AppointmentPage,
});

function AppointmentPage() {
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const { data: lawyers, isLoading: loadingLawyers, isError: errorLawyers } = useLawyers();
  const { data: services, isLoading: loadingServices, isError: errorServices } = useLegalServices();
  const { data: sections } = useServiceSections();
  const selectedService = services?.find((item) => item.id === search.service);
  const selectedLawyer = lawyers?.find((item) => item.id === (search.lawyer || search.doctor));

  const [lawyer, setLawyer] = useState<string>(search.lawyer || search.doctor || "");
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

  const { data: isHoliday, isLoading: loadingHoliday } = useLawyerUnavailability(lawyer, dateStr);
  const { data: bookedSlots, isLoading: loadingBookings } = useLawyerBookings(lawyer, dateStr);
  const { data: availability, isLoading: loadingAvailability } = useLawyerAvailability(
    lawyer,
    dayOfWeek,
  );
  const { data: serviceLawyerIds, isLoading: loadingServiceLawyers } =
    useLawyerIdsForService(service);

  const filteredLawyers = useMemo(() => {
    if (!service) {
      return [];
    }
    return getLawyersForService(lawyers || [], serviceLawyerIds);
  }, [lawyers, service, serviceLawyerIds]);

  const hasLawyerMappings = !!service && !!serviceLawyerIds && serviceLawyerIds.length > 0;
  const selectedLawyerIsAllowed = canBookLawyerForService(lawyer, service, serviceLawyerIds);

  useEffect(() => {
    if (lawyer && filteredLawyers.length > 0 && !filteredLawyers.some((doc) => doc.id === lawyer)) {
      setLawyer("");
      setSlot("");
    }
  }, [lawyer, filteredLawyers]);

  const slots = useMemo(() => {
    if (!lawyer || !date) return [];
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
  }, [lawyer, date, availability]);

  const valid =
    lawyer &&
    service &&
    date &&
    slot &&
    name &&
    phone &&
    email &&
    isValidIndianPhone(phone) &&
    selectedLawyerIsAllowed &&
    !loadingServiceLawyers &&
    !isHoliday &&
    !loading;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      if (phone && !isValidIndianPhone(phone)) {
        toast.error("Please enter a valid Indian mobile number.");
        return;
      }
      if (lawyer && service && !selectedLawyerIsAllowed) {
        toast.error("Please choose an advocate who provides the selected service.");
        return;
      }
      toast.error("Please complete all required fields");
      return;
    }

    setLoading(true);
    try {
      const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!loaded) {
        toast.error("Razorpay payment gateway failed to initialize. Are you online?");
        setLoading(false);
        return;
      }

      const selectedLawyer = lawyers?.find((d) => d.id === lawyer);
      const selectedService = services?.find((s) => s.id === service);
      const lawyerName = selectedLawyer ? selectedLawyer.name : "Advocate";
      const serviceName = selectedService ? selectedService.name : "Legal Service";

      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "create-razorpay-order",
        {
          body: {
            service_id: service,
            receipt: `receipt_consultation_${Date.now()}`,
          },
        },
      );

      if (orderError || !orderData?.order_id) {
        toast.error("Payment initialization failed. Please try again.");
        console.error("Order creation error:", orderError);
        setLoading(false);
        return;
      }

      const { order_id, amount, currency, key_id } = orderData;

      const options = {
        key: key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || "",
        amount: amount,
        currency: currency || "INR",
        name: LAW_FIRM.name,
        description: `Booking: ${serviceName} with ${lawyerName}`,
        order_id: order_id,
        theme: {
          color: "#C9A15A",
        },
        prefill: {
          name,
          email,
          contact: phone,
        },
        handler: async function (response: RazorpaySuccessResponse) {
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
              "verify-razorpay-payment",
              {
                body: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  lawyer_id: lawyer,
                  doctor_id: lawyer,
                  service_id: service,
                  date: dateStr,
                  time_slot: slot,
                  client_name: name,
                  patient_name: name,
                  client_phone: normalizeIndianPhone(phone),
                  patient_phone: normalizeIndianPhone(phone),
                  client_email: email,
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

            queryClient.invalidateQueries({ queryKey: ["lawyer-bookings", lawyer, dateStr] });
            queryClient.invalidateQueries({ queryKey: ["admin-consultations"] });
            queryClient.invalidateQueries({ queryKey: ["admin-count"] });

            setDone(true);
            toast.success("Consultation booked and payment successful!");
          } catch (err: unknown) {
            console.error("Signature verification error:", err);
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
      <div className="bg-[#05070B] text-[#F7F5EF] min-h-screen flex items-center justify-center py-20 px-4">
        <Card className="max-w-xl w-full border-[#263247] bg-[#0B1020] text-[#F7F5EF] shadow-2xl rounded-xl">
          <CardContent className="p-8 sm:p-10 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-[#C9A15A]/10 border border-[#C9A15A]/30 text-[#22C55E] grid place-items-center">
              <CheckCircle2 className="h-8 w-8 text-[#22C55E]" />
            </div>
            <h1 className="mt-5 font-serif text-3xl font-bold text-[#F7F5EF]">Consultation Confirmed</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#9AAAC0]">
              Thank you, <strong className="text-[#F7F5EF]">{name}</strong>. Your legal consultation has been booked for{" "}
              <strong className="text-[#F7F5EF]">{date && format(date, "PPP")}</strong> at <strong className="text-[#F7F5EF]">{slot}</strong>.
              Our chambers will contact you at <strong className="text-[#F7F5EF]">{phone}</strong> with meeting details.
            </p>
            <Button
              className="mt-8 bg-[#F7F5EF] hover:bg-white text-[#05070B] font-bold rounded-lg px-6 transition-all duration-200 hover:-translate-y-0.5"
              onClick={() => {
                setDone(false);
                setName("");
                setPhone("");
                setEmail("");
                setSlot("");
                setDate(undefined);
              }}
            >
              Book Another Consultation
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-[#05070B] text-[#F7F5EF] min-h-screen py-16 sm:py-24">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A15A]/30 bg-[#C9A15A]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#C9A15A]">
            <Scale className="h-3.5 w-3.5 text-[#C9A15A]" />
            Legal consultation booking
          </div>
          <h1 className="mt-4 font-serif text-4xl sm:text-5xl font-semibold text-[#F7F5EF]">Book a consultation</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#9AAAC0]">
            Select your required legal service, preferred advocate, and convenient consultation slot.
          </p>
        </div>

        {(selectedService || selectedLawyer) && (
          <div className="mt-8 rounded-2xl border border-[#263247] bg-[#0B1020] px-5 py-4 shadow-2xl sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#C9A15A]">
                  Booking context
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#9AAAC0]">
                  {selectedService
                    ? `Consultation will begin with ${selectedService.name} selected.`
                    : "A consultation service can be selected to continue."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {selectedService && (
                  <Link
                    to="/services/$serviceSlug"
                    params={{ serviceSlug: getServicePathSlug(selectedService, services || [], sections || []) }}
                    className="inline-flex items-center gap-2 rounded-full border border-[#C9A15A]/30 bg-[#070A10] px-3 py-1.5 font-medium text-[#F7F5EF] transition-colors hover:border-[#C9A15A] hover:bg-[#0B1020]"
                  >
                    {selectedService.name}
                    <ChevronRight className="h-3.5 w-3.5 text-[#C9A15A]" aria-hidden="true" />
                  </Link>
                )}
                {selectedLawyer && (
                  <span className="inline-flex items-center rounded-full border border-[#263247] bg-[#070A10] px-3 py-1.5 font-medium text-[#9AAAC0]">
                    {selectedLawyer.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <Card className="mt-10 border-[#263247] bg-[#0B1020] text-[#F7F5EF] shadow-2xl rounded-xl overflow-hidden">
          <CardContent className="p-6 sm:p-10">
            <form onSubmit={submit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <Field label="Legal Service" id="booking-service">
                  <Select
                    value={service}
                    onValueChange={(val) => {
                      setService(val);
                      const nextSelection = resetLawyerSelectionForServiceChange();
                      setLawyer(nextSelection.lawyer);
                      setSlot(nextSelection.slot);
                    }}
                    disabled={loadingServices || errorServices}
                  >
                    <SelectTrigger id="booking-service" className="bg-[#070A10] border-[#263247] text-[#F7F5EF] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:text-[#718198] disabled:border-[#263247]/60 rounded-lg min-h-11 h-11">
                      <SelectValue
                        placeholder={
                          errorServices
                            ? "Error loading services"
                            : loadingServices
                              ? "Loading services..."
                              : "Select legal service"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0B1020] border-[#263247] text-[#F7F5EF]">
                      {services?.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="focus:bg-[#162035] focus:text-[#F7F5EF] text-[#F7F5EF] cursor-pointer">
                          {s.name} · {s.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Advocate / Lawyer" id="booking-lawyer">
                  <Select
                    value={lawyer}
                    onValueChange={(val) => {
                      setLawyer(val);
                      setSlot("");
                    }}
                    disabled={
                      !service ||
                      loadingLawyers ||
                      loadingServiceLawyers ||
                      errorLawyers ||
                      filteredLawyers.length === 0
                    }
                  >
                    <SelectTrigger id="booking-lawyer" className="bg-[#070A10] border-[#263247] text-[#F7F5EF] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:text-[#718198] disabled:border-[#263247]/60 rounded-lg min-h-11 h-11">
                      <SelectValue
                        placeholder={
                          !service
                            ? "Select a service first"
                            : errorLawyers
                              ? "Error loading lawyers"
                              : loadingLawyers || loadingServiceLawyers
                                ? "Finding lawyers..."
                                : filteredLawyers.length === 0
                                  ? "No lawyers available"
                                  : "Select an advocate"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0B1020] border-[#263247] text-[#F7F5EF]">
                      {filteredLawyers.map((d) => (
                        <SelectItem key={d.id} value={d.id} className="focus:bg-[#162035] focus:text-[#F7F5EF] text-[#F7F5EF] cursor-pointer">
                          {d.name} — {d.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {service && loadingServiceLawyers && (
                    <p className="text-xs text-[#9AAAC0] mt-1.5">
                      Checking available advocates for this practice area...
                    </p>
                  )}
                  {service &&
                    !loadingServiceLawyers &&
                    !hasLawyerMappings &&
                    filteredLawyers.length > 0 && (
                      <p className="text-xs text-[#9AAAC0] mt-1.5">
                        All active firm advocates are shown for this service.
                      </p>
                    )}
                  {service && !loadingServiceLawyers && filteredLawyers.length === 0 && (
                    <p className="text-xs text-red-400 mt-1.5 font-medium">
                      No advocate currently handles the selected service.
                    </p>
                  )}
                </Field>

                <Field label="Consultation Date" id="booking-date">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="booking-date"
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-[#070A10] border-[#263247] text-[#F7F5EF] hover:bg-[#070A10] hover:text-[#F7F5EF] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-lg min-h-11 h-11",
                          !date && "text-[#718198]",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-[#C9A15A]" />
                        {date ? format(date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#0B1020] border-[#263247] text-[#F7F5EF]" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(val) => {
                          setDate(val);
                          setSlot("");
                        }}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className="p-3 pointer-events-auto bg-[#0B1020] text-[#F7F5EF]"
                      />
                    </PopoverContent>
                  </Popover>
                </Field>

                <Field label="Time Slot" id="booking-slot">
                  <Select
                    value={slot}
                    onValueChange={setSlot}
                    disabled={
                      !lawyer ||
                      !date ||
                      loadingHoliday ||
                      isHoliday ||
                      loadingBookings ||
                      loadingAvailability
                    }
                  >
                    <SelectTrigger id="booking-slot" className="bg-[#070A10] border-[#263247] text-[#F7F5EF] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:text-[#718198] disabled:border-[#263247]/60 rounded-lg min-h-11 h-11">
                      <SelectValue
                        placeholder={
                          !lawyer || !date
                            ? "Select advocate & date first"
                            : isHoliday
                              ? "Advocate is unavailable on this date."
                              : loadingHoliday || loadingBookings || loadingAvailability
                                ? "Loading time slots..."
                                : "Select a time slot"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0B1020] border-[#263247] text-[#F7F5EF]">
                      {!isHoliday &&
                        slots.map((t) => {
                          const isBooked = bookedSlots?.includes(t);
                          return (
                            <SelectItem key={t} value={t} disabled={isBooked} className="focus:bg-[#162035] focus:text-[#F7F5EF] text-[#F7F5EF] cursor-pointer">
                              {t} {isBooked ? "— Booked" : ""}
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                  {isHoliday && (
                    <p className="text-xs text-red-400 mt-1.5 font-medium">
                      Advocate is unavailable on this date.
                    </p>
                  )}
                </Field>
              </div>

              <div className="pt-2 border-t border-[#263247]" />

              <div className="grid sm:grid-cols-2 gap-6">
                <Field label="Client Full Name" id="booking-name">
                  <Input
                    id="booking-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full legal name"
                    className="bg-[#070A10] border-[#263247] text-[#F7F5EF] placeholder:text-[#718198] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-lg h-11"
                  />
                </Field>
                <Field label="Client Phone (India)" id="booking-phone">
                  <Input
                    id="booking-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="bg-[#070A10] border-[#263247] text-[#F7F5EF] placeholder:text-[#718198] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-lg h-11"
                  />
                  {phone && !isValidIndianPhone(phone) && (
                    <p className="text-xs text-red-400 mt-1">
                      Enter a valid 10-digit Indian mobile number.
                    </p>
                  )}
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Client Email Address" id="booking-email">
                    <Input
                      id="booking-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="bg-[#070A10] border-[#263247] text-[#F7F5EF] placeholder:text-[#718198] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] rounded-lg h-11"
                    />
                  </Field>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-[#F7F5EF] hover:bg-white text-[#05070B] font-bold rounded-lg min-h-12 h-12 text-base shadow-xl transition-all duration-200 hover:-translate-y-0.5 border-0"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-[#05070B]" />
                    Launching Payment Gateway...
                  </span>
                ) : (
                  "Proceed to Pay & Confirm Consultation"
                )}
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs text-[#9AAAC0] pt-1">
                <ShieldCheck className="h-4 w-4 text-[#C9A15A]" />
                <span>Protected by Lawyer-Client Confidentiality & Razorpay SSL Security.</span>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-[#9AAAC0]">{label}</Label>
      {children}
    </div>
  );
}

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
