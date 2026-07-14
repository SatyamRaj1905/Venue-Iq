"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button, ButtonLink } from "./Button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  reset?: () => void;
}

export function ErrorState({
  title = "This view could not be loaded",
  description = "Your data is safe. Try this view again, or return to the overview.",
  reset,
}: ErrorStateProps) {
  return (
    <section className="state-page" aria-labelledby="error-title">
      <span className="state-page__icon state-page__icon--warning">
        <TriangleAlert size={28} aria-hidden="true" />
      </span>
      <p className="eyebrow">Recoverable error</p>
      <h1 id="error-title">{title}</h1>
      <p>{description}</p>
      <div className="button-row">
        {reset ? (
          <Button onClick={reset}>
            <RotateCcw size={17} aria-hidden="true" /> Try again
          </Button>
        ) : null}
        <ButtonLink href="/" variant="secondary">
          Return home
        </ButtonLink>
      </div>
    </section>
  );
}
