(function (root, factory) {
  "use strict";

  const api = Object.freeze({ create: factory });
  if (typeof module === "object" && module.exports) {
    module.exports = api;
    return;
  }
  if (Object.prototype.hasOwnProperty.call(root, "PasteLintAnalyticsOperationAdapter")) return;

  Object.defineProperty(root, "PasteLintAnalyticsOperationAdapter", {
    value: api,
    writable: false,
    configurable: false
  });
})(typeof globalThis === "object" ? globalThis : this, function create(dispatcher) {
  "use strict";

  function dispatch(eventType) {
    try {
      return Boolean(dispatcher && dispatcher.dispatch(eventType));
    } catch (_error) {
      return false;
    }
  }

  return Object.freeze({
    beginOperation() {
      dispatch("tool_start");
      let completed = false;

      return Object.freeze({
        complete() {
          if (completed) return false;
          completed = true;
          return dispatch("tool_complete");
        }
      });
    },

    recordCopy() {
      return dispatch("output_copy");
    }
  });
});
