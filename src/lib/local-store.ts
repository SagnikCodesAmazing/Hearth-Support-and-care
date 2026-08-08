import { useEffect, useState } from "react";

import { makeRefCode } from "./ref-code";

export type Priority = "urgent" | "high" | "medium" | "low";
export type Status = "new" | "in_progress" | "waiting" | "resolved";
export type Source = "Support" | "People";

export type RequestRecord = {
  id: string;
  ref_code: string;
  source: Source;
  name: string;
  email: string;
  topic: string;
  detail: string;
  priority: Priority;
  status: Status;
  confidential: boolean;
  created_at: string;
  updated_at: string;
};

export type InvoiceStatus = "auto_approved" | "needs_review" | "approved" | "rejected" | "paid";

export type InvoiceFlag = { rule: string; note: string };

export type Invoice = {
  id: string;
  ref_code: string;
  vendor: string;
  invoice_number: string;
  amount: number;
  currency: string;
  category: string;
  due_date: string;
  submitted_by: string;
  notes: string;
  status: InvoiceStatus;
  flags: InvoiceFlag[];
  created_at: string;
  updated_at: string;
};

export type AuditEntry = {
  id: string;
  ref_code: string;
  actor: "Automation" | "Human";
  action: string;
  at: string;
};

export type Store = {
  requests: RequestRecord[];
  invoices: Invoice[];
  audit: AuditEntry[];
};

const KEY = "hearth.store.v1";
const EVENT = "hearth:store";
const EMPTY: Store = { requests: [], invoices: [], audit: [] };

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function readStore(): Store {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      requests: parsed.requests ?? [],
      invoices: parsed.invoices ?? [],
      audit: parsed.audit ?? [],
    };
  } catch {
    return EMPTY;
  }
}

