import { useMemo, useState } from "react";
import { HelpCircle, Search, ShieldCheck } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { type DBFaq, useFaqs } from "@/hooks/use-supabase-data";

const FALLBACK_FAQS: DBFaq[] = [
  {
    id: "appointment-booking",
    question: "How do I book an appointment?",
    answer:
      "You can book online through the appointment page or call the clinic directly. After choosing a service, doctor, date, and available time slot, we will confirm your booking details.",
    category: "Appointments",
    sort_order: 0,
    is_published: true,
  },
  {
    id: "first-visit",
    question: "What should I bring for my first visit?",
    answer:
      "Please bring previous prescriptions, investigation reports, current medications, and any discharge summaries if available. This helps the doctor understand your health history clearly.",
    category: "Visit preparation",
    sort_order: 1,
    is_published: true,
  },
  {
    id: "pricing",
    question: "Are service prices transparent?",
    answer:
      "Yes. Service prices are shown before booking wherever available. If a service needs additional tests or procedures, the care team will explain those costs before proceeding.",
    category: "Billing",
    sort_order: 2,
    is_published: true,
  },
  {
    id: "follow-up",
    question: "Is follow-up support included?",
    answer:
      "Most consultations include a clear follow-up plan. The doctor will explain when you should return, whether further tests are needed, and how to continue your treatment safely.",
    category: "After care",
    sort_order: 3,
    is_published: true,
  },
];

export function FAQSection() {
  const { data, isLoading } = useFaqs();
  const [query, setQuery] = useState("");
  const faqs = data?.length ? data : FALLBACK_FAQS;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredFaqs = useMemo(() => {
    if (!normalizedQuery) return faqs;

    return faqs.filter((faq) => {
      const searchable = `${faq.question} ${faq.answer} ${faq.category || ""}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [faqs, normalizedQuery]);

  return (
    <section className="relative isolate overflow-hidden bg-background py-20 sm:py-24">
      <div className="absolute left-1/2 top-0 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-light/60 px-3.5 py-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-primary shadow-sm">
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              FAQs
            </div>
            <h2 className="hero-display mt-5 max-w-xl text-4xl leading-tight text-foreground sm:text-5xl">
              Questions, answered with <span className="text-primary">clarity.</span>
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Find quick answers about appointments, preparation, billing, and follow-up care.
            </p>

            <div className="mt-7 flex items-center gap-2 rounded-2xl border border-primary/10 bg-secondary/45 p-3 text-sm text-foreground/75">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-success/10 text-success">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>Still unsure? Book a consultation and our team will guide you.</span>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white/90 p-4 shadow-[0_24px_70px_-45px_rgba(16,45,75,0.55)] backdrop-blur sm:p-6">
            <label htmlFor="faq-search" className="sr-only">
              Search frequently asked questions
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="faq-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search appointment, pricing, reports..."
                className="h-12 rounded-2xl border-primary/10 bg-background pl-11 shadow-sm"
                type="search"
              />
            </div>

            {isLoading ? (
              <div className="mt-5 space-y-3" aria-label="Loading FAQs">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="mt-5">
                {filteredFaqs.length > 0 ? (
                  <ScrollArea className="h-[24rem] w-full max-w-full rounded-[1.5rem] border border-border/60 bg-gradient-to-b from-background/95 via-background/90 to-secondary/20 sm:h-[28rem] lg:h-[32rem]">
                    <Accordion type="single" collapsible className="w-full max-w-full space-y-3 p-1.5 pr-3 sm:p-2 sm:pr-4">
                      {filteredFaqs.map((faq, index) => (
                        <AccordionItem
                          key={faq.id}
                          value={faq.id}
                          className="hero-enter w-full max-w-full overflow-hidden rounded-2xl border border-border bg-background/95 px-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                          style={{ animationDelay: `${index * 70}ms` }}
                        >
                          <AccordionTrigger className="w-full min-w-0 gap-4 py-5 text-left text-base font-bold leading-6 hover:no-underline sm:text-lg">
                            <span className="block min-w-0 max-w-full whitespace-normal break-all [overflow-wrap:anywhere]">
                              {faq.question}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm leading-7 text-muted-foreground sm:text-base">
                            <div className="max-h-40 min-w-0 max-w-full overflow-x-hidden overflow-y-auto whitespace-normal break-all border-t border-border/70 pt-4 pr-2 [overflow-wrap:anywhere]">
                              {faq.category && (
                                <div className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-primary">
                                  {faq.category}
                                </div>
                              )}
                              {faq.answer}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </ScrollArea>
                ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-6 text-center">
                      <p className="font-semibold">No matching FAQs found</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Try searching for appointment, reports, pricing, or follow-up.
                      </p>
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
