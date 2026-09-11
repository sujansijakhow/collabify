"use client";

import { useState } from "react";
import { useCreateCampaignMutation, useListCampaignsQuery } from "@/store/api/apiSlice";
import { CampaignCard } from "@/components/CampaignCard";
import { Button } from "@/components/ui/Button";

// NOTE: brandId is hardcoded for this scaffold — wire up real auth (the
// /auth routes + JWT cookie already issued by the API) before shipping.
const DEMO_BRAND_ID = "demo-brand-id";

export default function BrandDashboard() {
  const { data: campaigns } = useListCampaignsQuery({ status: "open" });
  const [createCampaign, { isLoading }] = useCreateCampaignMutation();
  const [form, setForm] = useState({ title: "", description: "", budgetCents: 0 });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createCampaign({ ...form, brandId: DEMO_BRAND_ID, status: "open" });
    setForm({ title: "", description: "", budgetCents: 0 });
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl">Your campaigns</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-3 rounded-lg border border-border bg-white p-5">
        <h2 className="font-display text-lg">New campaign</h2>
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        <textarea
          required
          placeholder="What do you need from creators?"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
          rows={3}
        />
        <input
          required
          type="number"
          placeholder="Budget (USD)"
          onChange={(e) => setForm({ ...form, budgetCents: Number(e.target.value) * 100 })}
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Posting…" : "Post campaign"}
        </Button>
      </form>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {campaigns?.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
    </main>
  );
}
