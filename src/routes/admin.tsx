import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import {
  clearStore,
  decideInvoice,
  setRequestStatus,
  useLocalStore,
  type RequestRecord,
  type Status,
} from "@/lib/local-store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Automation dashboard — Hearth operations" },
      {
        name: "description",
        content:
          "Live stats for support tickets, people requests and finance documents: volume, priority mix, spend and resolution progress.",
      },
      { property: "og:title", content: "Automation dashboard — Hearth operations" },
      {
        property: "og:description",
        content: "Support, people and finance workflows in one traceable view.",
      },
    ],
  }),
  component: AdminPage,
});

const STATUSES: Status[] = ["new", "in_progress", "waiting", "resolved"];
const PALETTE = [
  "var(--color-primary)",
  "var(--color-clay)",
  "var(--color-muted-foreground)",
  "var(--color-accent-foreground)",
];

const INVOICE_LABEL: Record<string, string> = {
  auto_approved: "Auto-approved",
  needs_review: "Needs a human",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
};

function AdminPage() {
  const store = useLocalStore();
  const [tab, setTab] = useState<"all" | "Support" | "People">("all");

  const all = store.requests;
  const invoices = store.invoices;

  const rows = useMemo(
    () => all.filter((r) => tab === "all" || r.source === tab),
    [all, tab],
  );

  const stats = useMemo(() => {
    const open = all.filter((r) => r.status !== "resolved").length;
    const resolved = all.filter((r) => r.status === "resolved").length;
    const urgent = all.filter((r) => r.priority === "urgent" && r.status !== "resolved").length;
    const spend = invoices.reduce((sum, i) => sum + i.amount, 0);
    const exceptions = invoices.filter((i) => i.status === "needs_review").length;
    return {
      total: all.length + invoices.length,
      open,
      resolved,
      urgent,
      resolutionRate: all.length === 0 ? 0 : Math.round((resolved / all.length) * 100),
      spend,
      exceptions,
    };
  }, [all, invoices]);

  const byDay = useMemo(() => {
    const days: { day: string; Support: number; People: number; Finance: number }[] = [];
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        Support: 0,
        People: 0,
        Finance: 0,
      });
    }
    const index = new Map(days.map((d, i) => [d.day, i]));
    const bump = (iso: string, key: "Support" | "People" | "Finance") => {
      const label = new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      const i = index.get(label);
      const bucket = i === undefined ? undefined : days[i];
      if (bucket) bucket[key] += 1;
    };
    for (const row of all) bump(row.created_at, row.source);
    for (const invoice of invoices) bump(invoice.created_at, "Finance");
    return days;
  }, [all, invoices]);

  const byPriority = useMemo(
    () =>
      ["urgent", "high", "medium", "low"].map((p) => ({
        name: p,
        value: all.filter((r) => r.priority === p).length,
      })),
    [all],
  );

  const byTopic = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of all) counts.set(row.topic, (counts.get(row.topic) ?? 0) + 1);
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [all]);

  const spendByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const invoice of invoices)
      counts.set(invoice.category, (counts.get(invoice.category) ?? 0) + invoice.amount);
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [invoices]);

  function updateStatus(row: RequestRecord, status: Status) {
    setRequestStatus(row.id, status);
    toast.success(`${row.ref_code} → ${status.replace("_", " ")}`);
  }

  return (
    <>
      <section className="surface-warm border-b border-border/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-6 py-16">
          <div className="animate-rise">
            <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">
              Business automation
            </p>
            <h1 className="mt-5 text-4xl leading-[1.05] sm:text-5xl">
              The whole desk, at a glance.
            </h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Support tickets, people requests and finance documents — all stored on this device, all
              traceable back to the step that decided them.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              clearStore();
              toast.success("Local desk cleared.");
            }}
          >
            Clear local data
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Items handled", value: stats.total },
            { label: "Open requests", value: stats.open },
            { label: "Urgent open", value: stats.urgent },
            { label: "Resolution rate", value: `${stats.resolutionRate}%` },
            { label: "Spend seen", value: `$${stats.spend.toFixed(2)}` },
          ].map((card, index) => (
            <Reveal key={card.label} delay={index * 60}>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                  {card.label}
                </p>
                <p className="font-display mt-3 text-4xl text-primary">{card.value}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-1">
          <Reveal>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-xl">Incoming, last 14 days</h2>
              <div className="mt-6 h-[70vh]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={byDay}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Support" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="People" stroke="var(--color-clay)" strokeWidth={2} dot={false} />
                    <Line
                      type="monotone"
                      dataKey="Finance"
                      stroke="var(--color-muted-foreground)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Reveal delay={60}>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-xl">Busiest topics</h2>
              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byTopic}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                      }}
                    />
                    <Bar dataKey="value" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-xl">Spend by category</h2>
              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendByCategory}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                      }}
                    />
                    <Bar dataKey="value" fill="var(--color-clay)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-border/70 bg-secondary/40 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl">Queue</h2>
            <div className="flex gap-2">
              {(["all", "Support", "People"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value)}
                  data-active={tab === value}
                  className="rounded-full border border-border px-4 py-2 text-sm transition-colors data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                >
                  {value === "all" ? "Everything" : value}
                </button>
              ))}
            </div>
          </div>

          {rows.length === 0 ? <p className="mt-8 text-muted-foreground">Nothing here yet.</p> : null}

          <div className="mt-8 space-y-4">
            {rows.map((row, index) => (
              <Reveal key={row.id} delay={Math.min(index, 8) * 50}>
                <article className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-display text-lg text-primary">{row.ref_code}</span>
                    <span className="rounded-full border border-border px-3 py-1 text-xs">{row.source}</span>
                    <span className="rounded-full bg-accent px-3 py-1 text-xs capitalize">{row.priority}</span>
                    {row.confidential ? (
                      <span className="rounded-full bg-clay/20 px-3 py-1 text-xs">Confidential</span>
                    ) : null}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-4 font-medium">{row.topic}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{row.detail}</p>
                  <p className="mt-3 text-sm">
                    {row.name} · <span className="text-muted-foreground">{row.email}</span>
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                    {STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateStatus(row, status)}
                        data-active={row.status === status}
                        className="rounded-full border border-border px-3 py-1.5 text-xs capitalize transition-colors data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                      >
                        {status.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <Reveal>
          <h2 className="text-2xl sm:text-3xl">Finance exceptions</h2>
          <p className="mt-3 text-muted-foreground">
            {stats.exceptions > 0
              ? `${stats.exceptions} document${stats.exceptions > 1 ? "s" : ""} need a decision.`
              : "Nothing waiting on a human."}
          </p>
        </Reveal>
        <div className="mt-8 space-y-4">
          {invoices.slice(0, 12).map((invoice, index) => (
            <Reveal key={invoice.id} delay={Math.min(index, 8) * 50}>
              <article className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-display text-lg text-primary">{invoice.ref_code}</span>
                  <span className="rounded-full border border-border px-3 py-1 text-xs">
                    {INVOICE_LABEL[invoice.status]}
                  </span>
                  <span className="rounded-full bg-accent px-3 py-1 text-xs">{invoice.category}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(invoice.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-4 font-medium">
                  {invoice.vendor} · {invoice.currency} {invoice.amount.toFixed(2)}
                </p>
                {invoice.flags.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {invoice.flags.map((flag) => (
                      <li key={flag.rule} className="rounded-xl bg-accent/50 px-4 py-3 text-sm">
                        <span className="font-medium">{flag.rule}</span>
                        <span className="text-muted-foreground"> — {flag.note}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                  {(["approved", "rejected", "paid"] as const).map((decision) => (
                    <button
                      key={decision}
                      type="button"
                      onClick={() => {
                        decideInvoice(invoice.id, decision);
                        toast.success(`${invoice.ref_code} → ${INVOICE_LABEL[decision]}`);
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
          {invoices.length === 0 ? (
            <p className="text-muted-foreground">No finance documents yet.</p>
          ) : null}
        </div>
      </section>
    </>
  );
}
