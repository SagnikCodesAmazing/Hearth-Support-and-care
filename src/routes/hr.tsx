import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarDays,
  FileText,
  GraduationCap,
  HeartHandshake,
  Receipt,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import hrDesk from "@/assets/hr-desk.jpg";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addRequest } from "@/lib/local-store";

export const Route = createFileRoute("/hr")({
  head: () => ({
    meta: [
      { title: "People & HR — Hearth" },
      {
        name: "description",
        content:
          "One desk for every people request at Hearth: leave, payroll, documents, onboarding, equipment and confidential concerns.",
      },
      { property: "og:title", content: "People & HR — Hearth" },
      {
        property: "og:description",
        content: "Leave, payroll, documents, onboarding and confidential concerns in one calm place.",
      },
    ],
  }),
  component: HrPage,
});

const requestTypes: { icon: typeof Users; title: string; body: string }[] = [
  {
    icon: CalendarDays,
    title: "Time off & leave",
    body: "Holiday, sick days, parental and unpaid leave — with balances you can actually read.",
  },
  {
    icon: Receipt,
    title: "Payroll & expenses",
    body: "Payslip questions, bank detail changes, reimbursements and per-diem claims.",
  },
  {
    icon: FileText,
    title: "Documents & letters",
    body: "Contracts, addenda, employment verification and visa support letters.",
  },
  {
    icon: GraduationCap,
    title: "Growth & reviews",
    body: "Review cycles, learning budget, internal moves and progression conversations.",
  },
  {
    icon: Users,
    title: "Onboarding & equipment",
    body: "First-week plans, accounts, laptops, desks and everything a new joiner needs.",
  },
  {
    icon: HeartHandshake,
    title: "Confidential concerns",
    body: "Raise something sensitive. It reaches two named people and nobody else.",
  },
];

const balances = [
  { label: "Annual leave", used: 11, total: 25 },
  { label: "Sick days", used: 2, total: 10 },
  { label: "Learning budget", used: 320, total: 900, unit: "€" },
];

const directory = [
  { name: "Amara Okafor", role: "People Lead", area: "Policy · Payroll" },
  { name: "Jonas Weber", role: "HR Partner", area: "Engineering · Design" },
  { name: "Priya Raman", role: "Talent", area: "Hiring · Onboarding" },
  { name: "Théo Marchand", role: "Workplace", area: "Equipment · Offices" },
];

const policies = [
  { title: "Handbook", meta: "PDF · updated April" },
  { title: "Leave policy", meta: "PDF · 6 pages" },
  { title: "Remote & travel", meta: "PDF · 4 pages" },
  { title: "Expense guide", meta: "PDF · 3 pages" },
];

