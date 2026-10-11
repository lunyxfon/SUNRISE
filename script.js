/* =========================================================
   SUNRISE — общий скрипт для всех страниц.
   Без библиотек, просто подключите в конце <body>:
   <script src="script.js"></script>
   ========================================================= */

(function () {
  "use strict";

  /* ---------- 1. Мобильное меню (бургер) ---------- */
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".nav");

  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });

    // Закрываем меню после клика по ссылке
    nav.querySelectorAll("a").forEach((link) =>
      link.addEventListener("click", () => {
        burger.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      })
    );
  }

  /* ---------- 2. Текущий год в футере ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- 3. Плавное появление блоков при скролле ----------
     Блоки, видимые сразу при загрузке, не прячем —
     анимируются только те, что ниже первого экрана. */
  const revealEls = document.querySelectorAll(".reveal");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("is-pending");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add("is-pending");
        io.observe(el);
      }
    });
  }

  /* ---------- 4. Подсветка активного направления в якорной панели ---------- */
  const anchorLinks = document.querySelectorAll(".anchors__link");

  if (anchorLinks.length && "IntersectionObserver" in window) {
    const byId = {};
    anchorLinks.forEach((a) => (byId[a.getAttribute("href").slice(1)] = a));

    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          anchorLinks.forEach((a) => a.classList.remove("is-active"));
          const active = byId[entry.target.id];
          if (active) {
            active.classList.add("is-active");
            // Прокручиваем панель, чтобы активная ссылка была видна на мобильных
            active.scrollIntoView({ block: "nearest", inline: "center" });
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    Object.keys(byId).forEach((id) => {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* ---------- 5. Галерея: фильтры ---------- */
  const filterBtns = document.querySelectorAll(".filter-btn");
  const galleryItems = Array.from(document.querySelectorAll(".g-item"));

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.filter;
      filterBtns.forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", String(b === btn));
      });
      galleryItems.forEach((item) => {
        item.hidden = !(cat === "all" || item.dataset.cat === cat);
      });
    });
  });

  /* ---------- 6. Галерея: лайтбокс ---------- */
  const lightbox = document.querySelector(".lightbox");

  if (lightbox && galleryItems.length) {
    const media = lightbox.querySelector(".lightbox__media");
    const caption = lightbox.querySelector(".lightbox__text");
    const counter = lightbox.querySelector(".lightbox__count");
    let current = 0;
    let lastFocus = null;

    // Показываем только те фото, что не скрыты фильтром
    const visibleItems = () => galleryItems.filter((i) => !i.hidden);

    function show(index) {
      const list = visibleItems();
      if (!list.length) return;
      current = (index + list.length) % list.length;
      const item = list[current];

      // Копируем содержимое: реальное <img> или плейсхолдер
      const img = item.querySelector("img");
      media.innerHTML = "";
      if (img) {
        const big = document.createElement("img");
        big.src = img.dataset.full || img.src; // data-full — ссылка на большое фото (необязательно)
        big.alt = img.alt;
        media.appendChild(big);
      } else {
        const ph = item.querySelector(".ph").cloneNode(true);
        media.appendChild(ph);
      }

      const title = item.querySelector("figcaption b");
      caption.textContent = title ? title.textContent : "";
      counter.textContent = current + 1 + " / " + list.length;
    }

    function open(item) {
      lastFocus = document.activeElement;
      show(visibleItems().indexOf(item));
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      lightbox.querySelector(".lightbox__close").focus();
    }

    function close() {
      lightbox.hidden = true;
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }

    galleryItems.forEach((item) => {
      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "button");
      item.addEventListener("click", () => open(item));
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(item);
        }
      });
    });

    lightbox.querySelector(".lightbox__close").addEventListener("click", close);
    lightbox.querySelector(".lightbox__prev").addEventListener("click", () => show(current - 1));
    lightbox.querySelector(".lightbox__next").addEventListener("click", () => show(current + 1));

    // Клик по тёмному фону закрывает лайтбокс
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });

    // Клавиатура: Esc, стрелки
    document.addEventListener("keydown", (e) => {
      if (lightbox.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });

    // Свайпы на телефоне
    let startX = null;
    lightbox.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
    lightbox.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      startX = null;
    });
  }
})();
