"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { useGetCampaignQuery, useUploadSubmissionMutation } from "@/store/api/apiSlice";
import { ChatPanel } from "@/components/ChatPanel";
import { Button } from "@/components/ui/Button";
import { RequireAuth } from "@/components/RequireAuth";
import type { RootState } from "@/store/store";

function CampaignDetailContent() {
  const { id } = useParams<{ id: string }>();
  const userId = useSelector((s: RootState) => s.auth.user!.id);
  const { data: campaign, isLoading } = useGetCampaignQuery(id);
  const [uploadSubmission, { isLoading: uploading }] = useUploadSubmissionMutation();
  const [file, setFile] = useState<File | null>(null);

  async function handleUpload() {
    if (!file) return;
    const formData = new FormData();
    formData.append("applicationId", "demo-application-id");
    formData.append("file", file);
    await uploadSubmission(formData);
    setFile(null);
  }

  if (isLoading || !campaign) return <main className="mx-auto max-w-5xl px-6 py-12 text-sm text-slate">Loading…</main>;

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-6 py-12 md:grid-cols-[1fr,360px]">
      <div>
        <h1 className="font-display text-3xl">{campaign.title}</h1>
        <p className="mt-3 max-w-prose text-slate">{campaign.description}</p>
        <p className="mt-4 text-sm font-medium text-signal-dark">
          Budget: ${(campaign.budgetCents / 100).toLocaleString()}
        </p>

        <div className="mt-6 flex gap-3">
          <Link href={`/live/${campaign.id}`}>
            <Button variant="ghost">Start a live pitch call</Button>
          </Link>
        </div>

        <div className="mt-8 rounded-lg border border-border bg-white p-5">
          <h2 className="font-display text-lg">Upload a deliverable</h2>
          <p className="mt-1 text-sm text-slate">Any format works - it's transcoded and thumbnailed automatically.</p>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-3 text-sm"
          />
          <Button onClick={handleUpload} disabled={!file || uploading} className="mt-3">
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </div>

      <div className="h-[540px]">
        <ChatPanel campaignId={campaign.id} userId={userId} />
      </div>
    </main>
  );
}

export default function CampaignDetailPage() {
  return (
    <RequireAuth>
      <CampaignDetailContent />
    </RequireAuth>
  );
}