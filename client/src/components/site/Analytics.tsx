import { useEffect } from "react";
import { inject } from "@vercel/analytics";

export function Analytics() {
  useEffect(() => {
    try {
      inject();
    } catch (e) {
      // Graceful fallback for non-Vercel environments
    }
  }, []);
  return null;
}