function HrPage() {
  const [selected, setSelected] = useState("Time off & leave");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [issuedCode, setIssuedCode] = useState<string | null>(null);

  function submitRequest(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || details.trim().length < 10) {
      toast.error("Please add your name, work email and a few lines of detail.");
      return;
    }
    setSending(true);
    const record = addRequest({
      source: "People",
      name: name.trim(),
      email: email.trim(),
      topic: selected,
      detail: details.trim(),
      confidential: selected === "Confidential concerns",
    });
    setSending(false);
    setIssuedCode(record.ref_code);
    setDetails("");
    toast.success(`Request ${record.ref_code} is with the people team.`);
  }

  return (
    <>
      <section className="surface-warm border-b border-border/70">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="animate-rise">
            <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">
              People operations
            </p>
            <h1 className="mt-6 text-4xl leading-[1.05] sm:text-5xl">
              Everything HR, at one warm desk.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Leave, payroll, documents, onboarding, equipment or something you'd rather say
              quietly — file it here and a named person picks it up the same working day.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#request"
                className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-transform duration-300 hover:-translate-y-0.5"
              >
                File a request
              </a>
              <a
                href="#directory"
                className="rounded-full border border-border bg-card px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                Meet the team
              </a>
            </div>
          </div>
          <div className="animate-rise [animation-delay:180ms]">
            <img
              src={hrDesk}
              alt="Sunlit desk with documents, a clay mug and dried grasses"
              width={1200}
              height={912}
              loading="lazy"
              className="animate-drift w-full rounded-3xl object-cover shadow-lift"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal as="h2" className="text-3xl sm:text-4xl">
          What we can help with
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {requestTypes.map((item, index) => (
            <Reveal key={item.title} delay={index * 70}>
              <button
                type="button"
                onClick={() => setSelected(item.title)}
                data-active={selected === item.title}
                className="h-full w-full rounded-2xl border border-border bg-card p-6 text-left shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-lift data-[active=true]:border-primary/50 data-[active=true]:bg-accent/60"
              >
                <item.icon className="size-5 text-primary" strokeWidth={1.6} />
                <h3 className="mt-4 text-xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-border/70 bg-secondary/40 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2">
          <div>
            <Reveal as="h2" className="text-3xl sm:text-4xl">
              Your balances
            </Reveal>
            <div className="mt-8 space-y-6">
              {balances.map((balance, index) => {
                const pct = Math.round((balance.used / balance.total) * 100);
                return (
                  <Reveal key={balance.label} delay={index * 90}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium">{balance.label}</span>
                      <span className="text-muted-foreground">
                        {balance.unit ?? ""}
                        {balance.used} of {balance.unit ?? ""}
                        {balance.total} used
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-sand">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
          <div>
            <Reveal as="h2" className="text-3xl sm:text-4xl">
              Policies & documents
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {policies.map((policy, index) => (
                <Reveal key={policy.title} delay={index * 80}>
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-transform duration-500 hover:-translate-y-1">
                    <FileText className="size-4 text-clay" strokeWidth={1.6} />
                    <p className="mt-3 font-medium">{policy.title}</p>
                    <p className="text-sm text-muted-foreground">{policy.meta}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="request" className="mx-auto max-w-4xl px-6 py-20">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl">File a request</h2>
          <p className="mt-3 text-muted-foreground">
            Two minutes. You'll get a reference code straight away.
          </p>
        </Reveal>
        <Reveal delay={120}>
          <form
            className="mt-10 space-y-6 rounded-3xl border border-border bg-card p-8 shadow-lift"
            onSubmit={submitRequest}
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs tracking-[0.18em] uppercase">Your name</Label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={120}
                  placeholder="Amara Okafor"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs tracking-[0.18em] uppercase">Work email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={200}
                  placeholder="you@company.com"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-xs tracking-[0.18em] uppercase">Request type</Label>
              <div className="flex flex-wrap gap-2">
                {requestTypes.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setSelected(item.title)}
                    data-active={selected === item.title}
                    className="rounded-full border border-border px-4 py-2 text-sm transition-colors data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs tracking-[0.18em] uppercase">Details</Label>
              <Textarea
                rows={6}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                maxLength={4000}
                placeholder="Dates, amounts, links — anything that saves a round trip."
              />
            </div>
            <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-sm text-sm text-muted-foreground">
                Sensitive requests are visible only to the People Lead and your HR partner.
              </p>
              <Button type="submit" size="lg" className="rounded-full" disabled={sending}>
                {sending ? "Filing…" : "Send request"}
              </Button>
            </div>
            {issuedCode ? (
              <p className="rounded-2xl bg-accent/60 px-5 py-4 text-sm">
                Your reference code is{" "}
                <span className="font-display text-lg text-primary">{issuedCode}</span>. Track it any
                time from the support desk.
              </p>
            ) : null}
          </form>
        </Reveal>
      </section>

      <section id="directory" className="border-t border-border/70 bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal as="h2" className="text-3xl sm:text-4xl">
            Who you'll be talking to
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {directory.map((person, index) => (
              <Reveal key={person.name} delay={index * 80}>
                <div className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-transform duration-500 hover:-translate-y-1">
                  <div className="font-display grid size-11 place-items-center rounded-full bg-accent text-lg">
                    {person.name.charAt(0)}
                  </div>
                  <p className="mt-4 font-medium">{person.name}</p>
                  <p className="text-sm text-primary">{person.role}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{person.area}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}