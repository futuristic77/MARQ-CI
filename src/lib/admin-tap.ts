import { useNavigate } from "@tanstack/react-router";
import type { MouseEvent } from "react";

// Module-level so the count survives the header remounting when the first click navigates home.
let taps: number[] = [];
const WINDOW_MS = 700;

/** Three quick clicks/taps on the MARQ’CI name open the admin area. */
export function useAdminTap() {
  const navigate = useNavigate();
  return (e: MouseEvent) => {
    const now = Date.now();
    taps = [...taps.filter((t) => now - t < WINDOW_MS), now];
    if (taps.length >= 3) {
      taps = [];
      e.preventDefault();
      void navigate({ to: "/admin" });
    }
  };
}
