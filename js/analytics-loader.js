(() => {
  "use strict";

  const STORAGE_KEY = "pastelint_internal_analytics";
  const EXCLUDED_VALUE = "excluded";
  const DECISION_NAME = "PasteLintAnalyticsPreferenceDecision";
  // Usage analytics paused. Preserve existing preferences; never load a provider here.

  let state = "blocked";

  try {
    const url = new URL(window.location.href);
    const controls = url.searchParams.getAll("analytics");
    let message = null;

    if (controls.length) {
      const hasExclusion = controls.includes("exclude");
      const isExplicitInclusion = controls.length === 1 && controls[0] === "include";

      if (hasExclusion || !isExplicitInclusion) {
        localStorage.setItem(STORAGE_KEY, EXCLUDED_VALUE);
        if (localStorage.getItem(STORAGE_KEY) !== EXCLUDED_VALUE) throw new Error("Preference write failed");
        message = "[PasteLint] Analytics preference: excluded for this browser.";
      } else {
        localStorage.removeItem(STORAGE_KEY);
        if (localStorage.getItem(STORAGE_KEY) !== null) throw new Error("Preference removal failed");
        message = "[PasteLint] Analytics preference: included for this browser.";
      }

      url.searchParams.delete("analytics");
      history.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
      if (window.location.href !== url.href) throw new Error("Preference URL cleanup failed");
    }

    state = localStorage.getItem(STORAGE_KEY) === null ? "included" : "excluded";
    if (message) console.info(message);
  } catch (_error) {
    // Storage and history access can be restricted; analytics must fail safely.
  }

  const decision = Object.freeze({ state });
  try {
    Object.defineProperty(window, DECISION_NAME, {
      value: decision,
      writable: false,
      configurable: false
    });
  } catch (_error) {
    // A missing decision keeps the later lifecycle bootstrap inert.
  }

  // No analytics script or network request while collection is paused.
})();
