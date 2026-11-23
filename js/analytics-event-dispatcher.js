(function (root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
    return;
  }
  Object.defineProperty(root, "PasteLintAnalyticsDispatcher", {
    value: api,
    writable: false,
    configurable: false
  });
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";

  const ANALYTICS_PREFERENCE_KEY = "pastelint_internal_analytics";
  const EXCLUDED_VALUE = "excluded";
  const EVENT_TYPES = Object.freeze([
    "page_view",
    "tool_start",
    "tool_complete",
    "output_copy"
  ]);
  const PAGE_PATHS = Object.freeze([
    "/pastelint/",
    "/pastelint/clean-chatgpt-output.html",
    "/pastelint/second-draft.html",
    "/pastelint/text-readiness-framework.html",
    "/pastelint/text-preparation-journal.html",
    "/pastelint/journal-engine-room-prepared-handoff-is-not-accepted-outcome.html",
    "/pastelint/journal-editors-desk-text-readiness-is-a-handoff-discipline.html",
    "/pastelint/journal-sources-case-studies-editors-optimize-for-readers.html",
    "/pastelint/journal-editors-desk-record-behind-product-transparency.html",
    "/pastelint/journal-sources-case-studies-tutor-not-ghostwriter.html",
    "/pastelint/journal-engine-room-line-breaks-are-part-of-the-meaning.html",
    "/pastelint/journal-engine-room-directness-without-false-certainty.html",
    "/pastelint/journal-sources-case-studies-the-new-bottleneck-is-taste.html",
    "/pastelint/journal-sources-case-studies-first-draft-finds-the-story.html",
    "/pastelint/journal-content-pipeline-breaks-before-writing.html",
    "/pastelint/journal-cleanup-pass-voice-survives.html",
    "/pastelint/journal-tracing-with-the-model.html",
    "/pastelint/journal-editors-desk-filler-openings.html",
    "/pastelint/journal-editors-desk-clearer-is-not-more-certain.html",
    "/pastelint/journal-engine-ssml-catalog-chunks.html",
    "/pastelint/journal-editors-desk-clean-up-chatgpt-text-without-overwriting-your-voice.html",
    "/pastelint/SSML_builder.html",
    "/pastelint/fix-pdf-paste.html",
    "/pastelint/tts-text-cleanup.html",
    "/pastelint/ivr-text-prep.html",
    "/pastelint/remove-hidden-characters.html",
    "/pastelint/clean-text-message.html"
  ]);
  const TOOL_PATHS = new Set([
    "/pastelint/",
    "/pastelint/second-draft.html",
    "/pastelint/SSML_builder.html"
  ]);
  const PAGE_PATH_SET = new Set(PAGE_PATHS);
  const OPERATION_EVENTS = new Set(["tool_start", "tool_complete", "output_copy"]);
  const dispatchersByDocument = new WeakMap();

  function normalizePagePath(pathname) {
    return pathname === "/pastelint/index.html" ? "/pastelint/" : pathname;
  }

  function isAllowedEvent(eventType, pagePath) {
    return PAGE_PATH_SET.has(pagePath) &&
      (eventType === "page_view" ||
        (TOOL_PATHS.has(pagePath) && OPERATION_EVENTS.has(eventType)));
  }

  function createGate(browser, config) {
    let blocked = false;
    const enabled = config && config.enabled === true;
    const allowedOrigin = config && typeof config.allowedOrigin === "string"
      ? config.allowedOrigin
      : null;
    const deny = function () { blocked = true; };

    try {
      const url = new URL(browser.location.href);
      const controls = url.searchParams.getAll("analytics");
      if (controls.length) {
        const storage = browser.localStorage;
        if (controls.includes("exclude")) {
          deny();
          storage.setItem(ANALYTICS_PREFERENCE_KEY, EXCLUDED_VALUE);
          if (storage.getItem(ANALYTICS_PREFERENCE_KEY) !== EXCLUDED_VALUE) deny();
        } else if (controls.length === 1 && controls[0] === "include") {
          storage.removeItem(ANALYTICS_PREFERENCE_KEY);
          if (storage.getItem(ANALYTICS_PREFERENCE_KEY) !== null) deny();
        } else {
          deny();
        }
        url.searchParams.delete("analytics");
        browser.history.replaceState(
          browser.history.state,
          "",
          url.pathname + url.search + url.hash
        );
        if (browser.location.href !== url.href) deny();
      }
      if (browser.localStorage.getItem(ANALYTICS_PREFERENCE_KEY) !== null) deny();
    } catch (_error) {
      deny();
    }

    return Object.freeze({
      authorize(eventType) {
        if (blocked) return null;
        try {
          if (!enabled || !allowedOrigin) return null;
          const configured = new URL(allowedOrigin);
          if (configured.protocol !== "https:" || configured.origin !== allowedOrigin) {
            return null;
          }
          const url = new URL(browser.location.href);
          if (url.origin !== allowedOrigin || url.searchParams.has("analytics")) return null;
          if (browser.localStorage.getItem(ANALYTICS_PREFERENCE_KEY) !== null) {
            deny();
            return null;
          }
          const pagePath = normalizePagePath(url.pathname);
          return isAllowedEvent(eventType, pagePath) ? pagePath : null;
        } catch (_error) {
          deny();
          return null;
        }
      }
    });
  }

  function inertDispatcher() {
    return Object.freeze({ dispatch() { return false; } });
  }

  function initializeDispatcher(browser, gateFactory, sink) {
    const documentRef = browser && browser.document;
    if ((typeof documentRef !== "object" || documentRef === null) &&
        typeof documentRef !== "function") {
      return inertDispatcher();
    }
    if (dispatchersByDocument.has(documentRef)) {
      return dispatchersByDocument.get(documentRef);
    }

    const gate = gateFactory();
    let pageViewDispatched = false;
    const dispatcher = Object.freeze({
      dispatch(eventType) {
        if (typeof sink !== "function") return false;
        if (eventType === "page_view" && pageViewDispatched) return false;
        const pagePath = gate.authorize(eventType);
        if (!pagePath) return false;
        if (eventType === "page_view") pageViewDispatched = true;
        const payload = Object.freeze({
          event_type: eventType,
          page_path: pagePath
        });
        try {
          sink(payload);
          return true;
        } catch (_error) {
          return false;
        }
      }
    });

    dispatchersByDocument.set(documentRef, dispatcher);
    return dispatcher;
  }

  function initialize(browser, config, sink) {
    return initializeDispatcher(
      browser,
      () => createGate(browser, config || {}),
      sink
    );
  }

  function isResolvedDecision(decision) {
    return Boolean(
      decision &&
      Object.isFrozen(decision) &&
      Object.keys(decision).length === 1 &&
      ["included", "excluded", "blocked"].includes(decision.state)
    );
  }

  function createResolvedGate(browser, decision, config) {
    let blocked = !isResolvedDecision(decision) || decision.state !== "included";
    const enabled = config && config.enabled === true;
    const allowedOrigin = config && typeof config.allowedOrigin === "string"
      ? config.allowedOrigin
      : null;
    const deny = function () { blocked = true; };

    return Object.freeze({
      authorize(eventType) {
        if (blocked) return null;
        try {
          if (!enabled || !allowedOrigin) return null;
          const configured = new URL(allowedOrigin);
          if (configured.protocol !== "https:" || configured.origin !== allowedOrigin) {
            return null;
          }
          const url = new URL(browser.location.href);
          if (url.origin !== allowedOrigin || url.searchParams.has("analytics")) {
            deny();
            return null;
          }
          if (browser.localStorage.getItem(ANALYTICS_PREFERENCE_KEY) !== null) {
            deny();
            return null;
          }
          const pagePath = normalizePagePath(url.pathname);
          return isAllowedEvent(eventType, pagePath) ? pagePath : null;
        } catch (_error) {
          deny();
          return null;
        }
      }
    });
  }

  function initializeResolved(browser, decision, config, sink) {
    return initializeDispatcher(
      browser,
      () => createResolvedGate(browser, decision, config || {}),
      sink
    );
  }

  return Object.freeze({
    ANALYTICS_PREFERENCE_KEY,
    EVENT_TYPES,
    PAGE_PATHS,
    initialize,
    initializeResolved,
    isAllowedEvent,
    normalizePagePath
  });
});
