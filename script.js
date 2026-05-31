const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const languageSelect = document.querySelector("[data-language-select]");
const heroVideo = document.querySelector(".hero-media");
const bookingModal = document.querySelector("[data-booking-modal]");
const bookingTriggers = document.querySelectorAll("[data-booking-trigger]");
const bookingCloseButtons = document.querySelectorAll("[data-booking-close]");

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

const openBookingModal = () => {
  bookingModal.hidden = false;
  document.body.classList.add("is-modal-open");
  closeNav();
  bookingModal.querySelector("[data-booking-close]")?.focus();
};

const closeBookingModal = () => {
  bookingModal.hidden = true;
  document.body.classList.remove("is-modal-open");
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
    localStorage.setItem("casaTerraMarreLanguage", nextLanguage);
    languageSelect.value = nextLanguage;
  } catch (error) {
    console.warn(error);
    languageSelect.value = DEFAULT_LANGUAGE;
  }
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

if (heroVideo) {
  heroVideo.muted = true;
  heroVideo.load();
  heroVideo.play().catch(() => {
    heroVideo.addEventListener("canplay", () => heroVideo.play(), { once: true });
  });
}

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

bookingTriggers.forEach((trigger) => {
  trigger.addEventListener("click", openBookingModal);
});

bookingCloseButtons.forEach((button) => {
  button.addEventListener("click", closeBookingModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !bookingModal.hidden) {
    closeBookingModal();
  }
});

languageSelect.addEventListener("change", (event) => {
  loadLanguage(event.target.value);
  closeNav();
});

loadLanguage(localStorage.getItem("casaTerraMarreLanguage") || DEFAULT_LANGUAGE);
