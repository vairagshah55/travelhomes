import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import {
  ActionLink,
  CONTAINER,
  Eyebrow,
  Reveal,
  Rule,
  SECTION_Y,
  SectionHead,
  SiteSection,
  StatFigure,
} from "@/components/site/kit";

/**
 * /about — the brand story.
 *
 * ── What changed and why it isn't coming back ─────────────────────────────
 *
 * • The page opened with a 2s `setTimeout` + "Fetching company details…"
 *   spinner. It fetched nothing, and it rendered *above* the content rather
 *   than instead of it, so the real page sat underneath the whole time. The
 *   page is static, so the honest loading state is no loading state.
 *
 * • The banner was `/career.jpg` under the headline "Build Your Future With
 *   Us" with careers body copy — the Career hero, pasted here. That file (and
 *   `/host.jpg`, `/contact.jpg`, `/blog1.jpg`, `/hostbanner.png`) does not
 *   exist anywhere in the repo, so every one of them rendered as a broken
 *   image. Compositions here are therefore built from type, space and the ink
 *   panel rather than from photography that isn't available. Anything with a
 *   real asset behind it (blog covers, CMS uploads) still uses it.
 *
 * • Vision and Mission were `Viverra ut potenti aliquam feugiat…` lorem ipsum,
 *   and all three value cards shared one identical paragraph under three
 *   titles ("Readability at Our Core", "Hospitality at the Core", "Exceptional
 *   at Our Core"). Replaced with copy grounded in what the product verifiably
 *   does — the three offering types, admin review before listings go live, and
 *   the host-control split spelled out on /hostwithus.
 *
 * • The team section used hotlinked istockphoto stock portraits, and its
 *   fourth member was a byte-identical duplicate of the third. Placeholder
 *   people presented as leadership is fake business information, so it's gone
 *   rather than restyled. Re-add it when there are real names and photos.
 *
 * The figures in `STATS` are pre-existing page content, carried over as-is —
 * they are hardcoded, not fetched, and nothing in the repo substantiates them.
 * Flagged for sign-off rather than silently invented or silently deleted.
 */

const STATS = [
  { value: "15k+", label: "Unique stays in 120+ countries" },
  { value: "1M+", label: "Satisfied travellers since 2015" },
  { value: "10k+", label: "Trusted hosts worldwide" },
  { value: "80%", label: "Homes with eco-friendly practices" },
];

/** The three things you can actually book. Filters match `FilterType` in Header. */
const OFFERINGS = [
  {
    to: "/?filter=camper-van",
    title: "Camper vans & caravans",
    body: "Open-road trips in well-equipped motorhomes, camper vans and caravans — the journey and the room are the same booking.",
  },
  {
    to: "/?filter=unique-stays",
    title: "Unique stays",
    body: "Homes with some character to them, from quiet villas to places you'd otherwise never find, hosted by the people who know them.",
  },
  {
    to: "/?filter=activity",
    title: "Activities",
    body: "Things worth doing once you've arrived, run by local operators and bookable alongside where you're staying.",
  },
];

const VALUES = [
  {
    title: "Hospitality first",
    body: "Welcoming experiences that go past expectation — attentive service, a friendly reply, thoughtful details. Every guest and every host gets treated with the same respect.",
  },
  {
    title: "Places we'd stay ourselves",
    body: "Hosts and listings are reviewed before they go live. What looks characterful in the photographs should be the place you actually walk into.",
  },
  {
    title: "Hosts as partners",
    body: "Hosts keep their calendar, their pricing and their house rules. We take on discovery, booking and payments — the parts that get in the way.",
  },
];

