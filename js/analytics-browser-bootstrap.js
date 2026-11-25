(function (root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
    return;
  }

  if (Object.prototype.hasOwnProperty.call(root, "PasteLintAnalyticsLifecycle")) return;

  const lifecycle = api.initialize(
    root,
    {
      preferenceDecision: root.PasteLintAnalyticsPreferenceDecision,
      dispatcherApi: root.PasteLintAnalyticsDispatcher,
      operationAdapter: root.PasteLintAnalyticsOperationAdapter
    },
    Object.freeze({ enabled: false }),
    null,
    Object.freeze({ emitPageView: false })
  );

  try {
    Object.defineProperty(root, "PasteLintAnalyticsLifecycle", {
      value: lifecycle,
      writable: false,
      configurable: false
    });
  } catch (_error) {
    // A lifecycle-global failure must not interrupt the page.
  }
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";

  const lifecyclesByDocument = new WeakMap();

  function inertLifecycle() {
    return Object.freeze({
      initialized: false,
      dispatcher: null,
      operations: null
    });
  }

  function initialize(browser, dependencies, config, sink, options) {
    const documentRef = browser && browser.document;
    if ((typeof documentRef !== "object" || documentRef === null) &&
        typeof documentRef !== "function") {
      return inertLifecycle();
    }
    if (lifecyclesByDocument.has(documentRef)) {
      return lifecyclesByDocument.get(documentRef);
    }

    let lifecycle;
    try {
      const dispatcherApi = dependencies && dependencies.dispatcherApi;
      const operationAdapter = dependencies && dependencies.operationAdapter;
      if (typeof dispatcherApi?.initializeResolved !== "function" ||
          typeof operationAdapter?.create !== "function") {
        throw new Error("Analytics lifecycle dependency unavailable");
      }

      const dispatcher = dispatcherApi.initializeResolved(
        browser,
        dependencies.preferenceDecision,
        config || {},
        sink
      );
      const operations = operationAdapter.create(dispatcher);
      if (Object.prototype.hasOwnProperty.call(browser, "PasteLintAnalyticsOperations")) {
        throw new Error("Analytics operation adapter already installed");
      }
      Object.defineProperty(browser, "PasteLintAnalyticsOperations", {
        value: operations,
        writable: false,
        configurable: false
      });

      lifecycle = Object.freeze({
        initialized: true,
        dispatcher,
        operations
      });
      if (options && options.emitPageView === true) {
        dispatcher.dispatch("page_view");
      }
    } catch (_error) {
      lifecycle = inertLifecycle();
    }

    lifecyclesByDocument.set(documentRef, lifecycle);
    return lifecycle;
  }

  return Object.freeze({ initialize });
});
