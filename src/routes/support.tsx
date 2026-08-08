import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CreditCard,
  KeyRound,
  LifeBuoy,
  PackageSearch,
  Search,
  Truck,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addRequest, findByRefCode, type Priority } from "@/lib/local-store";
import { REF_CODE_PATTERN } from "@/lib/ref-code";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Open a ticket — Hearth Support" },
      {
        name: "description",
        content:
          "Tell us what went wrong and we'll take it from here. Open a support ticket or check an existing one with your reference code.",
      },
      { property: "og:title", content: "Open a ticket — Hearth Support" },
      {
        property: "og:description",
        content: "Open a support ticket or check an existing one with your reference code.",
      },
    ],
  }),
  component: SupportPage,
});

const categories = [
  { icon: CreditCard, title: "Billing", body: "Invoices, refunds, plan changes and payment errors." },
  { icon: Wrench, title: "Technical issue", body: "Something is broken, slow or behaving oddly." },
  { icon: KeyRound, title: "Account access", body: "Sign-in trouble, permissions and lost accounts." },
  { icon: Truck, title: "Delivery & orders", body: "Missing, late or incorrect orders." },
  { icon: PackageSearch, title: "Product question", body: "How something works, or whether it can." },
  { icon: LifeBuoy, title: "Something else", body: "Not sure where it belongs? Start here." },
];

const priorities = [
  { value: "urgent", label: "Urgent", promise: "within 1 hour" },
  { value: "high", label: "High", promise: "within 8 hours" },
  { value: "medium", label: "Medium", promise: "within 2 business days" },
  { value: "low", label: "Low", promise: "within 5 business days" },
] as const;

type Lookup = {
  ref_code: string;
  kind: string;
  topic: string;
  priority: string;
  status: string;
  created_at: string;
};

function SupportPage() {
  const [category, setCategory] = useState("Billing");
  const [priority, setPriority] = useState<Priority>("medium");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [issuedCode, setIssuedCode] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [result, setResult] = useState<Lookup | "none" | null>(null);

  function submitTicket(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || message.trim().length < 10) {
      toast.error("Please add your name, email and a few lines about the problem.");
      return;
    }
    setSending(true);
    const record = addRequest({
      source: "Support",
      name: name.trim(),
      email: email.trim(),
      topic: category,
      priority,
      detail: [subject.trim(), message.trim()].filter(Boolean).join(" — "),
    });
    setSending(false);
    setIssuedCode(record.ref_code);
    setSubject("");
    setMessage("");
    toast.success(`Ticket ${record.ref_code} is with us.`);
  }

  function checkCode(event: React.FormEvent) {
    event.preventDefault();
    if (!REF_CODE_PATTERN.test(code.trim().toUpperCase())) {
      toast.error("That reference code doesn't look right.");
      return;
    }
    const found = findByRefCode(code);
    if (!found) {
      setResult("none");
      return;
    }
    if (found.type === "request") {
      const r = found.request;
      setResult({
        ref_code: r.ref_code,
        kind: r.source === "Support" ? "Support ticket" : "People request",
        topic: r.topic,
        priority: r.priority,
        status: r.status,
        created_at: r.created_at,
      });
      return;
    }
    const i = found.invoice;
    setResult({
      ref_code: i.ref_code,
      kind: "Finance document",
      topic: `${i.vendor} · ${i.category}`,
      priority: i.flags.length ? "needs review" : "clean",
      status: i.status,
      created_at: i.created_at,
    });
  }

  return (
    <>
      <section className="surface-warm border-b border-border/70">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="animate-rise max-w-2xl">
            <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">
              Customer support
            </p>
            <h1 className="mt-6 text-4xl leading-[1.05] sm:text-5xl">
              Tell us what's wrong.
              <span className="block text-primary">We'll take it from here.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              One short form, a category, a priority — and a reference code you can read out loud.
              No portal tour, no account required.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal as="h2" className="text-3xl sm:text-4xl">
          What can we help with?
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((item, index) => (
            <Reveal key={item.title} delay={index * 70}>
              <button
                type="button"
                onClick={() => setCategory(item.title)}
                data-active={category === item.title}
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

      <section id="ticket" className="border-y border-border/70 bg-secondary/40 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl">Open a ticket</h2>
            <p className="mt-3 text-muted-foreground">
              Two minutes. You'll get a reference code straight away.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <form
              onSubmit={submitTicket}
              className="mt-10 space-y-6 rounded-3xl border border-border bg-card p-8 shadow-lift"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs tracking-[0.18em] uppercase">Your name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs tracking-[0.18em] uppercase">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={200}
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-xs tracking-[0.18em] uppercase">Category</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setCategory(item.title)}
                      data-active={category === item.title}
                      className="rounded-full border border-border px-4 py-2 text-sm transition-colors data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs tracking-[0.18em] uppercase">Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={160}
                  placeholder="Invoice #2841 charged twice"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs tracking-[0.18em] uppercase">
                  Tell us what happened
                </Label>
                <Textarea
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={4000}
                  placeholder="Dates, amounts, links — anything that saves a round trip."
                />
              </div>
              <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-sm text-sm text-muted-foreground">
                  A named person reads every ticket the same working day.
                </p>
                <Button type="submit" size="lg" className="rounded-full" disabled={sending}>
                  {sending ? "Sending…" : "Send ticket"}
                </Button>
              </div>
              {issuedCode ? (
                <p className="rounded-2xl bg-accent/60 px-5 py-4 text-sm">
                  Your reference code is{" "}
                  <span className="font-display text-lg text-primary">{issuedCode}</span>. Keep it
                  somewhere safe — you can check progress with it below.
                </p>
              ) : null}
            </form>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl">Check a ticket</h2>
          <p className="mt-3 text-muted-foreground">
            Works for support tickets, people requests and finance documents.
          </p>
        </Reveal>
        <Reveal delay={110}>
          <form
            onSubmit={checkCode}
            className="mt-8 flex flex-col gap-3 rounded-3xl border border-border bg-card p-8 shadow-soft sm:flex-row"
          >
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="HT-4F2K9A"
              maxLength={12}
              className="font-display text-lg tracking-widest"
            />
            <Button type="submit" className="rounded-full">
              <Search className="mr-2 size-4" strokeWidth={1.8} />
              Check
            </Button>
          </form>
        </Reveal>
        {result === "none" ? (
          <p className="mt-6 text-sm text-muted-foreground">
            We couldn't find that code. Check the letters and try again.
          </p>
        ) : null}
        {result && result !== "none" ? (
          <div className="mt-6 rounded-3xl border border-border bg-card p-8 shadow-soft">
            <p className="font-display text-2xl text-primary">{result.ref_code}</p>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Kind</dt>
                <dd className="mt-1">{result.kind}</dd>
              </div>
              <div>
                <dt className="text-xs tracking-[0.18em] text-muted-foreground uppercase">Topic</dt>
                <dd className="mt-1">{result.topic}</dd>
              </div>
              <div>
                <dt className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                  Priority
                </dt>
                <dd className="mt-1 capitalize">{result.priority}</dd>
              </div>
              <div>
                <dt className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                  Status
                </dt>
                <dd className="mt-1 capitalize">{result.status.replace("_", " ")}</dd>
              </div>
            </dl>
            <p className="mt-5 text-sm text-muted-foreground">
              Filed {new Date(result.created_at).toLocaleString()}
            </p>
          </div>
        ) : null}
      </section>
    </>
  );
}