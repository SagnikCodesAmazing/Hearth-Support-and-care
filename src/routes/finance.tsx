import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, ReceiptText, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  APPROVED_VENDORS,
  AUTO_APPROVE_LIMIT,
  FINANCE_CATEGORIES,
  addInvoice,
  decideInvoice,
  useLocalStore,
} from "@/lib/local-store";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "Finance desk — invoices & expenses on autopilot" },
      {
        name: "description",
        content:
          "Submit an invoice or expense, watch the rules run, and let a human approve only the exceptions. Every step is logged and traceable.",
      },
      { property: "og:title", content: "Finance desk — invoices & expenses on autopilot" },
      {
        property: "og:description",
        content: "Invoices checked against rules automatically, exceptions queued for a human.",
      },
    ],
  }),
  component: FinancePage,
});

const rules = [
  {
    icon: Wallet,
    title: `Under ${AUTO_APPROVE_LIMIT} clears itself`,
    body: "Anything at or below the limit with a clean check-list is approved for payment without a human touching it.",
  },
  {
    icon: FileText,
    title: "Invoice number required",
    body: "No number, no reconciliation. Missing references are held back and flagged straight away.",
  },
  {
    icon: ShieldCheck,
    title: "Approved vendors only",
    body: "Vendors outside the approved list go to a human before a single currency unit moves.",
  },
  {
    icon: AlertTriangle,
    title: "Duplicate & late detection",
    body: "Same vendor, same amount inside 30 days — or a due date already gone — becomes an exception.",
  },
];

const STATUS_LABEL: Record<string, string> = {
  auto_approved: "Auto-approved",
  needs_review: "Needs a human",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
};

