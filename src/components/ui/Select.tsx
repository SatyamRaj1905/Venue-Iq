import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "@/lib/utils/classNames";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  hideLabel?: boolean;
}

export function Select({
  label,
  hint,
  hideLabel = false,
  className,
  id,
  children,
  ...props
}: SelectProps) {
  return (
    <label className="field" htmlFor={id}>
      <span className={cx("field__label", hideLabel && "sr-only")}>{label}</span>
      {hint ? <span className="field__hint">{hint}</span> : null}
      <span className="select-wrap">
        <select className={cx("select", className)} id={id} {...props}>
          {children}
        </select>
        <ChevronDown className="select-wrap__icon" size={17} aria-hidden="true" />
      </span>
    </label>
  );
}
