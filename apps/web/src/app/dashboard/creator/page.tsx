"use client";

import { useListCampaignsQuery } from "@/store/api/apiSlice";
import { CampaignCard } from "@/components/CampaignCard";
import { RequireAuth } from "@/components/RequireAuth";

function CreatorDashboardContent() {
  const { data: campaigns, isLoading } = useListCampaignsQuery({
    status: "open",
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl">Open campaigns</h1>
      <p className="mt-1 text-sm text-slate">
        Pitch a brand, then chat and share deliverables in one place.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {isLoading && <p className="text-sm text-slate">Loading campaigns…</p>}
        {campaigns?.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
        {campaigns?.length === 0 && (
          <p className="text-sm text-slate">
            No open campaigns right now - check back soon.
          </p>
        )}
      </div>
    </main>
  );
}

export default function CreatorDashboard() {
  return (
    <RequireAuth role="creator">
      <CreatorDashboardContent />
    </RequireAuth>
  );
}
