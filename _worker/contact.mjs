const messageLimit = 512;
const maxBodyBytes = 16 * 1024;
const htmlEntities = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
const emailPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/i;
const phonePattern = /^\+[1-9]\d{6,14}$/;

async function readSubmission(request) {
  if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return { status: 415, error: "content_type" };
  }
  if (!request.body) return { status: 400, error: "invalid_request" };

  const reader = request.body.getReader();
  const bytes = new Uint8Array(maxBodyBytes);
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (size + value.byteLength > bytes.byteLength) {
        await reader.cancel();
        return { status: 413, error: "request_too_large" };
      }
      bytes.set(value, size);
      size += value.byteLength;
    }
    const data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, size)));
    if (data && typeof data === "object" && !Array.isArray(data)) return { data };
  } catch {
    return { status: 400, error: "invalid_request" };
  } finally {
    reader.releaseLock();
  }
  return { status: 400, error: "invalid_request" };
}

async function verifyTurnstile(token, hostname, ip, secret) {
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(4000),
      redirect: "error",
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true && result.hostname === hostname && result.action === "contact";
  } catch {
    return false;
  }
}

async function sendTelegram(text, env) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        text,
      }),
      signal: AbortSignal.timeout(8000),
      redirect: "error",
    });
    return response.ok && (await response.json()).ok === true;
  } catch {
    return false;
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const allowedOrigins = (env.ALLOWED_ORIGINS ?? "").split(",").map((value) => value.trim());
    const allowedOrigin = origin && allowedOrigins.includes(origin);
    const headers = new Headers({ "Cache-Control": "no-store", Vary: "Origin" });
    if (allowedOrigin) headers.set("Access-Control-Allow-Origin", origin);
    function reply(status, error) {
      return Response.json(error ? { ok: false, error } : { ok: true }, { status, headers });
    }

    if (request.method !== "POST" && request.method !== "OPTIONS") {
      headers.set("Allow", "POST, OPTIONS");
      return reply(405, "method");
    }
    if (!allowedOrigin) return reply(403, "origin");
    if (new URL(request.url).pathname !== "/") return reply(404, "path");

    if (request.method === "OPTIONS") {
      headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type");
      return new Response(null, { status: 204, headers });
    }

    const ip = request.headers.get("CF-Connecting-IP");
    if (!ip) return reply(403, "ip");
    const { success } = await env.CONTACT_RATE_LIMITER.limit({ key: ip });
    if (!success) return reply(429, "rate_limit");

    const { data, status, error } = await readSubmission(request);
    if (!data) return reply(status, error);
    if (typeof data.website === "string" && data.website !== "") return reply(200);

    const name = typeof data.name === "string" ? data.name.trim() : "";
    const contact = typeof data.reply === "string" ? data.reply.trim() : "";
    const message = typeof data.message === "string" ? data.message.trim() : "";
    if (!name || name.length > 120 || !message) return reply(400, "fields");
    if (contact.length > 254 || (!emailPattern.test(contact) && !phonePattern.test(contact))) {
      return reply(400, "reply");
    }

    const rows = [["Imię", name], ["Kontakt", contact], ["Wiadomość", message]];
    const plainText = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
    if (Array.from(plainText).length > messageLimit) return reply(400, "message_length");

    if (!env.TURNSTILE_SECRET_KEY) return reply(503, "unavailable");
    const hostname = new URL(origin).hostname;
    if (!await verifyTurnstile(data["cf-turnstile-response"], hostname, ip, env.TURNSTILE_SECRET_KEY)) {
      return reply(403, "turnstile");
    }
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return reply(503, "unavailable");

    const text = rows.map(([label, value]) => {
      const escaped = value.replace(/[&<>]/g, (character) => htmlEntities[character]);
      return `<b>${label}:</b> ${escaped}`;
    }).join("\n");
    return await sendTelegram(text, env) ? reply(200) : reply(502, "delivery");
  },
};
