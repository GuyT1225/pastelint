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

  copyToClipboard(text) {
    if (!text) return Promise.resolve(false);

    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(() => true);
    }

    const temp = document.createElement("textarea");
    temp.value = text;
    temp.setAttribute("readonly", "");
    temp.style.position = "absolute";
    temp.style.left = "-9999px";

    document.body.appendChild(temp);
    temp.select();

    let successful = false;

    try {
      successful = document.execCommand("copy");
    } catch (error) {
      successful = false;
    }

    document.body.removeChild(temp);
    return Promise.resolve(successful);
  }
};
