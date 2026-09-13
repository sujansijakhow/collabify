"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import {
  useGetCampaignQuery,
  useUploadSubmissionMutation,
  useApplyToCampaignMutation,
  useGetMyApplicationQuery,
  useListApplicationsQuery,
  useUpdateApplicationStatusMutation,
} from "@/store/api/apiSlice";
import { ChatPanel } from "@/components/ChatPanel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RequireAuth } from "@/components/RequireAuth";
import type { RootState } from "@/store/store";

function CreatorPanel({ campaignId }: { campaignId: string }) {
  const { data: existingApplication, isLoading: checking } =
    useGetMyApplicationQuery(campaignId);
  const [applyToCampaign, { isLoading: applying }] =
    useApplyToCampaignMutation();
  const [uploadSubmission, { isLoading: uploading }] =
    useUploadSubmissionMutation();
  const [pitch, setPitch] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    await applyToCampaign({ campaignId, pitch }).unwrap();
  }

  async function handleUpload() {
    if (!file || !existingApplication) return;
    const formData = new FormData();
    formData.append("applicationId", existingApplication.id);
    formData.append("file", file);
    await uploadSubmission(formData);
    setFile(null);
  }

  if (checking) {
    return (
      <div className="rounded-xl border border-border bg-white p-5 text-sm text-slate">
        Loading…
      </div>
    );
  }

  if (!existingApplication) {
    return (
      <div className="rounded-xl border border-border bg-white p-5">
        <h2 className="font-display text-lg">Pitch this campaign</h2>
        <p className="mt-1 text-sm text-slate">
          Once you apply, you can upload your deliverable here.
        </p>
        <form onSubmit={handleApply} className="mt-3 space-y-3">
          <textarea
            required
            placeholder="Why are you a fit for this campaign?"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus-visible:border-signal"
          />
          <Button type="submit" disabled={applying}>
            {applying ? "Sending…" : "Apply"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-lg">Upload a deliverable</h2>
        <Badge
          tone={
            existingApplication.status === "accepted"
              ? "signal"
              : existingApplication.status === "rejected"
                ? "clay"
                : "neutral"
          }
        >
          {existingApplication.status}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-slate">
        Any format works — it's transcoded and thumbnailed automatically.
      </p>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="mt-3 text-sm"
      />
      <Button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="mt-3"
      >
        {uploading ? "Uploading…" : "Upload"}
      </Button>
    </div>
  );
}

function BrandPanel({ campaignId }: { campaignId: string }) {
  const { data: applications, isLoading } =
    useListApplicationsQuery(campaignId);
  const [updateStatus, { isLoading: updating }] =
    useUpdateApplicationStatusMutation();

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h2 className="font-display text-lg">Applicants</h2>
      {isLoading && <p className="mt-2 text-sm text-slate">Loading…</p>}
      {applications?.length === 0 && !isLoading && (
        <p className="mt-2 text-sm text-slate">No applications yet.</p>
      )}
      <ul className="mt-3 space-y-3">
        {applications?.map((app) => (
          <li key={app.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{app.creatorName}</span>
              <Badge
                tone={
                  app.status === "accepted"
                    ? "signal"
                    : app.status === "rejected"
                      ? "clay"
                      : "neutral"
                }
              >
                {app.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate">{app.pitch}</p>

            {app.submission && (
              <div className="mt-3">
                {app.submission.status === "ready" &&
                app.submission.videoUrl ? (
                  <video
                    controls
                    poster={
                      app.submission.thumbnailUrl
                        ? `/api/media/processed/${app.submission.thumbnailUrl.split(/[\\/]/).pop()}`
                        : undefined
                    }
                    src={`/api/media/processed/${app.submission.videoUrl.split(/[\\/]/).pop()}`}
                    className="w-full rounded-md"
                  />
                ) : (
                  <p className="text-xs text-slate">
                    Deliverable{" "}
                    {app.submission.status === "failed"
                      ? "failed to process"
                      : "still processing…"}
                  </p>
                )}
              </div>
            )}

            {app.status === "pending" && (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  disabled={updating}
                  onClick={() =>
                    updateStatus({ id: app.id, status: "accepted" })
                  }
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={updating}
                  onClick={() =>
                    updateStatus({ id: app.id, status: "rejected" })
                  }
                >
                  Reject
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CampaignDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { user } = useSelector((s: RootState) => s.auth);
  const { data: campaign, isLoading } = useGetCampaignQuery(id);

  if (isLoading || !campaign || !user)
    return (
      <main className="mx-auto max-w-5xl px-6 py-12 text-sm text-slate">
        Loading…
      </main>
    );

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-6 py-12 md:grid-cols-[1fr,360px]">
      <div>
        <Badge tone={campaign.status === "open" ? "signal" : "neutral"}>
          {campaign.status}
        </Badge>
        <h1 className="mt-3 font-display text-3xl">{campaign.title}</h1>
        <p className="mt-3 max-w-prose text-slate">{campaign.description}</p>
        <p className="mt-4 text-sm font-medium text-signal-dark">
          Budget: ${(campaign.budgetCents / 100).toLocaleString()}
        </p>

        <div className="mt-6">
          <Link href={`/live/${campaign.id}`}>
            <Button variant="ghost">Start a live pitch call</Button>
          </Link>
        </div>

        <div className="mt-8">
          {user.role === "creator" ? (
            <CreatorPanel campaignId={campaign.id} />
          ) : (
            <BrandPanel campaignId={campaign.id} />
          )}
        </div>
      </div>

      <div className="h-[540px]">
        <ChatPanel campaignId={campaign.id} userId={user.id} />
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
