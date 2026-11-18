const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

for (const carousel of document.querySelectorAll("[data-carousel]")) {
  const track = carousel.querySelector(".carousel-track");
  const slides = [...track.children];
  const controls = carousel.querySelector(".carousel-controls");
  const previous = controls.querySelector('[data-step="-1"]');
  const next = controls.querySelector('[data-step="1"]');

  function updateControls() {
    previous.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
  }

  function step(direction) {
    const origin = slides[0].offsetLeft;
    const stops = slides.map((slide) => slide.offsetLeft - origin);
    const target = direction > 0
      ? stops.find((left) => left > track.scrollLeft + 2)
      : stops.findLast((left) => left < track.scrollLeft - 2);
    track.scrollTo({
      left: target ?? (direction > 0 ? track.scrollWidth : 0),
      behavior: reducedMotion.matches ? "instant" : "smooth",
    });
  }

  previous.addEventListener("click", () => step(-1));
  next.addEventListener("click", () => step(1));
  track.addEventListener("scroll", updateControls, { passive: true });
  new ResizeObserver(updateControls).observe(track);
  controls.hidden = false;
  updateControls();
}

for (const grid of document.querySelectorAll(".gallery-grid")) {
  const items = [...grid.querySelectorAll("[data-photo]")];
  let lastWidth;
  new ResizeObserver(() => {
    const width = items[0].getBoundingClientRect().width;
    if (width === lastWidth) return;
    lastWidth = width;
    grid.classList.add("masonry");
    for (const item of items) {
      const image = item.querySelector("img");
      const ratio = Number(image.getAttribute("height")) / Number(image.getAttribute("width"));
      item.style.gridRowEnd = `span ${Math.ceil((width * ratio + 12) / 2)}`;
    }
  }).observe(grid);
}

const lightbox = document.querySelector(".lightbox");
if (lightbox) {
  const image = lightbox.querySelector("img");
  const count = lightbox.querySelector(".lightbox-count");
  let photos = [];
  let current = 0;

  function showPhoto(index) {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    image.alt = photo.querySelector("img").alt;
    image.src = photo.href;
    count.textContent = `${current + 1} / ${photos.length}`;
  }

  for (const gallery of document.querySelectorAll("[data-gallery]")) {
    gallery.addEventListener("click", (event) => {
      const photo = event.target.closest("[data-photo]");
      if (!photo || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      photos = [...gallery.querySelectorAll("[data-photo]")];
      showPhoto(photos.indexOf(photo));
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
  contact.addEventListener("submit", (event) => {
    event.preventDefault();
    const fields = new FormData(contact);
    const name = fields.get("name").trim();
    const reply = fields.get("reply").trim();
    const message = fields.get("message").trim();
    const subject = encodeURIComponent(`Zapytanie o sesję — ${name}`);
    const body = encodeURIComponent(`${message}\r\n\r\nImię: ${name}\r\nKontakt: ${reply}`);
    window.location.href = `mailto:ilosya.ph@gmail.com?subject=${subject}&body=${body}`;
  });
  contact.hidden = false;
}
