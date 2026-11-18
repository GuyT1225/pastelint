(() => {
  "use strict";

  const STORAGE_KEY = "pastelint_internal_analytics";
  const EXCLUDED_VALUE = "excluded";
  // Usage analytics paused. Preserve existing preferences; never load a provider here.

  let control = null;

  try {
    const url = new URL(window.location.href);
    control = url.searchParams.get("analytics");

    if (control === "exclude") {
      localStorage.setItem(STORAGE_KEY, EXCLUDED_VALUE);
      console.info("[PasteLint] Analytics preference: excluded for this browser.");
    } else if (control === "include") {
      localStorage.removeItem(STORAGE_KEY);
      console.info("[PasteLint] Analytics preference: included for this browser.");
    }

    if (control === "exclude" || control === "include") {
      url.searchParams.delete("analytics");
      history.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  } catch (_error) {
    // Storage and history access can be restricted; analytics must fail safely.
  }

  // No analytics script or network request while collection is paused.
})();
