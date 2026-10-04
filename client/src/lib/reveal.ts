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

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: "200px 0px 200px 0px" },
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
    }, 120);

    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, [dep]);
}
