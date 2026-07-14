import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cx } from "@/lib/utils/classNames";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
  compact?: boolean;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  icon,
  disabled = false,
  compact = false,
}: ToggleProps) {
  return (
    <button
      aria-pressed={checked}
      className={cx("toggle", checked && "toggle--active", compact && "toggle--compact")}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      type="button"
    >
      {icon ? (
        <span className="toggle__leading" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="toggle__copy">
        <span className="toggle__label">{label}</span>
        {description ? <span className="toggle__description">{description}</span> : null}
      </span>
      <span className="toggle__control" aria-hidden="true">
        <span className="toggle__thumb">
          {checked ? <Check size={11} strokeWidth={3} /> : null}
        </span>
      </span>
    </button>
  );
}
