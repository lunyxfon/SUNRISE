

const AGES = ["6–9", "9–12", "13+", "18+"];

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);

    // Браузер сначала спрашивает разрешение (preflight)
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, cors);
    if (!cors["Access-Control-Allow-Origin"]) return json({ ok: false, error: "Origin not allowed" }, 403, cors);

    let data;
    try {
      data = await request.json();
    } catch {
      return json({ ok: false, error: "Bad JSON" }, 400, cors);
    }

    // Ловушка для спам-ботов: поле website люди не заполняют
    if (data.website) return json({ ok: true }, 200, cors);

    const name = String(data.name || "").trim().slice(0, 100);
    const phone = String(data.phone || "").trim().slice(0, 20);
    const digits = phone.replace(/\D/g, "");
    const age = String(data.age || "");
    const context = String(data.context || "").trim().slice(0, 100);
    const page = String(data.page || "").trim().slice(0, 100);

    if (name.length < 2 || digits.length < 10 || digits.length > 15 || !AGES.includes(age)) {
      return json({ ok: false, error: "Invalid fields" }, 422, cors);
    }

    const lines = [
      "<b>Новая заявка с сайта SUNRISE</b>",
      "",
      `<b>ФИО:</b> ${esc(name)}`,
      `<b>Телефон:</b> ${esc(phone)}`,
      `<b>Возраст:</b> ${esc(age)}`,
    ];
    if (context) lines.push(`<b>Выбор:</b> ${esc(context)}`);
    if (page) lines.push(`<b>Страница:</b> ${esc(page)}`);

    const tg = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text: lines.join("\n"), parse_mode: "HTML" }),
    });

    if (!tg.ok) {
      console.log("Telegram error", tg.status, await tg.text());
      return json({ ok: false, error: "Telegram error" }, 502, cors);
    }
    return json({ ok: true }, 200, cors);
  },
};

// Разрешаем запросы только с вашего сайта
function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = String(env.ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim()).filter(Boolean);
  const allowOrigin = allowed.includes("*") ? "*" : allowed.includes(origin) ? origin : "";
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
  if (allowOrigin) headers["Access-Control-Allow-Origin"] = allowOrigin;
  return headers;
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

// Экранируем текст для Telegram (parse_mode: HTML)
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
