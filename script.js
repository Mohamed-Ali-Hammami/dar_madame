const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const languageSelect = document.querySelector("[data-language-select]");
const heroVideo = document.querySelector(".hero-media");
const bookingModal = document.querySelector("[data-booking-modal]");
const bookingTriggers = document.querySelectorAll("[data-booking-trigger]");
const bookingCloseButtons = document.querySelectorAll("[data-booking-close]");
const whatsappModal = document.querySelector("[data-whatsapp-modal]");
const whatsappTrigger = document.querySelector("[data-whatsapp-trigger]");
const whatsappCloseButtons = document.querySelectorAll("[data-whatsapp-close]");
const galleryImages = [...document.querySelectorAll(".gallery-grid img")];
const lightbox = document.querySelector("[data-gallery-lightbox]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxCount = document.querySelector("[data-lightbox-count]");
const lightboxClose = document.querySelector("[data-lightbox-close]");
const lightboxPrev = document.querySelector("[data-lightbox-prev]");
const lightboxNext = document.querySelector("[data-lightbox-next]");

const DEFAULT_LANGUAGE = "fr";
const SUPPORTED_LANGUAGES = ["fr", "en", "ar", "de", "it"];

let activeTranslations = {};
let activeGalleryIndex = 0;
let touchStartX = 0;

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
  syncModalState();
};

const syncModalState = () => {
  const hasOpenModal =
    !bookingModal.hidden ||
    !whatsappModal.hidden ||
    !lightbox.hidden;

  document.body.classList.toggle("is-modal-open", hasOpenModal);
};

const openWhatsappModal = () => {
  bookingModal.hidden = true;
  whatsappModal.hidden = false;
  syncModalState();
  whatsappModal.querySelector("[data-whatsapp-close]")?.focus();
};

const closeWhatsappModal = () => {
  whatsappModal.hidden = true;
  syncModalState();
};

const updateLightbox = () => {
  const image = galleryImages[activeGalleryIndex];
  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  lightboxCount.textContent = `${activeGalleryIndex + 1} / ${galleryImages.length}`;
};

const openLightbox = (index) => {
  activeGalleryIndex = index;
  updateLightbox();
  lightbox.hidden = false;
  syncModalState();
  lightboxClose.focus();
};

const closeLightbox = () => {
  lightbox.hidden = true;
  syncModalState();
};

const moveLightbox = (direction) => {
  activeGalleryIndex =
    (activeGalleryIndex + direction + galleryImages.length) % galleryImages.length;
  updateLightbox();
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
    localStorage.setItem("casaTerraMareLanguage", nextLanguage);
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

whatsappTrigger.addEventListener("click", openWhatsappModal);

whatsappCloseButtons.forEach((button) => {
  button.addEventListener("click", closeWhatsappModal);
});

galleryImages.forEach((image, index) => {
  image.tabIndex = 0;
  image.addEventListener("click", () => openLightbox(index));
  image.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLightbox(index);
    }
  });
});

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", () => moveLightbox(-1));
lightboxNext.addEventListener("click", () => moveLightbox(1));

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

lightbox.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });

lightbox.addEventListener("touchend", (event) => {
  const touchEndX = event.changedTouches[0].clientX;
  const deltaX = touchEndX - touchStartX;

  if (Math.abs(deltaX) > 50) {
    moveLightbox(deltaX > 0 ? -1 : 1);
  }
}, { passive: true });

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !lightbox.hidden) {
    closeLightbox();
  } else if (event.key === "Escape" && !whatsappModal.hidden) {
    closeWhatsappModal();
  } else if (event.key === "Escape" && !bookingModal.hidden) {
    closeBookingModal();
  } else if (event.key === "ArrowLeft" && !lightbox.hidden) {
    moveLightbox(-1);
  } else if (event.key === "ArrowRight" && !lightbox.hidden) {
    moveLightbox(1);
  }
});

languageSelect.addEventListener("change", (event) => {
  loadLanguage(event.target.value);
  closeNav();
});

loadLanguage(localStorage.getItem("casaTerraMareLanguage") || DEFAULT_LANGUAGE);
