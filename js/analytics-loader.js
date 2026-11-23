(() => {
  "use strict";

  const STORAGE_KEY = "pastelint_internal_analytics";
  const EXCLUDED_VALUE = "excluded";
  // Usage analytics paused. Preserve existing preferences; never load a provider here.

  try {
    const url = new URL(window.location.href);
    const controls = url.searchParams.getAll("analytics");

    if (controls.length) {
      const hasExclusion = controls.includes("exclude");
      const isExplicitInclusion = controls.length === 1 && controls[0] === "include";

      if (hasExclusion || !isExplicitInclusion) {
        localStorage.setItem(STORAGE_KEY, EXCLUDED_VALUE);
        if (localStorage.getItem(STORAGE_KEY) !== EXCLUDED_VALUE) throw new Error("Preference write failed");
        console.info("[PasteLint] Analytics preference: excluded for this browser.");
      } else {
        localStorage.removeItem(STORAGE_KEY);
        if (localStorage.getItem(STORAGE_KEY) !== null) throw new Error("Preference removal failed");
        console.info("[PasteLint] Analytics preference: included for this browser.");
      }

      url.searchParams.delete("analytics");
      history.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  } catch (_error) {
    // Storage and history access can be restricted; analytics must fail safely.
  }

  // No analytics script or network request while collection is paused.
})();
