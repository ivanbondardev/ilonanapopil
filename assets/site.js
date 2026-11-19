const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobile = window.matchMedia("(max-width: 56rem)");
const menu = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const categories = nav.querySelector("details");
const menuBackground = document.querySelectorAll("main, .site-footer, .skip-link, .wordmark");

function toggleMenu(open) {
  menu.setAttribute("aria-expanded", open);
  menu.setAttribute("aria-label", open ? "Zamknij menu" : "Otwórz menu");
  for (const element of menuBackground) element.inert = open;
  if (!open) categories.open = false;
}

menu.hidden = false;
menu.addEventListener("click", () => toggleMenu(menu.getAttribute("aria-expanded") === "false"));
nav.addEventListener("click", (event) => {
  if (mobile.matches && event.target.closest("a")) toggleMenu(false);
});
mobile.addEventListener("change", () => toggleMenu(false));
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (categories.open) {
    categories.open = false;
    categories.querySelector("summary").focus();
  } else if (menu.getAttribute("aria-expanded") === "true") {
    toggleMenu(false);
    menu.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!mobile.matches && !event.target.closest(".portfolio-nav")) categories.open = false;
});

for (const carousel of document.querySelectorAll("[data-carousel]")) {
  const track = carousel.querySelector(".carousel-track");
  const originals = [...track.children];
  const controls = carousel.querySelector(".carousel-controls");

  function copySlides() {
    return originals.map((slide) => {
      const copy = slide.cloneNode(true);
      copy.dataset.carouselCopy = "";
      copy.setAttribute("aria-hidden", "true");
      copy.tabIndex = -1;
      const image = copy.querySelector("img");
      image.loading = "lazy";
      image.removeAttribute("fetchpriority");
      return copy;
    });
  }

  track.prepend(...copySlides());
  track.append(...copySlides());
  const slides = [...track.children];
  let stops = [];
  let current = originals.length;
  let pending = null;

  function center(index, behavior = "instant") {
    track.scrollTo({ left: stops[index], behavior });
  }

  function nearest() {
    return stops.reduce((best, left, index) =>
      Math.abs(left - track.scrollLeft) < Math.abs(stops[best] - track.scrollLeft) ? index : best, 0);
  }

  function settle() {
    pending = null;
    current = nearest();
    if (current < originals.length || current >= 2 * originals.length) {
      current = current % originals.length + originals.length;
      center(current);
    }
  }

  new ResizeObserver(() => {
    const origin = slides[0].offsetLeft;
    stops = slides.map((slide) => slide.offsetLeft - origin + (slide.offsetWidth - track.clientWidth) / 2);
    pending = null;
    center(current);
  }).observe(track);

  for (const button of controls.querySelectorAll("button")) {
    button.addEventListener("click", () => {
      if (!stops.length) return;
      const index = pending ?? nearest();
      pending = Math.max(1, Math.min(index + Number(button.dataset.step), slides.length - 2));
      center(pending, reducedMotion.matches ? "instant" : "smooth");
    });
  }

  track.addEventListener("scrollend", settle);
  controls.hidden = false;
}

for (const grid of document.querySelectorAll(".gallery-grid")) {
  const items = [...grid.querySelectorAll("[data-photo]")];
  let lastWidth;
  new ResizeObserver(() => {
    const width = items[0].getBoundingClientRect().width;
    if (width === lastWidth) return;
    lastWidth = width;
    const gap = parseFloat(getComputedStyle(grid).columnGap);
    grid.classList.add("masonry");
    for (const item of items) {
      const image = item.querySelector("img");
      const ratio = Number(image.getAttribute("height")) / Number(image.getAttribute("width"));
      item.style.gridRowEnd = `span ${Math.ceil(width * ratio + gap)}`;
    }
  }).observe(grid);
}

const lightbox = document.querySelector(".lightbox");
if (lightbox) {
  const image = lightbox.querySelector("img");
  let photos = [];
  let current = 0;

  function showPhoto(index) {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    image.alt = photo.querySelector("img").alt;
    image.src = photo.href;
  }

  for (const gallery of document.querySelectorAll("[data-gallery]")) {
    gallery.addEventListener("click", (event) => {
      const photo = event.target.closest("[data-photo]");
      if (!photo || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      photos = [...gallery.querySelectorAll("[data-photo]:not([data-carousel-copy])")];
      showPhoto(photos.findIndex((item) => item.href === photo.href));
      lightbox.showModal();
    });
  }

  lightbox.querySelector(".lightbox-prev").addEventListener("click", () => showPhoto(current - 1));
  lightbox.querySelector(".lightbox-next").addEventListener("click", () => showPhoto(current + 1));
  lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showPhoto(current - 1);
    if (event.key === "ArrowRight") showPhoto(current + 1);
  });
}

