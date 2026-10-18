/* =========================================================
   SUNRISE — общий скрипт для всех страниц.
   Без библиотек, просто подключите в конце <body>:
   <script src="script.js"></script>
   ========================================================= */

/* ---------- НАСТРОЙКА ФОРМЫ ЗАПИСИ ----------
   ЗАМЕНИТЬ: адрес вашего Cloudflare Worker, который пересылает заявки
   в Telegram-бота (инструкция в README.md, раздел «Форма записи»).
   Пока адрес пустой, форма откроется, но вместо отправки предложит
   написать в Telegram. */
const SIGNUP_ENDPOINT = "";

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

  /* ---------- 7. Форма записи (всплывающее окно) ----------
     Открывается по любой кнопке .btn, которая ведёт в Telegram (t.me).
     Ссылка в href остаётся запасным вариантом: если скрипт не загрузится,
     кнопка просто откроет Telegram, как раньше. */
  const signupButtons = document.querySelectorAll('a.btn[href*="t.me/"], [data-signup]');

  if (signupButtons.length && "HTMLDialogElement" in window) {
    const AGES = ["6–9", "9–12", "13+", "18+"]; // ЗАМЕНИТЬ при необходимости: группы по возрасту

    // Разметка окна создаётся один раз и добавляется в конец страницы
    const dialog = document.createElement("dialog");
    dialog.className = "signup";
    dialog.setAttribute("aria-labelledby", "signup-title");
    dialog.innerHTML = `
      <button class="signup__close" type="button" aria-label="Закрыть">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>
      <form class="signup__form" novalidate>
        <p class="eyebrow">Пробное занятие</p>
        <h2 class="signup__title" id="signup-title">Запись на занятие</h2>
        <p class="signup__context" hidden></p>

        <label class="field">
          <span class="field__label">ФИО</span>
          <input class="field__input" id="signup-name" name="name" type="text" autocomplete="name" placeholder="Иванова Анна Сергеевна" required maxlength="100">
          <span class="field__error" data-error-for="name"></span>
        </label>

        <label class="field">
          <span class="field__label">Номер телефона</span>
          <input class="field__input" id="signup-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 900 000-00-00" required maxlength="20">
          <span class="field__error" data-error-for="phone"></span>
        </label>

        <fieldset class="field">
          <legend class="field__label">Возраст</legend>
          <div class="age-options">
            ${AGES.map((a, i) => `
              <label class="age-option">
                <input type="radio" name="age" id="signup-age-${i}" value="${a}" required>
                <span>${a}</span>
              </label>`).join("")}
          </div>
          <span class="field__error" data-error-for="age"></span>
        </fieldset>

        <label class="consent">
          <input type="checkbox" id="signup-consent" name="consent" required>
          <span>Согласен(на) на обработку персональных данных</span>
        </label>
        <span class="field__error" data-error-for="consent"></span>

        <!-- Ловушка для спам-ботов: человек это поле не видит и не заполняет -->
        <input class="signup__trap" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">

        <button class="btn btn--primary btn--block signup__submit" type="submit">Отправить заявку</button>
        <p class="signup__status" role="status" aria-live="polite"></p>
      </form>
      <div class="signup__done" hidden>
        <p class="eyebrow">Готово</p>
        <h2 class="signup__title">Заявка отправлена</h2>
        <p class="muted">Администратор свяжется с вами в ближайшее время и подберёт группу.</p>
        <button class="btn btn--outline btn--block signup__ok" type="button">Хорошо</button>
      </div>`;
    document.body.appendChild(dialog);

    const form = dialog.querySelector(".signup__form");
    const done = dialog.querySelector(".signup__done");
    const contextEl = dialog.querySelector(".signup__context");
    const statusEl = dialog.querySelector(".signup__status");
    const submitBtn = dialog.querySelector(".signup__submit");
    let context = "";
    let telegramUrl = "";

    // Откуда пришла заявка: тариф, направление или текст кнопки
    function contextFor(btn) {
      if (btn.dataset.signup) return btn.dataset.signup;
      const card = btn.closest(".price-card");
      if (card && card.querySelector("h2, h3")) return card.querySelector("h2, h3").textContent.trim();
      const dir = btn.closest(".direction");
      if (dir && dir.querySelector(".direction__title")) return dir.querySelector(".direction__title").textContent.trim();
      return "";
    }

    function setError(name, text) {
      const el = form.querySelector(`[data-error-for="${name}"]`);
      if (el) el.textContent = text || "";
    }

    function openSignup(btn) {
      context = contextFor(btn);
      telegramUrl = btn.getAttribute("href") || "";
      contextEl.textContent = context ? "Вы выбрали: " + context : "";
      contextEl.hidden = !context;
      form.hidden = false;
      done.hidden = true;
      statusEl.textContent = "";
      ["name", "phone", "age", "consent"].forEach((n) => setError(n));
      dialog.showModal();
      document.body.style.overflow = "hidden";
      form.querySelector("#signup-name").focus();
    }

    dialog.addEventListener("close", () => { document.body.style.overflow = ""; });
    dialog.querySelector(".signup__close").addEventListener("click", () => dialog.close());
    dialog.querySelector(".signup__ok").addEventListener("click", () => dialog.close());
    // Клик по затемнённому фону закрывает окно
    dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

    signupButtons.forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openSignup(btn);
      })
    );

    // Проверка полей; возвращает данные или null
    function validate() {
      const data = Object.fromEntries(new FormData(form));
      let ok = true;
      const name = (data.name || "").trim();
      const digits = (data.phone || "").replace(/\D/g, "");

      if (name.length < 2) { setError("name", "Укажите имя и фамилию"); ok = false; } else setError("name");
      if (digits.length < 10 || digits.length > 15) { setError("phone", "Проверьте номер: нужно 10–11 цифр"); ok = false; } else setError("phone");
      if (!data.age) { setError("age", "Выберите возраст"); ok = false; } else setError("age");
      if (!data.consent) { setError("consent", "Нужно согласие, чтобы мы могли перезвонить"); ok = false; } else setError("consent");

      if (!ok) return null;
      return { name, phone: (data.phone || "").trim(), age: data.age, context, page: document.title, website: data.website || "" };
    }

    function showFallback(text, linkText) {
      statusEl.innerHTML = "";
      statusEl.append(text + " ");
      if (telegramUrl) {
        const a = document.createElement("a");
        a.href = telegramUrl;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = linkText;
        statusEl.append(a);
      }
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = validate();
      if (!payload) {
        const firstError = form.querySelector(".field__error:not(:empty)");
        const field = firstError && firstError.closest(".field, .consent, form").querySelector("input");
        if (field) field.focus();
        return;
      }

      if (!SIGNUP_ENDPOINT) {
        showFallback("Онлайн-запись пока не подключена.", "Написать в Telegram");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Отправляем…";
      statusEl.textContent = "";
      try {
        const res = await fetch(SIGNUP_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        form.reset();
        form.hidden = true;
        done.hidden = false;
        done.querySelector(".signup__ok").focus();
      } catch (err) {
        showFallback("Не получилось отправить заявку. Попробуйте ещё раз или", "напишите нам в Telegram");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Отправить заявку";
      }
    });

    // Убираем ошибку у поля, как только его начали исправлять
    form.addEventListener("input", (e) => {
      if (e.target.name) setError(e.target.name);
    });
  }
})();
