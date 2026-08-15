"use client";

import { useState } from "react";

type BillingControlsProps = {
  plan: string;
  status: string;
  used: number;
  limit: number;
  configured: boolean;
};

export default function BillingControls({ plan, status, used, limit, configured }: BillingControlsProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function open(path: string, body?: Record<string, string>) {
    setBusy(path);
    setMessage("");
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = await response.json();
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Billing is unavailable right now.");
      }
      window.location.assign(payload.url);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Billing is unavailable right now.");
      setBusy(null);
    }
  }

  return (
    <section className="card" aria-label="Subscription and usage">
      <div className="dashboard-head">
        <div>
          <div className="tag">Subscription</div>
          <h2 style={{ margin: "4px 0" }}>Plan: {plan}</h2>
        </div>
        <span className="status">{status}</span>
      </div>
      <p className="notice">
        This month: {used} of {limit} analysis sessions reserved.
      </p>
      {configured ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {plan === "free" && (
            <>
              <button className="btn primary" disabled={busy !== null} onClick={() => open("/api/billing/checkout", { plan: "starter" })}>
                {busy === "/api/billing/checkout" ? "Opening checkout…" : "Choose Starter"}
              </button>
              <button className="btn" disabled={busy !== null} onClick={() => open("/api/billing/checkout", { plan: "pro" })}>
                Choose Pro
              </button>
            </>
          )}
          {plan !== "free" && (
            <button className="btn primary" disabled={busy !== null} onClick={() => open("/api/billing/portal")}>
              {busy === "/api/billing/portal" ? "Opening billing…" : "Manage billing"}
            </button>
          )}
        </div>
      ) : (
        <p className="notice">Subscription configuration is not available in this environment.</p>
      )}
      {message && <div className="error">{message}</div>}
    </section>
  );
}
