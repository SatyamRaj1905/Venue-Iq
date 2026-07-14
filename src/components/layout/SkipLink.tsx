"use client";

import type { MouseEvent } from "react";

function moveFocusToMain(event: MouseEvent<HTMLAnchorElement>): void {
  const main = document.getElementById("main-content");
  if (main === null) return;
  event.preventDefault();
  window.history.replaceState(null, "", "#main-content");
  main.focus({ preventScroll: true });
  main.scrollIntoView({ block: "start" });
}

export function SkipLink() {
  return (
    <a className="skip-link" href="#main-content" onClick={moveFocusToMain}>
      Skip to main content
    </a>
  );
}