function writeStore(next: Store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

function mutate(fn: (store: Store) => Store) {
  const next = fn(readStore());
  writeStore(next);
  return next;
}

function log(store: Store, entry: Omit<AuditEntry, "id" | "at">): Store {
  return {
    ...store,
    audit: [{ id: uid(), at: new Date().toISOString(), ...entry }, ...store.audit].slice(0, 500),
  };
}

/** Subscribe to the local store from any component. */
export function useLocalStore(): Store {
  const [store, setStore] = useState<Store>(EMPTY);

  useEffect(() => {
    const sync = () => setStore(readStore());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return store;
}

/* ---------------- Support & people requests ---------------- */

export function addRequest(input: {
  source: Source;
  name: string;
  email: string;
  topic: string;
  detail: string;
  priority?: Priority;
  confidential?: boolean;
}) {
  const now = new Date().toISOString();
  const record: RequestRecord = {
    id: uid(),
    ref_code: makeRefCode(input.source === "Support" ? "HT" : "HR"),
    source: input.source,
    name: input.name.slice(0, 120),
    email: input.email.slice(0, 200),
    topic: input.topic,
    detail: input.detail.slice(0, 4000),
    priority: input.priority ?? "medium",
    status: "new",
    confidential: input.confidential ?? false,
    created_at: now,
    updated_at: now,
  };
  mutate((store) =>
    log({ ...store, requests: [record, ...store.requests] }, {
      ref_code: record.ref_code,
      actor: "Automation",
      action: `Logged ${input.source === "Support" ? "support ticket" : "people request"} · ${record.topic} · ${record.priority}`,
    }),
  );
  return record;
}

export function setRequestStatus(id: string, status: Status) {
  mutate((store) => {
    const row = store.requests.find((r) => r.id === id);
    const requests = store.requests.map((r) =>
      r.id === id ? { ...r, status, updated_at: new Date().toISOString() } : r,
    );
    const next = { ...store, requests };
    return row
      ? log(next, {
          ref_code: row.ref_code,
          actor: "Human",
          action: `Status set to ${status.replace("_", " ")}`,
        })
      : next;
  });
}

export function findByRefCode(code: string) {
  const wanted = code.trim().toUpperCase();
  const store = readStore();
  const request = store.requests.find((r) => r.ref_code === wanted);
  if (request) return { type: "request" as const, request };
  const invoice = store.invoices.find((i) => i.ref_code === wanted);
  if (invoice) return { type: "invoice" as const, invoice };
  return null;
}

/* ---------------- Finance ---------------- */

export const APPROVED_VENDORS = [
  "Northwind Supply",
  "Cedar & Co",
  "Basalt Cloud",
  "Linen Press",
  "Harbour Logistics",
];

export const FINANCE_CATEGORIES = [
  "Software & cloud",
  "Travel",
  "Office & supplies",
  "Contractors",
  "Marketing",
  "Utilities",
];

export const AUTO_APPROVE_LIMIT = 2000;

/** Deterministic, auditable rules run on every invoice or expense. */
export function runFinanceRules(
  input: { vendor: string; invoice_number: string; amount: number; category: string; due_date: string },
  existing: Invoice[],
): InvoiceFlag[] {
  const flags: InvoiceFlag[] = [];

  if (input.amount > AUTO_APPROVE_LIMIT) {
    flags.push({
      rule: "Above auto-approve limit",
      note: `${input.amount.toFixed(2)} is over the ${AUTO_APPROVE_LIMIT} threshold, so a human signs it off.`,
    });
  }
  if (!input.invoice_number.trim()) {
    flags.push({ rule: "Missing invoice number", note: "Nothing to reconcile against in the ledger." });
  }
  if (!APPROVED_VENDORS.includes(input.vendor.trim())) {
    flags.push({
      rule: "Unlisted vendor",
      note: `${input.vendor.trim() || "This vendor"} isn't on the approved vendor list yet.`,
    });
  }
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const duplicate = existing.find(
    (i) =>
      i.vendor.trim().toLowerCase() === input.vendor.trim().toLowerCase() &&
      Math.abs(i.amount - input.amount) < 0.01 &&
      new Date(i.created_at).getTime() > thirtyDaysAgo,
  );
  if (duplicate) {
    flags.push({
      rule: "Possible duplicate",
      note: `Matches ${duplicate.ref_code} for the same vendor and amount in the last 30 days.`,
    });
  }
  if (input.due_date && new Date(input.due_date).getTime() < Date.now() - 24 * 60 * 60 * 1000) {
    flags.push({ rule: "Past due date", note: "Due date is already in the past — check for a late fee." });
  }

  return flags;
}

export function addInvoice(input: {
  vendor: string;
  invoice_number: string;
  amount: number;
  currency?: string;
  category: string;
  due_date: string;
  submitted_by: string;
  notes?: string;
}) {
  const store = readStore();
  const flags = runFinanceRules(input, store.invoices);
  const now = new Date().toISOString();
  const record: Invoice = {
    id: uid(),
    ref_code: makeRefCode("FN"),
    vendor: input.vendor.trim().slice(0, 120),
    invoice_number: input.invoice_number.trim().slice(0, 60),
    amount: input.amount,
    currency: input.currency ?? "USD",
    category: input.category,
    due_date: input.due_date,
    submitted_by: input.submitted_by.trim().slice(0, 200),
    notes: (input.notes ?? "").slice(0, 2000),
    status: flags.length === 0 ? "auto_approved" : "needs_review",
    flags,
    created_at: now,
    updated_at: now,
  };

  mutate((store) => {
    let next = log({ ...store, invoices: [record, ...store.invoices] }, {
      ref_code: record.ref_code,
      actor: "Automation",
      action: `Extracted ${record.currency} ${record.amount.toFixed(2)} from ${record.vendor} · ${record.category}`,
    });
    next = log(next, {
      ref_code: record.ref_code,
      actor: "Automation",
      action:
        flags.length === 0
          ? "All rules passed — auto-approved for payment"
          : `${flags.length} rule${flags.length > 1 ? "s" : ""} flagged (${flags.map((f) => f.rule).join(", ")}) — queued for a human`,
    });
    return next;
  });

  return record;
}

export function decideInvoice(id: string, decision: "approved" | "rejected" | "paid") {
  mutate((store) => {
    const row = store.invoices.find((i) => i.id === id);
    const invoices = store.invoices.map((i) =>
      i.id === id ? { ...i, status: decision, updated_at: new Date().toISOString() } : i,
    );
    const next = { ...store, invoices };
    return row
      ? log(next, {
          ref_code: row.ref_code,
          actor: "Human",
          action:
            decision === "paid"
              ? "Marked as paid"
              : decision === "approved"
                ? "Approved for payment after review"
                : "Rejected and sent back to the vendor",
        })
      : next;
  });
}

export function clearStore() {
  writeStore(EMPTY);
}
