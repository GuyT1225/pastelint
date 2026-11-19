const PasteLintUtils = {
  getElement(id) {
    return document.getElementById(id);
  },

  getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : "";
  },

  setValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value;
  },

  setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  },

  escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  },

  normalizeWhitespace(value) {
    return String(value)
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  },

  countWords(value) {
    const matches = String(value).trim().match(/\b[\w'-]+\b/g);
    return matches ? matches.length : 0;
  },

  async copyToClipboard(text) {
    if (typeof text !== "string" || !text) return false;

    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {
      // Try the legacy fallback when the modern API rejects.
    }

    let temp;
    const previousFocus = document.activeElement;
    try {
      temp = document.createElement("textarea");
      temp.value = text;
      temp.setAttribute("readonly", "");
      temp.style.position = "fixed";
      temp.style.left = "-9999px";
      document.body.appendChild(temp);
      temp.select();
      return document.execCommand("copy") === true;
    } catch (_) {
      return false;
    } finally {
      temp?.remove();
      try { previousFocus?.focus({ preventScroll: true }); } catch (_) {}
    }
  }
};
