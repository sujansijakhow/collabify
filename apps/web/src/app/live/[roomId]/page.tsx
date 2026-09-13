"use client";

import { useListCampaignsQuery } from "@/store/api/apiSlice";
import { CampaignCard } from "@/components/CampaignCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { RequireAuth } from "@/components/RequireAuth";

function CreatorDashboardContent() {
  const { data: campaigns, isLoading } = useListCampaignsQuery({
    status: "open",
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <PageHeader
        eyebrow="Creator dashboard"
        title="Open campaigns"
        description="Pitch a brand, then chat and share deliverables in one place."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {isLoading && <p className="text-sm text-slate">Loading campaigns…</p>}
        {campaigns?.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
        {campaigns?.length === 0 && !isLoading && (
          <p className="text-sm text-slate">
            No open campaigns right now — check back soon.
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
