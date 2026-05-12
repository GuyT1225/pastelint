document.addEventListener("DOMContentLoaded", () => {
  bindThemeButtons();
});

function bindThemeButtons() {
  const themeButtons = document.querySelectorAll("[data-theme-choice]");
  const savedTheme = localStorage.getItem("pastelint-theme") || "light";

  applyTheme(savedTheme);

  themeButtons.forEach(button => {
    button.addEventListener("click", () => {
      const theme = button.dataset.themeChoice;
      applyTheme(theme);
      localStorage.setItem("pastelint-theme", theme);
    });
  });
}

function applyTheme(theme) {
  const allowedThemes = ["light", "dark", "terminal"];
  const safeTheme = allowedThemes.includes(theme) ? theme : "light";

  document.documentElement.setAttribute("data-theme", safeTheme);

  document.querySelectorAll("[data-theme-choice]").forEach(button => {
    const isActive = button.dataset.themeChoice === safeTheme;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}
