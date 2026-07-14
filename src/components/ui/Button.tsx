import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cx } from "@/lib/utils/classNames";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "small" | "medium" | "large";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  showArrow?: boolean;
  "aria-label"?: string;
}

export function Button({
  className,
  variant = "primary",
  size = "medium",
  isLoading = false,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx("button", `button--${variant}`, `button--${size}`, className)}
      disabled={disabled || isLoading}
      type={type}
      {...props}
    >
      {isLoading ? <span className="button__spinner" aria-hidden="true" /> : null}
      <span>{isLoading ? "Working…" : children}</span>
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "medium",
  className,
  showArrow = false,
  "aria-label": ariaLabel,
}: ButtonLinkProps) {
  return (
    <Link
      className={cx("button", `button--${variant}`, `button--${size}`, className)}
      href={href}
      aria-label={ariaLabel}
    >
      <span>{children}</span>
      {showArrow ? <ArrowRight size={17} aria-hidden="true" /> : null}
    </Link>
  );
}
