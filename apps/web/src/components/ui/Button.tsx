import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger";
type Size = "sm" | "md";

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  const base =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const sizes: Record<Size, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };
  const styles: Record<Variant, string> = {
    primary: "bg-signal text-white hover:bg-signal-dark",
    ghost:
      "border border-border text-ink hover:border-signal hover:bg-signal-light",
    danger: "border border-clay/40 text-clay hover:bg-clay-light",
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
