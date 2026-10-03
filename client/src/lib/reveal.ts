import { useEffect } from "react";

/** Attaches IntersectionObserver-based reveal animations to .reveal elements. */
export function useReveal(dep: unknown = null) {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.is-visible)");
    if (!els.length) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    // Immediately show elements already in or near viewport
    const vh = window.innerHeight || 800;
    els.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top <= vh + 100) {
        el.classList.add("is-visible");
      }
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: "100px 0px 100px 0px" },
    );

    els.forEach((el) => {
      if (!el.classList.contains("is-visible")) {
        io.observe(el);
      }
    });

    // Safety fallback: ensure nothing stays permanently hidden
    const timer = setTimeout(() => {
      document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => {
        el.classList.add("is-visible");
      });
    }, 600);

    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, [dep]);
}
