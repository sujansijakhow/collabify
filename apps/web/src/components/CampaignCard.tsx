import Link from "next/link";
import type { Campaign } from "@collabify/shared";
import { Badge } from "./ui/Badge";

const STATUS_TONE = {
  open: "signal",
  draft: "neutral",
  closed: "clay",
} as const;

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <Link
      href={`/campaign/${campaign.id}`}
      className="group block rounded-xl border border-border bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-signal/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <Badge tone={STATUS_TONE[campaign.status]}>{campaign.status}</Badge>
        <span className="shrink-0 text-sm font-semibold text-signal-dark">
          ${(campaign.budgetCents / 100).toLocaleString()}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-display font-medium leading-snug group-hover:text-signal-dark">
        {campaign.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm text-slate">
        {campaign.description}
      </p>
    </Link>
  );
}
