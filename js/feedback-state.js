(function (global) {
  "use strict";

  const VALID_STATES = new Set([
    "changed",
    "unchanged",
    "blocked",
    "failed"
  ]);

  function setFeedbackState(element, state, message) {
    if (!element) return false;

    const normalizedState = String(state || "").toLowerCase();
    if (!VALID_STATES.has(normalizedState)) {
      throw new Error(`Unknown feedback state: ${state}`);
    }

    element.dataset.feedbackState = normalizedState;
    element.textContent = message;
    element.hidden = !message;
    return true;
  }

  global.PasteLintFeedback = Object.freeze({
    states: Object.freeze({
      CHANGED: "changed",
      UNCHANGED: "unchanged",
      BLOCKED: "blocked",
      FAILED: "failed"
    }),
    set: setFeedbackState
  });
})(window);
