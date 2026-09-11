import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors";
  const styles: Record<Variant, string> = {
    primary: "bg-signal text-white hover:bg-signal-dark",
    ghost: "border border-border text-ink hover:bg-signal-light",
  };
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
