"use client";
import { useState } from "react";
import { site } from "@/config/site";

/** Bank deposit details from the church settings (content/settings.json), with a button to copy the account number. */
export function BankDetails() {
  const { bank, accountName, accountNumber, reference } = site.giving;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard not available: the number is still on screen */
    }
  };
  return (
    <dl className="not-prose mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-bg">
      <div className="flex flex-wrap justify-between gap-2 p-4"><dt className="text-muted">Bank</dt><dd className="font-semibold">{bank}</dd></div>
      <div className="flex flex-wrap justify-between gap-2 p-4"><dt className="text-muted">Account name</dt><dd className="font-semibold">{accountName}</dd></div>
      <div className="flex flex-wrap items-center justify-between gap-2 p-4">
        <dt className="text-muted">Account number</dt>
        <dd className="flex items-center gap-3">
          <span className="font-mono text-lg font-semibold tracking-wide">{accountNumber}</span>
          <button type="button" onClick={copy} className="rounded-full border border-line px-3 py-1 text-sm font-semibold text-accent hover:bg-accent/10">{copied ? "Copied" : "Copy"}</button>
        </dd>
      </div>
      <div className="flex flex-wrap justify-between gap-2 p-4"><dt className="text-muted">Reference</dt><dd className="font-semibold">{reference}</dd></div>
    </dl>
  );
}