const contact = document.querySelector("[data-contact]");
if (contact) {
  const fields = [...contact.querySelectorAll("[required]")];
  const nameField = contact.elements.namedItem("name");
  const replyField = contact.elements.reply;
  const replyError = contact.querySelector("#reply-error");
  const messageField = contact.elements.message;
  const submit = contact.querySelector("button[type=submit]");
  const status = contact.querySelector(".form-status");
  const email = document.createElement("input");
  email.type = "email";
  const endpoint = contact.dataset.endpoint;
  const turnstileContainer = contact.querySelector("[data-turnstile-sitekey]");
  const messageLimit = 512;
  const turnstile = window.turnstile;
  const widgetId = turnstile?.render(turnstileContainer, {
    sitekey: turnstileContainer.dataset.turnstileSitekey,
    action: "contact",
    appearance: "interaction-only",
    size: "flexible",
    language: "pl",
  });

  for (const field of fields) {
    field.addEventListener("input", () => field.setCustomValidity(""));
  }

  function showReplyError(message) {
    replyError.textContent = message;
    replyError.hidden = !message;
    if (message) replyField.setAttribute("aria-invalid", "true");
    else replyField.removeAttribute("aria-invalid");
  }

  replyField.addEventListener("input", () => showReplyError(""));

  function normalizePhone(value) {
    if (!/^\+?(?:[\d .\u00a0\u202f-]|\(\d+\))+$/.test(value)) return;

    const dial = value.replace(/[^\d+]/g, "").replace(/^00/, "+");
    if (!dial.startsWith("+") && dial.length !== 9) return;

    const number = window.libphonenumber?.parsePhoneNumberFromString(dial, { defaultCountry: "PL", extract: false });
    if (number?.isValid()) return number.number;
  }

  contact.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    status.textContent = "";
    delete status.dataset.state;

    for (const field of fields) {
      field.value = field.value.trim();
      field.setCustomValidity(field.value ? "" : "Uzupełnij to pole.");
    }

    const reply = replyField.value;
    email.value = reply;
    const isEmail = email.checkValidity() && /@[^@]+\.(?:[a-z]{2,}|xn--[a-z0-9-]+)$/i.test(reply);
    const phone = normalizePhone(reply);
    if (reply && !isEmail && !phone) {
      replyField.setCustomValidity("Wpisz poprawny numer telefonu lub pełny adres e-mail, np. imie@example.com.");
    }
    showReplyError(replyField.validationMessage);
    if (!contact.reportValidity()) return;

    const rows = [
      ["Imię", nameField.value],
      ["Kontakt", phone ?? reply],
      ["Wiadomość", messageField.value],
    ];
    const plainText = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
    if (Array.from(plainText).length > messageLimit) {
      messageField.setCustomValidity(`Skróć wiadomość. Zgłoszenie wraz z podpisami pól może mieć maksymalnie ${messageLimit} znaków.`);
      contact.reportValidity();
      return;
    }

    const token = widgetId === undefined ? "" : turnstile.getResponse(widgetId);
    if (!token) {
      status.dataset.state = "error";
      status.textContent = "Poczekaj na zakończenie weryfikacji bezpieczeństwa. Jeśli problem się powtarza, odśwież stronę lub napisz e-mail.";
      return;
    }

    submit.disabled = true;
    status.textContent = "Wysyłanie wiadomości…";

    try {
      const response = await fetch(endpoint, {
        method: contact.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameField.value,
          reply: phone ?? reply,
          message: messageField.value,
          website: contact.elements.website.value,
          "cf-turnstile-response": token,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (response.status === 429) {
        status.dataset.state = "error";
        status.textContent = "Zbyt wiele prób wysłania wiadomości. Spróbuj ponownie za chwilę.";
        return;
      }
      const result = await response.json();
      if (response.status === 403 && result?.error === "turnstile") {
        status.dataset.state = "error";
        status.textContent = "Weryfikacja bezpieczeństwa wygasła lub nie powiodła się. Spróbuj ponownie.";
        return;
      }
      if (!response.ok || result?.ok !== true) {
        throw new Error("Submission not accepted");
      }
      contact.reset();
      status.dataset.state = "success";
      status.textContent = "Wiadomość została wysłana. Dziękuję!";
    } catch {
      status.dataset.state = "error";
      status.textContent = "Nie udało się wysłać wiadomości. Spróbuj ponownie lub skorzystaj z adresu e-mail powyżej.";
    } finally {
      submit.disabled = false;
      turnstile.reset(widgetId);
      status.focus({ preventScroll: true });
      status.scrollIntoView({ block: "nearest", behavior: "instant" });
    }
  });
  submit.disabled = false;
}
