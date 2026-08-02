(() => {
  "use strict";

  const STORAGE_KEY = "pastelint_internal_analytics";
  const EXCLUDED_VALUE = "excluded";
  const STATSKIT_SRC = "https://cdn.statskit.ai/v.js";
  const STATSKIT_SITE_ID = "vpk_live_20e8d5020dab682829ccd0beafbe17c93cacdfd20d14f200";
  const STATSKIT_API = "https://edge.statskit.ai";

  let control = null;

  try {
    const url = new URL(window.location.href);
    control = url.searchParams.get("analytics");

    if (control === "exclude") {
      localStorage.setItem(STORAGE_KEY, EXCLUDED_VALUE);
      console.info("[PasteLint] StatsKit analytics excluded for this browser.");
    } else if (control === "include") {
      localStorage.removeItem(STORAGE_KEY);
      console.info("[PasteLint] StatsKit analytics included for this browser.");
    }

    if (control === "exclude" || control === "include") {
      url.searchParams.delete("analytics");
      history.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  } catch (_error) {
    // Storage and history access can be restricted; analytics must fail safely.
  }

  let isExcluded = false;

  try {
    isExcluded = localStorage.getItem(STORAGE_KEY) === EXCLUDED_VALUE;
  } catch (_error) {
    // If browser storage is unavailable, retain normal public analytics behavior.
  }

  if (isExcluded) return;

  const script = document.createElement("script");
  script.async = false;
  script.defer = true;
  script.src = STATSKIT_SRC;
  script.setAttribute("data-site-id", STATSKIT_SITE_ID);
  script.setAttribute("data-api", STATSKIT_API);
  (document.head || document.documentElement).appendChild(script);
})();
