import Link from "next/link";
import type { Campaign } from "@collabify/shared";

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <Link
      href={`/campaign/${campaign.id}`}
      className="block rounded-lg border border-border bg-white p-5 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-display font-medium leading-snug">{campaign.title}</h3>
        <span className="shrink-0 rounded-full bg-signal-light px-2.5 py-1 text-xs font-medium text-signal-dark">
          ${(campaign.budgetCents / 100).toLocaleString()}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-slate">{campaign.description}</p>
    </Link>
  );
}
