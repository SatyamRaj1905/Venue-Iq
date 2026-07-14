"use client";

import { useState } from "react";
import { Check, ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface ActionChecklistProps {
  items: readonly string[];
}

export function ActionChecklist({ items }: ActionChecklistProps) {
  const [checked, setChecked] = useState<ReadonlySet<number>>(new Set());

  function toggle(index: number): void {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <section className="action-checklist" aria-labelledby="checklist-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">In the moment</p>
          <h3 id="checklist-title">Action checklist</h3>
        </div>
        <Badge tone={checked.size === items.length ? "positive" : "info"}>
          {checked.size}/{items.length} checked
        </Badge>
      </div>
      <ol>
        {items.map((item, index) => {
          const isChecked = checked.has(index);
          return (
            <li
              key={item}
              className={
                isChecked
                  ? "action-checklist__item action-checklist__item--checked"
                  : "action-checklist__item"
              }
            >
              <button
                type="button"
                onClick={() => toggle(index)}
                aria-pressed={isChecked}
                aria-label={`${isChecked ? "Mark incomplete" : "Mark complete"}: ${item}`}
              >
                <span aria-hidden="true">{isChecked ? <Check size={15} /> : index + 1}</span>
                <span>{item}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {checked.size === items.length ? (
        <p className="checklist-complete">
          <ClipboardCheck size={16} aria-hidden="true" /> Checklist complete. Stay with the guest
          until handoff.
        </p>
      ) : null}
    </section>
  );
}
