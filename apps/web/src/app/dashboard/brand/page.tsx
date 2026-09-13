"use client";

import { useState } from "react";
import {
  useCreateCampaignMutation,
  useListMyCampaignsQuery,
} from "@/store/api/apiSlice";
import { CampaignCard } from "@/components/CampaignCard";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { RequireAuth } from "@/components/RequireAuth";

function BrandDashboardContent() {
  const { data: campaigns, isLoading } = useListMyCampaignsQuery();
  const [createCampaign, { isLoading: posting }] = useCreateCampaignMutation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    budgetCents: 0,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createCampaign({ ...form, status: "open" });
    setForm({ title: "", description: "", budgetCents: 0 });
    setShowForm(false);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <PageHeader
        eyebrow="Brand dashboard"
        title="Your campaigns"
        description="Post a campaign, then chat and review deliverables from applicants."
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "New campaign"}
          </Button>
        }
      />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-3 rounded-xl border border-border bg-white p-5"
        >
          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus-visible:border-signal"
          />
          <textarea
            required
            placeholder="What do you need from creators?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus-visible:border-signal"
            rows={3}
          />
          <input
            required
            type="number"
            placeholder="Budget (USD)"
            onChange={(e) =>
              setForm({ ...form, budgetCents: Number(e.target.value) * 100 })
            }
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus-visible:border-signal"
          />
          <Button type="submit" disabled={posting}>
            {posting ? "Posting…" : "Post campaign"}
          </Button>
        </form>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {isLoading && (
          <p className="text-sm text-slate">Loading your campaigns…</p>
        )}
        {campaigns?.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
        {campaigns?.length === 0 && !isLoading && (
          <p className="text-sm text-slate">
            No campaigns yet — post your first one above.
          </p>
        )}
      </div>
    </main>
  );
}

export default function BrandDashboard() {
  return (
    <RequireAuth role="brand">
      <BrandDashboardContent />
    </RequireAuth>
  );
}
