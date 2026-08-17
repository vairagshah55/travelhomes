import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CheckCircle2, Mail, MapPin, Phone } from "lucide-react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import {
  ActionButton,
  CONTAINER,
  Eyebrow,
  FaqList,
  Reveal,
  SECTION_Y,
  SectionHead,
  SiteSection,
  SkelLine,
} from "@/components/site/kit";
import { useFaqs } from "@/hooks/useFaqs";
import { cmsPublicApi } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * /contact
 *
 * ── The headline fix ──────────────────────────────────────────────────────
 * The form did nothing. There was no `onSubmit`, no field state and no request:
 * a visitor filled in five fields, pressed "Send Message", and the browser
 * reloaded the page with the values in the query string. The `validate()`
 * helper and the `errors` state existed but were never called or read, and the
 * character counter was the literal string "0/1000".
 *
 * `cmsPublicApi.submitContact` → `POST /api/contact` already existed and was
 * unused, so wiring it up is connecting existing infrastructure, not new API
 * work. The schema below mirrors `Server/modules/contact/contact.dto.js` so the
 * client rejects what the server would reject.
 *
 * ── The other fix ────────────────────────────────────────────────────────
 * Contact details fell back to `support@travelhomes.com`, `+91 - 872XXXXXXX`
 * and "123 Avenue Lane, Suite 100, Bucks, Los Angeles" whenever the CMS row was
 * empty — placeholder contact information shown to real visitors, including a
 * phone number with X's in it. Now a channel renders only when the CMS actually
 * has it, and the whole block is skeletoned while that fetch is in flight.
 */

const MESSAGE_MAX = 1000;

/* Mirrors contact.dto.js `submitBody`. Phone keeps the 10-digit intent from the
   old dead `validate()` helper; the server only bounds its length. */
const contactSchema = z.object({
  firstName: z.string().trim().min(1, "Please enter your first name").max(80),
  lastName: z.string().trim().max(80).optional(),
  email: z.string().trim().min(1, "Please enter your email").email("Please enter a valid email address").max(254),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .refine((v) => !v || v.replace(/\D/g, "").length >= 10, "Please enter a valid phone number"),
  message: z.string().trim().min(1, "Please tell us what you need").max(MESSAGE_MAX),
});

type ContactValues = z.infer<typeof contactSchema>;

/* ── Field primitives ─────────────────────────────────────────────────────── */

const labelCls = "block text-[13px] font-semibold text-th-text-secondary";

const fieldCls = (invalid?: boolean) =>
  cn(
    "h-12 w-full rounded-th-lg border bg-th-surface-0 px-4 text-[15px] text-th-text-primary outline-none",
    "transition-[border-color,box-shadow] duration-150",
    "placeholder:text-th-text-placeholder",
    invalid
      ? "border-th-border-error focus:ring-4 focus:ring-[color:var(--th-ring-error)]"
      : "border-th-border hover:border-th-border-hover focus:border-th-border-focus focus:ring-4 focus:ring-[color:var(--th-ring)]",
  );

/** Error text is `role="alert"` so it's announced, and reserves no space when
    absent — the fields sit on a rhythm rather than jumping as errors appear. */
const FieldError = ({ msg }: { msg?: string }) =>
  msg ? (
    <p role="alert" className="mt-1.5 text-[12.5px] font-medium text-th-error-text">
      {msg}
    </p>
  ) : null;

/* ── Contact channels ─────────────────────────────────────────────────────── */

const Channel = ({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  href?: string;
}) => {
  const body = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-th-accent-subtle text-th-accent transition-colors duration-200 group-hover:bg-th-accent group-hover:text-th-accent-fg">
        <Icon size={18} strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[12px] font-bold uppercase tracking-[0.12em] text-th-text-muted">
          {label}
        </span>
        <span className="mt-1 block break-words text-[15px] font-medium leading-snug text-th-text-primary">
          {value}
        </span>
      </span>
    </>
  );

  return (
    <li className="border-t border-th-border py-5 first:border-t-0 first:pt-0">
      {href ? (
        <a
          href={href}
          className="group flex items-start gap-4 rounded-th-sm outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--th-ring)]"
        >
          {body}
        </a>
      ) : (
        <div className="group flex items-start gap-4">{body}</div>
      )}
    </li>
  );
};

const ChannelSkeleton = () => (
  <li className="border-t border-th-border py-5 first:border-t-0 first:pt-0">
    <div className="flex items-start gap-4">
      <SkelLine w="w-11" h="h-11" />
      <div className="flex-1 space-y-2">
        <SkelLine w="w-20" h="h-3" />
        <SkelLine w="w-44" h="h-4" />
      </div>
    </div>
  </li>
);