function FinancePage() {
  const store = useLocalStore();
  const [vendor, setVendor] = useState(APPROVED_VENDORS[0]!);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(FINANCE_CATEGORIES[0]!);
  const [dueDate, setDueDate] = useState("");
  const [submittedBy, setSubmittedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [issued, setIssued] = useState<string | null>(null);

  const stats = useMemo(() => {
    const invoices = store.invoices;
    const total = invoices.reduce((sum, i) => sum + i.amount, 0);
    const review = invoices.filter((i) => i.status === "needs_review");
    const touched = invoices.filter((i) => i.status !== "auto_approved").length;
    return {
      count: invoices.length,
      total,
      review: review.length,
      reviewValue: review.reduce((sum, i) => sum + i.amount, 0),
      autoRate: invoices.length === 0 ? 0 : Math.round(((invoices.length - touched) / invoices.length) * 100),
    };
  }, [store.invoices]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!vendor.trim() || !submittedBy.trim() || !Number.isFinite(value) || value <= 0) {
      toast.error("Add a vendor, who's submitting it, and a positive amount.");
      return;
    }
    const record = addInvoice({
      vendor,
      invoice_number: invoiceNumber,
      amount: Math.round(value * 100) / 100,
      category,
      due_date: dueDate,
      submitted_by: submittedBy,
      notes,
    });
    setIssued(record.ref_code);
    setInvoiceNumber("");
    setAmount("");
    setNotes("");
    toast.success(
      record.status === "auto_approved"
        ? `${record.ref_code} passed every rule and is approved for payment.`
        : `${record.ref_code} needs a human — ${record.flags.length} rule flagged.`,
    );
  }

  return (
    <>
      <section className="surface-warm border-b border-border/70">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="animate-rise max-w-2xl">
            <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">
              Finance operations
            </p>
            <h1 className="mt-6 text-4xl leading-[1.05] sm:text-5xl">
              Invoices that check themselves.
              <span className="block text-primary">Humans only for the exceptions.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Every invoice and expense is read, matched against the rules, and either cleared for
              payment or queued with a plain-language reason. Nothing happens silently — the whole
              trail sits in the ledger below.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Documents processed", value: stats.count },
            { label: "Value seen", value: `$${stats.total.toFixed(2)}` },
            { label: "Waiting on a human", value: stats.review },
            { label: "Cleared automatically", value: `${stats.autoRate}%` },
          ].map((card, index) => (
            <Reveal key={card.label} delay={index * 60}>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                  {card.label}
                </p>
                <p className="font-display mt-3 text-3xl text-primary">{card.value}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <Reveal as="h2" className="text-3xl sm:text-4xl">
          The rules, in the open
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {rules.map((rule, index) => (
            <Reveal key={rule.title} delay={index * 70}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-lift">
                <rule.icon className="size-5 text-primary" strokeWidth={1.6} />
                <h3 className="mt-4 text-xl">{rule.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{rule.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <p className="mt-6 text-sm text-muted-foreground">
            Approved vendors: {APPROVED_VENDORS.join(" · ")}
          </p>
        </Reveal>
      </section>

      <section id="submit" className="border-y border-border/70 bg-secondary/40 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl">Submit an invoice or expense</h2>
            <p className="mt-3 text-muted-foreground">
              You'll see the decision immediately, with the reasoning attached.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <form
              onSubmit={submit}
              className="mt-10 space-y-6 rounded-3xl border border-border bg-card p-8 shadow-lift"
            >
              <div className="space-y-3">
                <Label className="text-xs tracking-[0.18em] uppercase">Vendor</Label>
                <div className="flex flex-wrap gap-2">
                  {APPROVED_VENDORS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setVendor(item)}
                      data-active={vendor === item}
                      className="rounded-full border border-border px-4 py-2 text-sm transition-colors data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <Input
                  id="vendor"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  maxLength={120}
                  placeholder="Or type any vendor name"
                />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoice_number" className="text-xs tracking-[0.18em] uppercase">
                    Invoice number
                  </Label>
                  <Input
                    id="invoice_number"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    maxLength={60}
                    placeholder="INV-2841"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-xs tracking-[0.18em] uppercase">
                    Amount (USD)
                  </Label>
                  <Input
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="1450.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date" className="text-xs tracking-[0.18em] uppercase">
                    Due date
                  </Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="submitted_by" className="text-xs tracking-[0.18em] uppercase">
                    Submitted by
                  </Label>
                  <Input
                    id="submitted_by"
                    value={submittedBy}
                    onChange={(e) => setSubmittedBy(e.target.value)}
                    maxLength={200}
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-xs tracking-[0.18em] uppercase">Category</Label>
                <div className="flex flex-wrap gap-2">
                  {FINANCE_CATEGORIES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCategory(item)}
                      data-active={category === item}
                      className="rounded-full border border-border px-4 py-2 text-sm transition-colors data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs tracking-[0.18em] uppercase">
                  Notes for the reviewer
                </Label>
                <Textarea
                  id="notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Purchase order, project code, anything that saves a round trip."
                />
              </div>
              <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-sm text-sm text-muted-foreground">
                  Stored on this device only — nothing leaves your browser.
                </p>
                <Button type="submit" size="lg" className="rounded-full">
                  Run the checks
                </Button>
              </div>
              {issued ? (
                <p className="rounded-2xl bg-accent/60 px-5 py-4 text-sm">
                  Reference{" "}
                  <span className="font-display text-lg text-primary">{issued}</span> — follow it in
                  the ledger below or on the tracking form.
                </p>
              ) : null}
            </form>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl">Ledger & exceptions</h2>
          <p className="mt-3 text-muted-foreground">
            {stats.review > 0
              ? `${stats.review} document${stats.review > 1 ? "s" : ""} worth $${stats.reviewValue.toFixed(2)} waiting on approval.`
              : "No exceptions right now."}
          </p>
        </Reveal>

        {store.invoices.length === 0 ? (
          <p className="mt-8 text-muted-foreground">Nothing submitted yet.</p>
        ) : null}

        <div className="mt-8 space-y-4">
          {store.invoices.map((invoice, index) => (
            <Reveal key={invoice.id} delay={Math.min(index, 8) * 50}>
              <article className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-display text-lg text-primary">{invoice.ref_code}</span>
                  <span className="rounded-full border border-border px-3 py-1 text-xs">
                    {STATUS_LABEL[invoice.status]}
                  </span>
                  <span className="rounded-full bg-accent px-3 py-1 text-xs">{invoice.category}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(invoice.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-4 font-medium">
                  {invoice.vendor} · {invoice.currency} {invoice.amount.toFixed(2)}
                  {invoice.invoice_number ? ` · ${invoice.invoice_number}` : ""}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {invoice.due_date ? `Due ${invoice.due_date} · ` : ""}Submitted by {invoice.submitted_by}
                </p>
                {invoice.notes ? (
                  <p className="mt-2 text-sm text-muted-foreground">{invoice.notes}</p>
                ) : null}

                {invoice.flags.length === 0 ? (
                  <p className="mt-4 flex items-center gap-2 text-sm text-primary">
                    <CheckCircle2 className="size-4" strokeWidth={1.8} /> Every rule passed.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {invoice.flags.map((flag) => (
                      <li key={flag.rule} className="rounded-xl bg-accent/50 px-4 py-3 text-sm">
                        <span className="font-medium">{flag.rule}</span>
                        <span className="text-muted-foreground"> — {flag.note}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                  {(["approved", "rejected", "paid"] as const).map((decision) => (
                    <button
                      key={decision}
                      type="button"
                      onClick={() => {
                        decideInvoice(invoice.id, decision);
                        toast.success(`${invoice.ref_code} → ${STATUS_LABEL[decision]}`);
                      }}
                      data-active={invoice.status === decision}
                      className="rounded-full border border-border px-3 py-1.5 text-xs capitalize transition-colors data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                    >
                      {decision === "paid" ? "Mark paid" : decision}
                    </button>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-border/70 bg-secondary/40 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal>
            <h2 className="flex items-center gap-3 text-2xl sm:text-3xl">
              <ReceiptText className="size-6 text-primary" strokeWidth={1.6} /> Audit trail
            </h2>
          </Reveal>
          <div className="mt-8 space-y-3">
            {store.audit.filter((entry) => entry.ref_code.startsWith("FN")).length === 0 ? (
              <p className="text-muted-foreground">The trail starts with your first submission.</p>
            ) : null}
            {store.audit
              .filter((entry) => entry.ref_code.startsWith("FN"))
              .slice(0, 40)
              .map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-baseline gap-3 rounded-xl border border-border bg-card px-5 py-4 text-sm shadow-soft"
                >
                  <span className="font-display text-primary">{entry.ref_code}</span>
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-xs">
                    {entry.actor}
                  </span>
                  <span className="text-muted-foreground">{entry.action}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(entry.at).toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </section>
    </>
  );
}
