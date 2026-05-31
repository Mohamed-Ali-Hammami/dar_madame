const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const languageSelect = document.querySelector("[data-language-select]");

const DEFAULT_LANGUAGE = "fr";
const SUPPORTED_LANGUAGES = ["fr", "en", "ar", "de", "it"];

let activeTranslations = {};

const getValue = (object, path) =>
  path.split(".").reduce((value, key) => value?.[key], object);

const syncHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
};

const closeNav = () => {
  nav.classList.remove("is-open");
  header.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", getValue(activeTranslations, "nav.openMenu") || "Ouvrir le menu");
};

const applyTranslations = (translations, language) => {
  activeTranslations = translations;

  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  document.body.classList.toggle("is-rtl", language === "ar");

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = getValue(translations, element.dataset.i18n);
    if (typeof value === "string") {
      element.textContent = value;
    }
  });

  document.querySelectorAll("[data-i18n-attr]").forEach((element) => {
    element.dataset.i18nAttr.split(",").forEach((definition) => {
      const [attribute, key] = definition.split(":");
      const value = getValue(translations, key);
      if (attribute && typeof value === "string") {
        element.setAttribute(attribute, value);
      }
    });
  });

  document.title = translations.meta?.title || document.title;
};

const loadLanguage = async (language) => {
  const nextLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;

  try {
    const response = await fetch(`languages/${nextLanguage}.json`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Could not load ${nextLanguage}.json`);
    }

    const translations = await response.json();
    applyTranslations(translations, nextLanguage);
    localStorage.setItem("darMadameLanguage", nextLanguage);
    languageSelect.value = nextLanguage;
  } catch (error) {
    console.warn(error);
    languageSelect.value = DEFAULT_LANGUAGE;
  }
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  header.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute(
    "aria-label",
    isOpen
      ? getValue(activeTranslations, "nav.closeMenu") || "Fermer le menu"
      : getValue(activeTranslations, "nav.openMenu") || "Ouvrir le menu"
  );
});

nav.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    closeNav();
  }
});

languageSelect.addEventListener("change", (event) => {
  loadLanguage(event.target.value);
  closeNav();
});

loadLanguage(localStorage.getItem("darMadameLanguage") || DEFAULT_LANGUAGE);
