import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors";
  const styles =
    variant === "primary"
      ? "bg-black text-white hover:bg-zinc-800"
      : "border border-zinc-200 bg-white text-black hover:bg-zinc-50";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