function About() {
  return (
    <div className="flex min-h-screen flex-col bg-th-surface-0">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────────────
          Asymmetric 7/5 split. The ink panel carries the figures so the hero
          has a second focal point without needing a photograph. */}
      <section className={`${SECTION_Y} border-b border-th-border bg-th-surface-0`}>
        <div className={CONTAINER}>
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-7">
              <Eyebrow>About TravelHomes</Eyebrow>
              <h1 className="mt-5 font-display text-[38px] leading-[1.05] tracking-[-0.03em] text-th-text-primary sm:text-[52px] md:text-[62px]">
                Your home,
                <br />
                away from home.
              </h1>
              <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-th-text-muted sm:text-[17.5px]">
                Travel is more than reaching a destination. It's the experiences you don't plan for,
                the people you meet on the way, and arriving somewhere that already feels like
                yours.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <ActionLink to="/" withArrow>
                  Find a stay
                </ActionLink>
                <ActionLink to="/hostwithus" tone="outline">
                  Become a host
                </ActionLink>
              </div>
            </Reveal>

            <Reveal delay={120} className="lg:col-span-5">
              <div className="rounded-th-3xl bg-th-text-primary p-8 shadow-th-lg sm:p-10">
                <Eyebrow tone="ink">By the numbers</Eyebrow>
                <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-9">
                  {STATS.map((s) => (
                    <StatFigure key={s.value} value={s.value} label={s.label} tone="ink" />
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── What we do ───────────────────────────────────────────────────────
          Numbered rows on hairlines rather than three shadowed cards — the
          pattern this page used for everything. */}
      <SiteSection tone="light">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <SectionHead
              eyebrow="What we do"
              title="Three ways to travel with us"
              lead="One account, one checkout, whichever of them you're booking."
            />
            <Link
              to="/"
              className="group mt-7 inline-flex items-center gap-2 rounded-th-sm text-[14.5px] font-semibold text-th-accent outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--th-ring)]"
            >
              Browse everything
              <ArrowRight
                size={16}
                strokeWidth={2.4}
                aria-hidden
                className="transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          <ul className="lg:col-span-8">
            {OFFERINGS.map((o, i) => (
              <li key={o.title}>
                <Reveal delay={i * 90}>
                  {/* `group` on the link so the arrow and the rule respond
                      together on hover. */}
                  <Link
                    to={o.to}
                    className="group flex gap-6 border-t border-th-border py-7 outline-none transition-colors duration-200 hover:border-th-border-hover focus-visible:ring-4 focus-visible:ring-[color:var(--th-ring)] sm:gap-9"
                  >
                    <span
                      aria-hidden
                      className="shrink-0 pt-1 font-display text-[15px] tabular-nums text-th-accent"
                    >
                      0{i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-[22px] leading-snug tracking-[-0.01em] text-th-text-primary transition-colors duration-200 group-hover:text-th-accent sm:text-[26px]">
                        {o.title}
                      </span>
                      <span className="mt-2.5 block max-w-xl text-[14.5px] leading-relaxed text-th-text-muted">
                        {o.body}
                      </span>
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </SiteSection>

      {/* ── Pull-quote ───────────────────────────────────────────────────────
          The existing tagline, given the room to actually work as a statement
          instead of being squeezed beside a stat block. */}
      <section className="bg-th-surface-1 py-20 md:py-28">
        <div className={CONTAINER}>
          <Reveal>
            <Rule />
            <blockquote className="py-14 text-center md:py-20">
              <p className="mx-auto max-w-4xl font-display text-[30px] leading-[1.18] tracking-[-0.02em] text-th-text-primary sm:text-[42px] md:text-[52px]">
                Where unique stays meet{" "}
                <span className="text-th-text-muted">exceptional service.</span>
              </p>
            </blockquote>
            <Rule />
          </Reveal>
        </div>
      </section>

      {/* ── Values ───────────────────────────────────────────────────────── */}
      <SiteSection tone="light">
        <SectionHead
          eyebrow="What we stand for"
          title="Three things we don't compromise on"
          className="max-w-3xl"
        />

        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 90}>
              {/* Oversized ghost numeral instead of a generic lucide icon —
                  the old RocketIcon / ChartAreaIcon / HandCoinsIcon trio said
                  nothing about the values they sat above. */}
              <div className="flex h-full flex-col border-t-2 border-th-text-primary pt-6">
                <span
                  aria-hidden
                  className="font-display text-[40px] leading-none text-th-surface-3"
                >
                  0{i + 1}
                </span>
                <h3 className="mt-5 font-display text-[21px] leading-snug tracking-[-0.01em] text-th-text-primary">
                  {v.title}
                </h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-th-text-muted">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </SiteSection>

      {/* ── Vision & Mission ─────────────────────────────────────────────────
          Two stacked asymmetric rows sharing one hairline, so the pair reads as
          one statement rather than two bordered boxes. */}
      <SiteSection tone="raised">
        <div className="grid gap-x-16 gap-y-12 lg:grid-cols-2">
          <Reveal>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-th-accent">
              Our vision
            </p>
            <p className="mt-6 font-display text-[26px] leading-[1.25] tracking-[-0.02em] text-th-text-primary sm:text-[32px]">
              A world where every journey ends somewhere that feels like your own.
            </p>
          </Reveal>

          <Reveal delay={120}>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-th-accent">
              Our mission
            </p>
            <p className="mt-6 text-[16px] leading-relaxed text-th-text-muted sm:text-[17px]">
              To connect travellers with places worth the trip — camper vans on open roads, homes
              with a story, and the things worth doing once you're there — and to give the people
              who host them the tools to do it well. We handle discovery, booking and payments so
              hosts can get on with hospitality.
            </p>
          </Reveal>
        </div>
      </SiteSection>

      {/* ── Closing CTA ──────────────────────────────────────────────────────
          Ink, so it hands off into the footer rather than stopping dead at it. */}
      <section className="bg-th-text-primary py-20 md:py-28">
        <div className={CONTAINER}>
          <Reveal className="mx-auto max-w-3xl text-center">
            <Eyebrow tone="ink">Get started</Eyebrow>
            <h2 className="mt-6 font-display text-[32px] leading-[1.12] tracking-[-0.02em] text-th-text-inverse sm:text-[44px]">
              Somewhere to go, or somewhere to share.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-white/70">
              Book a stay for your next trip, or open your own place up to travellers.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <ActionLink to="/" tone="inverse" withArrow>
                Explore stays
              </ActionLink>
              <ActionLink to="/hostwithus" tone="ghostInverse">
                Host with us
              </ActionLink>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default About;
