import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <section className="mt-8 max-w-2xl">
        <h1 className="font-display text-5xl leading-[1.1] tracking-tight">
          Run the whole campaign in one thread - brief, chat, call, deliver.
        </h1>
        <p className="mt-6 max-w-prose text-lg text-slate">
          Brands post a campaign. Creators pitch, negotiate over live chat or a
          quick video call, then upload deliverables straight into a review
          queue that handles the encoding for you.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/dashboard/brand"
            className="rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-white"
          >
            Post a campaign
          </Link>
          <Link
            href="/dashboard/creator"
            className="rounded-md border border-border px-5 py-2.5 text-sm font-medium"
          >
            Browse open campaigns
          </Link>
        </div>
      </section>

      <section className="mt-28 grid gap-8 border-t border-border pt-12 sm:grid-cols-3">
        <div>
          <h2 className="font-display text-lg">Live, not laggy</h2>
          <p className="mt-2 text-sm text-slate">
            Chat and pitch calls run over the same real-time connection - no
            refreshing to see a reply.
          </p>
        </div>
        <div>
          <h2 className="font-display text-lg">Uploads that just work</h2>
          <p className="mt-2 text-sm text-slate">
            Drop a video from any phone; it's transcoded and thumbnailed
            automatically in the background.
          </p>
        </div>
        <div>
          <h2 className="font-display text-lg">Know what's working</h2>
          <p className="mt-2 text-sm text-slate">
            Every view and application streams into a live counter, so campaign
            performance is never a stale report.
          </p>
        </div>
      </section>
    </main>
  );
}
