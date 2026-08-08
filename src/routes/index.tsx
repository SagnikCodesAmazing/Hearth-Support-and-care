import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Inbox, ShieldCheck, Sparkles } from "lucide-react";

import heroLinen from "@/assets/hero-linen.jpg";
import { Reveal } from "@/components/reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hearth — Support and people care, handled warmly" },
      {
        name: "description",
        content:
          "Hearth is one calm desk for customer support tickets and people operations: clear priorities, named humans, no queues that go quiet.",
      },
      { property: "og:title", content: "Hearth — Support and people care, handled warmly" },
      {
        property: "og:description",
        content: "One calm desk for support tickets and HR requests.",
      },
    ],
  }),
  component: Index,
});

const pillars = [
  {
    icon: Inbox,
    title: "One inbox, two worlds",
    body: "Customer tickets and internal people requests share the same calm desk — different routes, same care.",
  },
  {
    icon: Clock,
    title: "Priority at the door",
    body: "Every request is categorised and given a promise the moment it arrives, so nothing sits quietly.",
  },
  {
    icon: ShieldCheck,
    title: "Named humans",
    body: "You always know who holds your request, and confidential matters stay with two people only.",
  },
  {
    icon: Sparkles,
    title: "Written like a person",
    body: "Plain language, no ticket-speak, and a reference code you can read out loud.",
  },
];

const steps = [
  { n: "01", title: "Tell us what's happening", body: "A short form. No account, no portal tour." },
  { n: "02", title: "We route and set priority", body: "A person reads it and assigns the promise." },
  { n: "03", title: "You follow along", body: "Track with your code, or reply straight to the thread." },
];

function Index() {
  return (
    <>
      <section className="surface-warm relative overflow-hidden border-b border-border/70">
        <div
          aria-hidden
          className="animate-glow pointer-events-none absolute -top-40 -right-24 size-[32rem] rounded-full bg-clay/20 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 py-24 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="animate-rise">
            <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">
              Support · People · Care
            </p>
            <h1 className="mt-6 text-[2.65rem] leading-[1.02] sm:text-6xl">
              Tell us what's wrong.
              <span className="block text-primary">We'll take it from here.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground">
              Hearth is one warm desk for the things people need help with — a customer's broken
              invoice or a colleague's parental leave. Both get a category, a priority and a name.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/support"
                className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 hover:-translate-y-0.5"
              >
                Open a ticket
              </Link>
              <Link
                to="/hr"
                className="rounded-full border border-border bg-card px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                Go to People & HR
              </Link>
              <a
                href="#how"
                className="rounded-full border border-border bg-card px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                See how it works
              </a>
            </div>
          </div>
          <div className="animate-rise [animation-delay:200ms]">
            <img
              src={heroLinen}
              alt="Clay mug, sealed envelope and notebook resting on sunlit linen"
              width={1200}
              height={1408}
              className="animate-drift w-full rounded-[2rem] object-cover shadow-lift"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <Reveal as="h2" className="max-w-2xl text-3xl sm:text-4xl">
          A desk that answers, not a queue that swallows.
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {pillars.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 90}>
              <div className="h-full rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
                <pillar.icon className="size-5 text-primary" strokeWidth={1.6} />
                <h3 className="mt-5 text-xl">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="how" className="border-y border-border/70 bg-secondary/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal as="h2" className="text-3xl sm:text-4xl">
            How it works
          </Reveal>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {steps.map((step, index) => (
              <Reveal key={step.n} delay={index * 130}>
                <p className="font-display text-4xl text-clay">{step.n}</p>
                <h3 className="mt-4 text-xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <Reveal>
          <h2 className="text-3xl leading-tight sm:text-4xl">
            Working here? Your people desk is one click away.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Leave, payroll, documents, onboarding, equipment and confidential concerns — all filed
            and tracked the same warm way.
          </p>
          <Link
            to="/hr"
            className="mt-9 inline-block rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 hover:-translate-y-0.5"
          >
            Open People & HR
          </Link>
        </Reveal>
      </section>
    </>
  );
}
