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
    question: "How do I book a consultation with an advocate?",
    answer:
      "You can book online through our consultation booking page or call our chambers directly. Select your legal practice area, lawyer, preferred date, and slot, then complete payment.",
    category: "Consultations",
    sort_order: 0,
    is_published: true,
  },
  {
    id: "first-visit",
    question: "What documents should I bring for my legal consultation?",
    answer:
      "Please bring any relevant contracts, court notices, agreements, police reports, or correspondence. This allows the advocate to provide a comprehensive case evaluation.",
    category: "Preparation",
    sort_order: 1,
    is_published: true,
  },
  {
    id: "pricing",
    question: "Are legal consultation fees transparent?",
    answer:
      "Yes. All legal consultation fees and practice prices are displayed upfront before booking. For ongoing litigation or drafting, our advocates discuss fee structures clearly.",
    category: "Billing & Fees",
    sort_order: 2,
    is_published: true,
  },
  {
    id: "follow-up",
    question: "How is client confidentiality maintained?",
    answer:
      "All consultations and shared documents are strictly protected under lawyer-client privilege and Indian Bar Council professional ethics standards.",
    category: "Confidentiality",
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
    <section className="relative isolate overflow-hidden bg-[#F8FAFC] py-16 sm:py-24 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-600 shadow-sm">
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Frequently Asked Questions
            </div>
            <h2 className="hero-display mt-5 max-w-xl font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-5xl">
              Legal questions, answered with <span className="text-blue-600">clarity.</span>
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
              Find quick answers about advocate consultations, case preparation, fee structures, and confidentiality.
            </p>

            <div className="mt-7 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>Need specific legal counsel? Book a consultation for personalized advice.</span>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <label htmlFor="faq-search" className="sr-only">
              Search legal questions
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                id="faq-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search consultation, court fees, documents..."
                className="h-12 rounded-lg border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500 pl-11 shadow-inner focus:border-blue-600"
                type="search"
              />
            </div>

            {isLoading ? (
              <div className="mt-5 space-y-3" aria-label="Loading FAQs">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : (
              <div className="mt-5">
                {filteredFaqs.length > 0 ? (
                  <ScrollArea className="h-[24rem] w-full max-w-full rounded-xl border border-slate-200 bg-slate-50 sm:h-[28rem] lg:h-[32rem]">
                    <Accordion type="single" collapsible className="w-full max-w-full space-y-3 p-2 sm:p-3">
                      {filteredFaqs.map((faq, index) => (
                        <AccordionItem
                          key={faq.id}
                          value={faq.id}
                          className="w-full max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition-all duration-200 hover:border-slate-300"
                          style={{ animationDelay: `${index * 70}ms` }}
                        >
                          <AccordionTrigger className="w-full min-w-0 gap-4 py-4 text-left text-base font-bold leading-snug text-slate-900 hover:no-underline font-serif sm:text-lg">
                            <span className="block min-w-0 max-w-full whitespace-normal break-words [overflow-wrap:anywhere]">
                              {faq.question}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm leading-relaxed text-slate-600">
                            <div className="max-h-48 min-w-0 max-w-full overflow-x-hidden overflow-y-auto whitespace-normal break-words border-t border-slate-100 pt-3 pb-2 [overflow-wrap:anywhere]">
                              {faq.category && (
                                <div className="mb-2 text-[0.65rem] font-bold uppercase tracking-widest text-blue-600">
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
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-700">
                    <p className="font-semibold text-slate-900">No matching FAQs found</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Try searching for consultation, documents, fees, or advocacy.
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
