type Tone = "signal" | "clay" | "neutral";

const TONE_STYLES: Record<Tone, string> = {
  signal: "bg-signal-light text-signal-dark",
  clay: "bg-clay-light text-clay",
  neutral: "bg-border/60 text-slate",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}