/* ── Page ─────────────────────────────────────────────────────────────────── */

const Contact = () => {
  const { data: contact, isLoading: contactLoading } = useQuery({
    queryKey: ["cms", "contact", "public"],
    queryFn: async () => {
      try {
        return await cmsPublicApi.getContact();
      } catch (err) {
        // Swallowed on purpose: the page is still useful without the sidebar,
        // and the form is the primary action. Never surfaced to the visitor.
        console.error("Failed to fetch contact info", err);
        return null;
      }
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", message: "" },
  });

  const submit = useMutation({
    mutationFn: (values: ContactValues) =>
      cmsPublicApi.submitContact({
        firstName: values.firstName,
        lastName: values.lastName ?? "",
        email: values.email,
        phone: values.phone ?? "",
        message: values.message,
      }),
  });

  const messageLength = watch("message")?.length ?? 0;

  /* Only render a channel the CMS actually filled in. */
  const address = [contact?.address, contact?.city, contact?.state]
    .filter((p) => typeof p === "string" && p.trim())
    .join(", ");
  const fullAddress = contact?.pincode ? `${address} - ${contact.pincode}` : address;

  const channels = [
    contact?.email && {
      icon: Mail,
      label: "Email",
      value: contact.email as string,
      href: `mailto:${contact.email}`,
    },
    contact?.phone && {
      icon: Phone,
      label: "Phone",
      value: contact.phone as string,
      href: `tel:${String(contact.phone).replace(/\s/g, "")}`,
    },
    address && { icon: MapPin, label: "Office", value: fullAddress },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string; href?: string }[];

  const { data: faqs = [] } = useFaqs();
  const shownFaqs = faqs.slice(0, 6);

  return (
    <div className="flex min-h-screen flex-col bg-th-surface-0">
      <Header />

      {/* ── Hero + form ──────────────────────────────────────────────────────
          One band, 5/7 split: the form is the page's job, so it gets the wider
          column and sits beside the hero instead of below a separate title. */}
      <section className={`${SECTION_Y} border-b border-th-border bg-th-surface-1`}>
        <div className={CONTAINER}>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left — context */}
            <Reveal className="lg:col-span-5">
              <Eyebrow>Contact us</Eyebrow>
              <h1 className="mt-5 font-display text-[38px] leading-[1.05] tracking-[-0.03em] text-th-text-primary sm:text-[50px]">
                Let's talk.
              </h1>
              <p className="mt-5 max-w-md text-[16px] leading-relaxed text-th-text-muted">
                Questions about a booking, hosting, or something that went wrong — send it over and
                a real person will read it.
              </p>

              <ul className="mt-10">
                {contactLoading ? (
                  <>
                    <ChannelSkeleton />
                    <ChannelSkeleton />
                    <ChannelSkeleton />
                  </>
                ) : channels.length ? (
                  channels.map((c) => <Channel key={c.label} {...c} />)
                ) : (
                  /* No fabricated fallback address or +91-872XXXXXXX here. If
                     the CMS has nothing, the form is the way to reach us and
                     saying so is more honest than inventing an office. */
                  <li className="border-t border-th-border pt-5 text-[14.5px] leading-relaxed text-th-text-muted">
                    The form is the fastest way to reach us — we'll reply to the email address you
                    give us.
                  </li>
                )}
              </ul>

              {/* Expectation-setting, and it keeps this column from running
                  empty when the CMS has no contact row. Deliberately no
                  "we reply within N hours" — nothing in the product guarantees
                  one, so promising it here would be inventing a commitment. */}
              <div className="mt-10 rounded-th-2xl bg-th-surface-0 p-6">
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-th-text-muted">
                  What happens next
                </p>
                <ol className="mt-4 space-y-3">
                  {[
                    "Your message lands with our support team.",
                    "We reply to the email address you gave us.",
                    "Writing about a trip? Add the booking details and we can look it up straight away.",
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span
                        aria-hidden
                        className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-th-accent-subtle text-[11px] font-bold tabular-nums text-th-accent"
                      >
                        {i + 1}
                      </span>
                      <span className="text-[14px] leading-relaxed text-th-text-muted">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>

            {/* Right — form */}
            <Reveal delay={120} className="lg:col-span-7">
              <div className="rounded-th-3xl border border-th-border bg-th-surface-0 p-6 shadow-th-lg sm:p-9">
                {submit.isSuccess ? (
                  /* Success replaces the form rather than toasting over it —
                     a toast leaves a filled-in form on screen, which reads as
                     "nothing happened, try again". */
                  <div className="flex flex-col items-center py-10 text-center sm:py-16">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-th-success-bg text-th-success">
                      <CheckCircle2 size={28} strokeWidth={2} aria-hidden />
                    </span>
                    <h2 className="mt-6 font-display text-[26px] leading-snug text-th-text-primary">
                      Message sent.
                    </h2>
                    <p className="mt-3 max-w-sm text-[14.5px] leading-relaxed text-th-text-muted">
                      Thanks for getting in touch. We've got your message and will reply to the
                      email address you gave us.
                    </p>
                    <ActionButton
                      type="button"
                      tone="outline"
                      className="mt-8"
                      onClick={() => {
                        submit.reset();
                        reset();
                      }}
                    >
                      Send another message
                    </ActionButton>
                  </div>
                ) : (
                  <form
                    noValidate
                    onSubmit={handleSubmit((values) => submit.mutate(values))}
                    className="space-y-5"
                  >
                    <div>
                      <h2 className="font-display text-[24px] leading-snug text-th-text-primary">
                        Send us a message
                      </h2>
                      <p className="mt-1.5 text-[13.5px] text-th-text-muted">
                        Fields marked with an asterisk are required.
                      </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="firstName" className={labelCls}>
                          First name <span aria-hidden className="text-th-error-text">*</span>
                        </label>
                        <input
                          id="firstName"
                          autoComplete="given-name"
                          aria-invalid={!!errors.firstName}
                          {...register("firstName")}
                          className={cn("mt-1.5", fieldCls(!!errors.firstName))}
                        />
                        <FieldError msg={errors.firstName?.message} />
                      </div>

                      <div>
                        <label htmlFor="lastName" className={labelCls}>
                          Last name
                        </label>
                        <input
                          id="lastName"
                          autoComplete="family-name"
                          {...register("lastName")}
                          className={cn("mt-1.5", fieldCls(!!errors.lastName))}
                        />
                        <FieldError msg={errors.lastName?.message} />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className={labelCls}>
                        Email <span aria-hidden className="text-th-error-text">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        aria-invalid={!!errors.email}
                        {...register("email")}
                        className={cn("mt-1.5", fieldCls(!!errors.email))}
                      />
                      <FieldError msg={errors.email?.message} />
                    </div>

                    <div>
                      <label htmlFor="phone" className={labelCls}>
                        Phone <span className="font-normal text-th-text-muted">(optional)</span>
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        aria-invalid={!!errors.phone}
                        {...register("phone")}
                        className={cn("mt-1.5", fieldCls(!!errors.phone))}
                      />
                      <FieldError msg={errors.phone?.message} />
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between gap-3">
                        <label htmlFor="message" className={labelCls}>
                          Message <span aria-hidden className="text-th-error-text">*</span>
                        </label>
                        {/* A real counter this time. */}
                        <span
                          className={cn(
                            "text-[12px] tabular-nums",
                            messageLength > MESSAGE_MAX - 50
                              ? "font-semibold text-th-warning-text"
                              : "text-th-text-muted",
                          )}
                        >
                          {messageLength}/{MESSAGE_MAX}
                        </span>
                      </div>
                      <textarea
                        id="message"
                        rows={5}
                        maxLength={MESSAGE_MAX}
                        aria-invalid={!!errors.message}
                        {...register("message")}
                        className={cn(
                          "mt-1.5 resize-y py-3",
                          fieldCls(!!errors.message),
                          "h-auto min-h-[132px]",
                        )}
                      />
                      <FieldError msg={errors.message?.message} />
                    </div>

                    {/* One friendly line. No status codes, no error object. */}
                    {submit.isError && (
                      <p
                        role="alert"
                        className="rounded-th-lg border border-th-border-error bg-th-error-bg px-4 py-3 text-[13.5px] font-medium text-th-error-text"
                      >
                        We couldn't send that just now. Check your connection and try again.
                      </p>
                    )}

                    <ActionButton
                      type="submit"
                      disabled={submit.isPending}
                      className="w-full sm:w-auto sm:min-w-[190px]"
                      withArrow={!submit.isPending}
                    >
                      {submit.isPending ? "Sending…" : "Send message"}
                    </ActionButton>
                  </form>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────
          Real CMS FAQs. Rendered only when there are some — an empty accordion
          under a heading is worse than no section. */}
      {shownFaqs.length > 0 && (
        <SiteSection tone="light">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <SectionHead
                eyebrow="Before you write"
                title="Answers to the usual questions"
                lead="Worth a scan — it might save you the message."
              />
            </div>
            <div className="lg:col-span-8">
              <FaqList items={shownFaqs} />
            </div>
          </div>
        </SiteSection>
      )}

      <Footer />
    </div>
  );
};

export default Contact;
