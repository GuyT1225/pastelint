(function () {
  "use strict";

  const RESET_DELAY = 2500;

  function getCanonicalUrl() {
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) return null;

    try {
      const url = new URL(canonical.href);
      if (url.protocol !== "https:" && url.protocol !== "http:") return null;
      url.search = "";
      url.hash = "";
      return url.href;
    } catch {
      return null;
    }
  }

  function copyWithFallback(value) {
    const input = document.createElement("textarea");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    if (!copied) throw new Error("Copy command was unavailable");
  }

  async function copyCanonical(value) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(value);
      return;
    }
    copyWithFallback(value);
  }

  function initialize(button) {
    if (button.dataset.journalShareInitialized === "true") return;
    button.dataset.journalShareInitialized = "true";

    const container = button.closest(".journal-share");
    const status = container?.querySelector("[data-journal-share-status]");
    const nativeSupported = typeof navigator.share === "function";
    const event = nativeSupported ? button.dataset.shareNativeEvent : button.dataset.shareCopyEvent;
    if (event) button.dataset.statkitEvent = event;

    let resetTimer;
    const setStatus = (message, state) => {
      if (!status) return;
      window.clearTimeout(resetTimer);
      status.textContent = message;
      container?.classList.remove("is-success", "is-error");
      if (state) container?.classList.add(state);
      if (message) {
        resetTimer = window.setTimeout(() => {
          status.textContent = "";
          container?.classList.remove("is-success", "is-error");
        }, RESET_DELAY);
      }
    };

    button.addEventListener("click", async () => {
      const canonicalUrl = getCanonicalUrl();
      if (!canonicalUrl || button.disabled) return;

      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      container?.classList.add("is-pending");
      setStatus("", "");

      try {
        if (nativeSupported) {
          const title = document.querySelector("h1")?.textContent?.trim() || document.title;
          const text = document.querySelector('meta[name="description"]')?.content || "";
          await navigator.share({ title, text, url: canonicalUrl });
        } else {
          await copyCanonical(canonicalUrl);
          setStatus("Link copied", "is-success");
        }
      } catch (error) {
        if (error?.name !== "AbortError") {
          setStatus(nativeSupported ? "Sharing unavailable" : "Copy the address from your browser", "is-error");
        }
      } finally {
        button.disabled = false;
        button.removeAttribute("aria-busy");
        container?.classList.remove("is-pending");
      }
    });
  }

  function start() {
    document.querySelectorAll("[data-journal-share]").forEach(initialize);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
